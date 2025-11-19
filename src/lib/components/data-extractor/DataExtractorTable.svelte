<script lang="ts">
	import Table from '$lib/components/ui/table/Table.svelte';
	import TableBody from '$lib/components/ui/table/TableBody.svelte';
	import TableCell from '$lib/components/ui/table/TableCell.svelte';
	import TableHead from '$lib/components/ui/table/TableHead.svelte';
	import TableHeaderCell from '$lib/components/ui/table/TableHeaderCell.svelte';
	import TableRow from '$lib/components/ui/table/TableRow.svelte';
	import Dialog from '$lib/components/ui/dialog/Dialog.svelte';
	import { dataExtractorColumns, dataExtractorRows, dataExtractorUploads } from '$lib/stores/data-extractor';
	import type {
		DataExtractorColumn,
		DataExtractorRow,
		DataExtractorUpload
	} from '$lib/types/data-extractor';

	const INITIAL_COLUMN_COUNT = 4;
	const COLUMN_MIN_WIDTH = 208;
	const INDEX_COLUMN_WIDTH = 320;

	const createColumn = (index: number): DataExtractorColumn => ({
		id: index + 1,
		name: '',
		synonym: '',
		prompt: ''
	});

	const createRow = (index: number, columnCount: number): DataExtractorRow => ({
		id: index + 1,
		file: undefined,
		filename: '',
		values: Object.fromEntries(Array.from({ length: columnCount }, (_, colIndex) => [colIndex, '']))
	});

	let columns: DataExtractorColumn[] = Array.from({ length: INITIAL_COLUMN_COUNT }, (_, index) =>
		createColumn(index)
	);
	let rows: DataExtractorRow[] = Array.from({ length: 5 }, (_, index) => createRow(index, columns.length));
	let uploads: DataExtractorUpload[] = [];

	const syncColumnsStore = () => {
		dataExtractorColumns.set(columns);
	};

	const syncRowsStore = () => {
		dataExtractorRows.set(rows);
	};

	const syncUploadsStore = () => {
		dataExtractorUploads.set(uploads);
	};

	syncColumnsStore();
	syncRowsStore();
	syncUploadsStore();
	$: tableMinWidth = `${INDEX_COLUMN_WIDTH + columns.length * COLUMN_MIN_WIDTH}px`;

	let dialogOpen = false;
	let editingColumnIndex: number | null = null;
	let columnForm = {
		name: '',
		synonym: '',
		prompt: ''
	};
	let debugSnapshot: { columns: DataExtractorColumn[]; rows: DataExtractorRow[] } | null = null;
	let isExtracting = false;
	let extractionError: string | null = null;
	let extractionResponse: Record<string, unknown> | null = null;
	let responseFormatPreview = '';
	let extractionStatusMessage = '';
	$: extractionResponsePreview =
		extractionResponse !== null ? JSON.stringify(extractionResponse, null, 2) : '';

	const normalizeUploads = (value: unknown): DataExtractorUpload[] => {
		if (!Array.isArray(value)) return [];
		return value
			.map((item): DataExtractorUpload | null => {
				if (!item || typeof item !== 'object' || !('id' in item)) return null;
				const id = String((item as { id: unknown }).id);
				const filename =
					'filename' in item
						? String((item as { filename: unknown }).filename ?? 'document')
						: 'document';
				const rawRowId = 'rowId' in item ? (item as { rowId: unknown }).rowId : null;
				const rowId =
					typeof rawRowId === 'number'
						? rawRowId
						: rawRowId === null || rawRowId === undefined
						? null
						: Number.isFinite(Number(rawRowId))
							? Number(rawRowId)
							: null;
				return {
					fileId: id,
					filename,
					rowId
				};
			})
			.filter((upload): upload is DataExtractorUpload => upload !== null);
	};

	const updateStatus = (message: string) => {
		extractionStatusMessage = message;
	};

	const columnKey = (column: DataExtractorColumn) =>
		column.name?.trim() ? column.name.trim().replace(/\s+/g, '_').toLowerCase() : `column_${column.id}`;

	const applyExtractionResults = (results: Record<string, string>) => {
		if (!Object.keys(results).length) return;
		const targetRowId = uploads[0]?.rowId ?? rows[0]?.id;
		if (!targetRowId) return;
		rows = rows.map((row) => {
			if (row.id !== targetRowId) return row;
			const updatedValues = { ...row.values };
			columns.forEach((column, index) => {
				const key = columnKey(column);
				if (results[key] !== undefined) {
					updatedValues[index] = results[key];
				}
			});
			return { ...row, values: updatedValues };
		});
		syncRowsStore();
	};

	const startExtraction = async () => {
		debugSnapshot = {
			columns: columns.map((column) => ({ ...column })),
			rows: rows.map((row) => ({
				...row,
				values: { ...row.values }
			}))
		};
		extractionError = null;
		extractionResponse = null;
		responseFormatPreview = '';
		extractionStatusMessage = 'Preparing schema and payload…';
		isExtracting = true;

		try {
			const formData = new FormData();
			formData.append('columns', JSON.stringify(columns));
			formData.append(
				'rows',
				JSON.stringify(rows.map((row) => ({ id: row.id, values: row.values })))
			);

			const fileMeta: { id: number; filename: string }[] = [];

			rows.forEach((row) => {
				if (row.file) {
					const name = row.filename || row.file.name || `document-${row.id}`;
					formData.append('documents', row.file, name);
					fileMeta.push({ id: row.id, filename: name });
				}
			});

			formData.append('fileMeta', JSON.stringify(fileMeta));
			updateStatus('Uploading files to OpenAI…');

			const response = await fetch('/api/extract', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const message = await response.text();
				throw new Error(message || 'Extraction request failed');
			}

			updateStatus('Processing server response…');
			const payload = (await response.json()) as Record<string, unknown>;
			extractionResponse = payload;
			const normalizedUploads = normalizeUploads(payload.uploads);
			uploads = normalizedUploads;
			if (normalizedUploads.length > 0) {
				rows = rows.map((row) => {
					const match = normalizedUploads.find((upload) => upload.rowId === row.id);
					return match ? { ...row, uploadId: match.fileId } : row;
				});
				syncRowsStore();
			}
			syncUploadsStore();
			if (payload.responseFormat) {
				responseFormatPreview = JSON.stringify(payload.responseFormat, null, 2);
			}
			const responseData = payload.response as {
				output_text?: string;
			};
			const outputText = responseData?.output_text;
			if (outputText) {
				try {
					const parsed = JSON.parse(outputText) as Record<string, string>;
					applyExtractionResults(parsed);
				} catch (parseError) {
					console.warn('Failed to parse extraction output', parseError);
				}
			}
			updateStatus('Extraction complete.');
		} catch (error) {
			extractionError =
				error instanceof Error ? error.message : 'Unexpected error while extracting data.';
			updateStatus('Extraction failed.');
		} finally {
			isExtracting = false;
		}

		console.log('Extraction snapshot', debugSnapshot);
	};

	const summarizeRowValues = (row: DataExtractorRow, snapshotColumns: DataExtractorColumn[]) =>
		snapshotColumns
			.map((column, index) => {
				const label = column.name?.trim() ? column.name : `Column ${index + 1}`;
				const value = row.values[index] ?? '';
				return `${label}: ${value || '-'}`;
			})
			.join(' | ');

	const openColumnDialog = (index: number) => {
		editingColumnIndex = index;
		const column = columns[index];
		columnForm = { ...column };
		dialogOpen = true;
	};

	const closeDialog = () => {
		dialogOpen = false;
	};

	const saveColumn = (event?: SubmitEvent) => {
		event?.preventDefault();
		if (editingColumnIndex === null || !columnForm.name.trim()) return;
		columns = columns.map((col, index) => (index === editingColumnIndex ? { ...col, ...columnForm } : col));
		dialogOpen = false;
		syncColumnsStore();
	};

		const addRow = () => {
			rows = [...rows, createRow(rows.length, columns.length)];
			syncRowsStore();
		};

	const ensureRowCount = (rowIndex: number) => {
		if (rowIndex === rows.length - 1) {
			addRow();
		}
	};

	const handleFileChange = (rowIndex: number, event: Event) => {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		rows = rows.map((row, index) =>
			index === rowIndex ? { ...row, file, filename: file ? file.name : '', uploadId: undefined } : row
		);
			if (file) {
				ensureRowCount(rowIndex);
			}
			syncRowsStore();
		};

	const handleValueChange = (rowIndex: number, colIndex: number, value: string) => {
		rows = rows.map((row, index) =>
			index === rowIndex
				? { ...row, values: { ...row.values, [colIndex]: value } }
				: row
		);
			if (value.trim()) {
				ensureRowCount(rowIndex);
			}
			syncRowsStore();
		};

	const addColumn = () => {
		const newColumnIndex = columns.length;
		columns = [...columns, createColumn(newColumnIndex)];
		rows = rows.map((row) => ({
			...row,
			values: { ...row.values, [newColumnIndex]: '' }
		}));
		syncColumnsStore();
		syncRowsStore();
	};
</script>

<section class="w-full rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-2xl">
	<header class="flex flex-col gap-4 border-b border-slate-800/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<p class="text-xs uppercase tracking-[0.4em] text-emerald-200/80">Data Extractor</p>
			<h3 class="mt-2 text-2xl font-semibold text-white">Define your extraction grid</h3>
			<p class="mt-1 text-sm text-slate-400">
				Start by uploading source documents in the index column, then describe each output column via the header dialog.
			</p>
		</div>
		<div class="flex flex-wrap gap-3">
				<button
					type="button"
					class="inline-flex items-center justify-center rounded-2xl border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:border-emerald-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
					onclick={addColumn}
					disabled={isExtracting}
				>
					Add column
				</button>
				<button
					type="button"
					class="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700 disabled:text-slate-200"
					onclick={startExtraction}
					disabled={isExtracting}
					aria-busy={isExtracting}
				>
					{#if isExtracting}
						<span class="inline-flex size-4 animate-spin rounded-full border-2 border-slate-900 border-b-transparent"></span>
						Uploading…
					{:else}
						Extract
					{/if}
				</button>
			</div>
		</header>

	<div class="mt-6 w-full overflow-x-auto rounded-3xl border border-slate-800/70">
		<Table class="w-full" style={`min-width: ${tableMinWidth};`}>
			<TableHead>
				<TableRow class="bg-slate-950/40">
					<TableHeaderCell class="rounded-none text-slate-400" style={`min-width: ${INDEX_COLUMN_WIDTH}px;`}>
						<span class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Index</span>
						<p class="text-sm font-semibold text-white">Source Document</p>
					</TableHeaderCell>
					{#each columns as column, index}
						<TableHeaderCell class="text-slate-200" style={`min-width: ${COLUMN_MIN_WIDTH}px;`}>
							<button
								type="button"
								class="flex w-full flex-col items-start rounded-2xl border border-transparent px-2 py-1 text-left transition hover:border-emerald-400/50 hover:bg-emerald-500/10"
								onclick={() => openColumnDialog(index)}
							>
								<span class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
									Column {index + 1}
								</span>
								<span class="text-base font-semibold text-white">
									{column.name?.trim() ? column.name : '(Undefined)'}
								</span>
								{#if column.synonym}
									<span class="text-xs text-slate-400">Synonym: {column.synonym}</span>
								{/if}
							</button>
						</TableHeaderCell>
					{/each}
				</TableRow>
			</TableHead>

			<TableBody>
				{#each rows as row, rowIndex}
					<TableRow class="hover:bg-slate-900/40">
						<TableCell class="align-top">
							<div class="space-y-2 rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-3">
								<label
									class="block text-xs uppercase tracking-[0.3em] text-slate-400"
									for={`document-${row.id}`}
								>
									Document #{row.id}
								</label>
								<input
									class="block w-full cursor-pointer rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
									type="file"
									id={`document-${row.id}`}
									name={`document-${row.id}`}
									onchange={(event) => handleFileChange(rowIndex, event)}
								/>
								{#if row.filename}
									<p class="text-xs text-emerald-300">Selected: {row.filename}</p>
								{/if}
							</div>
						</TableCell>

						{#each columns as _, colIndex}
							<TableCell style={`min-width: ${COLUMN_MIN_WIDTH}px;`}>
								<input
									type="text"
									class="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
									placeholder="Awaiting extraction..."
									value={row.values[colIndex] ?? ''}
									oninput={(event) =>
										handleValueChange(rowIndex, colIndex, (event.target as HTMLInputElement).value)}
								/>
							</TableCell>
						{/each}
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</div>

	{#if debugSnapshot}
		<div class="mt-6 rounded-2xl border border-dashed border-emerald-700/60 bg-slate-900/60 p-5">
			<p class="text-xs uppercase tracking-[0.3em] text-emerald-300">Debug preview</p>
			<div class="mt-4 grid gap-6 lg:grid-cols-2">
				<div>
					<p class="text-sm font-semibold text-white">Columns</p>
					<ul class="mt-3 space-y-3 text-sm text-slate-200">
						{#each debugSnapshot.columns as column, idx}
							<li class="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
								<p class="font-semibold">{column.name?.trim() ? column.name : `(Undefined ${idx + 1})`}</p>
								<p class="text-xs text-slate-400">
									Prompt: {column.prompt?.trim() ? column.prompt : 'No description provided'}
								</p>
							</li>
						{/each}
					</ul>
				</div>
				<div>
					<p class="text-sm font-semibold text-white">Rows</p>
					<ul class="mt-3 space-y-3 text-sm text-slate-200">
						{#each debugSnapshot.rows as row}
							<li class="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
								<p class="font-semibold">
									Document #{row.id} — {row.filename ?? 'No file selected'}
								</p>
								<p class="mt-1 text-xs text-slate-400">
									{summarizeRowValues(row, debugSnapshot.columns)}
								</p>
							</li>
						{/each}
					</ul>
				</div>
			</div>

			<div class="mt-6 space-y-3 text-sm">
				{#if extractionStatusMessage}
					<p class="text-emerald-300">{extractionStatusMessage}</p>
				{/if}
				{#if extractionError}
					<p class="text-red-400">Extraction error: {extractionError}</p>
				{/if}
			</div>

			{#if uploads.length}
				<div class="mt-4 rounded-xl border border-emerald-700/40 bg-slate-950/40 p-4 text-xs text-slate-200">
					<p class="text-sm font-semibold text-white">Files registered with OpenAI</p>
					<ul class="mt-3 space-y-2">
						{#each uploads as upload}
							<li>
								<span class="font-semibold text-emerald-300">{upload.filename}</span>
								<span class="text-slate-400"> → File ID: {upload.fileId}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

		</div>
	{/if}
</section>

<Dialog open={dialogOpen} on:close={closeDialog}>
	<form class="space-y-5" onsubmit={saveColumn}>
		<div>
			<p class="text-xs uppercase tracking-[0.4em] text-emerald-200/80">Configure Column</p>
			<h4 class="mt-2 text-2xl font-semibold text-white">
				{#if editingColumnIndex !== null}
					Column {editingColumnIndex + 1}
				{:else}
					Column
				{/if}
			</h4>
			<p class="mt-1 text-sm text-slate-400">
				Give the column a descriptive label, optional synonym, and a prompt the extractor uses to fetch values.
			</p>
		</div>

		<label class="block text-sm font-semibold text-slate-200">
			Name
			<input
				type="text"
				class="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
				required
				value={columnForm.name}
				oninput={(event) => (columnForm = { ...columnForm, name: (event.target as HTMLInputElement).value })}
			/>
		</label>

		<label class="block text-sm font-semibold text-slate-200">
			Synonym <span class="text-xs font-normal text-slate-500">(optional)</span>
			<input
				type="text"
				class="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
				value={columnForm.synonym}
				oninput={(event) => (columnForm = { ...columnForm, synonym: (event.target as HTMLInputElement).value })}
			/>
		</label>

		<label class="block text-sm font-semibold text-slate-200">
			Prompt
			<textarea
				class="mt-1 h-32 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
				placeholder="Describe which value to extract from each document"
				value={columnForm.prompt}
				oninput={(event) => (columnForm = { ...columnForm, prompt: (event.target as HTMLTextAreaElement).value })}
			></textarea>
		</label>

		<div class="flex justify-end gap-3 pt-2">
			<button
				type="button"
				class="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
				onclick={closeDialog}
			>
				Cancel
			</button>
			<button
				type="submit"
				class="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
				disabled={!columnForm.name.trim()}
			>
				Save column
			</button>
		</div>
	</form>
</Dialog>

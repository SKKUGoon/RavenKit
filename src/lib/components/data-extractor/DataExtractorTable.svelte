<script lang="ts">
	import Table from '$lib/components/ui/table/Table.svelte';
	import TableBody from '$lib/components/ui/table/TableBody.svelte';
	import TableCell from '$lib/components/ui/table/TableCell.svelte';
	import TableHead from '$lib/components/ui/table/TableHead.svelte';
	import TableHeaderCell from '$lib/components/ui/table/TableHeaderCell.svelte';
	import TableRow from '$lib/components/ui/table/TableRow.svelte';
	import Dialog from '$lib/components/ui/dialog/Dialog.svelte';
	import { dataExtractorColumns } from '$lib/stores/data-extractor';
	import type { DataExtractorColumn } from '$lib/types/data-extractor';

	type RowData = {
		id: number;
		file?: File;
		filename?: string;
		values: Record<number, string>;
	};

	const INITIAL_COLUMN_COUNT = 4;
	const COLUMN_MIN_WIDTH = 208;
	const INDEX_COLUMN_WIDTH = 320;

	const createColumn = (index: number): DataExtractorColumn => ({
		id: index + 1,
		name: '',
		synonym: '',
		prompt: ''
	});

	const createRow = (index: number, columnCount: number): RowData => ({
		id: index + 1,
		file: undefined,
		filename: '',
		values: Object.fromEntries(Array.from({ length: columnCount }, (_, colIndex) => [colIndex, '']))
	});

	let columns: DataExtractorColumn[] = Array.from({ length: INITIAL_COLUMN_COUNT }, (_, index) => createColumn(index));
	let rows: RowData[] = Array.from({ length: 5 }, (_, index) => createRow(index, columns.length));

	const syncColumnsStore = () => {
		dataExtractorColumns.set(columns);
	};

	syncColumnsStore();
	$: tableMinWidth = `${INDEX_COLUMN_WIDTH + columns.length * COLUMN_MIN_WIDTH}px`;

	let dialogOpen = false;
	let editingColumnIndex: number | null = null;
		let columnForm = {
			name: '',
			synonym: '',
			prompt: ''
		};
		const startExtraction = () => {
			/* extraction hook placeholder */
		};

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
			index === rowIndex ? { ...row, file, filename: file ? file.name : '' } : row
		);
		if (file) {
			ensureRowCount(rowIndex);
		}
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
	};

	const addColumn = () => {
		const newColumnIndex = columns.length;
		columns = [...columns, createColumn(newColumnIndex)];
		rows = rows.map((row) => ({
			...row,
			values: { ...row.values, [newColumnIndex]: '' }
		}));
		syncColumnsStore();
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
				<!-- TODO: Undisable the Add column button -->
				<button
					type="button"
					class="inline-flex items-center justify-center rounded-2xl border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:border-emerald-300 hover:text-white"
					onclick={addColumn}
					disabled={true} 
				>
					Add column
				</button>
				<button
					type="button"
					class="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
					onclick={startExtraction}
				>
					Extract
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

<script lang="ts">
	import DataExtractorTable from '$lib/components/data-extractor/DataExtractorTable.svelte';

	type Tool = {
		id: string;
		name: string;
		summary: string;
		useCases: string[];
		owner: string;
		isDisabled: boolean;
	};

	const tools: Tool[] = [
		{
			id: 'data-extractor',
			name: 'Data Extractor',
			summary:
				'Safely parses spreadsheets, PDFs, and dashboards to surface the exact fields analysts need.',
			useCases: [
				'Pull quarter-close metrics from revenue workbooks',
				'Extract compliance checkpoints from vendor PDFs',
				'Compile customer KPIs from Looker dashboards'
			],
			owner: '@SKKUGoon',
			isDisabled: false,
		},
		{
			id: 'Placeholder',
			name: 'Placeholder',
			summary: 'Not implemented.',
			useCases: ['Implementation pending'],
			owner: 'Placeholder',
			isDisabled: true,
		},
		{
			id: 'Placeholder',
			name: 'Placeholder',
			summary: 'Not implemented.',
			useCases: ['Implementation pending'],
			owner: 'Placeholder',
			isDisabled: true,
		}
	];

	let selectedTool: Tool = tools[0];
</script>

<main class="min-h-screen bg-slate-950 py-12 text-slate-50">
	<div
		class="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-start lg:justify-center lg:px-8"
	>
		<aside
			class="flex min-h-full w-full shrink-0 flex-col self-stretch rounded-3xl border border-slate-800 bg-slate-900/80 p-5 lg:w-64"
		>
			<p class="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">AI Tooling</p>
			<h1 class="mt-3 text-2xl font-semibold text-white">Company Utilities</h1>
			<p class="mt-2 text-sm text-slate-400">
				Pin your go-to AI agents, workplace helpers and experiment. 
				Select a utility to view its scope, and best-fit workflows.
			</p>

			<ul class="mt-6 space-y-2">
				{#each tools as tool}
					<li class={tool.isDisabled ? 'opacity-50' : ''}>
						<button
							type="button"
							class="w-full rounded-2xl border px-4 py-3 text-left transition hover:border-emerald-500/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 {selectedTool.id === tool.id
								? 'border-emerald-500/70 bg-gradient-to-r from-emerald-500/10 to-slate-900 text-white'
								: 'border-slate-800 text-slate-300'}"
							onclick={() => (selectedTool = tool)}
							disabled={tool.isDisabled}
						>
							<p class="text-sm font-semibold">{tool.name}</p>
							<p class="text-xs text-slate-400">{tool.owner}</p>
						</button>
					</li>
				{/each}
			</ul>
		</aside>

		<section class="flex flex-1 flex-col space-y-6">
			<div class="flex flex-col rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8">
				<p class="text-sm uppercase tracking-[0.4em] text-emerald-200/80">Currently Viewing</p>
				<h2 class="mt-4 text-4xl font-semibold text-white">{selectedTool.name}</h2>
				<p class="mt-3 text-base text-slate-300">{selectedTool.summary}</p>

				<div class="mt-8 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-6">
					<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Use cases</p>
					<ul class="mt-5 space-y-4 text-base text-slate-200">
						{#each selectedTool.useCases as useCase}
							<li class="flex items-start gap-3">
								<span class="mt-1 inline-flex size-2 rounded-full bg-emerald-400"></span>
								<p>{useCase}</p>
							</li>
						{/each}
					</ul>
				</div>
			</div>

			{#if selectedTool.id === 'data-extractor'}
				<DataExtractorTable />
			{/if}
		</section>
	</div>
</main>

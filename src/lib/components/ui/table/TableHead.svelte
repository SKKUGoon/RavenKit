<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
	};

	let { class: className = '', children }: Props = $props();
</script>

<thead class={`text-xs uppercase tracking-[0.2em] text-slate-400 ${className}`.trim()}>
	{@render children?.()}
</thead>

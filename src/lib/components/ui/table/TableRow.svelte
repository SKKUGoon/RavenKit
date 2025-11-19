<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children?: Snippet;
	};

	let { class: className = '', children }: Props = $props();
</script>

<tr class={`border-b border-slate-800/80 ${className}`.trim()}>
	{@render children?.()}
</tr>

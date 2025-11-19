<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		style?: string;
		children?: Snippet;
	};

	let { class: className = '', style = '', children }: Props = $props();
</script>

<td class={`px-3 py-2 text-sm text-slate-200 ${className}`.trim()} style={style}>
	{@render children?.()}
</td>

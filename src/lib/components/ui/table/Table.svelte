<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		style?: string;
		children?: Snippet;
	};

	let { class: className = '', style = '', children }: Props = $props();
</script>

<table
	class={`w-full border-separate border-spacing-0 text-sm text-slate-200 ${className}`.trim()}
	style={style}
>
	{@render children?.()}
</table>

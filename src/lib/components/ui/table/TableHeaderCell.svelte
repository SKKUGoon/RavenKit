<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		style?: string;
		children?: Snippet;
	};

	let { class: className = '', style = '', children }: Props = $props();
</script>

<th
	scope="col"
	class={`bg-slate-950/60 px-3 py-2 text-left font-semibold text-slate-300 first:rounded-tl-3xl last:rounded-tr-3xl ${className}`.trim()}
	style={style}
>
	{@render children?.()}
</th>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		open: boolean;
		children?: Snippet;
	};

	let { open, children }: Props = $props();
	const dispatch = createEventDispatcher();

	const close = () => {
		dispatch('close');
	};
</script>

{#if open}
	<div class="fixed inset-0 z-40 flex items-center justify-center">
		<button
			type="button"
			class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
			onclick={close}
			aria-label="Close dialog backdrop"
		></button>
		<div
			class="relative z-50 w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-8 text-slate-100 shadow-2xl"
			role="dialog"
			aria-modal="true"
		>
			<button
				type="button"
				class="absolute right-4 top-4 text-slate-400 transition hover:text-white"
				onclick={close}
				aria-label="Close dialog"
			>
				&times;
			</button>
			{@render children?.()}
		</div>
	</div>
{/if}

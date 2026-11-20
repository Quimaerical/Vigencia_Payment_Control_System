<script lang="ts">
	import type { Snippet } from 'svelte';
	import { pointerSkew } from '../../actions/pointerSkew';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';

	interface Props {
		id: string;
		title: string;
		isShimmer?: boolean;
		children: Snippet;
	}

	let { id, title, isShimmer = false, children }: Props = $props();
</script>

<div
	use:pointerSkew={{ disabled: workspaceStore.isCustomizing }}
	class="modular-card chroma-glass-card relative space-y-2.5 rounded-2xl p-3.5 transition-colors duration-300 {isShimmer
		? 'shimmer-glass'
		: ''} {workspaceStore.isCustomizing
		? 'border-dashed border-teal-400'
		: 'modular-card-interactive'}"
	data-module-id={id}
	data-module-name={title}
>
	{#if workspaceStore.isCustomizing}
		<div
			class="modular-controls mb-1 flex items-center justify-between border-b border-slate-900/10 pb-2 opacity-90 transition-opacity dark:border-white/10"
		>
			<div class="flex items-center gap-1 text-[11px] font-bold text-teal-800 dark:text-teal-300">
				<span
					class="material-symbols-outlined cursor-grab text-[16px] text-slate-500 dark:text-neutral-400"
				>
					drag_indicator
				</span>
				<span class="font-mono text-[11px]">{title}</span>
			</div>
			<div class="flex items-center gap-1">
				<button
					class="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900/8 text-xs text-slate-700 transition-colors hover:bg-teal-600 hover:text-white dark:bg-white/10 dark:text-neutral-300 dark:hover:bg-teal-400 dark:hover:text-black"
					onclick={() => workspaceStore.moveModuleUp(id)}
					title="Mover arriba"
				>
					<span class="material-symbols-outlined text-[14px]">arrow_upward</span>
				</button>
				<button
					class="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900/8 text-xs text-slate-700 transition-colors hover:bg-teal-600 hover:text-white dark:bg-white/10 dark:text-neutral-300 dark:hover:bg-teal-400 dark:hover:text-black"
					onclick={() => workspaceStore.moveModuleDown(id)}
					title="Mover abajo"
				>
					<span class="material-symbols-outlined text-[14px]">arrow_downward</span>
				</button>
				<button
					class="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/15 text-xs text-rose-700 transition-colors hover:bg-rose-600 hover:text-white dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500"
					onclick={() => workspaceStore.deleteModule(id)}
					title="Eliminar Módulo"
				>
					<span class="material-symbols-outlined text-[14px]">close</span>
				</button>
			</div>
		</div>
	{/if}

	{@render children()}
</div>

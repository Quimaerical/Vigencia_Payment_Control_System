<script lang="ts">
	import type { Snippet } from 'svelte';
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
	class="modular-card chroma-glass-card rounded-2xl p-3.5 space-y-2.5 relative transition-all duration-300 {isShimmer
		? 'shimmer-glass'
		: ''} {workspaceStore.isCustomizing ? 'border-teal-400 border-dashed' : ''}"
	data-module-id={id}
	data-module-name={title}
>
	{#if workspaceStore.isCustomizing}
		<div
			class="modular-controls flex items-center justify-between pb-2 mb-1 border-b border-white/10 opacity-90 transition-opacity"
		>
			<div class="flex items-center gap-1 text-[11px] font-bold text-teal-300">
				<span class="material-symbols-outlined text-[16px] text-neutral-400 cursor-grab">
					drag_indicator
				</span>
				<span class="font-mono text-[11px]">{title}</span>
			</div>
			<div class="flex items-center gap-1">
				<button
					class="w-6 h-6 rounded-lg bg-white/10 hover:bg-teal-400 hover:text-black flex items-center justify-center text-xs text-neutral-300 transition-colors"
					onclick={() => workspaceStore.moveModuleUp(id)}
					title="Mover arriba"
				>
					<span class="material-symbols-outlined text-[14px]">arrow_upward</span>
				</button>
				<button
					class="w-6 h-6 rounded-lg bg-white/10 hover:bg-teal-400 hover:text-black flex items-center justify-center text-xs text-neutral-300 transition-colors"
					onclick={() => workspaceStore.moveModuleDown(id)}
					title="Mover abajo"
				>
					<span class="material-symbols-outlined text-[14px]">arrow_downward</span>
				</button>
				<button
					class="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white flex items-center justify-center text-xs transition-colors"
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

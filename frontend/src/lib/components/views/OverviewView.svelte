<script lang="ts">
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import ProjectStripModule from '../modules/ProjectStripModule.svelte';
	import KpiGridModule from '../modules/KpiGridModule.svelte';
	import QuickActionsModule from '../modules/QuickActionsModule.svelte';
	import ProjectBreakdownModule from '../modules/ProjectBreakdownModule.svelte';
	import PettyCashModule from '../modules/PettyCashModule.svelte';

	let activeModules = $derived(workspaceStore.modules);
</script>

<section class="view-panel space-y-3" id="tab-overview">
	<!-- Workspace Customization Toolbar (visible only when in customizing mode) -->
	{#if workspaceStore.isCustomizing}
		<div
			class="chroma-glass-card rounded-2xl p-3 border-teal-400/40 bg-gradient-to-r from-teal-950/60 via-purple-950/50 to-neutral-950/80 shadow-[0_0_20px_rgba(45,212,191,0.2)]"
		>
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
				<div class="flex items-center gap-2">
					<span
						class="w-7 h-7 rounded-lg bg-teal-500 text-neutral-950 font-bold flex items-center justify-center animate-spin"
					>
						<span class="material-symbols-outlined text-[16px]">settings</span>
					</span>
					<div>
						<p class="text-xs font-bold text-white leading-tight">Modo Edición de Módulos Activo</p>
						<p class="text-[10px] text-neutral-400">Reordena con [↑][↓] o elimina con [✕]</p>
					</div>
				</div>
				<div class="flex items-center gap-1.5 self-end sm:self-center">
					<button
						class="px-2.5 py-1.5 rounded-xl bg-teal-500 text-neutral-950 text-[11px] font-bold shadow-sm hover:bg-mint-300 transition-all flex items-center gap-1 interactive-spring"
						onclick={() => workspaceStore.toggleDrawer()}
					>
						<span class="material-symbols-outlined text-[15px]">add</span>
						<span>+ Catálogo</span>
					</button>
					<button
						class="px-3 py-1.5 rounded-xl bg-emerald-500 text-neutral-950 text-[11px] font-bold shadow-sm hover:bg-emerald-400 transition-all flex items-center gap-1 interactive-spring"
						onclick={() => workspaceStore.toggleCustomizeMode()}
					>
						<span class="material-symbols-outlined text-[15px]">check</span>
						<span>Listo</span>
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Dynamic Modular Canvas with Reactive Reordering -->
	<div class="space-y-3" id="modularWidgetContainer">
		{#each activeModules as mod (mod.id)}
			{#if mod.id === 'mod-project-strip'}
				<ProjectStripModule />
			{:else if mod.id === 'mod-kpi-grid'}
				<KpiGridModule />
			{:else if mod.id === 'mod-quick-actions'}
				<QuickActionsModule />
			{:else if mod.id === 'mod-project-breakdown'}
				<ProjectBreakdownModule />
			{:else if mod.id === 'mod-petty-cash'}
				<PettyCashModule />
			{/if}
		{/each}
	</div>

	<!-- Add Module Shortcut Card at Bottom of Workspace -->
	<button
		class="w-full py-3 border border-dashed border-teal-400/40 rounded-2xl flex items-center justify-center gap-2 text-teal-300 text-xs font-bold hover:bg-teal-400/10 hover:border-teal-300 transition-all interactive-spring bg-neutral-950/40"
		onclick={() => workspaceStore.toggleDrawer()}
	>
		<span class="material-symbols-outlined text-[18px]">add_circle</span>
		<span>Añadir o Restaurar Módulos desde el Catálogo</span>
	</button>
</section>

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
			class="chroma-glass-card rounded-2xl border-teal-400/40 bg-gradient-to-r from-teal-950/60 via-purple-950/50 to-neutral-950/80 p-3 shadow-[0_0_20px_rgba(45,212,191,0.2)]"
		>
			<div class="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
				<div class="flex items-center gap-2">
					<span
						class="flex h-7 w-7 animate-spin items-center justify-center rounded-lg bg-teal-500 font-bold text-neutral-950"
					>
						<span class="material-symbols-outlined text-[16px]">settings</span>
					</span>
					<div>
						<p class="text-xs leading-tight font-bold text-white">Modo Edición de Módulos Activo</p>
						<p class="text-[10px] text-neutral-400">Reordena con [↑][↓] o elimina con [✕]</p>
					</div>
				</div>
				<div class="flex items-center gap-1.5 self-end sm:self-center">
					<button
						class="interactive-spring flex items-center gap-1 rounded-xl bg-teal-500 px-2.5 py-1.5 text-[11px] font-bold text-neutral-950 shadow-sm transition-all hover:bg-mint-300"
						onclick={() => workspaceStore.toggleDrawer()}
					>
						<span class="material-symbols-outlined text-[15px]">add</span>
						<span>+ Catálogo</span>
					</button>
					<button
						class="interactive-spring flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-neutral-950 shadow-sm transition-all hover:bg-emerald-400"
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
		class="interactive-spring flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-teal-400/40 bg-neutral-950/40 py-3 text-xs font-bold text-teal-300 transition-all hover:border-teal-300 hover:bg-teal-400/10"
		onclick={() => workspaceStore.toggleDrawer()}
	>
		<span class="material-symbols-outlined text-[18px]">add_circle</span>
		<span>Añadir o Restaurar Módulos desde el Catálogo</span>
	</button>
</section>

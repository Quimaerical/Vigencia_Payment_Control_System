<script lang="ts">
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import { MOCK_DEFAULT_MODULES } from '../../services/mockData';
	import type { ModuloWorkspace } from '../../types/financial';

	let activeIds = $derived(new Set(workspaceStore.modules.map((m) => m.id)));
</script>

<!-- Backdrop Blur -->
{#if workspaceStore.isDrawerOpen}
	<button
		type="button"
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity cursor-default"
		onclick={() => workspaceStore.toggleDrawer()}
		aria-label="Cerrar Catálogo de Módulos"
	></button>
{/if}

<aside
	class="fixed inset-y-0 right-0 w-84 max-w-[88vw] z-50 transform transition-transform duration-300 chroma-glass-card rounded-l-3xl border-r-0 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col h-full p-4 backdrop-blur-3xl bg-neutral-950/70 {workspaceStore.isDrawerOpen
		? 'translate-x-0'
		: 'translate-x-full'}"
	id="moduleDrawer"
>
	<!-- Header -->
	<div class="flex items-center justify-between pb-3 border-b border-white/10">
		<div class="flex items-center gap-2.5">
			<div
				class="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-mint-400 text-neutral-950 font-bold flex items-center justify-center text-[12px] shadow-sm"
			>
				<span class="material-symbols-outlined text-[19px]">widgets</span>
			</div>
			<div>
				<h3 class="font-bold text-white text-[13px]">Catálogo de Módulos</h3>
				<p class="text-[10px] text-neutral-400 font-mono">Workspace Modular Core</p>
			</div>
		</div>
		<button
			class="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
			onclick={() => workspaceStore.toggleDrawer()}
		>
			<span class="material-symbols-outlined text-[20px]">close</span>
		</button>
	</div>

	<!-- Available Modules List -->
	<div class="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
		<p class="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
			Módulos Disponibles para el Lienzo
		</p>

		{#each MOCK_DEFAULT_MODULES as mod (mod.id)}
			{@const isAlreadyActive = activeIds.has(mod.id)}
			<div class="p-2.5 rounded-xl bg-neutral-950/70 border border-white/10 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="material-symbols-outlined text-teal-400 text-[18px]">{mod.icono}</span>
					<div>
						<p class="text-[11px] font-bold text-white">{mod.nombre}</p>
						<p class="text-[10px] text-neutral-400">{mod.subtitulo}</p>
					</div>
				</div>

				{#if isAlreadyActive}
					<span class="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
						Activo
					</span>
				{:else}
					<button
						class="px-2 py-1 rounded-lg bg-teal-400/20 text-teal-300 font-bold text-[11px] hover:bg-teal-400 hover:text-neutral-950 transition-colors flex items-center gap-0.5 border border-teal-400/30"
						onclick={() => workspaceStore.restoreModule(mod.id)}
					>
						<span class="material-symbols-outlined text-[14px]">add</span> Añadir
					</button>
				{/if}
			</div>
		{/each}

		<!-- Quick Navigation list -->
		<div class="pt-3 border-t border-white/10 space-y-1.5">
			<p class="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
				Navegación Rápida
			</p>
			<button
				class="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-teal-300 flex items-center gap-2 hover:bg-teal-400/10"
				onclick={() => {
					workspaceStore.switchTab('overview');
					workspaceStore.toggleDrawer();
				}}
			>
				<span class="material-symbols-outlined text-[16px]">monitoring</span> Overview Modular
			</button>
			<button
				class="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white flex items-center gap-2 hover:bg-white/10"
				onclick={() => {
					workspaceStore.switchTab('ledger');
					workspaceStore.toggleDrawer();
				}}
			>
				<span class="material-symbols-outlined text-[16px]">receipt_long</span> Libro Mayor Forense
			</button>
			<button
				class="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white flex items-center gap-2 hover:bg-white/10"
				onclick={() => {
					workspaceStore.switchTab('accrual');
					workspaceStore.toggleDrawer();
				}}
			>
				<span class="material-symbols-outlined text-[16px]">calculate</span> Generador de Prorrateo
			</button>
			<button
				class="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white flex items-center gap-2 hover:bg-white/10"
				onclick={() => {
					workspaceStore.switchTab('fifo');
					workspaceStore.toggleDrawer();
				}}
			>
				<span class="material-symbols-outlined text-[16px]">account_tree</span> Motor Cascada FIFO
			</button>
			<button
				class="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white flex items-center gap-2 hover:bg-white/10"
				onclick={() => {
					workspaceStore.switchTab('audit');
					workspaceStore.toggleDrawer();
				}}
			>
				<span class="material-symbols-outlined text-[16px]">policy</span> Inspector JSONB Diff
			</button>
		</div>
	</div>

	<!-- Drawer Footer -->
	<div class="pt-3 border-t border-white/10">
		<button
			class="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-mint-400 text-neutral-950 text-[11px] font-bold shadow-[0_0_16px_rgba(20,184,166,0.35)] flex items-center justify-center gap-1.5 interactive-spring"
			onclick={() => {
				workspaceStore.toggleCustomizeMode();
				workspaceStore.toggleDrawer();
			}}
		>
			<span class="material-symbols-outlined text-[16px]">dashboard_customize</span>
			<span>Reorganizar Módulos Activos</span>
		</button>
	</div>
</aside>

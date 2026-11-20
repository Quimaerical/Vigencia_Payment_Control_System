<script lang="ts">
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import { MOCK_DEFAULT_MODULES } from '../../services/mockData';

	let activeIds = $derived(new Set(workspaceStore.modules.map((m) => m.id)));
</script>

<!-- Backdrop Blur -->
{#if workspaceStore.isDrawerOpen}
	<button
		type="button"
		class="fixed inset-0 z-40 cursor-default bg-black/60 backdrop-blur-sm transition-opacity"
		onclick={() => workspaceStore.toggleDrawer()}
		aria-label="Cerrar Catálogo de Módulos"
	></button>
{/if}

<aside
	class="chroma-glass-card surface-modal fixed inset-y-0 right-0 z-50 flex h-full w-84 max-w-[88vw] transform flex-col rounded-l-3xl border-r-0 p-4 shadow-2xl backdrop-blur-3xl transition-transform duration-300 dark:shadow-[0_0_50px_rgba(0,0,0,0.9)] {workspaceStore.isDrawerOpen
		? 'translate-x-0'
		: 'translate-x-full'}"
	id="moduleDrawer"
>
	<!-- Header -->
	<div
		class="flex items-center justify-between border-b border-slate-900/10 pb-3 dark:border-white/10"
	>
		<div class="flex items-center gap-2.5">
			<div
				class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-mint-400 text-[12px] font-bold text-neutral-950 shadow-sm"
			>
				<span class="material-symbols-outlined text-[19px]">widgets</span>
			</div>
			<div>
				<h3 class="text-[13px] font-bold text-slate-900 dark:text-white">Catálogo de Módulos</h3>
				<p class="font-mono text-[10px] text-slate-600 dark:text-neutral-400">
					Workspace Modular Core
				</p>
			</div>
		</div>
		<button
			class="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-900/8 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
			onclick={() => workspaceStore.toggleDrawer()}
		>
			<span class="material-symbols-outlined text-[20px]">close</span>
		</button>
	</div>

	<!-- Available Modules List -->
	<div class="mt-4 flex-1 space-y-2.5 overflow-y-auto pr-1">
		<p
			class="font-mono text-[10px] font-bold tracking-wider text-slate-600 uppercase dark:text-neutral-400"
		>
			Módulos Disponibles para el Lienzo
		</p>

		{#each MOCK_DEFAULT_MODULES as mod (mod.id)}
			{@const isAlreadyActive = activeIds.has(mod.id)}
			<div class="surface-subcard flex items-center justify-between rounded-xl p-2.5">
				<div class="flex items-center gap-2">
					<span class="material-symbols-outlined text-[18px] text-teal-700 dark:text-teal-400">
						{mod.icono}
					</span>
					<div>
						<p class="text-[11px] font-bold text-slate-900 dark:text-white">{mod.nombre}</p>
						<p class="text-[10px] text-slate-600 dark:text-neutral-400">{mod.subtitulo}</p>
					</div>
				</div>

				{#if isAlreadyActive}
					<span
						class="rounded border border-emerald-600/25 bg-emerald-500/12 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
					>
						Activo
					</span>
				{:else}
					<button
						class="flex items-center gap-0.5 rounded-lg border border-teal-600/30 bg-teal-600/12 px-2 py-1 text-[11px] font-bold text-teal-800 transition-colors hover:bg-teal-600 hover:text-white dark:border-teal-400/30 dark:bg-teal-400/20 dark:text-teal-300 dark:hover:bg-teal-400 dark:hover:text-neutral-950"
						onclick={() => workspaceStore.restoreModule(mod.id)}
					>
						<span class="material-symbols-outlined text-[14px]">add</span> Añadir
					</button>
				{/if}
			</div>
		{/each}

		<!-- Quick Navigation list -->
		<div class="space-y-1.5 border-t border-slate-900/10 pt-3 dark:border-white/10">
			<p
				class="font-mono text-[10px] font-bold tracking-wider text-slate-600 uppercase dark:text-neutral-400"
			>
				Navegación Rápida
			</p>
			<button
				class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-bold text-teal-800 hover:bg-teal-600/10 dark:text-teal-300 dark:hover:bg-teal-400/10"
				onclick={() => {
					workspaceStore.switchTab('overview');
					workspaceStore.toggleDrawer();
				}}
			>
				<span class="material-symbols-outlined text-[16px]">monitoring</span> Overview Modular
			</button>
			<button
				class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-bold text-slate-800 hover:bg-slate-900/6 dark:text-white dark:hover:bg-white/10"
				onclick={() => {
					workspaceStore.switchTab('ledger');
					workspaceStore.toggleDrawer();
				}}
			>
				<span class="material-symbols-outlined text-[16px]">receipt_long</span> Libro Mayor Forense
			</button>
			<button
				class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-bold text-slate-800 hover:bg-slate-900/6 dark:text-white dark:hover:bg-white/10"
				onclick={() => {
					workspaceStore.switchTab('accrual');
					workspaceStore.toggleDrawer();
				}}
			>
				<span class="material-symbols-outlined text-[16px]">calculate</span> Generador de Prorrateo
			</button>
			<button
				class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-bold text-slate-800 hover:bg-slate-900/6 dark:text-white dark:hover:bg-white/10"
				onclick={() => {
					workspaceStore.switchTab('fifo');
					workspaceStore.toggleDrawer();
				}}
			>
				<span class="material-symbols-outlined text-[16px]">account_tree</span> Motor Cascada FIFO
			</button>
			<button
				class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-bold text-slate-800 hover:bg-slate-900/6 dark:text-white dark:hover:bg-white/10"
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
	<div class="border-t border-slate-900/10 pt-3 dark:border-white/10">
		<button
			class="interactive-spring flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-mint-500 py-2.5 text-[11px] font-bold text-white shadow-[0_0_16px_rgba(20,184,166,0.28)] dark:from-teal-500 dark:to-mint-400 dark:text-neutral-950"
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

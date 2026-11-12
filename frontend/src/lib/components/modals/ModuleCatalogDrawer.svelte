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
	class="chroma-glass-card fixed inset-y-0 right-0 z-50 flex h-full w-84 max-w-[88vw] transform flex-col rounded-l-3xl border-r-0 bg-neutral-950/70 p-4 shadow-[0_0_50px_rgba(0,0,0,0.9)] backdrop-blur-3xl transition-transform duration-300 {workspaceStore.isDrawerOpen
		? 'translate-x-0'
		: 'translate-x-full'}"
	id="moduleDrawer"
>
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-white/10 pb-3">
		<div class="flex items-center gap-2.5">
			<div
				class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-mint-400 text-[12px] font-bold text-neutral-950 shadow-sm"
			>
				<span class="material-symbols-outlined text-[19px]">widgets</span>
			</div>
			<div>
				<h3 class="text-[13px] font-bold text-white">Catálogo de Módulos</h3>
				<p class="font-mono text-[10px] text-neutral-400">Workspace Modular Core</p>
			</div>
		</div>
		<button
			class="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
			onclick={() => workspaceStore.toggleDrawer()}
		>
			<span class="material-symbols-outlined text-[20px]">close</span>
		</button>
	</div>

	<!-- Available Modules List -->
	<div class="mt-4 flex-1 space-y-2.5 overflow-y-auto pr-1">
		<p class="font-mono text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
			Módulos Disponibles para el Lienzo
		</p>

		{#each MOCK_DEFAULT_MODULES as mod (mod.id)}
			{@const isAlreadyActive = activeIds.has(mod.id)}
			<div
				class="flex items-center justify-between rounded-xl border border-white/10 bg-neutral-950/70 p-2.5"
			>
				<div class="flex items-center gap-2">
					<span class="material-symbols-outlined text-[18px] text-teal-400">{mod.icono}</span>
					<div>
						<p class="text-[11px] font-bold text-white">{mod.nombre}</p>
						<p class="text-[10px] text-neutral-400">{mod.subtitulo}</p>
					</div>
				</div>

				{#if isAlreadyActive}
					<span
						class="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400"
					>
						Activo
					</span>
				{:else}
					<button
						class="flex items-center gap-0.5 rounded-lg border border-teal-400/30 bg-teal-400/20 px-2 py-1 text-[11px] font-bold text-teal-300 transition-colors hover:bg-teal-400 hover:text-neutral-950"
						onclick={() => workspaceStore.restoreModule(mod.id)}
					>
						<span class="material-symbols-outlined text-[14px]">add</span> Añadir
					</button>
				{/if}
			</div>
		{/each}

		<!-- Quick Navigation list -->
		<div class="space-y-1.5 border-t border-white/10 pt-3">
			<p class="font-mono text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
				Navegación Rápida
			</p>
			<button
				class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-bold text-teal-300 hover:bg-teal-400/10"
				onclick={() => {
					workspaceStore.switchTab('overview');
					workspaceStore.toggleDrawer();
				}}
			>
				<span class="material-symbols-outlined text-[16px]">monitoring</span> Overview Modular
			</button>
			<button
				class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-bold text-white hover:bg-white/10"
				onclick={() => {
					workspaceStore.switchTab('ledger');
					workspaceStore.toggleDrawer();
				}}
			>
				<span class="material-symbols-outlined text-[16px]">receipt_long</span> Libro Mayor Forense
			</button>
			<button
				class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-bold text-white hover:bg-white/10"
				onclick={() => {
					workspaceStore.switchTab('accrual');
					workspaceStore.toggleDrawer();
				}}
			>
				<span class="material-symbols-outlined text-[16px]">calculate</span> Generador de Prorrateo
			</button>
			<button
				class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-bold text-white hover:bg-white/10"
				onclick={() => {
					workspaceStore.switchTab('fifo');
					workspaceStore.toggleDrawer();
				}}
			>
				<span class="material-symbols-outlined text-[16px]">account_tree</span> Motor Cascada FIFO
			</button>
			<button
				class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-bold text-white hover:bg-white/10"
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
	<div class="border-t border-white/10 pt-3">
		<button
			class="interactive-spring flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-mint-400 py-2.5 text-[11px] font-bold text-neutral-950 shadow-[0_0_16px_rgba(20,184,166,0.35)]"
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

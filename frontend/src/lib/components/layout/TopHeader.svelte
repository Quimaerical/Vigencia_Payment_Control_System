<script lang="ts">
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import { financialStore } from '../../stores/financialStore.svelte';
	import { RolUsuario } from '@app/shared';

	let activeProject = $derived(
		financialStore.proyectos.find((p) => p.id === workspaceStore.activeProjectId) ||
			financialStore.proyectos[0]
	);
</script>

<header
	class="sticky top-0 z-30 chroma-glass-card rounded-b-2xl border-t-0 mx-2 mt-1 px-3.5 py-2.5 shadow-2xl backdrop-blur-2xl"
>
	<div class="flex items-center justify-between">
		<!-- Brand & Scientific Node Mark -->
		<div class="flex items-center gap-2.5">
			<div
				class="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-400 to-mint-300 flex items-center justify-center text-black font-bold shadow-[0_0_16px_rgba(45,212,191,0.4)] ring-1 ring-white/40"
			>
				<span class="material-symbols-outlined text-[20px] text-neutral-950 font-bold">biotech</span>
			</div>
			<div>
				<div class="flex items-center gap-1.5">
					<h1 class="text-title font-headline-sm font-bold tracking-tight text-white">Vigencia Core</h1>
					<span
						class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-400/15 text-teal-300 border border-teal-400/30"
					>
						v4.8
					</span>
				</div>
				<div class="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
					<span
						class="w-1.5 h-1.5 rounded-full bg-emerald-accent animate-ping shadow-[0_0_8px_#10B981]"
					></span>
					<span>Nodo Fiscal {activeProject ? activeProject.codigo : 'FQ-2025'}</span>
				</div>
			</div>
		</div>

		<!-- Top Action Controls -->
		<div class="flex items-center gap-1.5">
			<!-- Customize Workspace Mode Toggle Button -->
			<button
				class="px-2.5 py-1.5 rounded-xl text-body-sm flex items-center gap-1.5 transition-all interactive-spring shadow-[0_0_12px_rgba(45,212,191,0.15)] {workspaceStore.isCustomizing
					? 'bg-teal-400 text-neutral-950 font-bold ring-2 ring-teal-300'
					: 'bg-teal-400/15 text-teal-300 border border-teal-400/35 hover:bg-teal-400/25'}"
				onclick={() => workspaceStore.toggleCustomizeMode()}
				title="Personalizar Módulos"
			>
				<span class="material-symbols-outlined text-[17px]">dashboard_customize</span>
				<span class="text-[11px] font-semibold">
					{workspaceStore.isCustomizing ? 'Salir' : 'Personalizar'}
				</span>
			</button>

			<!-- Theme Toggle -->
			<button
				class="w-8 h-8 rounded-xl flex items-center justify-center text-amber-300 hover:text-white bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/15 shadow-sm"
				onclick={() => workspaceStore.toggleTheme()}
				title={workspaceStore.isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
			>
				<span class="material-symbols-outlined text-[18px]">
					{workspaceStore.isDarkMode ? 'light_mode' : 'dark_mode'}
				</span>
			</button>

			<!-- Open Module Catalog Drawer -->
			<button
				class="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-mint-400 text-neutral-950 font-bold flex items-center justify-center shadow-[0_0_16px_rgba(20,184,166,0.35)] active:scale-95 transition-all"
				onclick={() => workspaceStore.toggleDrawer()}
				title="Catálogo de Módulos"
			>
				<span class="material-symbols-outlined text-[18px]">add_box</span>
			</button>
		</div>
	</div>

	<!-- Active Role Switcher Pill Bar & Project Selector -->
	<div
		class="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-[11px]"
	>
		<div class="bg-black/60 p-0.5 rounded-lg border border-white/15 flex items-center gap-0.5">
			<button
				class="px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold transition-all {workspaceStore.currentRole ===
				RolUsuario.ADMINISTRADOR
					? 'bg-teal-500 text-neutral-950 shadow-[0_0_10px_rgba(20,184,166,0.4)]'
					: 'text-neutral-400 hover:text-teal-300'}"
				onclick={() => workspaceStore.setRole(RolUsuario.ADMINISTRADOR)}
			>
				Admin
			</button>
			<button
				class="px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold transition-all {workspaceStore.currentRole ===
				RolUsuario.GENERADOR
					? 'bg-teal-500 text-neutral-950 shadow-[0_0_10px_rgba(20,184,166,0.4)]'
					: 'text-neutral-400 hover:text-teal-300'}"
				onclick={() => workspaceStore.setRole(RolUsuario.GENERADOR)}
			>
				Generador
			</button>
			<button
				class="px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold transition-all {workspaceStore.currentRole ===
				RolUsuario.RECEPTOR
					? 'bg-teal-500 text-neutral-950 shadow-[0_0_10px_rgba(20,184,166,0.4)]'
					: 'text-neutral-400 hover:text-teal-300'}"
				onclick={() => workspaceStore.setRole(RolUsuario.RECEPTOR)}
			>
				Tesorero
			</button>
		</div>

		<div
			class="flex items-center gap-1 font-mono text-[11px] px-2 py-1 rounded-lg bg-white/5 border border-white/15 text-teal-300 truncate max-w-[160px]"
		>
			<span class="material-symbols-outlined text-[14px]">science</span>
			<span class="truncate">{activeProject ? activeProject.nombre : 'FQ-2025 Quincena 10'}</span>
		</div>
	</div>
</header>

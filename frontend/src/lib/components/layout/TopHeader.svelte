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
	class="chroma-glass-card sticky top-0 z-30 mx-2 mt-1 rounded-b-2xl border-t-0 px-3.5 py-2.5 shadow-2xl backdrop-blur-2xl"
>
	<div class="flex items-center justify-between">
		<!-- Brand & Scientific Node Mark -->
		<div class="flex items-center gap-2.5">
			<div
				class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 via-teal-400 to-mint-300 font-bold text-black shadow-[0_0_16px_rgba(45,212,191,0.4)] ring-1 ring-white/40"
			>
				<span class="material-symbols-outlined text-[20px] font-bold text-neutral-950">biotech</span
				>
			</div>
			<div>
				<div class="flex items-center gap-1.5">
					<h1 class="text-title font-headline-sm font-bold tracking-tight text-white">
						Vigencia Core
					</h1>
					<span
						class="rounded border border-teal-400/30 bg-teal-400/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-teal-300"
					>
						v4.8
					</span>
				</div>
				<div class="flex items-center gap-1 font-mono text-[11px] text-neutral-400">
					<span
						class="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-accent shadow-[0_0_8px_#10B981]"
					></span>
					<span>Nodo Fiscal {activeProject ? activeProject.codigo : 'FQ-2025'}</span>
				</div>
			</div>
		</div>

		<!-- Top Action Controls -->
		<div class="flex items-center gap-1.5">
			<!-- Customize Workspace Mode Toggle Button -->
			<button
				class="text-body-sm interactive-spring flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 shadow-[0_0_12px_rgba(45,212,191,0.15)] transition-all {workspaceStore.isCustomizing
					? 'bg-teal-400 font-bold text-neutral-950 ring-2 ring-teal-300'
					: 'border border-teal-400/35 bg-teal-400/15 text-teal-300 hover:bg-teal-400/25'}"
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
				class="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-amber-300 shadow-sm transition-all hover:bg-white/10 hover:text-white active:scale-95"
				onclick={() => workspaceStore.toggleTheme()}
				title={workspaceStore.isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
			>
				<span class="material-symbols-outlined text-[18px]">
					{workspaceStore.isDarkMode ? 'light_mode' : 'dark_mode'}
				</span>
			</button>

			<!-- Open Module Catalog Drawer -->
			<button
				class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-mint-400 font-bold text-neutral-950 shadow-[0_0_16px_rgba(20,184,166,0.35)] transition-all active:scale-95"
				onclick={() => workspaceStore.toggleDrawer()}
				title="Catálogo de Módulos"
			>
				<span class="material-symbols-outlined text-[18px]">add_box</span>
			</button>
		</div>
	</div>

	<!-- Active Role Switcher Pill Bar & Project Selector -->
	<div
		class="mt-2.5 flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[11px]"
	>
		<div class="flex items-center gap-0.5 rounded-lg border border-white/15 bg-black/60 p-0.5">
			<button
				class="rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold transition-all {workspaceStore.currentRole ===
				RolUsuario.ADMINISTRADOR
					? 'bg-teal-500 text-neutral-950 shadow-[0_0_10px_rgba(20,184,166,0.4)]'
					: 'text-neutral-400 hover:text-teal-300'}"
				onclick={() => workspaceStore.setRole(RolUsuario.ADMINISTRADOR)}
			>
				Admin
			</button>
			<button
				class="rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold transition-all {workspaceStore.currentRole ===
				RolUsuario.GENERADOR
					? 'bg-teal-500 text-neutral-950 shadow-[0_0_10px_rgba(20,184,166,0.4)]'
					: 'text-neutral-400 hover:text-teal-300'}"
				onclick={() => workspaceStore.setRole(RolUsuario.GENERADOR)}
			>
				Generador
			</button>
			<button
				class="rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold transition-all {workspaceStore.currentRole ===
				RolUsuario.RECEPTOR
					? 'bg-teal-500 text-neutral-950 shadow-[0_0_10px_rgba(20,184,166,0.4)]'
					: 'text-neutral-400 hover:text-teal-300'}"
				onclick={() => workspaceStore.setRole(RolUsuario.RECEPTOR)}
			>
				Tesorero
			</button>
		</div>

		<div
			class="flex max-w-[160px] items-center gap-1 truncate rounded-lg border border-white/15 bg-white/5 px-2 py-1 font-mono text-[11px] text-teal-300"
		>
			<span class="material-symbols-outlined text-[14px]">science</span>
			<span class="truncate">{activeProject ? activeProject.nombre : 'FQ-2025 Quincena 10'}</span>
		</div>
	</div>
</header>

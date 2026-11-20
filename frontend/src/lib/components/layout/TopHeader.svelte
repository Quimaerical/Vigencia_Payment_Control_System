<script lang="ts">
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import { financialStore } from '../../stores/financialStore.svelte';
	import { authStore } from '../../stores/authStore.svelte';

	let activeProject = $derived(
		financialStore.proyectos.find((p) => p.id === workspaceStore.activeProjectId) ||
			financialStore.proyectos[0]
	);
</script>

<header
	class="chroma-glass-card sticky top-0 z-30 mx-2 mt-1 rounded-b-2xl border-t-0 px-3.5 py-2.5 shadow-2xl backdrop-blur-2xl"
>
	<div class="flex flex-wrap items-center justify-between gap-2">
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
					<h1
						class="text-title font-headline-sm font-bold tracking-tight text-slate-900 dark:text-white"
					>
						Vigencia Core
					</h1>
					<span
						class="rounded border border-teal-700/25 bg-teal-600/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-teal-800 dark:border-teal-400/30 dark:bg-teal-400/15 dark:text-teal-300"
					>
						v4.8
					</span>
				</div>
				<div
					class="flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-neutral-400"
				>
					<span
						class="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-accent shadow-[0_0_8px_#10B981]"
					></span>
					<span>Nodo Fiscal {activeProject ? activeProject.codigo : 'Sin proyecto'}</span>
				</div>
			</div>
		</div>

		<!-- Top Action Controls -->
		<div class="flex items-center gap-1.5">
			<!-- Login / Session Button -->
			<button
				class="flex items-center gap-1 rounded-xl border border-slate-300/80 bg-white/75 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-teal-800 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-teal-300 dark:hover:bg-white/10"
				onclick={() => (workspaceStore.loginModalOpen = true)}
				title="Autenticación de Usuario"
			>
				<span class="material-symbols-outlined text-[15px]">
					{authStore.isAuthenticated ? 'verified_user' : 'login'}
				</span>
				<span>
					{authStore.usuarioActual ? authStore.usuarioActual.username : 'Iniciar Sesión'}
				</span>
			</button>

			<!-- Customize Workspace Mode Toggle Button -->
			<button
				class="text-body-sm interactive-spring flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 shadow-[0_0_12px_rgba(45,212,191,0.15)] transition-all {workspaceStore.isCustomizing
					? 'bg-teal-500 font-bold text-white ring-2 ring-teal-300 dark:bg-teal-400 dark:text-neutral-950'
					: 'border border-teal-700/25 bg-teal-600/10 text-teal-800 hover:bg-teal-600/20 dark:border-teal-400/35 dark:bg-teal-400/15 dark:text-teal-300 dark:hover:bg-teal-400/25'}"
				onclick={() => workspaceStore.toggleCustomizeMode()}
				title="Personalizar Módulos"
			>
				<span class="material-symbols-outlined text-[17px]">dashboard_customize</span>
				<span class="hidden text-[11px] font-semibold sm:inline">
					{workspaceStore.isCustomizing ? 'Salir' : 'Personalizar'}
				</span>
			</button>

			<!-- Theme Toggle -->
			<button
				class="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-300/80 bg-white/75 text-amber-600 shadow-sm transition-all hover:bg-white hover:text-slate-900 active:scale-95 dark:border-white/15 dark:bg-white/5 dark:text-amber-300 dark:hover:bg-white/10 dark:hover:text-white"
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

	<!-- Authenticated Role Indicator & Project Selector -->
	<div
		class="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-900/10 pt-2 text-[11px] dark:border-white/10"
	>
		<div class="flex items-center gap-2">
			{#if authStore.isAuthenticated && authStore.usuarioActual}
				<span
					class="rounded-md border border-teal-700/25 bg-teal-600/12 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-800 uppercase dark:border-teal-400/30 dark:bg-teal-500/20 dark:text-teal-300"
				>
					Rol: {authStore.usuarioActual.rol}
				</span>
				<button
					type="button"
					class="rounded-md border border-slate-300/80 bg-white/70 px-2 py-0.5 font-mono text-[10px] text-slate-700 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10"
					onclick={() => (workspaceStore.loginModalOpen = true)}
				>
					Cambiar cuenta
				</button>
			{:else}
				<button
					type="button"
					class="rounded-md border border-amber-500/40 bg-amber-100/90 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-300"
					onclick={() => (workspaceStore.loginModalOpen = true)}
				>
					Sin sesión activa — Autenticar
				</button>
			{/if}
		</div>

		<select
			aria-label="Proyecto activo"
			class="surface-input max-w-[180px] truncate rounded-lg px-2 py-1 font-mono text-[11px] font-medium text-teal-800 dark:text-teal-300"
			bind:value={workspaceStore.activeProjectId}
		>
			{#each financialStore.proyectos as proy (proy.id)}
				<option value={proy.id}>{proy.codigo} - {proy.nombre}</option>
			{/each}
		</select>
	</div>
</header>

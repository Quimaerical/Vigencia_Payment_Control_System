<script lang="ts">
	import ModularCardWrapper from './ModularCardWrapper.svelte';
	import { financialStore } from '../../stores/financialStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';

	let activeProject = $derived(
		financialStore.proyectos.find((p) => p.id === workspaceStore.activeProjectId) ||
			financialStore.proyectos[0]
	);
</script>

<ModularCardWrapper id="mod-project-strip" title="Ficha de Proyecto" isShimmer={true}>
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div class="flex items-center gap-2">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-600/25 bg-teal-600/12 text-teal-800 dark:border-teal-400/25 dark:bg-teal-400/15 dark:text-teal-300"
			>
				<span class="material-symbols-outlined text-[18px]">domain</span>
			</div>
			<div>
				<p class="text-[12px] leading-none font-bold text-slate-900 dark:text-white">
					{activeProject ? activeProject.nombre : 'Sin proyecto activo'}
				</p>
				<p class="mt-0.5 font-mono text-[10px] text-slate-600 dark:text-neutral-400">
					{activeProject
						? activeProject.descripcion || `Código: ${activeProject.codigo}`
						: 'Autentique una sesión para cargar el proyecto seleccionado'}
				</p>
			</div>
		</div>
		<span
			class="flex items-center gap-1 rounded-full border border-emerald-600/30 bg-emerald-500/12 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 shadow-[0_0_8px_rgba(16,185,129,0.15)] dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:shadow-[0_0_8px_rgba(16,185,129,0.2)]"
		>
			<span class="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-accent"></span>
			{activeProject ? (activeProject.estaActivo ? 'Activo' : 'Inactivo') : 'Sin sesión'}
		</span>
	</div>
</ModularCardWrapper>

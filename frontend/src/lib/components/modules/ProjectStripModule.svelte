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
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-400/25 bg-teal-400/15 text-teal-300"
			>
				<span class="material-symbols-outlined text-[18px]">domain</span>
			</div>
			<div>
				<p class="text-[12px] leading-none font-bold text-white">
					{activeProject ? activeProject.nombre : 'Lab de Física Cuántica FACYT'}
				</p>
				<p class="mt-0.5 font-mono text-[10px] text-neutral-400">
					{activeProject
						? activeProject.descripcion
						: 'Subvención Fonacit #8820 · Período Quincena 10'}
				</p>
			</div>
		</div>
		<span
			class="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
		>
			<span class="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-accent"></span> Activo
		</span>
	</div>
</ModularCardWrapper>

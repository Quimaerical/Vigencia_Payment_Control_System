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
				class="w-8 h-8 rounded-lg bg-teal-400/15 text-teal-300 flex items-center justify-center border border-teal-400/25"
			>
				<span class="material-symbols-outlined text-[18px]">domain</span>
			</div>
			<div>
				<p class="text-[12px] font-bold text-white leading-none">
					{activeProject ? activeProject.nombre : 'Lab de Física Cuántica FACYT'}
				</p>
				<p class="text-[10px] font-mono text-neutral-400 mt-0.5">
					{activeProject
						? activeProject.descripcion
						: 'Subvención Fonacit #8820 · Período Quincena 10'}
				</p>
			</div>
		</div>
		<span
			class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-400/30 flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
		>
			<span class="w-1.5 h-1.5 rounded-full bg-emerald-accent animate-ping"></span> Activo
		</span>
	</div>
</ModularCardWrapper>

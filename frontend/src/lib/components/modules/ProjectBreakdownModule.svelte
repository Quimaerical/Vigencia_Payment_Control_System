<script lang="ts">
	import ModularCardWrapper from './ModularCardWrapper.svelte';
	import { financialStore } from '../../stores/financialStore.svelte';

	let proyectos = $derived(financialStore.proyectos);
	let totalComprometido = $derived(proyectos.reduce((acc, p) => acc + p.presupuestoUsd, 0));
</script>

<ModularCardWrapper id="mod-project-breakdown" title="Compromisos y Presupuesto por Proyecto">
	<div class="flex items-center justify-between pb-1">
		<div>
			<h2 class="text-[13px] font-bold text-white">Compromisos por Proyecto</h2>
			<p class="text-[11px] text-neutral-400">Distribución del presupuesto aprobado</p>
		</div>
		<span class="font-mono text-[11px] font-bold text-teal-300">
			${totalComprometido.toLocaleString('en-US', { minimumFractionDigits: 0 })} USD
		</span>
	</div>

	<div class="space-y-2 text-[11px]">
		{#each proyectos as proy (proy.id)}
			<div>
				<div class="mb-1 flex justify-between">
					<span class="text-neutral-200">{proy.nombre} ({proy.codigo})</span>
					<span class="font-mono font-bold text-teal-300">
						${proy.presupuestoUsd.toLocaleString('en-US')} ({proy.porcentajeEjecucion}%)
					</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full border border-white/5 bg-neutral-900">
					<div
						class="animate-fill h-full rounded-full bg-gradient-to-r from-teal-500 to-mint-400 shadow-[0_0_8px_#2DD4BF]"
						style="width: {proy.porcentajeEjecucion}%;"
					></div>
				</div>
			</div>
		{/each}
	</div>
</ModularCardWrapper>

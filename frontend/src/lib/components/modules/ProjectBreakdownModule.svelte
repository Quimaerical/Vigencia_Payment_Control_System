<script lang="ts">
	import ModularCardWrapper from './ModularCardWrapper.svelte';
	import { financialStore } from '../../stores/financialStore.svelte';

	let proyectos = $derived(financialStore.proyectos);
	let totalComprometido = $derived(proyectos.reduce((acc, p) => acc + p.presupuestoUsd, 0));
</script>

<ModularCardWrapper id="mod-project-breakdown" title="Causado y Ejecución por Proyecto">
	<div class="flex items-center justify-between pb-1">
		<div>
			<h2 class="text-[13px] font-bold text-slate-900 dark:text-white">Causado por Proyecto</h2>
			<p class="text-[11px] text-slate-600 dark:text-neutral-400">
				Distribución del total devengado (USD)
			</p>
		</div>
		<span class="font-mono text-[11px] font-bold text-teal-800 dark:text-teal-300">
			${totalComprometido.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
		</span>
	</div>

	<div class="grid grid-cols-1 gap-3 text-[11px] lg:grid-cols-2">
		{#each proyectos as proy (proy.id)}
			<div>
				<div class="mb-1 flex justify-between gap-2">
					<span class="font-medium text-slate-800 dark:text-neutral-200">
						{proy.nombre} ({proy.codigo})
					</span>
					<span class="shrink-0 font-mono font-bold text-teal-800 dark:text-teal-300">
						${proy.presupuestoUsd.toLocaleString('en-US')} ({proy.porcentajeEjecucion}%)
					</span>
				</div>
				<div
					class="h-2 w-full overflow-hidden rounded-full border border-slate-300/70 bg-slate-200 dark:border-white/5 dark:bg-neutral-900"
				>
					<div
						class="animate-fill h-full rounded-full bg-gradient-to-r from-teal-600 to-mint-500 shadow-[0_0_8px_#2DD4BF] dark:from-teal-500 dark:to-mint-400"
						style="width: {proy.porcentajeEjecucion}%;"
					></div>
				</div>
			</div>
		{/each}
	</div>
</ModularCardWrapper>

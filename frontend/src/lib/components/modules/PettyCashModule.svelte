<script lang="ts">
	import ModularCardWrapper from './ModularCardWrapper.svelte';
	import { financialStore } from '../../stores/financialStore.svelte';
	import { pettyCashStore } from '../../stores/pettyCashStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import { EstadoCajaChica } from '@app/shared';

	let cajasAbiertas = $derived(
		pettyCashStore.cajasChicas.filter((c) => c.estado === EstadoCajaChica.ABIERTA)
	);
	let cajaProyectoActivo = $derived(
		cajasAbiertas.find((c) => c.proyectoId === workspaceStore.activeProjectId) ||
			cajasAbiertas[0] ||
			pettyCashStore.cajasChicas[0] ||
			null
	);
</script>

<ModularCardWrapper id="mod-petty-cash" title="Caja Chica & Vales de Custodia">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div class="flex items-center gap-2">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-700 dark:border-amber-400/25 dark:bg-amber-500/20 dark:text-amber-300"
			>
				<span class="material-symbols-outlined text-[18px]">receipt</span>
			</div>
			<div>
				<p class="text-xs font-bold text-slate-900 dark:text-white">
					{cajaProyectoActivo
						? `${cajaProyectoActivo.codigo} — ${cajaProyectoActivo.nombre}`
						: 'Resumen Global de Cajas Chicas'}
				</p>
				<p class="font-mono text-[10px] text-slate-600 dark:text-neutral-400">
					{#if cajaProyectoActivo}
						Saldo caja: ${Number(cajaProyectoActivo.saldoActual).toFixed(2)} USD ·
					{/if}
					Vales custodia: {financialStore.kpis.valesCustodiaCount}
					{#if cajasAbiertas.length > 0}
						· {cajasAbiertas.length} abiertas
					{/if}
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<div class="text-right">
				<span class="block font-mono text-[9px] text-slate-500 uppercase dark:text-neutral-400">
					Total Global Cajas
				</span>
				<span class="font-mono text-[13px] font-bold text-teal-800 dark:text-teal-300">
					${financialStore.kpis.cajaChicaSaldo.toFixed(2)} USD
				</span>
			</div>
			<button
				type="button"
				class="rounded-lg border border-slate-300/80 bg-white/80 px-2.5 py-1 font-mono text-[10px] font-semibold text-slate-800 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
				onclick={() => workspaceStore.switchTab('petty-cash')}
			>
				Gestionar →
			</button>
		</div>
	</div>
</ModularCardWrapper>

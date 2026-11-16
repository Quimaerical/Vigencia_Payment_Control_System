<script lang="ts">
	import ModularCardWrapper from './ModularCardWrapper.svelte';
	import { financialStore } from '../../stores/financialStore.svelte';
	import { pettyCashStore } from '../../stores/pettyCashStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';

	let primeraCaja = $derived(pettyCashStore.cajasChicas[0] || null);
</script>

<ModularCardWrapper id="mod-petty-cash" title="Caja Chica & Vales de Custodia">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/20 text-amber-300"
			>
				<span class="material-symbols-outlined text-[18px]">receipt</span>
			</div>
			<div>
				<p class="text-xs font-bold text-white">
					{primeraCaja ? `${primeraCaja.codigo} — ${primeraCaja.nombre}` : 'Caja Chica Operativa'}
				</p>
				<p class="font-mono text-[10px] text-neutral-400">
					Vales en custodia: {financialStore.kpis.valesCustodiaCount}
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<span class="font-mono text-[13px] font-bold text-teal-300">
				${financialStore.kpis.cajaChicaSaldo.toFixed(2)} USD
			</span>
			<button
				type="button"
				class="rounded border border-white/15 bg-white/5 px-2 py-1 font-mono text-[10px] text-white hover:bg-white/10"
				onclick={() => workspaceStore.switchTab('petty-cash')}
			>
				Gestionar →
			</button>
		</div>
	</div>
</ModularCardWrapper>

<script lang="ts">
	import ModularCardWrapper from './ModularCardWrapper.svelte';
	import { financialStore } from '../../stores/financialStore.svelte';
	import { authStore } from '../../stores/authStore.svelte';

	let kpis = $derived(financialStore.kpis);
</script>

<ModularCardWrapper id="mod-kpi-grid" title="KPIs Ejecutivos Financieros">
	<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
		<!-- KPI 1: Causado -->
		<div
			class="flex flex-col justify-between rounded-xl border border-white/10 bg-neutral-950/70 p-3 shadow-inner transition-transform hover:scale-[1.01]"
		>
			<div class="flex items-center justify-between">
				<span class="text-[11px] font-semibold text-neutral-400">Total Causado</span>
				<div
					class="flex h-7 w-7 items-center justify-center rounded-lg border border-teal-400/20 bg-teal-400/15 text-teal-300"
				>
					<span class="material-symbols-outlined text-[16px]">account_balance</span>
				</div>
			</div>
			<div class="mt-2">
				<div class="text-[20px] leading-tight font-bold text-white">
					<span class="text-xs font-normal text-teal-400">$</span>
					{kpis.totalCausado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
				</div>
				<div class="mt-1 flex items-center gap-1 font-mono text-[10px] font-semibold text-teal-300">
					<span class="material-symbols-outlined text-[13px]">receipt</span>
					<span>
						{authStore.esAdmin
							? 'Resumen agregado por rol'
							: `${financialStore.asignaciones.length} causaciones registradas`}
					</span>
				</div>
			</div>
			<div class="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-teal-500/20">
				<div
					class="animate-fill h-full w-full rounded-full bg-gradient-to-r from-teal-500 to-mint-400 shadow-[0_0_8px_#2DD4BF]"
				></div>
			</div>
		</div>

		<!-- KPI 2: Pagado -->
		<div
			class="flex flex-col justify-between rounded-xl border border-white/10 bg-neutral-950/70 p-3 shadow-inner transition-transform hover:scale-[1.01]"
		>
			<div class="flex items-center justify-between">
				<span class="text-[11px] font-semibold text-neutral-400">Total Pagado</span>
				<div
					class="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-500/15 text-emerald-400"
				>
					<span class="material-symbols-outlined text-[16px]">verified</span>
				</div>
			</div>
			<div class="mt-2">
				<div class="text-[20px] leading-tight font-bold text-white">
					<span class="text-xs font-normal text-emerald-400">$</span>
					{kpis.totalPagado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
				</div>
				<div
					class="mt-1 flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-300"
				>
					<span class="material-symbols-outlined text-[13px]">pie_chart</span>
					<span>{kpis.porcentajeCubierto}% cubierto</span>
				</div>
			</div>
			<div class="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-emerald-500/20">
				<div
					class="animate-fill h-full rounded-full bg-gradient-to-r from-emerald-500 to-mint-300 shadow-[0_0_8px_#10B981]"
					style="width: {kpis.porcentajeCubierto}%;"
				></div>
			</div>
		</div>

		<!-- KPI 3: Saldo Deudor -->
		<div
			class="flex flex-col justify-between rounded-xl border border-white/10 bg-neutral-950/70 p-3 shadow-inner transition-transform hover:scale-[1.01]"
		>
			<div class="flex items-center justify-between">
				<span class="text-[11px] font-semibold text-rose-300">Saldo Exigible</span>
				<div
					class="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/25 bg-rose-500/15 text-rose-300"
				>
					<span class="material-symbols-outlined text-[16px]">pending_actions</span>
				</div>
			</div>
			<div class="mt-2">
				<div class="text-[20px] leading-tight font-bold text-rose-300">
					<span class="text-xs font-normal">$</span>
					{kpis.saldoExigible.toLocaleString('en-US', { minimumFractionDigits: 2 })}
				</div>
				<div class="mt-1 flex items-center gap-1 font-mono text-[10px] font-semibold text-rose-400">
					<span class="material-symbols-outlined text-[13px]">hourglass_top</span>
					<span>{kpis.pasivosFifoCount} pasivos FIFO</span>
				</div>
			</div>
			<div class="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-rose-500/20">
				<div
					class="h-full w-[45%] rounded-full bg-gradient-to-r from-rose-500 to-amber-500 shadow-[0_0_8px_#F43F5E]"
				></div>
			</div>
		</div>

		<!-- KPI 4: Caja Chica -->
		<div
			class="flex flex-col justify-between rounded-xl border border-white/10 bg-neutral-950/70 p-3 shadow-inner transition-transform hover:scale-[1.01]"
		>
			<div class="flex items-center justify-between">
				<span class="text-[11px] font-semibold text-neutral-400">Caja Chica</span>
				<div
					class="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-500/15 text-amber-300"
				>
					<span class="material-symbols-outlined text-[16px]">receipt</span>
				</div>
			</div>
			<div class="mt-2">
				<div class="text-[20px] leading-tight font-bold text-white">
					<span class="text-xs font-normal text-amber-400">$</span>
					{kpis.cajaChicaSaldo.toLocaleString('en-US', { minimumFractionDigits: 2 })}
				</div>
				<div
					class="mt-1 flex items-center gap-1 font-mono text-[10px] font-semibold text-amber-300"
				>
					<span class="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#FBBF24]"></span>
					<span>{kpis.valesCustodiaCount} Vales custodia</span>
				</div>
			</div>
			<div class="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-amber-500/20">
				<div
					class="h-full w-[33%] rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_8px_#F59E0B]"
				></div>
			</div>
		</div>
	</div>
</ModularCardWrapper>

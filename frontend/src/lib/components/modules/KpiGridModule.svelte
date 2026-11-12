<script lang="ts">
	import ModularCardWrapper from './ModularCardWrapper.svelte';
	import { financialStore } from '../../stores/financialStore.svelte';

	let kpis = $derived(financialStore.kpis);
</script>

<ModularCardWrapper id="mod-kpi-grid" title="KPIs Ejecutivos Financieros">
	<div class="grid grid-cols-2 gap-2.5">
		<!-- KPI 1: Causado -->
		<div
			class="p-3 rounded-xl bg-neutral-950/70 border border-white/10 flex flex-col justify-between hover:scale-[1.01] transition-transform shadow-inner"
		>
			<div class="flex items-center justify-between">
				<span class="text-[11px] font-semibold text-neutral-400">Total Causado</span>
				<div
					class="w-7 h-7 rounded-lg bg-teal-400/15 text-teal-300 flex items-center justify-center border border-teal-400/20"
				>
					<span class="material-symbols-outlined text-[16px]">account_balance</span>
				</div>
			</div>
			<div class="mt-2">
				<div class="text-[20px] font-bold text-white leading-tight">
					<span class="text-xs font-normal text-teal-400">$</span>
					{kpis.totalCausado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
				</div>
				<div class="mt-1 flex items-center gap-1 text-teal-300 text-[10px] font-mono font-semibold">
					<span class="material-symbols-outlined text-[13px]">trending_up</span>
					<span>+{kpis.porcentajeCausadoVsPrev}% vs prev.</span>
				</div>
			</div>
			<div class="w-full bg-teal-500/20 h-1.5 rounded-full mt-2.5 overflow-hidden">
				<div
					class="bg-gradient-to-r from-teal-500 to-mint-400 h-full rounded-full w-full animate-fill shadow-[0_0_8px_#2DD4BF]"
				></div>
			</div>
		</div>

		<!-- KPI 2: Pagado -->
		<div
			class="p-3 rounded-xl bg-neutral-950/70 border border-white/10 flex flex-col justify-between hover:scale-[1.01] transition-transform shadow-inner"
		>
			<div class="flex items-center justify-between">
				<span class="text-[11px] font-semibold text-neutral-400">Total Pagado</span>
				<div
					class="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-400/20"
				>
					<span class="material-symbols-outlined text-[16px]">verified</span>
				</div>
			</div>
			<div class="mt-2">
				<div class="text-[20px] font-bold text-white leading-tight">
					<span class="text-xs font-normal text-emerald-400">$</span>
					{kpis.totalPagado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
				</div>
				<div
					class="mt-1 flex items-center gap-1 text-emerald-300 text-[10px] font-mono font-semibold"
				>
					<span class="material-symbols-outlined text-[13px]">pie_chart</span>
					<span>{kpis.porcentajeCubierto}% cubierto</span>
				</div>
			</div>
			<div class="w-full bg-emerald-500/20 h-1.5 rounded-full mt-2.5 overflow-hidden">
				<div
					class="bg-gradient-to-r from-emerald-500 to-mint-300 h-full rounded-full animate-fill shadow-[0_0_8px_#10B981]"
					style="width: {kpis.porcentajeCubierto}%;"
				></div>
			</div>
		</div>

		<!-- KPI 3: Saldo Deudor -->
		<div
			class="p-3 rounded-xl bg-neutral-950/70 border border-white/10 flex flex-col justify-between hover:scale-[1.01] transition-transform shadow-inner"
		>
			<div class="flex items-center justify-between">
				<span class="text-[11px] font-semibold text-rose-300">Saldo Exigible</span>
				<div
					class="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-300 flex items-center justify-center border border-rose-500/25"
				>
					<span class="material-symbols-outlined text-[16px]">pending_actions</span>
				</div>
			</div>
			<div class="mt-2">
				<div class="text-[20px] font-bold text-rose-300 leading-tight">
					<span class="text-xs font-normal">$</span>
					{kpis.saldoExigible.toLocaleString('en-US', { minimumFractionDigits: 2 })}
				</div>
				<div class="mt-1 flex items-center gap-1 text-rose-400 text-[10px] font-mono font-semibold">
					<span class="material-symbols-outlined text-[13px]">hourglass_top</span>
					<span>{kpis.pasivosFifoCount} pasivos FIFO</span>
				</div>
			</div>
			<div class="w-full bg-rose-500/20 h-1.5 rounded-full mt-2.5 overflow-hidden">
				<div
					class="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full w-[45%] shadow-[0_0_8px_#F43F5E]"
				></div>
			</div>
		</div>

		<!-- KPI 4: Caja Chica -->
		<div
			class="p-3 rounded-xl bg-neutral-950/70 border border-white/10 flex flex-col justify-between hover:scale-[1.01] transition-transform shadow-inner"
		>
			<div class="flex items-center justify-between">
				<span class="text-[11px] font-semibold text-neutral-400">Caja Chica</span>
				<div
					class="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-300 flex items-center justify-center border border-amber-400/25"
				>
					<span class="material-symbols-outlined text-[16px]">receipt</span>
				</div>
			</div>
			<div class="mt-2">
				<div class="text-[20px] font-bold text-white leading-tight">
					<span class="text-xs font-normal text-amber-400">$</span>
					{kpis.cajaChicaSaldo.toLocaleString('en-US', { minimumFractionDigits: 2 })}
				</div>
				<div
					class="mt-1 flex items-center gap-1 text-amber-300 text-[10px] font-mono font-semibold"
				>
					<span class="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#FBBF24]"></span>
					<span>{kpis.valesCustodiaCount} Vales custodia</span>
				</div>
			</div>
			<div class="w-full bg-amber-500/20 h-1.5 rounded-full mt-2.5 overflow-hidden">
				<div
					class="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full w-[33%] shadow-[0_0_8px_#F59E0B]"
				></div>
			</div>
		</div>
	</div>
</ModularCardWrapper>

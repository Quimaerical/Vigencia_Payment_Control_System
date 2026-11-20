<script lang="ts">
	import ModularCardWrapper from './ModularCardWrapper.svelte';
	import { financialStore } from '../../stores/financialStore.svelte';
	import { authStore } from '../../stores/authStore.svelte';

	let kpis = $derived(financialStore.kpis);
</script>

<ModularCardWrapper id="mod-kpi-grid" title="KPIs Ejecutivos Financieros">
	<div class="mb-2 flex items-center justify-between text-[10px]">
		<span class="font-semibold text-slate-600 dark:text-neutral-400">
			Consolidado Global del Sistema
		</span>
		<span
			class="rounded border border-teal-700/20 bg-teal-600/10 px-1.5 py-0.5 font-mono font-bold text-teal-800 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-300"
		>
			Todos los proyectos
		</span>
	</div>
	<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
		<!-- KPI 1: Causado -->
		<div
			class="surface-subcard flex flex-col justify-between rounded-xl p-3 shadow-inner transition-transform hover:scale-[1.01]"
		>
			<div class="flex items-center justify-between">
				<span class="text-[11px] font-semibold text-slate-600 dark:text-neutral-400">
					Total Causado
				</span>
				<div
					class="flex h-7 w-7 items-center justify-center rounded-lg border border-teal-600/25 bg-teal-600/12 text-teal-800 dark:border-teal-400/20 dark:bg-teal-400/15 dark:text-teal-300"
				>
					<span class="material-symbols-outlined text-[16px]">account_balance</span>
				</div>
			</div>
			<div class="mt-2">
				<div class="text-[20px] leading-tight font-bold text-slate-900 dark:text-white">
					<span class="text-xs font-normal text-teal-700 dark:text-teal-400">$</span>
					{kpis.totalCausado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
				</div>
				<div
					class="mt-1 flex items-center gap-1 font-mono text-[10px] font-semibold text-teal-800 dark:text-teal-300"
				>
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
					class="animate-fill h-full w-full rounded-full bg-gradient-to-r from-teal-600 to-mint-500 shadow-[0_0_8px_#2DD4BF] dark:from-teal-500 dark:to-mint-400"
				></div>
			</div>
		</div>

		<!-- KPI 2: Pagado -->
		<div
			class="surface-subcard flex flex-col justify-between rounded-xl p-3 shadow-inner transition-transform hover:scale-[1.01]"
		>
			<div class="flex items-center justify-between">
				<span class="text-[11px] font-semibold text-slate-600 dark:text-neutral-400">
					Total Pagado
				</span>
				<div
					class="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-600/25 bg-emerald-500/12 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-400"
				>
					<span class="material-symbols-outlined text-[16px]">verified</span>
				</div>
			</div>
			<div class="mt-2">
				<div class="text-[20px] leading-tight font-bold text-slate-900 dark:text-white">
					<span class="text-xs font-normal text-emerald-700 dark:text-emerald-400">$</span>
					{kpis.totalPagado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
				</div>
				<div
					class="mt-1 flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-800 dark:text-emerald-300"
				>
					<span class="material-symbols-outlined text-[13px]">pie_chart</span>
					<span>{kpis.porcentajeCubierto}% cubierto</span>
				</div>
			</div>
			<div class="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-emerald-500/20">
				<div
					class="animate-fill h-full rounded-full bg-gradient-to-r from-emerald-600 to-mint-400 shadow-[0_0_8px_#10B981] dark:from-emerald-500 dark:to-mint-300"
					style="width: {kpis.porcentajeCubierto}%;"
				></div>
			</div>
		</div>

		<!-- KPI 3: Saldo Deudor -->
		<div
			class="surface-subcard flex flex-col justify-between rounded-xl p-3 shadow-inner transition-transform hover:scale-[1.01]"
		>
			<div class="flex items-center justify-between">
				<span class="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
					Saldo Exigible
				</span>
				<div
					class="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/25 bg-rose-500/12 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
				>
					<span class="material-symbols-outlined text-[16px]">pending_actions</span>
				</div>
			</div>
			<div class="mt-2">
				<div class="text-[20px] leading-tight font-bold text-rose-700 dark:text-rose-300">
					<span class="text-xs font-normal">$</span>
					{kpis.saldoExigible.toLocaleString('en-US', { minimumFractionDigits: 2 })}
				</div>
				<div
					class="mt-1 flex items-center gap-1 font-mono text-[10px] font-semibold text-rose-700 dark:text-rose-400"
				>
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
			class="surface-subcard flex flex-col justify-between rounded-xl p-3 shadow-inner transition-transform hover:scale-[1.01]"
		>
			<div class="flex items-center justify-between">
				<span class="text-[11px] font-semibold text-slate-600 dark:text-neutral-400">
					Caja Chica
				</span>
				<div
					class="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/12 text-amber-700 dark:border-amber-400/25 dark:bg-amber-500/15 dark:text-amber-300"
				>
					<span class="material-symbols-outlined text-[16px]">receipt</span>
				</div>
			</div>
			<div class="mt-2">
				<div class="text-[20px] leading-tight font-bold text-slate-900 dark:text-white">
					<span class="text-xs font-normal text-amber-700 dark:text-amber-400">$</span>
					{kpis.cajaChicaSaldo.toLocaleString('en-US', { minimumFractionDigits: 2 })}
				</div>
				<div
					class="mt-1 flex items-center gap-1 font-mono text-[10px] font-semibold text-amber-800 dark:text-amber-300"
				>
					<span
						class="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_#FBBF24] dark:bg-amber-400"
					></span>
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

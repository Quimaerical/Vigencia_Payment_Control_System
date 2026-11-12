<script lang="ts">
	import { financialStore } from '../../stores/financialStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';

	let diasActivos = $state(22);
	let diasPeriodo = $state(30);
	let baseUsd = $state(2500);

	let montoCausadoComputado = $derived(
		financialStore.calcularProrrateo(diasActivos, diasPeriodo, baseUsd)
	);

	let totalEnTramite = $derived(
		financialStore.asignaciones.reduce((acc, a) => acc + a.montoCausadoUsd, 0)
	);
</script>

<section class="view-panel space-y-3.5" id="tab-accrual">
	<div class="chroma-glass-card rounded-2xl p-4 space-y-3">
		<div class="flex items-center justify-between pb-2 border-b border-white/10">
			<div class="flex items-center gap-2">
				<div
					class="w-8 h-8 rounded-xl bg-teal-400/15 text-teal-300 flex items-center justify-center border border-teal-400/25"
				>
					<span class="material-symbols-outlined text-[19px]">calculate</span>
				</div>
				<div>
					<h2 class="font-bold text-white text-[15px]">Calculadora de Prorrateo</h2>
					<p class="text-[11px] text-neutral-400">Dedicación científica sujeta a días reales</p>
				</div>
			</div>
			<span
				class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-400/15 text-teal-300 font-bold border border-teal-400/30"
			>
				Fórmula Real
			</span>
		</div>

		<!-- Formula Display Callout -->
		<div
			class="p-2.5 rounded-xl bg-teal-400/10 border border-teal-400/25 text-[11px] font-mono text-teal-300 leading-relaxed"
		>
			Causación USD = (Días Activos / Días Período) × Base Contractual USD
		</div>

		<!-- Inputs -->
		<div class="grid grid-cols-3 gap-2 text-[11px]">
			<div>
				<label for="calc-dias-activos" class="block text-neutral-400 font-mono mb-1 text-[10px]">Días Activos</label>
				<input
					id="calc-dias-activos"
					class="w-full bg-neutral-950/70 border border-white/15 rounded-xl px-2.5 py-1.5 font-mono text-white font-bold focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
					type="number"
					bind:value={diasActivos}
					min="1"
					max="31"
				/>
			</div>
			<div>
				<label for="calc-dias-periodo" class="block text-neutral-400 font-mono mb-1 text-[10px]">Días Período</label>
				<input
					id="calc-dias-periodo"
					class="w-full bg-neutral-950/70 border border-white/15 rounded-xl px-2.5 py-1.5 font-mono text-white font-bold focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
					type="number"
					bind:value={diasPeriodo}
					min="1"
					max="31"
				/>
			</div>
			<div>
				<label for="calc-base-usd" class="block text-neutral-400 font-mono mb-1 text-[10px]">Base USD</label>
				<input
					id="calc-base-usd"
					class="w-full bg-neutral-950/70 border border-white/15 rounded-xl px-2.5 py-1.5 font-mono text-white font-bold focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
					type="number"
					bind:value={baseUsd}
					min="0"
					step="50"
				/>
			</div>
		</div>

		<!-- Result Strip -->
		<div
			class="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-400/30 flex items-center justify-between text-body-sm shadow-[0_0_12px_rgba(16,185,129,0.15)]"
		>
			<span class="text-[11px] text-emerald-200">Monto Causado Computado:</span>
			<span class="font-mono font-bold text-[15px] text-emerald-300">
				${montoCausadoComputado.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
			</span>
		</div>
	</div>

	<!-- Batch Table of Scientific Researchers -->
	<div class="chroma-glass-card rounded-2xl p-4 space-y-3">
		<div class="flex items-center justify-between">
			<h3 class="font-bold text-[13px] text-white">Asignaciones en Trámite</h3>
			<span class="text-[10px] font-mono text-neutral-400">
				Total: ${totalEnTramite.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
			</span>
		</div>

		<div class="space-y-2.5">
			{#each financialStore.asignaciones as asig (asig.id)}
				<div class="p-3 rounded-2xl bg-neutral-950/70 border border-white/10 space-y-2">
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-2.5">
							<div
								class="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500/25 to-mint-400/25 text-teal-300 font-bold flex items-center justify-center text-[12px] border border-teal-400/30"
							>
								{asig.beneficiarioIniciales}
							</div>
							<div>
								<div class="flex items-center gap-1.5">
									<p class="font-bold text-[12px] text-white">{asig.beneficiarioNombre}</p>
									<span
										class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30"
									>
										{asig.area}
									</span>
								</div>
								<p class="text-[10px] text-neutral-400">
									{asig.diasActivos}/{asig.diasPeriodo} días computados · Ratio: {(
										(asig.diasActivos / asig.diasPeriodo) *
										100
									).toFixed(1)}%
								</p>
							</div>
						</div>
						<div class="text-right">
							<span class="font-mono font-bold text-teal-300 text-[13px]">
								${asig.montoCausadoUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
							</span>
							<span
								class="block text-[9px] font-mono font-semibold {asig.estado === 'pendiente'
									? 'text-amber-400'
									: 'text-teal-300'}"
							>
								● {asig.estado === 'pendiente' ? 'Pendiente' : 'Abonado'}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<button
			class="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-mint-400 text-neutral-950 text-[12px] font-bold shadow-[0_0_16px_rgba(20,184,166,0.3)] active:scale-98 transition-all flex items-center justify-center gap-1.5 interactive-spring"
			onclick={() => workspaceStore.showToast('Planilla de causación generada y registrada en auditoría')}
		>
			<span class="material-symbols-outlined text-[17px]">post_add</span>
			<span>Generar Nueva Planilla de Causación</span>
		</button>
	</div>
</section>

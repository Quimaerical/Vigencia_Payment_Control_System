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
	<div class="chroma-glass-card space-y-3 rounded-2xl p-4">
		<div class="flex items-center justify-between border-b border-white/10 pb-2">
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-xl border border-teal-400/25 bg-teal-400/15 text-teal-300"
				>
					<span class="material-symbols-outlined text-[19px]">calculate</span>
				</div>
				<div>
					<h2 class="text-[15px] font-bold text-white">Calculadora de Prorrateo</h2>
					<p class="text-[11px] text-neutral-400">Dedicación científica sujeta a días reales</p>
				</div>
			</div>
			<span
				class="rounded-full border border-teal-400/30 bg-teal-400/15 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-300"
			>
				Fórmula Real
			</span>
		</div>

		<!-- Formula Display Callout -->
		<div
			class="rounded-xl border border-teal-400/25 bg-teal-400/10 p-2.5 font-mono text-[11px] leading-relaxed text-teal-300"
		>
			Causación USD = (Días Activos / Días Período) × Base Contractual USD
		</div>

		<!-- Inputs -->
		<div class="grid grid-cols-3 gap-2 text-[11px]">
			<div>
				<label for="calc-dias-activos" class="mb-1 block font-mono text-[10px] text-neutral-400"
					>Días Activos</label
				>
				<input
					id="calc-dias-activos"
					class="w-full rounded-xl border border-white/15 bg-neutral-950/70 px-2.5 py-1.5 font-mono font-bold text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
					type="number"
					bind:value={diasActivos}
					min="1"
					max="31"
				/>
			</div>
			<div>
				<label for="calc-dias-periodo" class="mb-1 block font-mono text-[10px] text-neutral-400"
					>Días Período</label
				>
				<input
					id="calc-dias-periodo"
					class="w-full rounded-xl border border-white/15 bg-neutral-950/70 px-2.5 py-1.5 font-mono font-bold text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
					type="number"
					bind:value={diasPeriodo}
					min="1"
					max="31"
				/>
			</div>
			<div>
				<label for="calc-base-usd" class="mb-1 block font-mono text-[10px] text-neutral-400"
					>Base USD</label
				>
				<input
					id="calc-base-usd"
					class="w-full rounded-xl border border-white/15 bg-neutral-950/70 px-2.5 py-1.5 font-mono font-bold text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
					type="number"
					bind:value={baseUsd}
					min="0"
					step="50"
				/>
			</div>
		</div>

		<!-- Result Strip -->
		<div
			class="text-body-sm flex items-center justify-between rounded-xl border border-emerald-400/30 bg-emerald-950/40 p-2.5 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
		>
			<span class="text-[11px] text-emerald-200">Monto Causado Computado:</span>
			<span class="font-mono text-[15px] font-bold text-emerald-300">
				${montoCausadoComputado.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
			</span>
		</div>
	</div>

	<!-- Batch Table of Scientific Researchers -->
	<div class="chroma-glass-card space-y-3 rounded-2xl p-4">
		<div class="flex items-center justify-between">
			<h3 class="text-[13px] font-bold text-white">Asignaciones en Trámite</h3>
			<span class="font-mono text-[10px] text-neutral-400">
				Total: ${totalEnTramite.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
			</span>
		</div>

		<div class="space-y-2.5">
			{#each financialStore.asignaciones as asig (asig.id)}
				<div class="space-y-2 rounded-2xl border border-white/10 bg-neutral-950/70 p-3">
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-2.5">
							<div
								class="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-400/30 bg-gradient-to-tr from-teal-500/25 to-mint-400/25 text-[12px] font-bold text-teal-300"
							>
								{asig.beneficiarioIniciales}
							</div>
							<div>
								<div class="flex items-center gap-1.5">
									<p class="text-[12px] font-bold text-white">{asig.beneficiarioNombre}</p>
									<span
										class="rounded border border-teal-500/30 bg-teal-500/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-teal-300"
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
							<span class="font-mono text-[13px] font-bold text-teal-300">
								${asig.montoCausadoUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
							</span>
							<span
								class="block font-mono text-[9px] font-semibold {asig.estado === 'pendiente'
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
			class="interactive-spring flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-mint-400 py-2.5 text-[12px] font-bold text-neutral-950 shadow-[0_0_16px_rgba(20,184,166,0.3)] transition-all active:scale-98"
			onclick={() =>
				workspaceStore.showToast('Planilla de causación generada y registrada en auditoría')}
		>
			<span class="material-symbols-outlined text-[17px]">post_add</span>
			<span>Generar Nueva Planilla de Causación</span>
		</button>
	</div>
</section>

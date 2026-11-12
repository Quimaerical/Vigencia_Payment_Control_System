<script lang="ts">
	import { financialStore } from '../../stores/financialStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';

	let deudas = $derived(financialStore.deudasFifo);
	let deudaPendienteTotal = $derived(
		deudas.reduce((acc, d) => acc + d.saldoPendiente, 0)
	);
</script>

<section class="view-panel space-y-3.5" id="tab-fifo">
	<div class="chroma-glass-card rounded-2xl p-4 space-y-3">
		<div class="flex items-center justify-between pb-2 border-b border-white/10">
			<div class="flex items-center gap-2">
				<div
					class="w-8 h-8 rounded-xl bg-teal-400/15 text-teal-300 flex items-center justify-center border border-teal-400/25"
				>
					<span class="material-symbols-outlined text-[19px]">account_tree</span>
				</div>
				<div>
					<h2 class="font-bold text-white text-[15px]">Simulador Cascada FIFO</h2>
					<p class="text-[11px] text-neutral-400">Amortización por antigüedad cronológica</p>
				</div>
			</div>
			<span
				class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-400/15 text-teal-300 font-bold border border-teal-400/30"
			>
				Motor Cuántico
			</span>
		</div>

		<!-- Beneficiary Header -->
		<div
			class="p-3 rounded-xl bg-neutral-950/70 border border-white/10 flex items-center justify-between text-[11px]"
		>
			<div>
				<span class="text-neutral-400 block text-[10px]">Beneficiario Activo</span>
				<span class="font-bold text-white">Dra. Elena Rostova</span>
			</div>
			<div class="text-right">
				<span class="text-neutral-400 block text-[10px]">Deuda Consolidada</span>
				<span class="font-mono font-bold text-teal-300">
					${deudaPendienteTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
				</span>
			</div>
		</div>

		<!-- Waterfall Steps -->
		<div class="space-y-2.5">
			{#each deudas as deuda, idx (deuda.id)}
				<div
					class="p-3 rounded-2xl bg-neutral-950/70 border {deuda.estado === 'liquidada'
						? 'border-emerald-500/40'
						: 'border-amber-500/40'} space-y-1.5"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-1.5">
							<span
								class="w-5 h-5 rounded-full {deuda.estado === 'liquidada'
									? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
									: 'bg-amber-500/20 text-amber-300 border-amber-400/30'} text-[10px] font-bold flex items-center justify-center border"
							>
								{idx + 1}
							</span>
							<span class="text-[12px] font-bold text-white">{deuda.descripcion}</span>
						</div>
						<span
							class="text-[10px] font-mono font-bold flex items-center gap-1 {deuda.estado ===
							'liquidada'
								? 'text-emerald-400'
								: 'text-amber-300'}"
						>
							{#if deuda.estado === 'liquidada'}
								<span
									class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10B981]"
								></span>
								100% Liquidada
							{:else}
								{deuda.porcentajeAmortizado}% Parcial Ámbar
							{/if}
						</span>
					</div>

					<div class="flex justify-between text-[10px] font-mono text-neutral-400">
						<span>Monto Base: ${deuda.montoOriginal.toFixed(2)} USD</span>
						<span class={deuda.estado === 'liquidada' ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
							Aplicado: -${deuda.montoAmortizado.toFixed(2)} USD
						</span>
					</div>

					<div class="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
						<div
							class="h-full rounded-full animate-fill {deuda.estado === 'liquidada'
								? 'bg-emerald-500 shadow-[0_0_8px_#10B981]'
								: 'bg-amber-400 shadow-[0_0_8px_#F59E0B]'}"
							style="width: {deuda.porcentajeAmortizado}%;"
						></div>
					</div>

					{#if deuda.saldoPendiente > 0}
						<div class="pt-1 flex items-center justify-between">
							<span class="text-[10px] font-mono text-rose-300">
								Remanente: ${deuda.saldoPendiente.toFixed(2)} USD
							</span>
							<button
								class="px-2 py-0.5 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-[10px] font-mono border border-teal-500/30 transition-colors"
								onclick={() => financialStore.openFifoPaymentModal(deuda)}
							>
								Amortizar
							</button>
						</div>
					{/if}
				</div>
			{/each}

			<!-- Remaining Debt Alert -->
			{#if deudaPendienteTotal > 0}
				<div
					class="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between text-rose-300 text-[11px]"
				>
					<div class="flex items-center gap-1.5">
						<span class="material-symbols-outlined text-[16px]">error_outline</span>
						<span>Remanente Deudor Consolidado:</span>
					</div>
					<span class="font-mono font-bold text-[13px]">
						${deudaPendienteTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
					</span>
				</div>
			{/if}
		</div>

		<!-- Disbursement Trigger Buttons -->
		<div class="flex items-center gap-2 pt-1">
			<button
				class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-mint-400 text-neutral-950 text-[12px] font-bold shadow-[0_0_16px_rgba(20,184,166,0.35)] active:scale-95 transition-all flex items-center justify-center gap-1.5 interactive-spring"
				onclick={() => {
					const firstPending = deudas.find((d) => d.saldoPendiente > 0);
					if (firstPending) {
						financialStore.openFifoPaymentModal(firstPending);
					} else {
						workspaceStore.showToast('Todas las deudas del proyecto ya están liquidadas', 'verified');
					}
				}}
			>
				<span class="material-symbols-outlined text-[17px]">payments</span>
				<span>Ejecutar Desembolso FIFO</span>
			</button>
			<button
				class="w-10 h-10 rounded-xl bg-white/5 border border-white/15 text-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all interactive-spring"
				onclick={() => workspaceStore.showToast('Comprobante fiscal PDF preparado', 'picture_as_pdf')}
				title="Descargar Comprobante PDF"
			>
				<span class="material-symbols-outlined text-[18px]">picture_as_pdf</span>
			</button>
		</div>
	</div>
</section>

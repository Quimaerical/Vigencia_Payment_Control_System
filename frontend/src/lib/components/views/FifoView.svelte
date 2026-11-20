<script lang="ts">
	import { pointerSkew } from '../../actions/pointerSkew';
	import { financialStore } from '../../stores/financialStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import { authStore } from '../../stores/authStore.svelte';
	import RbacNoticeBanner from '../layout/RbacNoticeBanner.svelte';

	let filtrarPorProyectoActivo = $state(true);

	let deudas = $derived(
		filtrarPorProyectoActivo && workspaceStore.activeProjectId
			? financialStore.deudasFifo.filter((d) => d.proyectoId === workspaceStore.activeProjectId)
			: financialStore.deudasFifo
	);

	let deudaPendienteTotal = $derived(deudas.reduce((acc, d) => acc + d.saldoPendiente, 0));
	let beneficiarioPrincipal = $derived(
		deudas.find((d) => d.saldoPendiente > 0)?.beneficiarioNombre ||
			deudas[0]?.beneficiarioNombre ||
			'Sin beneficiarios pendientes'
	);

	function handleDescargarUltimoRecibo() {
		const ultimoPago = financialStore.pagosRaw[0];
		if (ultimoPago) {
			void financialStore.descargarReciboPagoPdf(ultimoPago.id);
		} else {
			workspaceStore.showToast(
				'No hay pagos registrados en el servidor para emitir recibo PDF',
				'info'
			);
		}
	}
</script>

<section class="view-panel space-y-3.5" id="tab-fifo">
	<div use:pointerSkew class="modular-card-interactive chroma-glass-card space-y-3 rounded-2xl p-4">
		<div
			class="flex items-center justify-between border-b border-teal-900/12 pb-2 dark:border-white/10"
		>
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-xl border border-teal-600/25 bg-teal-500/12 text-teal-800 dark:border-teal-400/25 dark:bg-teal-400/15 dark:text-teal-300"
				>
					<span class="material-symbols-outlined text-[19px]">account_tree</span>
				</div>
				<div>
					<h2 class="text-[15px] font-bold text-slate-900 dark:text-white">
						Simulador Cascada FIFO
					</h2>
					<p class="text-[11px] text-slate-600 dark:text-neutral-400">
						Amortización por antigüedad cronológica
					</p>
				</div>
			</div>
			<label
				class="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-teal-800 dark:text-teal-300"
			>
				<input type="checkbox" bind:checked={filtrarPorProyectoActivo} />
				<span>Solo proyecto activo</span>
			</label>
		</div>

		{#if !authStore.isAuthenticated}
			<RbacNoticeBanner variant="unauthenticated" context="Desembolso FIFO" />
		{:else if authStore.esAdmin}
			<RbacNoticeBanner variant="admin-restricted" context="Desembolso FIFO" />
		{:else if authStore.esGenerador}
			<RbacNoticeBanner variant="generador-readonly" context="Desembolso FIFO" />
		{/if}

		<!-- Beneficiary Header -->
		<div class="surface-subcard flex items-center justify-between rounded-xl p-3 text-[11px]">
			<div>
				<span class="block text-[10px] text-slate-500 dark:text-neutral-400">
					Beneficiario Prioritario
				</span>
				<span class="font-bold text-slate-900 dark:text-white">{beneficiarioPrincipal}</span>
			</div>
			<div class="text-right">
				<span class="block text-[10px] text-slate-500 dark:text-neutral-400">
					Deuda Consolidada
				</span>
				<span class="font-mono font-bold text-teal-800 dark:text-teal-300">
					${deudaPendienteTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
				</span>
			</div>
		</div>

		<!-- Waterfall Steps -->
		<div class="space-y-2.5">
			{#each deudas as deuda, idx (deuda.id)}
				<div
					class="surface-subcard rounded-2xl p-3 {deuda.estado === 'liquidada'
						? 'border-emerald-600/40 dark:border-emerald-500/40'
						: 'border-amber-600/40 dark:border-amber-500/40'} space-y-1.5"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-1.5">
							<span
								class="h-5 w-5 rounded-full {deuda.estado === 'liquidada'
									? 'border-emerald-600/35 bg-emerald-500/15 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-300'
									: 'border-amber-600/35 bg-amber-500/15 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-300'} flex items-center justify-center border text-[10px] font-bold"
							>
								{idx + 1}
							</span>
							<span class="text-[12px] font-bold text-slate-900 dark:text-white"
								>{deuda.descripcion}</span
							>
						</div>
						<span
							class="flex items-center gap-1 font-mono text-[10px] font-bold {deuda.estado ===
							'liquidada'
								? 'text-emerald-700 dark:text-emerald-400'
								: 'text-amber-700 dark:text-amber-300'}"
						>
							{#if deuda.estado === 'liquidada'}
								<span
									class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981] dark:bg-emerald-400"
								></span>
								100% Liquidada
							{:else}
								{deuda.porcentajeAmortizado}% Parcial
							{/if}
						</span>
					</div>

					<div
						class="flex justify-between font-mono text-[10px] text-slate-600 dark:text-neutral-400"
					>
						<span>Monto Base: ${deuda.montoOriginal.toFixed(2)} USD</span>
						<span
							class={deuda.estado === 'liquidada'
								? 'font-bold text-emerald-700 dark:text-emerald-400'
								: 'font-bold text-amber-700 dark:text-amber-300'}
						>
							Aplicado: -${deuda.montoAmortizado.toFixed(2)} USD
						</span>
					</div>

					<div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-neutral-900">
						<div
							class="animate-fill h-full rounded-full {deuda.estado === 'liquidada'
								? 'bg-emerald-500 shadow-[0_0_8px_#10B981]'
								: 'bg-amber-500 shadow-[0_0_8px_#F59E0B] dark:bg-amber-400'}"
							style="width: {deuda.porcentajeAmortizado}%;"
						></div>
					</div>

					{#if deuda.saldoPendiente > 0}
						<div class="flex items-center justify-between pt-1">
							<span class="font-mono text-[10px] font-semibold text-rose-700 dark:text-rose-300">
								Remanente: ${deuda.saldoPendiente.toFixed(2)} USD
							</span>
							{#if authStore.esReceptor}
								<button
									type="button"
									class="rounded border border-teal-600/35 bg-teal-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-teal-800 transition-colors hover:bg-teal-500/25 dark:border-teal-500/30 dark:bg-teal-500/20 dark:text-teal-300 dark:hover:bg-teal-500/30"
									onclick={() => financialStore.openFifoPaymentModal(deuda)}
								>
									Amortizar
								</button>
							{/if}
						</div>
					{/if}
				</div>
			{:else}
				<p class="text-center font-mono text-[11px] text-slate-600 dark:text-neutral-400">
					No hay deudas registradas para el filtro actual.
				</p>
			{/each}

			<!-- Remaining Debt Alert -->
			{#if deudaPendienteTotal > 0}
				<div
					class="flex items-center justify-between rounded-xl border border-rose-600/35 bg-rose-50/90 p-2.5 text-[11px] text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-300"
				>
					<div class="flex items-center gap-1.5">
						<span class="material-symbols-outlined text-[16px]">error_outline</span>
						<span>Remanente Deudor Consolidado:</span>
					</div>
					<span class="font-mono text-[13px] font-bold">
						${deudaPendienteTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
					</span>
				</div>
			{/if}
		</div>

		<!-- Disbursement Trigger Buttons -->
		<div class="flex items-center gap-2 pt-1">
			<button
				type="button"
				disabled={!authStore.esReceptor}
				class="interactive-spring flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 py-2.5 text-[12px] font-bold text-white shadow-[0_0_16px_rgba(20,184,166,0.28)] transition-all active:scale-95 disabled:opacity-45 dark:from-teal-500 dark:to-mint-400 dark:text-neutral-950"
				onclick={() => {
					const firstPending = deudas.find((d) => d.saldoPendiente > 0);
					if (firstPending) {
						financialStore.openFifoPaymentModal(firstPending);
					} else {
						workspaceStore.showToast(
							'Todas las deudas del proyecto ya están liquidadas',
							'verified'
						);
					}
				}}
			>
				<span class="material-symbols-outlined text-[17px]">payments</span>
				<span>
					Ejecutar Desembolso FIFO {authStore.esReceptor ? '' : '(Solo Rol Receptor)'}
				</span>
			</button>
			<button
				type="button"
				class="surface-subcard interactive-spring flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-teal-50 active:scale-95 dark:hover:bg-white/10"
				onclick={handleDescargarUltimoRecibo}
				title="Descargar Recibo PDF del último pago"
			>
				<span class="material-symbols-outlined text-[18px]">picture_as_pdf</span>
			</button>
		</div>
	</div>
</section>

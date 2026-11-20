<script lang="ts">
	import { financialStore } from '../../stores/financialStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import { authStore } from '../../stores/authStore.svelte';
	import { EstadoSolicitud, MetodoPago } from '@app/shared';

	let montoPagar = $state(0);
	let metodoSeleccionado = $state<MetodoPago>(MetodoPago.TRANSFERENCIA);
	let referencia = $state('');
	let fechaPago = $state(new Date().toISOString().substring(0, 10));
	let solicitudId = $state<number | null>(null);
	let isSubmitting = $state(false);

	let solicitudesElegibles = $derived(
		financialStore.solicitudesPago.filter(
			(s) =>
				(!financialStore.selectedDeudaForPayment ||
					s.proyectoId === financialStore.selectedDeudaForPayment.proyectoId) &&
				(s.estado === EstadoSolicitud.APROBACION || s.estado === EstadoSolicitud.ENTREGA)
		)
	);

	$effect(() => {
		const deuda = financialStore.selectedDeudaForPayment;
		if (deuda) {
			montoPagar = deuda.saldoPendiente;
			const elegibles = financialStore.solicitudesPago.filter(
				(s) =>
					s.proyectoId === deuda.proyectoId &&
					(s.estado === EstadoSolicitud.APROBACION || s.estado === EstadoSolicitud.ENTREGA)
			);
			solicitudId = elegibles.some((s) => s.id === deuda.solicitudId)
				? (deuda.solicitudId ?? null)
				: null;
		}
	});

	async function handlePagar() {
		if (!authStore.esReceptor) {
			workspaceStore.showToast(
				'Segregación RBAC: Solo el rol Receptor puede registrar desembolsos FIFO.',
				'lock'
			);
			return;
		}

		const deuda = financialStore.selectedDeudaForPayment;
		if (!deuda) return;

		if (montoPagar <= 0) {
			workspaceStore.showToast('El monto debe ser superior a 0.00 USD', 'warning');
			return;
		}

		if (montoPagar > deuda.saldoPendiente) {
			workspaceStore.showToast(
				`El monto no puede superar el saldo pendiente de la deuda ($${deuda.saldoPendiente.toFixed(2)} USD)`,
				'warning'
			);
			return;
		}

		isSubmitting = true;
		const ok = await financialStore.procesarPagoFifo({
			personaId: deuda.personaId,
			proyectoId: deuda.proyectoId,
			solicitudId: solicitudId ? Number(solicitudId) : null,
			montoTotal: Number(montoPagar),
			metodoPago: metodoSeleccionado,
			numeroReferencia: referencia.trim() ? referencia.trim() : null,
			fechaPago
		});
		isSubmitting = false;

		if (ok) {
			referencia = '';
			financialStore.closeFifoPaymentModal();
		}
	}
</script>

{#if financialStore.fifoModalOpen && financialStore.selectedDeudaForPayment}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md transition-opacity dark:bg-black/80"
	>
		<div
			class="chroma-glass-card surface-modal w-full max-w-sm space-y-3 rounded-3xl border-teal-600/30 p-5 shadow-2xl dark:border-teal-500/30"
		>
			<div
				class="flex items-center justify-between border-b border-slate-900/10 pb-2 dark:border-white/10"
			>
				<div class="flex items-center gap-2">
					<span
						class="flex h-7 w-7 items-center justify-center rounded-lg border border-teal-600/25 bg-teal-600/12 text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/20 dark:text-teal-300"
					>
						<span class="material-symbols-outlined text-[18px]">payments</span>
					</span>
					<h3 class="text-[13px] font-bold text-slate-900 dark:text-white">Desembolso FIFO</h3>
				</div>
				<button
					class="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-900/8 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
					onclick={() => financialStore.closeFifoPaymentModal()}
				>
					<span class="material-symbols-outlined text-[18px]">close</span>
				</button>
			</div>

			<div
				class="rounded-xl border border-teal-600/25 bg-teal-50/90 p-2.5 text-[11px] leading-tight text-teal-950 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-200"
			>
				Imputación directa sobre la deuda más antigua:
				<strong>{financialStore.selectedDeudaForPayment.descripcion}</strong>.
			</div>

			<div class="space-y-2 text-[11px]">
				<div>
					<label
						for="modal-monto-amortizar"
						class="mb-0.5 block font-mono text-[10px] text-slate-600 dark:text-neutral-400"
					>
						Monto a Amortizar (Máx. ${financialStore.selectedDeudaForPayment.saldoPendiente.toFixed(
							2
						)} USD)
					</label>
					<input
						id="modal-monto-amortizar"
						class="surface-input w-full rounded-xl px-2.5 py-1.5 font-mono font-bold text-teal-800 dark:text-teal-300"
						type="number"
						bind:value={montoPagar}
						min="0.01"
						max={financialStore.selectedDeudaForPayment.saldoPendiente}
						step="0.01"
					/>
				</div>

				<div class="grid grid-cols-2 gap-2">
					<div>
						<label
							for="modal-metodo-pago"
							class="mb-0.5 block font-mono text-[10px] text-slate-600 dark:text-neutral-400"
						>
							Método de Pago
						</label>
						<select
							id="modal-metodo-pago"
							class="surface-input w-full rounded-xl px-2.5 py-1.5 font-mono"
							bind:value={metodoSeleccionado}
						>
							{#each Object.values(MetodoPago) as metodo (metodo)}
								<option value={metodo}>{metodo.toUpperCase()}</option>
							{/each}
						</select>
					</div>

					<div>
						<label
							for="modal-fecha-pago"
							class="mb-0.5 block font-mono text-[10px] text-slate-600 dark:text-neutral-400"
						>
							Fecha de Pago
						</label>
						<input
							id="modal-fecha-pago"
							class="surface-input w-full rounded-xl px-2.5 py-1.5 font-mono"
							type="date"
							bind:value={fechaPago}
						/>
					</div>
				</div>

				{#if solicitudesElegibles.length > 0}
					<div>
						<label
							for="modal-solicitud-pago"
							class="mb-0.5 block font-mono text-[10px] text-slate-600 dark:text-neutral-400"
						>
							Solicitud de Pago Asociada (Opcional)
						</label>
						<select
							id="modal-solicitud-pago"
							class="surface-input w-full rounded-xl px-2.5 py-1.5 font-mono"
							bind:value={solicitudId}
						>
							<option value={null}>Sin solicitud vinculada</option>
							{#each solicitudesElegibles as sol (sol.id)}
								<option value={sol.id}>{sol.codigo} ({sol.estado.toUpperCase()})</option>
							{/each}
						</select>
					</div>
				{/if}

				<div>
					<label
						for="modal-referencia-bancaria"
						class="mb-0.5 block font-mono text-[10px] text-slate-600 dark:text-neutral-400"
					>
						Referencia / Comprobante (Única)
					</label>
					<input
						id="modal-referencia-bancaria"
						class="surface-input w-full rounded-xl px-2.5 py-1.5 font-mono"
						placeholder="Ej: REF-992019 / Transferencia"
						type="text"
						bind:value={referencia}
					/>
				</div>
			</div>

			<div
				class="flex items-center justify-end gap-2 border-t border-slate-900/10 pt-2 text-[11px] dark:border-white/10"
			>
				<button
					class="rounded-xl px-3 py-1.5 text-slate-600 hover:bg-slate-900/8 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
					onclick={() => financialStore.closeFifoPaymentModal()}
				>
					Cancelar
				</button>
				<button
					disabled={isSubmitting || !authStore.esReceptor}
					class="flex items-center gap-1 rounded-xl bg-gradient-to-r from-teal-600 to-mint-500 px-3.5 py-1.5 font-bold text-white shadow-md shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50 dark:from-teal-500 dark:to-mint-400 dark:text-neutral-950"
					onclick={handlePagar}
				>
					<span class="material-symbols-outlined text-[15px]">send</span>
					<span>{isSubmitting ? 'Procesando...' : 'Confirmar Pago FIFO'}</span>
				</button>
			</div>
		</div>
	</div>
{/if}

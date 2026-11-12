<script lang="ts">
	import { financialStore } from '../../stores/financialStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import { MetodoPago } from '@app/shared';

	let montoPagar = $state(0);
	let metodoSeleccionado = $state<MetodoPago>(MetodoPago.TRANSFERENCIA);
	let referencia = $state('');

	$effect(() => {
		if (financialStore.selectedDeudaForPayment) {
			montoPagar = financialStore.selectedDeudaForPayment.saldoPendiente;
		}
	});

	function handlePagar() {
		if (montoPagar <= 0) {
			workspaceStore.showToast('El monto debe ser superior a 0.00 USD', 'warning');
			return;
		}

		if (financialStore.selectedDeudaForPayment) {
			const deuda = financialStore.selectedDeudaForPayment;
			financialStore.registrarAmortizacionLocal(deuda.id, montoPagar);
			workspaceStore.showToast(
				`Desembolso FIFO aplicado: $${montoPagar.toFixed(2)} USD amortizados`,
				'verified'
			);
			financialStore.closeFifoPaymentModal();
		}
	}
</script>

{#if financialStore.fifoModalOpen && financialStore.selectedDeudaForPayment}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-opacity"
	>
		<div
			class="chroma-glass-card w-full max-w-sm space-y-3 rounded-3xl border border-teal-500/30 bg-neutral-950/95 p-5 shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-white/10 pb-2">
				<div class="flex items-center gap-2">
					<span
						class="flex h-7 w-7 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/20 text-teal-300"
					>
						<span class="material-symbols-outlined text-[18px]">payments</span>
					</span>
					<h3 class="text-[13px] font-bold text-white">Desembolso FIFO</h3>
				</div>
				<button
					class="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-white"
					onclick={() => financialStore.closeFifoPaymentModal()}
				>
					<span class="material-symbols-outlined text-[18px]">close</span>
				</button>
			</div>

			<div
				class="rounded-xl border border-teal-400/30 bg-teal-500/10 p-2.5 text-[11px] leading-tight text-teal-200"
			>
				Imputación directa sobre la deuda más antigua: <strong
					>{financialStore.selectedDeudaForPayment.descripcion}</strong
				>.
			</div>

			<div class="space-y-2 text-[11px]">
				<div>
					<label
						for="modal-monto-amortizar"
						class="mb-0.5 block font-mono text-[10px] text-neutral-400"
					>
						Monto a Amortizar (USD)
					</label>
					<input
						id="modal-monto-amortizar"
						class="w-full rounded-xl border border-white/15 bg-neutral-900 px-2.5 py-1.5 font-mono font-bold text-teal-300 focus:ring-1 focus:ring-teal-400"
						type="number"
						bind:value={montoPagar}
						min="0.01"
						max={financialStore.selectedDeudaForPayment.saldoPendiente}
						step="0.01"
					/>
				</div>

				<div>
					<label for="modal-metodo-pago" class="mb-0.5 block font-mono text-[10px] text-neutral-400"
						>Método de Pago</label
					>
					<select
						id="modal-metodo-pago"
						class="w-full rounded-xl border border-white/15 bg-neutral-900 px-2.5 py-1.5 font-mono text-white focus:ring-1 focus:ring-teal-400"
						bind:value={metodoSeleccionado}
					>
						{#each Object.values(MetodoPago) as metodo (metodo)}
							<option value={metodo}>{metodo.toUpperCase()}</option>
						{/each}
					</select>
				</div>

				<div>
					<label
						for="modal-referencia-bancaria"
						class="mb-0.5 block font-mono text-[10px] text-neutral-400"
					>
						Referencia / Comprobante
					</label>
					<input
						id="modal-referencia-bancaria"
						class="w-full rounded-xl border border-white/15 bg-neutral-900 px-2.5 py-1.5 font-mono text-white focus:ring-1 focus:ring-teal-400"
						placeholder="Ej: REF-992019 / Transferencia"
						type="text"
						bind:value={referencia}
					/>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2 border-t border-white/10 pt-2 text-[11px]">
				<button
					class="rounded-xl px-3 py-1.5 text-neutral-400 hover:bg-white/10 hover:text-white"
					onclick={() => financialStore.closeFifoPaymentModal()}
				>
					Cancelar
				</button>
				<button
					class="flex items-center gap-1 rounded-xl bg-gradient-to-r from-teal-500 to-mint-400 px-3.5 py-1.5 font-bold text-neutral-950 shadow-md shadow-teal-500/20 transition-all active:scale-95"
					onclick={handlePagar}
				>
					<span class="material-symbols-outlined text-[15px]">send</span>
					<span>Confirmar Pago FIFO</span>
				</button>
			</div>
		</div>
	</div>
{/if}

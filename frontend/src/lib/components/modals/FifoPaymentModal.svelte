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
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity"
	>
		<div
			class="chroma-glass-card bg-neutral-950/95 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3 border border-teal-500/30"
		>
			<div class="flex items-center justify-between pb-2 border-b border-white/10">
				<div class="flex items-center gap-2">
					<span
						class="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30"
					>
						<span class="material-symbols-outlined text-[18px]">payments</span>
					</span>
					<h3 class="font-bold text-[13px] text-white">Desembolso FIFO</h3>
				</div>
				<button
					class="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10"
					onclick={() => financialStore.closeFifoPaymentModal()}
				>
					<span class="material-symbols-outlined text-[18px]">close</span>
				</button>
			</div>

			<div
				class="p-2.5 rounded-xl bg-teal-500/10 border border-teal-400/30 text-[11px] text-teal-200 leading-tight"
			>
				Imputación directa sobre la deuda más antigua: <strong>{financialStore.selectedDeudaForPayment.descripcion}</strong>.
			</div>

			<div class="space-y-2 text-[11px]">
				<div>
					<label for="modal-monto-amortizar" class="font-mono text-neutral-400 block mb-0.5 text-[10px]">
						Monto a Amortizar (USD)
					</label>
					<input
						id="modal-monto-amortizar"
						class="w-full bg-neutral-900 border border-white/15 font-mono font-bold px-2.5 py-1.5 rounded-xl text-teal-300 focus:ring-1 focus:ring-teal-400"
						type="number"
						bind:value={montoPagar}
						min="0.01"
						max={financialStore.selectedDeudaForPayment.saldoPendiente}
						step="0.01"
					/>
				</div>

				<div>
					<label for="modal-metodo-pago" class="font-mono text-neutral-400 block mb-0.5 text-[10px]">Método de Pago</label>
					<select
						id="modal-metodo-pago"
						class="w-full bg-neutral-900 border border-white/15 text-white font-mono px-2.5 py-1.5 rounded-xl focus:ring-1 focus:ring-teal-400"
						bind:value={metodoSeleccionado}
					>
						{#each Object.values(MetodoPago) as metodo}
							<option value={metodo}>{metodo.toUpperCase()}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="modal-referencia-bancaria" class="font-mono text-neutral-400 block mb-0.5 text-[10px]">
						Referencia / Comprobante
					</label>
					<input
						id="modal-referencia-bancaria"
						class="w-full bg-neutral-900 border border-white/15 font-mono text-white px-2.5 py-1.5 rounded-xl focus:ring-1 focus:ring-teal-400"
						placeholder="Ej: REF-992019 / Transferencia"
						type="text"
						bind:value={referencia}
					/>
				</div>
			</div>

			<div class="pt-2 border-t border-white/10 flex items-center justify-end gap-2 text-[11px]">
				<button
					class="px-3 py-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10"
					onclick={() => financialStore.closeFifoPaymentModal()}
				>
					Cancelar
				</button>
				<button
					class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-mint-400 text-neutral-950 font-bold shadow-md shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-1"
					onclick={handlePagar}
				>
					<span class="material-symbols-outlined text-[15px]">send</span>
					<span>Confirmar Pago FIFO</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<script lang="ts">
	import { financialStore } from '../../stores/financialStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';

	let motivoForense = $state('');

	function handleConfirm() {
		if (!motivoForense.trim()) {
			workspaceStore.showToast('Debe ingresar un motivo forense obligatorio', 'warning');
			return;
		}

		if (financialStore.selectedAsiento) {
			const id = financialStore.selectedAsiento.id;
			financialStore.anularAsiento(id, motivoForense.trim());
			workspaceStore.showToast(`Asiento ${id} anulado. Emitida Nota de Crédito Reversa`, 'done_all');
			financialStore.closeVoidModal();
			motivoForense = '';
		}
	}
</script>

{#if financialStore.voidModalOpen && financialStore.selectedAsiento}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity"
	>
		<div
			class="chroma-glass-card bg-neutral-950/90 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3 border border-white/15"
		>
			<div class="flex items-center justify-between pb-2 border-b border-white/10">
				<div class="flex items-center gap-2">
					<span
						class="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-500/30"
					>
						<span class="material-symbols-outlined text-[18px]">gavel</span>
					</span>
					<h3 class="font-bold text-[13px] text-white">Anulación Justificada</h3>
				</div>
				<button
					class="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10"
					onclick={() => financialStore.closeVoidModal()}
				>
					<span class="material-symbols-outlined text-[18px]">close</span>
				</button>
			</div>

			<div
				class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-[11px] text-amber-200 leading-tight"
			>
				Principio de inmutabilidad: el asiento original no se borrará. Se generará una Nota de Crédito
				Reversa.
			</div>

			<div class="space-y-2 text-[11px]">
				<div>
					<label for="modal-asiento-id" class="font-mono text-neutral-400 block mb-0.5 text-[10px]">
						Asiento Sujeto a Reverso
					</label>
					<input
						id="modal-asiento-id"
						class="w-full bg-neutral-900 border border-white/15 font-mono font-bold px-2.5 py-1.5 rounded-xl text-white"
						readonly
						value={financialStore.selectedAsiento.id}
					/>
				</div>
				<div>
					<label for="modal-asiento-monto" class="font-mono text-neutral-400 block mb-0.5 text-[10px]">Monto USD a Reversar</label>
					<input
						id="modal-asiento-monto"
						class="w-full bg-neutral-900 border border-white/15 font-mono font-bold px-2.5 py-1.5 rounded-xl text-rose-400"
						readonly
						value={`$${financialStore.selectedAsiento.monto.toFixed(2)} USD`}
					/>
				</div>
				<div>
					<label for="modal-motivo-forense" class="font-bold text-white block mb-0.5 text-[11px]">
						Motivo Forense <span class="text-rose-400">* (Obligatorio)</span>
					</label>
					<textarea
						id="modal-motivo-forense"
						class="w-full bg-neutral-900 rounded-xl px-2.5 py-1.5 text-[11px] border border-white/20 text-white focus:ring-1 focus:ring-teal-400 focus:outline-none"
						placeholder="Detalle la causal técnica o administrativa..."
						rows="2"
						bind:value={motivoForense}
					></textarea>
				</div>
			</div>

			<div class="pt-2 border-t border-white/10 flex items-center justify-end gap-2 text-[11px]">
				<button
					class="px-3 py-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10"
					onclick={() => financialStore.closeVoidModal()}
				>
					Cancelar
				</button>
				<button
					class="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-600/30 active:scale-95 transition-all flex items-center gap-1"
					onclick={handleConfirm}
				>
					<span class="material-symbols-outlined text-[15px]">done_all</span>
					<span>Emitir Reverso</span>
				</button>
			</div>
		</div>
	</div>
{/if}

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
			workspaceStore.showToast(
				`Asiento ${id} anulado. Emitida Nota de Crédito Reversa`,
				'done_all'
			);
			financialStore.closeVoidModal();
			motivoForense = '';
		}
	}
</script>

{#if financialStore.voidModalOpen && financialStore.selectedAsiento}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-opacity"
	>
		<div
			class="chroma-glass-card w-full max-w-sm space-y-3 rounded-3xl border border-white/15 bg-neutral-950/90 p-5 shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-white/10 pb-2">
				<div class="flex items-center gap-2">
					<span
						class="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/20 text-rose-300"
					>
						<span class="material-symbols-outlined text-[18px]">gavel</span>
					</span>
					<h3 class="text-[13px] font-bold text-white">Anulación Justificada</h3>
				</div>
				<button
					class="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-white"
					onclick={() => financialStore.closeVoidModal()}
				>
					<span class="material-symbols-outlined text-[18px]">close</span>
				</button>
			</div>

			<div
				class="rounded-xl border border-amber-400/30 bg-amber-500/10 p-2.5 text-[11px] leading-tight text-amber-200"
			>
				Principio de inmutabilidad: el asiento original no se borrará. Se generará una Nota de
				Crédito Reversa.
			</div>

			<div class="space-y-2 text-[11px]">
				<div>
					<label for="modal-asiento-id" class="mb-0.5 block font-mono text-[10px] text-neutral-400">
						Asiento Sujeto a Reverso
					</label>
					<input
						id="modal-asiento-id"
						class="w-full rounded-xl border border-white/15 bg-neutral-900 px-2.5 py-1.5 font-mono font-bold text-white"
						readonly
						value={financialStore.selectedAsiento.id}
					/>
				</div>
				<div>
					<label
						for="modal-asiento-monto"
						class="mb-0.5 block font-mono text-[10px] text-neutral-400">Monto USD a Reversar</label
					>
					<input
						id="modal-asiento-monto"
						class="w-full rounded-xl border border-white/15 bg-neutral-900 px-2.5 py-1.5 font-mono font-bold text-rose-400"
						readonly
						value={`$${financialStore.selectedAsiento.monto.toFixed(2)} USD`}
					/>
				</div>
				<div>
					<label for="modal-motivo-forense" class="mb-0.5 block text-[11px] font-bold text-white">
						Motivo Forense <span class="text-rose-400">* (Obligatorio)</span>
					</label>
					<textarea
						id="modal-motivo-forense"
						class="w-full rounded-xl border border-white/20 bg-neutral-900 px-2.5 py-1.5 text-[11px] text-white focus:ring-1 focus:ring-teal-400 focus:outline-none"
						placeholder="Detalle la causal técnica o administrativa..."
						rows="2"
						bind:value={motivoForense}></textarea>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2 border-t border-white/10 pt-2 text-[11px]">
				<button
					class="rounded-xl px-3 py-1.5 text-neutral-400 hover:bg-white/10 hover:text-white"
					onclick={() => financialStore.closeVoidModal()}
				>
					Cancelar
				</button>
				<button
					class="flex items-center gap-1 rounded-xl bg-rose-600 px-3.5 py-1.5 font-bold text-white shadow-md shadow-rose-600/30 transition-all hover:bg-rose-500 active:scale-95"
					onclick={handleConfirm}
				>
					<span class="material-symbols-outlined text-[15px]">done_all</span>
					<span>Emitir Reverso</span>
				</button>
			</div>
		</div>
	</div>
{/if}

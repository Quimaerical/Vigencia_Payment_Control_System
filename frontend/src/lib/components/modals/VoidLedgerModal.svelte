<script lang="ts">
	import { financialStore } from '../../stores/financialStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';

	let motivoForense = $state('');
	let isSubmitting = $state(false);

	async function handleConfirm() {
		if (motivoForense.trim().length < 5) {
			workspaceStore.showToast(
				'Debe ingresar un motivo forense obligatorio (mínimo 5 caracteres)',
				'warning'
			);
			return;
		}

		if (financialStore.selectedAsiento) {
			const id = financialStore.selectedAsiento.id;
			isSubmitting = true;
			const ok = await financialStore.anularAsiento(id, motivoForense.trim());
			isSubmitting = false;

			if (ok) {
				financialStore.closeVoidModal();
				motivoForense = '';
			}
		}
	}
</script>

{#if financialStore.voidModalOpen && financialStore.selectedAsiento}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md transition-opacity dark:bg-black/80"
	>
		<div
			class="chroma-glass-card surface-modal w-full max-w-sm space-y-3 rounded-3xl p-5 shadow-2xl"
		>
			<div
				class="flex items-center justify-between border-b border-slate-900/10 pb-2 dark:border-white/10"
			>
				<div class="flex items-center gap-2">
					<span
						class="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
					>
						<span class="material-symbols-outlined text-[18px]">gavel</span>
					</span>
					<h3 class="text-[13px] font-bold text-slate-900 dark:text-white">
						Anulación Justificada
					</h3>
				</div>
				<button
					class="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-900/8 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
					onclick={() => financialStore.closeVoidModal()}
				>
					<span class="material-symbols-outlined text-[18px]">close</span>
				</button>
			</div>

			<div
				class="rounded-xl border border-amber-500/35 bg-amber-50 p-2.5 text-[11px] leading-tight text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200"
			>
				Principio de inmutabilidad: el asiento original no se borrará. Se registrará su anulación y
				se restaurarán los saldos de deuda FIFO.
			</div>

			<div class="space-y-2 text-[11px]">
				<div>
					<label
						for="modal-asiento-id"
						class="mb-0.5 block font-mono text-[10px] text-slate-600 dark:text-neutral-400"
					>
						Asiento Sujeto a Reverso
					</label>
					<input
						id="modal-asiento-id"
						class="surface-input w-full rounded-xl px-2.5 py-1.5 font-mono font-bold"
						readonly
						value={financialStore.selectedAsiento.id}
					/>
				</div>
				<div>
					<label
						for="modal-asiento-monto"
						class="mb-0.5 block font-mono text-[10px] text-slate-600 dark:text-neutral-400"
					>
						Monto USD a Reversar
					</label>
					<input
						id="modal-asiento-monto"
						class="surface-input w-full rounded-xl px-2.5 py-1.5 font-mono font-bold text-rose-700 dark:text-rose-400"
						readonly
						value={`$${financialStore.selectedAsiento.monto.toFixed(2)} USD`}
					/>
				</div>
				<div>
					<label
						for="modal-motivo-forense"
						class="mb-0.5 block text-[11px] font-bold text-slate-900 dark:text-white"
					>
						Motivo Forense <span class="text-rose-700 dark:text-rose-400"
							>* (Mínimo 5 caracteres)</span
						>
					</label>
					<textarea
						id="modal-motivo-forense"
						class="surface-input w-full rounded-xl px-2.5 py-1.5 text-[11px]"
						placeholder="Detalle la causal técnica o administrativa..."
						rows="2"
						bind:value={motivoForense}></textarea>
				</div>
			</div>

			<div
				class="flex items-center justify-end gap-2 border-t border-slate-900/10 pt-2 text-[11px] dark:border-white/10"
			>
				<button
					class="rounded-xl px-3 py-1.5 text-slate-600 hover:bg-slate-900/8 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
					onclick={() => financialStore.closeVoidModal()}
				>
					Cancelar
				</button>
				<button
					disabled={isSubmitting}
					class="flex items-center gap-1 rounded-xl bg-rose-600 px-3.5 py-1.5 font-bold text-white shadow-md shadow-rose-600/30 transition-all hover:bg-rose-500 active:scale-95 disabled:opacity-50"
					onclick={handleConfirm}
				>
					<span class="material-symbols-outlined text-[15px]">done_all</span>
					<span>{isSubmitting ? 'Procesando...' : 'Emitir Reverso'}</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<script lang="ts">
	import { financialStore } from '../../stores/financialStore.svelte';

	let searchQuery = $state('');
	let filterStatus = $state<'todos' | 'asentado' | 'anulado'>('todos');

	let filteredAsientos = $derived(
		financialStore.asientos.filter((item) => {
			const matchesSearch =
				item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.concepto.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.beneficiarioNombre.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesFilter = filterStatus === 'todos' || item.estado === filterStatus;
			return matchesSearch && matchesFilter;
		})
	);
</script>

<section class="view-panel space-y-3.5" id="tab-ledger">
	<div class="chroma-glass-card rounded-2xl p-4 space-y-3">
		<div class="flex items-center justify-between pb-2 border-b border-white/10">
			<div class="flex items-center gap-2">
				<div
					class="w-8 h-8 rounded-xl bg-teal-400/15 text-teal-300 flex items-center justify-center border border-teal-400/25"
				>
					<span class="material-symbols-outlined text-[19px]">receipt_long</span>
				</div>
				<div>
					<h2 class="font-bold text-white text-[15px]">Libro Mayor Inmutable</h2>
					<p class="text-[11px] text-neutral-400">Registros contables Append-Only</p>
				</div>
			</div>
			<span
				class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-400/15 text-teal-300 font-bold border border-teal-400/30 flex items-center gap-1"
			>
				<span class="material-symbols-outlined text-[13px]">lock</span> WORM Log
			</span>
		</div>

		<!-- Search & Filter Controls -->
		<div class="flex items-center gap-2">
			<div class="relative flex-1">
				<input
					class="w-full bg-neutral-950/70 border border-white/15 rounded-xl px-3 py-1.5 text-[11px] text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-teal-400 pl-8"
					placeholder="Buscar por Asiento, ID o Investigador..."
					type="text"
					bind:value={searchQuery}
				/>
				<span
					class="material-symbols-outlined absolute left-2.5 top-1.5 text-neutral-500 text-[16px]"
				>
					search
				</span>
			</div>
			<button
				class="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/15 text-neutral-300 text-[11px] font-mono flex items-center gap-1 shrink-0 hover:bg-white/10 transition-colors"
				onclick={() => {
					if (filterStatus === 'todos') filterStatus = 'asentado';
					else if (filterStatus === 'asentado') filterStatus = 'anulado';
					else filterStatus = 'todos';
				}}
			>
				<span class="material-symbols-outlined text-[15px]">filter_list</span>
				<span class="capitalize">{filterStatus}</span>
			</button>
		</div>

		<!-- Asientos Entries List -->
		<div class="space-y-2.5">
			{#each filteredAsientos as asiento (asiento.id)}
				<div
					class="p-3 rounded-2xl {asiento.estado === 'anulado'
						? 'bg-rose-950/30 border border-rose-500/30 opacity-90'
						: 'bg-neutral-950/70 border border-white/10 hover:border-teal-400/40'} transition-all space-y-2"
				>
					<div class="flex items-center justify-between">
						<span
							class="text-xs font-mono font-bold {asiento.estado === 'anulado'
								? 'text-rose-300 bg-rose-500/20 border border-rose-500/30'
								: 'text-teal-300 bg-teal-400/15 border border-teal-400/25'} px-2 py-0.5 rounded-md"
						>
							{asiento.id}
						</span>
						<span class="text-[10px] font-mono text-neutral-400">
							{#if asiento.estado === 'anulado'}
								Reversado · {asiento.timestamp}
							{:else}
								{asiento.timestamp}
							{/if}
						</span>
					</div>

					<div class="flex items-start justify-between">
						<div>
							<p
								class="font-bold text-[12px] {asiento.estado === 'anulado'
									? 'text-neutral-300 line-through opacity-70'
									: 'text-white'}"
							>
								{asiento.concepto}
							</p>
							<p
								class="text-[11px] {asiento.estado === 'anulado'
									? 'text-rose-300 font-medium'
									: 'text-neutral-400'}"
							>
								{#if asiento.estado === 'anulado'}
									Motivo: {asiento.motivoReverso || 'Reverso autorizado por auditoría'}
								{:else}
									{asiento.beneficiarioNombre} ({asiento.proyectoCodigo})
								{/if}
							</p>
						</div>
						<div class="text-right">
							<span
								class="font-mono font-bold text-[14px] {asiento.estado === 'anulado'
									? 'text-rose-400 line-through'
									: 'text-white'} block"
							>
								${asiento.montoUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
							</span>
							<span
								class="text-[10px] font-mono font-semibold {asiento.estado === 'anulado'
									? 'text-rose-400'
									: 'text-emerald-400'}"
							>
								{asiento.estado === 'anulado' ? 'Anulado' : 'Asentado'}
							</span>
						</div>
					</div>

					<div
						class="pt-1.5 border-t {asiento.estado === 'anulado'
							? 'border-rose-500/20'
							: 'border-white/10'} flex items-center justify-between"
					>
						<span class="text-[10px] font-mono text-neutral-400">
							Hash: <code class="opacity-75">{asiento.hashSha256.substring(0, 8)}...</code>
						</span>
						{#if asiento.estado !== 'anulado'}
							<button
								class="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 text-[11px] font-mono font-semibold flex items-center gap-1 transition-all border border-rose-500/20 active:scale-95"
								onclick={() => financialStore.openVoidModal(asiento.id, asiento.montoUsd)}
							>
								<span class="material-symbols-outlined text-[13px]">block</span>
								<span>Anular con Reverso</span>
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

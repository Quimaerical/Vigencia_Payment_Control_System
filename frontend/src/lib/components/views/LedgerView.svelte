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
	<div class="chroma-glass-card space-y-3 rounded-2xl p-4">
		<div class="flex items-center justify-between border-b border-white/10 pb-2">
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-xl border border-teal-400/25 bg-teal-400/15 text-teal-300"
				>
					<span class="material-symbols-outlined text-[19px]">receipt_long</span>
				</div>
				<div>
					<h2 class="text-[15px] font-bold text-white">Libro Mayor Inmutable</h2>
					<p class="text-[11px] text-neutral-400">Registros contables Append-Only</p>
				</div>
			</div>
			<span
				class="flex items-center gap-1 rounded-full border border-teal-400/30 bg-teal-400/15 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-300"
			>
				<span class="material-symbols-outlined text-[13px]">lock</span> WORM Log
			</span>
		</div>

		<!-- Search & Filter Controls -->
		<div class="flex items-center gap-2">
			<div class="relative flex-1">
				<input
					class="w-full rounded-xl border border-white/15 bg-neutral-950/70 px-3 py-1.5 pl-8 text-[11px] text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-teal-400 focus:outline-none"
					placeholder="Buscar por Asiento, ID o Investigador..."
					type="text"
					bind:value={searchQuery}
				/>
				<span
					class="material-symbols-outlined absolute top-1.5 left-2.5 text-[16px] text-neutral-500"
				>
					search
				</span>
			</div>
			<button
				class="flex shrink-0 items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5 font-mono text-[11px] text-neutral-300 transition-colors hover:bg-white/10"
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
					class="rounded-2xl p-3 {asiento.estado === 'anulado'
						? 'border border-rose-500/30 bg-rose-950/30 opacity-90'
						: 'border border-white/10 bg-neutral-950/70 hover:border-teal-400/40'} space-y-2 transition-all"
				>
					<div class="flex items-center justify-between">
						<span
							class="font-mono text-xs font-bold {asiento.estado === 'anulado'
								? 'border border-rose-500/30 bg-rose-500/20 text-rose-300'
								: 'border border-teal-400/25 bg-teal-400/15 text-teal-300'} rounded-md px-2 py-0.5"
						>
							{asiento.id}
						</span>
						<span class="font-mono text-[10px] text-neutral-400">
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
								class="text-[12px] font-bold {asiento.estado === 'anulado'
									? 'text-neutral-300 line-through opacity-70'
									: 'text-white'}"
							>
								{asiento.concepto}
							</p>
							<p
								class="text-[11px] {asiento.estado === 'anulado'
									? 'font-medium text-rose-300'
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
								class="font-mono text-[14px] font-bold {asiento.estado === 'anulado'
									? 'text-rose-400 line-through'
									: 'text-white'} block"
							>
								${asiento.montoUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
							</span>
							<span
								class="font-mono text-[10px] font-semibold {asiento.estado === 'anulado'
									? 'text-rose-400'
									: 'text-emerald-400'}"
							>
								{asiento.estado === 'anulado' ? 'Anulado' : 'Asentado'}
							</span>
						</div>
					</div>

					<div
						class="border-t pt-1.5 {asiento.estado === 'anulado'
							? 'border-rose-500/20'
							: 'border-white/10'} flex items-center justify-between"
					>
						<span class="font-mono text-[10px] text-neutral-400">
							Hash: <code class="opacity-75">{asiento.hashSha256.substring(0, 8)}...</code>
						</span>
						{#if asiento.estado !== 'anulado'}
							<button
								class="flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-rose-300 transition-all hover:bg-rose-500/25 active:scale-95"
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

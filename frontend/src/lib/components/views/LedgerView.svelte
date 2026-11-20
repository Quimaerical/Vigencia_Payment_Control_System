<script lang="ts">
	import { pointerSkew } from '../../actions/pointerSkew';
	import { financialStore } from '../../stores/financialStore.svelte';
	import { authStore } from '../../stores/authStore.svelte';
	import RbacNoticeBanner from '../layout/RbacNoticeBanner.svelte';

	let searchQuery = $state('');
	let filterStatus = $state<'todos' | 'asentado' | 'anulado'>('todos');

	let filteredAsientos = $derived(
		financialStore.asientos.filter((item) => {
			const q = searchQuery.toLowerCase();
			const matchesSearch =
				item.id.toLowerCase().includes(q) ||
				item.concepto.toLowerCase().includes(q) ||
				item.beneficiarioNombre.toLowerCase().includes(q) ||
				item.proyectoCodigo.toLowerCase().includes(q) ||
				(item.solicitudCodigo ?? '').toLowerCase().includes(q);
			const matchesFilter = filterStatus === 'todos' || item.estado === filterStatus;
			return matchesSearch && matchesFilter;
		})
	);
</script>

<section class="view-panel space-y-3.5" id="tab-ledger">
	<div use:pointerSkew class="modular-card-interactive chroma-glass-card space-y-3 rounded-2xl p-4">
		<div
			class="flex items-center justify-between border-b border-teal-900/12 pb-2 dark:border-white/10"
		>
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-xl border border-teal-600/25 bg-teal-500/12 text-teal-800 dark:border-teal-400/25 dark:bg-teal-400/15 dark:text-teal-300"
				>
					<span class="material-symbols-outlined text-[19px]">receipt_long</span>
				</div>
				<div>
					<h2 class="text-[15px] font-bold text-slate-900 dark:text-white">
						Libro Mayor Inmutable
					</h2>
					<p class="text-[11px] text-slate-600 dark:text-neutral-400">
						Registros contables Append-Only
					</p>
				</div>
			</div>
			<span
				class="flex items-center gap-1 rounded-full border border-teal-600/30 bg-teal-500/12 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-800 dark:border-teal-400/30 dark:bg-teal-400/15 dark:text-teal-300"
			>
				<span class="material-symbols-outlined text-[13px]">lock</span> WORM Log
			</span>
		</div>

		{#if !authStore.isAuthenticated}
			<RbacNoticeBanner variant="unauthenticated" context="Libro Mayor Inmutable" />
		{:else if authStore.esAdmin}
			<RbacNoticeBanner variant="admin-restricted" context="Libro Mayor Inmutable" />
		{/if}

		<!-- Search & Filter Controls -->
		<div class="flex items-center gap-2">
			<div class="relative flex-1">
				<input
					class="surface-input w-full rounded-xl px-3 py-1.5 pl-8 text-[11px] focus:ring-1 focus:ring-teal-500 focus:outline-none"
					placeholder="Buscar por Asiento, Proyecto, Solicitud o Investigador..."
					type="text"
					bind:value={searchQuery}
				/>
				<span
					class="material-symbols-outlined absolute top-1.5 left-2.5 text-[16px] text-slate-400 dark:text-neutral-500"
				>
					search
				</span>
			</div>
			<button
				type="button"
				class="surface-subcard flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 font-mono text-[11px] font-semibold transition-colors hover:bg-teal-50 dark:hover:bg-white/10"
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
						? 'border border-rose-600/35 bg-rose-50/90 opacity-95 dark:border-rose-500/30 dark:bg-rose-950/30'
						: 'surface-subcard hover:border-teal-600/40 dark:hover:border-teal-400/40'} space-y-2 transition-all"
				>
					<div class="flex items-center justify-between">
						<span
							class="font-mono text-xs font-bold {asiento.estado === 'anulado'
								? 'border border-rose-600/30 bg-rose-500/15 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300'
								: 'border border-teal-600/25 bg-teal-500/12 text-teal-800 dark:border-teal-400/25 dark:bg-teal-400/15 dark:text-teal-300'} rounded-md px-2 py-0.5"
						>
							{asiento.id}
						</span>
						<span class="font-mono text-[10px] text-slate-600 dark:text-neutral-400">
							{#if asiento.estado === 'anulado'}
								Reversado · {asiento.timestamp}
							{:else}
								{asiento.timestamp}
							{/if}
						</span>
					</div>

					<div class="flex items-start justify-between gap-2">
						<div>
							<p
								class="text-[12px] font-bold {asiento.estado === 'anulado'
									? 'text-slate-600 line-through opacity-75 dark:text-neutral-300'
									: 'text-slate-900 dark:text-white'}"
							>
								{asiento.concepto}
							</p>
							<p
								class="text-[11px] {asiento.estado === 'anulado'
									? 'font-medium text-rose-700 dark:text-rose-300'
									: 'text-slate-600 dark:text-neutral-400'}"
							>
								{#if asiento.estado === 'anulado'}
									Motivo: {asiento.motivoReverso || 'Reverso autorizado por auditoría'}
								{:else}
									{asiento.beneficiarioNombre} · {asiento.proyectoCodigo}{#if asiento.solicitudCodigo && asiento.solicitudCodigo !== asiento.proyectoCodigo}
										· {asiento.solicitudCodigo}{/if}
								{/if}
							</p>
						</div>
						<div class="text-right">
							<span
								class="font-mono text-[14px] font-bold {asiento.estado === 'anulado'
									? 'text-rose-700 line-through dark:text-rose-400'
									: 'text-slate-900 dark:text-white'} block"
							>
								${asiento.montoUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
							</span>
							<span
								class="font-mono text-[10px] font-semibold {asiento.estado === 'anulado'
									? 'text-rose-700 dark:text-rose-400'
									: 'text-emerald-700 dark:text-emerald-400'}"
							>
								{asiento.estado === 'anulado' ? 'Anulado' : 'Asentado'}
							</span>
						</div>
					</div>

					<div
						class="border-t pt-1.5 {asiento.estado === 'anulado'
							? 'border-rose-600/20 dark:border-rose-500/20'
							: 'border-teal-900/12 dark:border-white/10'} flex flex-wrap items-center justify-between gap-2"
					>
						<span class="font-mono text-[10px] text-slate-600 dark:text-neutral-400">
							Registro: <code>{asiento.id}</code>
						</span>
						<div class="flex items-center gap-1.5">
							{#if asiento.pagoId}
								<button
									type="button"
									class="flex items-center gap-1 rounded-lg border border-teal-600/30 bg-teal-500/12 px-2.5 py-1 font-mono text-[11px] font-semibold text-teal-800 hover:bg-teal-500/20 dark:border-teal-500/30 dark:bg-teal-500/15 dark:text-teal-300 dark:hover:bg-teal-500/25"
									onclick={() =>
										asiento.pagoId && financialStore.descargarReciboPagoPdf(asiento.pagoId)}
								>
									<span class="material-symbols-outlined text-[13px]">picture_as_pdf</span>
									<span>Recibo PDF</span>
								</button>
							{/if}
							{#if asiento.estado !== 'anulado' && authStore.esReceptor}
								<button
									type="button"
									class="flex items-center gap-1 rounded-lg border border-rose-600/30 bg-rose-500/12 px-2.5 py-1 font-mono text-[11px] font-semibold text-rose-800 transition-all hover:bg-rose-500/20 active:scale-95 dark:border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
									onclick={() =>
										financialStore.openVoidModal(asiento.id, asiento.montoUsd, asiento.pagoId)}
								>
									<span class="material-symbols-outlined text-[13px]">block</span>
									<span>Anular con Reverso</span>
								</button>
							{/if}
						</div>
					</div>
				</div>
			{:else}
				<p class="text-center font-mono text-[11px] text-slate-600 dark:text-neutral-400">
					No hay asientos registrados para mostrar.
				</p>
			{/each}
		</div>
	</div>
</section>

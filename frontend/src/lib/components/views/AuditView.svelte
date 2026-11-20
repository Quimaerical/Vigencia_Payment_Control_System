<script lang="ts">
	import { pointerSkew } from '../../actions/pointerSkew';
	import { financialStore } from '../../stores/financialStore.svelte';
	import { authStore } from '../../stores/authStore.svelte';
	import RbacNoticeBanner from '../layout/RbacNoticeBanner.svelte';

	let diffs = $derived(financialStore.auditDiffs);
</script>

<section class="view-panel space-y-3.5" id="tab-audit">
	<div use:pointerSkew class="modular-card-interactive chroma-glass-card space-y-3 rounded-2xl p-4">
		<div
			class="flex items-center justify-between border-b border-teal-900/12 pb-2 dark:border-white/10"
		>
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-xl border border-teal-600/25 bg-teal-500/12 text-teal-800 dark:border-teal-400/25 dark:bg-teal-400/15 dark:text-teal-300"
				>
					<span class="material-symbols-outlined text-[19px]">history_edu</span>
				</div>
				<div>
					<h2 class="text-[15px] font-bold text-slate-900 dark:text-white">
						Inspector Forense JSONB
					</h2>
					<p class="text-[11px] text-slate-600 dark:text-neutral-400">
						PostgreSQL Trigger &amp;
						<code class="font-mono text-[10px] font-semibold text-teal-800 dark:text-teal-300">
							/api/v1/audit-logs
						</code>
					</p>
				</div>
			</div>
			<div class="flex items-center gap-1.5">
				<button
					type="button"
					class="surface-subcard rounded-lg px-2 py-0.5 font-mono text-[10px] font-semibold hover:bg-teal-50 dark:hover:bg-white/10"
					onclick={() => financialStore.syncFromBackend()}
				>
					↻ Recargar
				</button>
				<span
					class="rounded-full border border-teal-600/30 bg-teal-500/12 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-800 dark:border-teal-400/30 dark:bg-teal-400/15 dark:text-teal-300"
				>
					Audit DB
				</span>
			</div>
		</div>

		{#if !authStore.isAuthenticated}
			<RbacNoticeBanner variant="unauthenticated" context="Inspector Forense JSONB" />
		{:else if !authStore.esAdmin}
			<RbacNoticeBanner variant="generador-readonly" context="Inspector Forense JSONB" />
		{/if}

		{#each diffs as diff (diff.id)}
			<div
				class="space-y-2 border-t border-teal-900/10 pt-2 first:border-0 first:pt-0 dark:border-white/5"
			>
				<div
					class="flex flex-wrap items-center justify-between gap-1 font-mono text-[10px] text-slate-600 dark:text-neutral-400"
				>
					<span>
						usuario:
						<strong class="text-slate-900 dark:text-white"
							>{diff.usuarioId} [{diff.usuarioRol}]</strong
						>
						· acción:
						<strong class="text-teal-800 dark:text-teal-300">{diff.accion}</strong>
						({diff.tablaAfectada} #{diff.registroId})
					</span>
					<span>{diff.timestamp}</span>
				</div>

				<!-- JSON Diff Panels (Anterior vs Nuevo) -->
				<div class="space-y-2">
					{#if diff.datosAnteriores}
						<div
							class="rounded-xl border border-rose-600/30 bg-rose-50/90 p-2.5 font-mono text-[10px] dark:border-rose-500/30 dark:bg-rose-950/30"
						>
							<div
								class="mb-1.5 flex items-center justify-between border-b border-rose-600/20 pb-1 font-bold text-rose-800 dark:border-rose-500/25 dark:text-rose-300"
							>
								<span class="flex items-center gap-1">
									<span class="material-symbols-outlined text-[13px]">remove_circle</span>
									<span>datos_anteriores (JSONB)</span>
								</span>
								<span>Estado Previo</span>
							</div>
							<pre
								class="space-y-0.5 overflow-x-auto leading-snug text-slate-800 dark:text-neutral-300"><code
									>{JSON.stringify(diff.datosAnteriores, null, 2)}</code
								></pre>
						</div>
					{/if}

					<div
						class="rounded-xl border border-emerald-600/30 bg-emerald-50/90 p-2.5 font-mono text-[10px] dark:border-emerald-500/30 dark:bg-emerald-950/30"
					>
						<div
							class="mb-1.5 flex items-center justify-between border-b border-emerald-600/20 pb-1 font-bold text-emerald-800 dark:border-emerald-500/25 dark:text-emerald-300"
						>
							<span class="flex items-center gap-1">
								<span class="material-symbols-outlined text-[13px]">add_circle</span>
								<span>datos_nuevos (JSONB)</span>
							</span>
							<span>Estado Mutado</span>
						</div>
						<pre
							class="space-y-0.5 overflow-x-auto leading-snug text-slate-800 dark:text-neutral-300"><code
								>{JSON.stringify(diff.datosNuevos, null, 2)}</code
							></pre>
					</div>
				</div>

				<div
					class="surface-subcard flex items-center justify-between rounded-xl p-2 font-mono text-[10px]"
				>
					<span class="flex items-center gap-1 font-semibold text-teal-800 dark:text-teal-300">
						<span class="material-symbols-outlined text-[14px]">verified_user</span>
						Registro Inmutable #{diff.id}
					</span>
					<span class="text-slate-600 dark:text-neutral-400">IP: {diff.ipOrigen || 'N/A'}</span>
				</div>
			</div>
		{:else}
			<p class="py-4 text-center font-mono text-[11px] text-slate-600 dark:text-neutral-400">
				{#if authStore.esAdmin}
					No hay eventos de auditoría registrados todavía.
				{:else}
					Inicie sesión como ADMINISTRADOR para inspeccionar trazas JSONB del servidor.
				{/if}
			</p>
		{/each}
	</div>
</section>

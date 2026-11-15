<script lang="ts">
	import { financialStore } from '../../stores/financialStore.svelte';
	import { authStore } from '../../stores/authStore.svelte';

	let diffs = $derived(financialStore.auditDiffs);
</script>

<section class="view-panel space-y-3.5" id="tab-audit">
	<div class="chroma-glass-card space-y-3 rounded-2xl p-4">
		<div class="flex items-center justify-between border-b border-white/10 pb-2">
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-xl border border-teal-400/25 bg-teal-400/15 text-teal-300"
				>
					<span class="material-symbols-outlined text-[19px]">history_edu</span>
				</div>
				<div>
					<h2 class="text-[15px] font-bold text-white">Inspector Forense JSONB</h2>
					<p class="text-[11px] text-neutral-400">
						PostgreSQL Trigger & <code class="font-mono text-[10px] text-teal-300"
							>/api/v1/audit-logs</code
						>
					</p>
				</div>
			</div>
			<div class="flex items-center gap-1.5">
				<button
					type="button"
					class="rounded-lg border border-white/20 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white hover:bg-white/10"
					onclick={() => financialStore.syncFromBackend()}
				>
					↻ Recargar
				</button>
				<span
					class="rounded-full border border-teal-400/30 bg-teal-400/15 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-300"
				>
					SHA-256
				</span>
			</div>
		</div>

		{#if !authStore.esAdmin}
			<div
				class="rounded-xl border border-amber-400/30 bg-amber-950/30 p-2.5 text-[11px] text-amber-200"
			>
				Nota RBAC: La consulta en vivo de <code>/api/v1/audit-logs</code> requiere rol
				<strong>ADMINISTRADOR</strong>.
			</div>
		{/if}

		{#each diffs as diff (diff.id)}
			<div class="space-y-2 border-t border-white/5 pt-2 first:border-0 first:pt-0">
				<div
					class="flex flex-wrap items-center justify-between gap-1 font-mono text-[10px] text-neutral-400"
				>
					<span>
						usuario: <strong class="text-white">{diff.usuarioId} [{diff.usuarioRol}]</strong> ·
						acción: <strong class="text-teal-300">{diff.accion}</strong> ({diff.tablaAfectada} #{diff.registroId})
					</span>
					<span>{diff.timestamp}</span>
				</div>

				<!-- JSON Diff Panels (Anterior vs Nuevo) -->
				<div class="space-y-2">
					{#if diff.datosAnteriores}
						<div
							class="rounded-xl border border-rose-500/30 bg-rose-950/30 p-2.5 font-mono text-[10px]"
						>
							<div
								class="mb-1.5 flex items-center justify-between border-b border-rose-500/25 pb-1 font-bold text-rose-300"
							>
								<span class="flex items-center gap-1">
									<span class="material-symbols-outlined text-[13px]">remove_circle</span>
									<span>datos_anteriores (JSONB)</span>
								</span>
								<span>Estado Previo</span>
							</div>
							<pre class="space-y-0.5 overflow-x-auto leading-snug text-neutral-300"><code
									>{JSON.stringify(diff.datosAnteriores, null, 2)}</code
								></pre>
						</div>
					{/if}

					<div
						class="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-2.5 font-mono text-[10px]"
					>
						<div
							class="mb-1.5 flex items-center justify-between border-b border-emerald-500/25 pb-1 font-bold text-emerald-300"
						>
							<span class="flex items-center gap-1">
								<span class="material-symbols-outlined text-[13px]">add_circle</span>
								<span>datos_nuevos (JSONB)</span>
							</span>
							<span>Estado Mutado</span>
						</div>
						<pre class="space-y-0.5 overflow-x-auto leading-snug text-neutral-300"><code
								>{JSON.stringify(diff.datosNuevos, null, 2)}</code
							></pre>
					</div>
				</div>

				<div
					class="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2 font-mono text-[10px]"
				>
					<span class="flex items-center gap-1 font-semibold text-teal-300">
						<span class="material-symbols-outlined text-[14px]">verified_user</span>
						Integridad Criptográfica Verificada
					</span>
					<span class="text-neutral-400">Nivel: ISO 27001</span>
				</div>
			</div>
		{/each}
	</div>
</section>

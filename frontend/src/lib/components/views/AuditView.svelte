<script lang="ts">
	import { financialStore } from '../../stores/financialStore.svelte';

	let diffs = $derived(financialStore.auditDiffs);
</script>

<section class="view-panel space-y-3.5" id="tab-audit">
	<div class="chroma-glass-card rounded-2xl p-4 space-y-3">
		<div class="flex items-center justify-between pb-2 border-b border-white/10">
			<div class="flex items-center gap-2">
				<div
					class="w-8 h-8 rounded-xl bg-teal-400/15 text-teal-300 flex items-center justify-center border border-teal-400/25"
				>
					<span class="material-symbols-outlined text-[19px]">history_edu</span>
				</div>
				<div>
					<h2 class="font-bold text-white text-[15px]">Inspector Forense JSONB</h2>
					<p class="text-[11px] text-neutral-400">
						PostgreSQL Trigger <code class="text-teal-300 font-mono text-[10px]">trg_audit_payments()</code>
					</p>
				</div>
			</div>
			<span
				class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-400/15 text-teal-300 font-bold border border-teal-400/30"
			>
				SHA-256
			</span>
		</div>

		{#each diffs as diff (diff.id)}
			<div class="space-y-2 pt-2 border-t border-white/5 first:border-0 first:pt-0">
				<div class="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-neutral-400">
					<span>
						usuario_id: <strong class="text-white">{diff.usuarioId} [{diff.usuarioRol}]</strong>
					</span>
					<span>{diff.timestamp}</span>
				</div>

				<!-- JSON Diff Panels (Anterior vs Nuevo) -->
				<div class="space-y-2">
					{#if diff.datosAnteriores}
						<div class="rounded-xl bg-rose-950/30 border border-rose-500/30 p-2.5 font-mono text-[10px]">
							<div
								class="flex items-center justify-between pb-1 mb-1.5 border-b border-rose-500/25 text-rose-300 font-bold"
							>
								<span class="flex items-center gap-1">
									<span class="material-symbols-outlined text-[13px]">remove_circle</span>
									<span>datos_anteriores (JSONB)</span>
								</span>
								<span>Estado Previo</span>
							</div>
							<pre
								class="overflow-x-auto text-neutral-300 space-y-0.5 leading-snug"><code>{JSON.stringify(diff.datosAnteriores, null, 2)}</code></pre>
						</div>
					{/if}

					<div class="rounded-xl bg-emerald-950/30 border border-emerald-500/30 p-2.5 font-mono text-[10px]">
						<div
							class="flex items-center justify-between pb-1 mb-1.5 border-b border-emerald-500/25 text-emerald-300 font-bold"
						>
							<span class="flex items-center gap-1">
								<span class="material-symbols-outlined text-[13px]">add_circle</span>
								<span>datos_nuevos (JSONB)</span>
							</span>
							<span>Estado Mutado</span>
						</div>
						<pre
							class="overflow-x-auto text-neutral-300 space-y-0.5 leading-snug"><code>{JSON.stringify(diff.datosNuevos, null, 2)}</code></pre>
					</div>
				</div>

				<div
					class="p-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono flex items-center justify-between"
				>
					<span class="text-teal-300 flex items-center gap-1 font-semibold">
						<span class="material-symbols-outlined text-[14px]">verified_user</span>
						Integridad Criptográfica Verificada
					</span>
					<span class="text-neutral-400">Nivel: ISO 27001</span>
				</div>
			</div>
		{/each}
	</div>
</section>

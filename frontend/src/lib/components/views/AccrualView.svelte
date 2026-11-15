<script lang="ts">
	import { financialStore } from '../../stores/financialStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import { catalogStore } from '../../stores/catalogStore.svelte';
	import { authStore } from '../../stores/authStore.svelte';

	let diasActivos = $state(22);
	let diasPeriodo = $state(30);
	let baseUsd = $state(2500);
	let factorBackend = $state<number | null>(null);

	// Parámetros para generación de Lote de Causación (/api/v1/causaciones/lote)
	let loteProyectoId = $state<number>(0);
	let loteGrupoId = $state<number>(0);
	let loteInicio = $state(new Date(Date.now() - 14 * 86400000).toISOString().substring(0, 10));
	let loteFin = $state(new Date().toISOString().substring(0, 10));
	let loteCrearSolicitud = $state(false);
	let loteCodigoSolicitud = $state(`SOL-LOTE-${Math.floor(1000 + Math.random() * 9000)}`);
	let motivoAnulacionDeudaMap = $state<Record<number, string>>({});

	$effect(() => {
		if (!loteProyectoId) {
			loteProyectoId = workspaceStore.activeProjectId || catalogStore.proyectos[0]?.id || 1;
		}
	});

	let montoCausadoComputado = $derived(
		financialStore.calcularProrrateo(diasActivos, diasPeriodo, baseUsd)
	);

	let totalEnTramite = $derived(
		financialStore.asignaciones.reduce((acc, a) => acc + a.montoCausadoUsd, 0)
	);

	async function handleSimularBackend() {
		const res = await financialStore.simularProrrateoBackend(baseUsd, diasActivos, diasPeriodo);
		if (res) {
			factorBackend = res.factorProrrateo;
			workspaceStore.showToast(
				`Simulación Backend: $${res.montoCausado.toFixed(2)} USD (Factor: ${res.factorProrrateo})`,
				'calculate'
			);
		}
	}

	async function handleGenerarLote() {
		await financialStore.generarLoteCausacion({
			proyectoId: Number(loteProyectoId || workspaceStore.activeProjectId || 1),
			grupoPagoId: loteGrupoId ? Number(loteGrupoId) : null,
			periodoInicio: loteInicio,
			periodoFin: loteFin,
			crearSolicitud: loteCrearSolicitud,
			codigoSolicitud: loteCrearSolicitud ? loteCodigoSolicitud.trim() : undefined
		});
	}

	async function handleAnularCausacion(deudaId: number) {
		const motivo = (motivoAnulacionDeudaMap[deudaId] || '').trim();
		if (motivo.length < 5) {
			workspaceStore.showToast('Ingrese un motivo de anulación (mínimo 5 caracteres)', 'warning');
			return;
		}
		const ok = await financialStore.anularCausacion(deudaId, motivo);
		if (ok) {
			motivoAnulacionDeudaMap[deudaId] = '';
		}
	}
</script>

<section class="view-panel space-y-3.5" id="tab-accrual">
	<div class="chroma-glass-card space-y-3 rounded-2xl p-4">
		<div class="flex items-center justify-between border-b border-white/10 pb-2">
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-xl border border-teal-400/25 bg-teal-400/15 text-teal-300"
				>
					<span class="material-symbols-outlined text-[19px]">calculate</span>
				</div>
				<div>
					<h2 class="text-[15px] font-bold text-white">Calculadora de Prorrateo</h2>
					<p class="text-[11px] text-neutral-400">Dedicación científica sujeta a días reales</p>
				</div>
			</div>
			<button
				type="button"
				class="rounded-full border border-teal-400/30 bg-teal-400/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-teal-300 hover:bg-teal-400/25"
				onclick={handleSimularBackend}
			>
				Verificar en API {factorBackend !== null ? `(${factorBackend})` : ''}
			</button>
		</div>

		<!-- Formula Display Callout -->
		<div
			class="rounded-xl border border-teal-400/25 bg-teal-400/10 p-2.5 font-mono text-[11px] leading-relaxed text-teal-300"
		>
			Causación USD = (Días Activos / Días Período) × Base Contractual USD
		</div>

		<!-- Inputs -->
		<div class="grid grid-cols-3 gap-2 text-[11px]">
			<div>
				<label for="calc-dias-activos" class="mb-1 block font-mono text-[10px] text-neutral-400"
					>Días Activos</label
				>
				<input
					id="calc-dias-activos"
					class="w-full rounded-xl border border-white/15 bg-neutral-950/70 px-2.5 py-1.5 font-mono font-bold text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
					type="number"
					bind:value={diasActivos}
					min="1"
					max="31"
				/>
			</div>
			<div>
				<label for="calc-dias-periodo" class="mb-1 block font-mono text-[10px] text-neutral-400"
					>Días Período</label
				>
				<input
					id="calc-dias-periodo"
					class="w-full rounded-xl border border-white/15 bg-neutral-950/70 px-2.5 py-1.5 font-mono font-bold text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
					type="number"
					bind:value={diasPeriodo}
					min="1"
					max="31"
				/>
			</div>
			<div>
				<label for="calc-base-usd" class="mb-1 block font-mono text-[10px] text-neutral-400"
					>Base USD</label
				>
				<input
					id="calc-base-usd"
					class="w-full rounded-xl border border-white/15 bg-neutral-950/70 px-2.5 py-1.5 font-mono font-bold text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
					type="number"
					bind:value={baseUsd}
					min="0"
					step="50"
				/>
			</div>
		</div>

		<!-- Result Strip -->
		<div
			class="text-body-sm flex items-center justify-between rounded-xl border border-emerald-400/30 bg-emerald-950/40 p-2.5 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
		>
			<span class="text-[11px] text-emerald-200">Monto Causado Computado:</span>
			<span class="font-mono text-[15px] font-bold text-emerald-300">
				${montoCausadoComputado.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
			</span>
		</div>
	</div>

	<!-- Batch Table of Scientific Researchers -->
	<div class="chroma-glass-card space-y-3 rounded-2xl p-4">
		<div class="flex items-center justify-between">
			<h3 class="text-[13px] font-bold text-white">Causaciones y Asignaciones en Trámite</h3>
			<span class="font-mono text-[10px] text-neutral-400">
				Total: ${totalEnTramite.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
			</span>
		</div>

		<!-- Parámetros del lote de causación (/api/v1/causaciones/lote) -->
		<div
			class="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-neutral-950/70 p-2.5 text-[11px] text-white"
		>
			<div>
				<label for="lote-proy" class="block text-[10px] text-neutral-400">Proyecto para Lote</label>
				<select
					id="lote-proy"
					class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1"
					bind:value={loteProyectoId}
				>
					{#each catalogStore.proyectos as p (p.id)}
						<option value={p.id}>{p.codigo} - {p.nombre}</option>
					{:else}
						{#each financialStore.proyectos as p (p.id)}
							<option value={p.id}>{p.codigo} - {p.nombre}</option>
						{/each}
					{/each}
				</select>
			</div>
			<div>
				<label for="lote-grp" class="block text-[10px] text-neutral-400"
					>Grupo de Pago (opcional)</label
				>
				<select
					id="lote-grp"
					class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1"
					bind:value={loteGrupoId}
				>
					<option value={0}>Todos los grupos</option>
					{#each catalogStore.gruposPago as g (g.id)}
						<option value={g.id}>{g.nombre}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="lote-ini" class="block text-[10px] text-neutral-400">Período Inicio</label>
				<input
					id="lote-ini"
					type="date"
					class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1 font-mono"
					bind:value={loteInicio}
				/>
			</div>
			<div>
				<label for="lote-fin" class="block text-[10px] text-neutral-400">Período Fin</label>
				<input
					id="lote-fin"
					type="date"
					class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1 font-mono"
					bind:value={loteFin}
				/>
			</div>
			<div class="col-span-2 flex flex-wrap items-center justify-between gap-2 pt-1">
				<label class="flex items-center gap-1.5 text-[10px] text-neutral-300">
					<input type="checkbox" bind:checked={loteCrearSolicitud} />
					<span>Crear Solicitud de Pago automáticamente</span>
				</label>
				{#if loteCrearSolicitud}
					<input
						type="text"
						placeholder="Código Solicitud"
						class="rounded border border-white/15 bg-neutral-900 px-2 py-0.5 font-mono text-[10px]"
						bind:value={loteCodigoSolicitud}
					/>
				{/if}
			</div>
		</div>

		<div class="space-y-2.5">
			{#each financialStore.asignaciones as asig (asig.id)}
				<div class="space-y-2 rounded-2xl border border-white/10 bg-neutral-950/70 p-3">
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-2.5">
							<div
								class="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-400/30 bg-gradient-to-tr from-teal-500/25 to-mint-400/25 text-[12px] font-bold text-teal-300"
							>
								{asig.beneficiarioIniciales}
							</div>
							<div>
								<div class="flex items-center gap-1.5">
									<p class="text-[12px] font-bold text-white">{asig.beneficiarioNombre}</p>
									<span
										class="rounded border border-teal-500/30 bg-teal-500/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-teal-300"
									>
										{asig.area}
									</span>
								</div>
								<p class="text-[10px] text-neutral-400">
									{asig.diasActivos}/{asig.diasPeriodo} días computados · Ratio: {(
										(asig.diasActivos / asig.diasPeriodo) *
										100
									).toFixed(1)}%
								</p>
							</div>
						</div>
						<div class="text-right">
							<span class="font-mono text-[13px] font-bold text-teal-300">
								${asig.montoCausadoUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
							</span>
							<span
								class="block font-mono text-[9px] font-semibold {asig.estado === 'pendiente'
									? 'text-amber-400'
									: 'text-teal-300'}"
							>
								● {asig.estado === 'pendiente'
									? 'Pendiente'
									: asig.estado === 'liquidado'
										? 'Liquidado'
										: 'Abonado'}
							</span>
						</div>
					</div>

					{#if asig.deudaId && asig.estado === 'pendiente' && !authStore.esAdmin}
						<div
							class="flex items-center justify-end gap-1.5 border-t border-white/10 pt-1.5 text-[10px]"
						>
							<input
								type="text"
								placeholder="Motivo anulación causación..."
								class="rounded border border-white/15 bg-neutral-900 px-2 py-0.5 text-white"
								bind:value={motivoAnulacionDeudaMap[asig.deudaId]}
							/>
							<button
								type="button"
								class="rounded border border-rose-500/30 bg-rose-500/20 px-2 py-0.5 font-mono text-rose-300 hover:bg-rose-500/30"
								onclick={() => asig.deudaId && handleAnularCausacion(asig.deudaId)}
							>
								Anular Causación
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<button
			disabled={!authStore.esGenerador}
			class="interactive-spring flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-mint-400 py-2.5 text-[12px] font-bold text-neutral-950 shadow-[0_0_16px_rgba(20,184,166,0.3)] transition-all active:scale-98 disabled:opacity-40"
			onclick={handleGenerarLote}
		>
			<span class="material-symbols-outlined text-[17px]">post_add</span>
			<span>
				Generar Nueva Planilla de Causación por Lote {authStore.esGenerador
					? ''
					: '(Rol Generador)'}
			</span>
		</button>
	</div>
</section>

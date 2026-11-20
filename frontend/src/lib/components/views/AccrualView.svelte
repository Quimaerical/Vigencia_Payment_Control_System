<script lang="ts">
	import { pointerSkew } from '../../actions/pointerSkew';
	import { financialStore } from '../../stores/financialStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import { catalogStore } from '../../stores/catalogStore.svelte';
	import { authStore } from '../../stores/authStore.svelte';
	import RbacNoticeBanner from '../layout/RbacNoticeBanner.svelte';

	let diasActivos = $state(22);
	let diasPeriodo = $state(30);
	let baseUsd = $state(2500);
	let factorBackend = $state<number | null>(null);

	// Parámetros para generación de Lote de Causación (/api/v1/causaciones/lote)
	let loteProyectoId = $state<number>(0);
	let filtroProyectoId = $state<number>(0);
	let loteGrupoId = $state<number>(0);
	let loteInicio = $state(new Date(Date.now() - 14 * 86400000).toISOString().substring(0, 10));
	let loteFin = $state(new Date().toISOString().substring(0, 10));
	let loteCrearSolicitud = $state(false);
	let loteCodigoSolicitud = $state(`SOL-LOTE-${Math.floor(1000 + Math.random() * 9000)}`);
	let motivoAnulacionDeudaMap = $state<Record<number, string>>({});

	$effect(() => {
		const activeId = workspaceStore.activeProjectId;
		if (activeId && catalogStore.proyectos.some((p) => p.id === activeId)) {
			loteProyectoId = activeId;
		} else if (!loteProyectoId) {
			loteProyectoId = catalogStore.proyectos[0]?.id || 1;
		}
	});

	let montoCausadoComputado = $derived(
		financialStore.calcularProrrateo(diasActivos, diasPeriodo, baseUsd)
	);

	let asignacionesVisibles = $derived(
		filtroProyectoId
			? financialStore.asignaciones.filter((a) => a.proyectoId === Number(filtroProyectoId))
			: financialStore.asignaciones
	);

	let totalEnTramite = $derived(
		asignacionesVisibles.reduce((acc, a) => acc + a.montoCausadoUsd, 0)
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
	<div use:pointerSkew class="modular-card-interactive chroma-glass-card space-y-3 rounded-2xl p-4">
		<div
			class="flex flex-wrap items-center justify-between gap-2 border-b border-teal-900/12 pb-2 dark:border-white/10"
		>
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-xl border border-teal-600/25 bg-teal-500/12 text-teal-800 dark:border-teal-400/25 dark:bg-teal-400/15 dark:text-teal-300"
				>
					<span class="material-symbols-outlined text-[19px]">calculate</span>
				</div>
				<div>
					<h2 class="text-[15px] font-bold text-slate-900 dark:text-white">
						Calculadora de Prorrateo
					</h2>
					<p class="text-[11px] text-slate-600 dark:text-neutral-400">
						Simulador matemático independiente (no persiste registros)
					</p>
				</div>
			</div>
			<button
				type="button"
				disabled={!authStore.esGenerador}
				title={authStore.esGenerador
					? 'Simular prorrateo contra la API'
					: 'Solo el rol Generador puede simular causaciones en API'}
				class="rounded-full border border-teal-600/30 bg-teal-500/12 px-2.5 py-0.5 font-mono text-[10px] font-bold text-teal-800 hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-45 dark:border-teal-400/30 dark:bg-teal-400/15 dark:text-teal-300 dark:hover:bg-teal-400/25"
				onclick={handleSimularBackend}
			>
				Verificar en API {factorBackend !== null ? `(${factorBackend})` : ''}
			</button>
		</div>

		<!-- Formula Display Callout -->
		<div
			class="rounded-xl border border-teal-600/25 bg-teal-500/10 p-2.5 font-mono text-[11px] leading-relaxed font-semibold text-teal-900 dark:border-teal-400/25 dark:bg-teal-400/10 dark:text-teal-300"
		>
			Causación USD = (Días Activos / Días Período) × Base Contractual USD
		</div>

		<!-- Inputs -->
		<div class="grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-3">
			<div>
				<label
					for="calc-dias-activos"
					class="mb-1 block font-mono text-[10px] font-semibold text-slate-600 dark:text-neutral-400"
				>
					Días Activos
				</label>
				<input
					id="calc-dias-activos"
					class="surface-input w-full rounded-xl px-2.5 py-1.5 font-mono font-bold focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
					type="number"
					bind:value={diasActivos}
					min="1"
					max="31"
				/>
			</div>
			<div>
				<label
					for="calc-dias-periodo"
					class="mb-1 block font-mono text-[10px] font-semibold text-slate-600 dark:text-neutral-400"
				>
					Días Período
				</label>
				<input
					id="calc-dias-periodo"
					class="surface-input w-full rounded-xl px-2.5 py-1.5 font-mono font-bold focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
					type="number"
					bind:value={diasPeriodo}
					min="1"
					max="31"
				/>
			</div>
			<div>
				<label
					for="calc-base-usd"
					class="mb-1 block font-mono text-[10px] font-semibold text-slate-600 dark:text-neutral-400"
				>
					Base USD
				</label>
				<input
					id="calc-base-usd"
					class="surface-input w-full rounded-xl px-2.5 py-1.5 font-mono font-bold focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
					type="number"
					bind:value={baseUsd}
					min="0"
					step="50"
				/>
			</div>
		</div>

		<!-- Result Strip -->
		<div
			class="flex items-center justify-between rounded-xl border border-emerald-600/30 bg-emerald-50/90 p-2.5 shadow-[0_0_12px_rgba(16,185,129,0.12)] dark:border-emerald-400/30 dark:bg-emerald-950/40"
		>
			<span class="text-[11px] font-semibold text-emerald-900 dark:text-emerald-200">
				Monto Causado Computado:
			</span>
			<span class="font-mono text-[15px] font-bold text-emerald-800 dark:text-emerald-300">
				${montoCausadoComputado.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
			</span>
		</div>
	</div>

	<!-- Batch Table of Scientific Researchers -->
	<div use:pointerSkew class="modular-card-interactive chroma-glass-card space-y-3 rounded-2xl p-4">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h3 class="text-[13px] font-bold text-slate-900 dark:text-white">
				Causaciones y Asignaciones en Trámite
			</h3>
			<div class="flex items-center gap-2">
				<select
					aria-label="Filtrar causaciones por proyecto"
					class="surface-input rounded-lg px-2 py-0.5 text-[10px]"
					bind:value={filtroProyectoId}
				>
					<option value={0}>Todos los proyectos</option>
					{#each catalogStore.proyectos as p (p.id)}
						<option value={p.id}>{p.codigo}</option>
					{/each}
				</select>
				<span class="font-mono text-[10px] font-semibold text-slate-600 dark:text-neutral-400">
					Total: ${totalEnTramite.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
				</span>
			</div>
		</div>

		{#if !authStore.isAuthenticated}
			<RbacNoticeBanner variant="unauthenticated" context="Generación de Lotes de Causación" />
		{:else if authStore.esAdmin}
			<RbacNoticeBanner variant="admin-restricted" context="Generación de Lotes de Causación" />
		{:else if authStore.esReceptor}
			<RbacNoticeBanner variant="receptor-readonly" context="Generación de Lotes de Causación" />
		{/if}

		<!-- Parámetros del lote de causación (/api/v1/causaciones/lote) -->
		<div
			class="surface-subcard grid grid-cols-1 gap-2 rounded-xl p-2.5 text-[11px] sm:grid-cols-2 lg:grid-cols-4"
		>
			<div>
				<label
					for="lote-proy"
					class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
				>
					Proyecto para Lote
				</label>
				<select
					id="lote-proy"
					class="surface-input w-full rounded px-2 py-1"
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
				<label
					for="lote-grp"
					class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
				>
					Grupo de Pago (opcional)
				</label>
				<select
					id="lote-grp"
					class="surface-input w-full rounded px-2 py-1"
					bind:value={loteGrupoId}
				>
					<option value={0}>Todos los grupos</option>
					{#each catalogStore.gruposPago as g (g.id)}
						<option value={g.id}>{g.nombre}</option>
					{/each}
				</select>
			</div>
			<div>
				<label
					for="lote-ini"
					class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
				>
					Período Inicio
				</label>
				<input
					id="lote-ini"
					type="date"
					class="surface-input w-full rounded px-2 py-1 font-mono"
					bind:value={loteInicio}
				/>
			</div>
			<div>
				<label
					for="lote-fin"
					class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
				>
					Período Fin
				</label>
				<input
					id="lote-fin"
					type="date"
					class="surface-input w-full rounded px-2 py-1 font-mono"
					bind:value={loteFin}
				/>
			</div>
			<div class="col-span-full flex flex-wrap items-center justify-between gap-2 pt-1">
				<label
					class="flex items-center gap-1.5 text-[10px] font-medium text-slate-700 dark:text-neutral-300"
				>
					<input type="checkbox" bind:checked={loteCrearSolicitud} />
					<span>Crear Solicitud de Pago automáticamente</span>
				</label>
				{#if loteCrearSolicitud}
					<input
						type="text"
						placeholder="Código Solicitud"
						class="surface-input rounded px-2 py-0.5 font-mono text-[10px]"
						bind:value={loteCodigoSolicitud}
					/>
				{/if}
			</div>
		</div>

		<div class="space-y-2.5">
			{#each asignacionesVisibles as asig (asig.id)}
				<div class="surface-subcard space-y-2 rounded-2xl p-3">
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-2.5">
							<div
								class="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-600/30 bg-gradient-to-tr from-teal-500/20 to-emerald-400/20 text-[12px] font-bold text-teal-800 dark:border-teal-400/30 dark:text-teal-300"
							>
								{asig.beneficiarioIniciales}
							</div>
							<div>
								<div class="flex flex-wrap items-center gap-1.5">
									<p class="text-[12px] font-bold text-slate-900 dark:text-white">
										{asig.beneficiarioNombre}
									</p>
									{#if asig.proyectoCodigo}
										<span
											class="rounded border border-amber-600/30 bg-amber-500/12 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-300"
										>
											{asig.proyectoCodigo}
										</span>
									{/if}
									<span
										class="rounded border border-teal-600/30 bg-teal-500/12 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/20 dark:text-teal-300"
									>
										{asig.area}
									</span>
								</div>
								<p class="text-[10px] text-slate-600 dark:text-neutral-400">
									{asig.diasActivos}/{asig.diasPeriodo} días computados · Ratio: {(
										(asig.diasActivos / asig.diasPeriodo) *
										100
									).toFixed(1)}%
								</p>
							</div>
						</div>
						<div class="text-right">
							<span class="font-mono text-[13px] font-bold text-teal-800 dark:text-teal-300">
								${asig.montoCausadoUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
							</span>
							<span
								class="block font-mono text-[9px] font-semibold {asig.estado === 'pendiente'
									? 'text-amber-700 dark:text-amber-400'
									: 'text-teal-800 dark:text-teal-300'}"
							>
								● {asig.estado === 'pendiente'
									? 'Pendiente'
									: asig.estado === 'liquidado'
										? 'Liquidado'
										: 'Abonado'}
							</span>
						</div>
					</div>

					{#if asig.deudaId && asig.estado === 'pendiente' && authStore.esGenerador}
						<div
							class="flex items-center justify-end gap-1.5 border-t border-teal-900/12 pt-1.5 text-[10px] dark:border-white/10"
						>
							<input
								type="text"
								placeholder="Motivo anulación causación..."
								class="surface-input rounded px-2 py-0.5"
								bind:value={motivoAnulacionDeudaMap[asig.deudaId]}
							/>
							<button
								type="button"
								class="rounded border border-rose-600/30 bg-rose-500/12 px-2 py-0.5 font-mono font-semibold text-rose-800 hover:bg-rose-500/20 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/30"
								onclick={() => asig.deudaId && handleAnularCausacion(asig.deudaId)}
							>
								Anular Causación
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<p class="py-3 text-center font-mono text-[11px] text-slate-600 dark:text-neutral-400">
					No hay causaciones para el filtro de proyecto seleccionado.
				</p>
			{/each}
		</div>

		<button
			type="button"
			disabled={!authStore.esGenerador}
			class="interactive-spring flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 py-2.5 text-[12px] font-bold text-white shadow-[0_0_16px_rgba(20,184,166,0.28)] transition-all active:scale-98 disabled:opacity-45 dark:from-teal-500 dark:to-mint-400 dark:text-neutral-950"
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

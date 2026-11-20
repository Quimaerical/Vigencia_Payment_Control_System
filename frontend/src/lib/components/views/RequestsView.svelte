<script lang="ts">
	import { pointerSkew } from '../../actions/pointerSkew';
	import { financialStore } from '../../stores/financialStore.svelte';
	import { catalogStore } from '../../stores/catalogStore.svelte';
	import { authStore } from '../../stores/authStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import { EstadoDeuda, EstadoSolicitud } from '@app/shared';
	import RbacNoticeBanner from '../layout/RbacNoticeBanner.svelte';

	let solCodigo = $state(
		`SOL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
	);
	let solProyectoId = $state<number>(0);
	let solGrupoPagoId = $state<number>(0);
	let solPeriodoInicio = $state(
		new Date(Date.now() - 15 * 86400000).toISOString().substring(0, 10)
	);
	let solPeriodoFin = $state(new Date().toISOString().substring(0, 10));
	let selectedDeudaIds = $state<number[]>([]);
	let motivoRechazoMap = $state<Record<number, string>>({});
	let showCreateForm = $state(false);

	$effect(() => {
		const activeId = workspaceStore.activeProjectId;
		if (activeId && catalogStore.proyectos.some((p) => p.id === activeId)) {
			solProyectoId = activeId;
		} else if (!solProyectoId && catalogStore.proyectos.length > 0) {
			solProyectoId = catalogStore.proyectos[0].id;
		}
	});

	let formExpanded = $derived(authStore.esGenerador || showCreateForm);

	let deudasElegibles = $derived(
		financialStore.deudasRaw.filter(
			(d) =>
				(!solProyectoId || d.proyectoId === Number(solProyectoId)) &&
				(!solGrupoPagoId || d.grupoPagoId === Number(solGrupoPagoId)) &&
				!d.solicitudId &&
				(d.estado === EstadoDeuda.PENDIENTE || d.estado === EstadoDeuda.ABONADO) &&
				Number(d.saldoPendiente) > 0
		)
	);

	function toggleDeudaSelection(id: number) {
		if (selectedDeudaIds.includes(id)) {
			selectedDeudaIds = selectedDeudaIds.filter((item) => item !== id);
		} else {
			selectedDeudaIds = [...selectedDeudaIds, id];
		}
	}

	async function handleCrearSolicitud(e: Event) {
		e.preventDefault();
		if (!solProyectoId) return;
		const ok = await financialStore.crearSolicitudPago({
			codigo: solCodigo.trim(),
			proyectoId: Number(solProyectoId),
			grupoPagoId: solGrupoPagoId ? Number(solGrupoPagoId) : null,
			periodoInicio: solPeriodoInicio,
			periodoFin: solPeriodoFin,
			deudaIds: selectedDeudaIds.length > 0 ? selectedDeudaIds : undefined
		});
		if (ok) {
			solCodigo = `SOL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
			selectedDeudaIds = [];
		}
	}

	async function handleRechazar(solicitudId: number) {
		const motivo = (motivoRechazoMap[solicitudId] || '').trim();
		if (motivo.length < 5) {
			workspaceStore.showToast('Ingrese un motivo de rechazo de al menos 5 caracteres.', 'warning');
			return;
		}
		const ok = await financialStore.rechazarSolicitudPago(solicitudId, motivo);
		if (ok) {
			motivoRechazoMap[solicitudId] = '';
		}
	}
</script>

<section class="view-panel space-y-3" id="tab-requests">
	<div
		use:pointerSkew
		class="modular-card-interactive chroma-glass-card space-y-3 rounded-2xl p-4 text-xs text-slate-900 dark:text-white"
	>
		<div
			class="flex items-center justify-between border-b border-teal-900/12 pb-2 dark:border-white/10"
		>
			<div>
				<h2 class="text-sm font-bold text-slate-900 dark:text-white">
					2.3 Ciclo de Solicitudes de Pago y PDF Consolidado
				</h2>
				<p class="text-[11px] text-slate-600 dark:text-neutral-400">
					Flujo: Creación → Envío (Generador) → Aprobación/Rechazo (Receptor) → Entrega → Cierre
				</p>
			</div>
			<button
				type="button"
				class="surface-subcard rounded-lg px-2.5 py-1 font-mono text-[10px] font-semibold hover:bg-teal-50 dark:hover:bg-white/10"
				onclick={() => financialStore.syncFromBackend()}
			>
				↻ Actualizar
			</button>
		</div>

		{#if !authStore.isAuthenticated}
			<RbacNoticeBanner variant="unauthenticated" context="Solicitudes de Pago" />
		{:else if authStore.esAdmin}
			<RbacNoticeBanner variant="admin-restricted" context="Solicitudes de Pago" />
		{:else if authStore.esReceptor}
			<RbacNoticeBanner variant="receptor-readonly" context="Solicitudes de Pago" />
		{/if}

		<!-- Formulario de Creación de Solicitud (Rol Generador) -->
		{#if authStore.esReceptor || authStore.esAdmin}
			<div class="flex items-center justify-between">
				<span class="font-mono text-[10px] font-semibold text-slate-600 dark:text-neutral-400">
					Bandeja operativa priorizada arriba para revisión/aprobación
				</span>
				<button
					type="button"
					class="surface-subcard rounded-lg px-2.5 py-1 font-mono text-[10px] font-semibold text-teal-800 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-white/10"
					onclick={() => (showCreateForm = !showCreateForm)}
				>
					{formExpanded ? 'Ocultar formulario (Generador)' : 'Mostrar formulario (Generador)'}
				</button>
			</div>
		{/if}

		{#if formExpanded}
			<form class="surface-subcard space-y-2 rounded-xl p-3" onsubmit={handleCrearSolicitud}>
				<div class="flex items-center justify-between">
					<span class="font-bold text-teal-800 dark:text-teal-300">
						Nueva Solicitud de Pago (Rol: Generador)
					</span>
					<span class="font-mono text-[10px] text-slate-600 dark:text-neutral-400">
						Elegibles sin solicitud: {deudasElegibles.length}
					</span>
				</div>

				<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
					<div>
						<label
							for="sol-codigo"
							class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
						>
							Código Solicitud
						</label>
						<input
							id="sol-codigo"
							type="text"
							class="surface-input w-full rounded px-2 py-1 font-mono"
							bind:value={solCodigo}
							required
						/>
					</div>
					<div>
						<label
							for="sol-proy"
							class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
						>
							Proyecto
						</label>
						<select
							id="sol-proy"
							class="surface-input w-full rounded px-2 py-1"
							bind:value={solProyectoId}
						>
							{#each catalogStore.proyectos as p (p.id)}
								<option value={p.id}>{p.codigo} - {p.nombre}</option>
							{/each}
						</select>
					</div>
					<div>
						<label
							for="sol-grp"
							class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
						>
							Grupo de Pago (opcional)
						</label>
						<select
							id="sol-grp"
							class="surface-input w-full rounded px-2 py-1"
							bind:value={solGrupoPagoId}
						>
							<option value={0}>Todos los grupos</option>
							{#each catalogStore.gruposPago as g (g.id)}
								<option value={g.id}>{g.nombre}</option>
							{/each}
						</select>
					</div>
					<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
						<div>
							<label
								for="sol-ini"
								class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
							>
								Período Inicio
							</label>
							<input
								id="sol-ini"
								type="date"
								class="surface-input w-full rounded px-1.5 py-1"
								bind:value={solPeriodoInicio}
								required
							/>
						</div>
						<div>
							<label
								for="sol-fin"
								class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
							>
								Período Fin
							</label>
							<input
								id="sol-fin"
								type="date"
								class="surface-input w-full rounded px-1.5 py-1"
								bind:value={solPeriodoFin}
								required
							/>
						</div>
					</div>
				</div>

				{#if deudasElegibles.length > 0}
					<div
						class="max-h-32 space-y-1 overflow-y-auto rounded border border-teal-900/12 bg-slate-50/90 p-2 dark:border-white/10 dark:bg-neutral-900/70"
					>
						<p class="text-[10px] text-slate-600 dark:text-neutral-400">
							Seleccione causaciones específicas (o deje vacío para agrupar todas las elegibles del
							proyecto):
						</p>
						{#each deudasElegibles as d (d.id)}
							<label
								class="flex items-center justify-between gap-2 rounded px-1.5 py-0.5 hover:bg-teal-500/10 dark:hover:bg-white/5"
							>
								<span class="flex items-center gap-1.5">
									<input
										type="checkbox"
										checked={selectedDeudaIds.includes(d.id)}
										onchange={() => toggleDeudaSelection(d.id)}
									/>
									<span>
										Deuda #{d.id} · {d.persona
											? `${d.persona.nombres} ${d.persona.apellidos}`
											: `Persona #${d.personaId}`}
									</span>
								</span>
								<span class="font-mono font-semibold text-teal-800 dark:text-teal-300">
									${Number(d.saldoPendiente).toFixed(2)} USD
								</span>
							</label>
						{/each}
					</div>
				{/if}

				<button
					type="submit"
					disabled={!authStore.esGenerador}
					class="w-full rounded-lg bg-teal-600 py-1.5 font-bold text-white transition-colors hover:bg-teal-700 disabled:opacity-45 dark:bg-teal-500 dark:text-neutral-950 dark:hover:bg-teal-400"
				>
					+ Crear Solicitud de Pago {authStore.esGenerador ? '' : '(Requiere rol Generador)'}
				</button>
			</form>
		{/if}

		<!-- Listado de Solicitudes -->
		<div class="space-y-2">
			{#each financialStore.solicitudesPago as sol (sol.id)}
				<div class="surface-subcard space-y-2 rounded-xl p-3">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<div>
							<p class="font-mono font-bold text-teal-800 dark:text-teal-300">
								{sol.codigo} — {sol.proyecto?.codigo ?? `PROY-${sol.proyectoId}`}
							</p>
							<p class="font-mono text-[10px] text-slate-600 dark:text-neutral-400">
								Período: {String(sol.periodoInicio).substring(0, 10)} → {String(
									sol.periodoFin
								).substring(0, 10)}
								| Deudas: {sol.deudas?.length ?? 0}
							</p>
						</div>
						<div class="text-right">
							<span class="block font-mono text-sm font-bold text-slate-900 dark:text-white">
								${Number(sol.montoTotal).toFixed(2)} USD
							</span>
							<span
								class="rounded border border-slate-300/80 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-800 uppercase dark:border-white/20 dark:bg-white/10 dark:text-neutral-200"
							>
								Estado: {sol.estado}
							</span>
						</div>
					</div>

					{#if sol.motivoRechazo}
						<p
							class="rounded border border-rose-600/35 bg-rose-50/90 p-1.5 text-[10px] text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300"
						>
							Motivo Rechazo: {sol.motivoRechazo}
						</p>
					{/if}

					<div
						class="flex flex-wrap items-center justify-between gap-1.5 border-t border-teal-900/12 pt-2 dark:border-white/10"
					>
						<button
							type="button"
							class="rounded border border-teal-600/30 bg-teal-500/12 px-2.5 py-1 font-mono text-[10px] font-semibold text-teal-800 hover:bg-teal-500/20 dark:border-teal-400/30 dark:bg-teal-500/15 dark:text-teal-300 dark:hover:bg-teal-500/25"
							onclick={() => financialStore.descargarSolicitudConsolidadaPdf(sol.id, sol.codigo)}
						>
							⬇ PDF Solicitud Consolidada
						</button>

						<div class="flex flex-wrap items-center gap-1.5">
							{#if sol.estado === EstadoSolicitud.CREACION && authStore.esGenerador}
								<button
									type="button"
									class="rounded bg-amber-500 px-2.5 py-1 font-bold text-neutral-950 hover:bg-amber-400"
									onclick={() => financialStore.enviarSolicitudPago(sol.id)}
								>
									Enviar a Aprobación →
								</button>
							{/if}

							{#if sol.estado === EstadoSolicitud.ENVIO && authStore.esReceptor}
								<button
									type="button"
									class="rounded bg-emerald-600 px-2.5 py-1 font-bold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-neutral-950 dark:hover:bg-emerald-400"
									onclick={() => financialStore.aprobarSolicitudPago(sol.id)}
								>
									✓ Aprobar
								</button>
								<input
									type="text"
									placeholder="Motivo rechazo..."
									class="surface-input rounded px-2 py-1 text-[10px]"
									bind:value={motivoRechazoMap[sol.id]}
								/>
								<button
									type="button"
									class="rounded bg-rose-600 px-2.5 py-1 font-bold text-white hover:bg-rose-700"
									onclick={() => handleRechazar(sol.id)}
								>
									✕ Rechazar
								</button>
							{/if}

							{#if (sol.estado === EstadoSolicitud.APROBACION || sol.estado === EstadoSolicitud.ENTREGA) && (authStore.esGenerador || authStore.esReceptor)}
								<button
									type="button"
									class="surface-subcard rounded px-2.5 py-1 font-mono text-[10px] font-semibold hover:bg-teal-50 dark:hover:bg-white/20"
									onclick={() => financialStore.cerrarSolicitudPago(sol.id)}
								>
									🔒 Cerrar Solicitud
								</button>
							{/if}
						</div>
					</div>
				</div>
			{:else}
				<p class="text-slate-600 dark:text-neutral-400">No hay solicitudes de pago registradas.</p>
			{/each}
		</div>
	</div>
</section>

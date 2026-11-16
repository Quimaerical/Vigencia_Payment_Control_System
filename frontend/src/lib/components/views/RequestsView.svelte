<script lang="ts">
	import { financialStore } from '../../stores/financialStore.svelte';
	import { catalogStore } from '../../stores/catalogStore.svelte';
	import { authStore } from '../../stores/authStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import { EstadoDeuda, EstadoSolicitud } from '@app/shared';

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

	$effect(() => {
		if (!solProyectoId && catalogStore.proyectos.length > 0) {
			solProyectoId = catalogStore.proyectos[0].id;
		}
	});

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
	<div class="chroma-glass-card space-y-3 rounded-2xl p-4 text-xs text-white">
		<div class="flex items-center justify-between border-b border-white/10 pb-2">
			<div>
				<h2 class="text-sm font-bold">2.3 Ciclo de Solicitudes de Pago y PDF Consolidado</h2>
				<p class="text-[11px] text-neutral-400">
					Flujo: Creación → Envío (Generador) → Aprobación/Rechazo (Receptor) → Entrega → Cierre
				</p>
			</div>
			<button
				type="button"
				class="rounded-lg border border-white/20 bg-white/5 px-2.5 py-1 font-mono text-[10px] hover:bg-white/10"
				onclick={() => financialStore.syncFromBackend()}
			>
				↻ Actualizar
			</button>
		</div>

		<!-- Formulario de Creación de Solicitud (Rol Generador) -->
		<form
			class="space-y-2 rounded-xl border border-white/10 bg-neutral-950/70 p-3"
			onsubmit={handleCrearSolicitud}
		>
			<div class="flex items-center justify-between">
				<span class="font-bold text-teal-300">Nueva Solicitud de Pago (Rol: Generador)</span>
				<span class="font-mono text-[10px] text-neutral-400">
					Elegibles sin solicitud: {deudasElegibles.length}
				</span>
			</div>

			<div class="grid grid-cols-2 gap-2">
				<div>
					<label for="sol-codigo" class="block text-[10px] text-neutral-400">Código Solicitud</label
					>
					<input
						id="sol-codigo"
						type="text"
						class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1 font-mono"
						bind:value={solCodigo}
						required
					/>
				</div>
				<div>
					<label for="sol-proy" class="block text-[10px] text-neutral-400">Proyecto</label>
					<select
						id="sol-proy"
						class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1"
						bind:value={solProyectoId}
					>
						{#each catalogStore.proyectos as p (p.id)}
							<option value={p.id}>{p.codigo} - {p.nombre}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="sol-grp" class="block text-[10px] text-neutral-400"
						>Grupo de Pago (opcional)</label
					>
					<select
						id="sol-grp"
						class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1"
						bind:value={solGrupoPagoId}
					>
						<option value={0}>Todos los grupos</option>
						{#each catalogStore.gruposPago as g (g.id)}
							<option value={g.id}>{g.nombre}</option>
						{/each}
					</select>
				</div>
				<div class="grid grid-cols-2 gap-1">
					<div>
						<label for="sol-ini" class="block text-[10px] text-neutral-400">Período Inicio</label>
						<input
							id="sol-ini"
							type="date"
							class="w-full rounded border border-white/15 bg-neutral-900 px-1.5 py-1"
							bind:value={solPeriodoInicio}
							required
						/>
					</div>
					<div>
						<label for="sol-fin" class="block text-[10px] text-neutral-400">Período Fin</label>
						<input
							id="sol-fin"
							type="date"
							class="w-full rounded border border-white/15 bg-neutral-900 px-1.5 py-1"
							bind:value={solPeriodoFin}
							required
						/>
					</div>
				</div>
			</div>

			{#if deudasElegibles.length > 0}
				<div
					class="max-h-32 space-y-1 overflow-y-auto rounded border border-white/10 bg-neutral-900/70 p-2"
				>
					<p class="text-[10px] text-neutral-400">
						Seleccione causaciones específicas (o deje vacío para agrupar todas las elegibles del
						proyecto):
					</p>
					{#each deudasElegibles as d (d.id)}
						<label
							class="flex items-center justify-between gap-2 rounded px-1.5 py-0.5 hover:bg-white/5"
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
							<span class="font-mono text-teal-300">${Number(d.saldoPendiente).toFixed(2)} USD</span
							>
						</label>
					{/each}
				</div>
			{/if}

			<button
				type="submit"
				disabled={!authStore.esGenerador}
				class="w-full rounded-lg bg-teal-500 py-1.5 font-bold text-neutral-950 disabled:opacity-40"
			>
				+ Crear Solicitud de Pago {authStore.esGenerador ? '' : '(Requiere rol Generador)'}
			</button>
		</form>

		<!-- Listado de Solicitudes -->
		<div class="space-y-2">
			{#each financialStore.solicitudesPago as sol (sol.id)}
				<div class="space-y-2 rounded-xl border border-white/10 bg-neutral-950/70 p-3">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<div>
							<p class="font-mono font-bold text-teal-300">
								{sol.codigo} — {sol.proyecto?.codigo ?? `PROY-${sol.proyectoId}`}
							</p>
							<p class="font-mono text-[10px] text-neutral-400">
								Período: {String(sol.periodoInicio).substring(0, 10)} → {String(
									sol.periodoFin
								).substring(0, 10)}
								| Deudas: {sol.deudas?.length ?? 0}
							</p>
						</div>
						<div class="text-right">
							<span class="block font-mono text-sm font-bold text-white">
								${Number(sol.montoTotal).toFixed(2)} USD
							</span>
							<span
								class="rounded border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[10px] uppercase"
							>
								Estado: {sol.estado}
							</span>
						</div>
					</div>

					{#if sol.motivoRechazo}
						<p
							class="rounded border border-rose-500/30 bg-rose-950/30 p-1.5 text-[10px] text-rose-300"
						>
							Motivo Rechazo: {sol.motivoRechazo}
						</p>
					{/if}

					<div
						class="flex flex-wrap items-center justify-between gap-1.5 border-t border-white/10 pt-2"
					>
						<button
							type="button"
							class="rounded border border-teal-400/30 bg-teal-500/15 px-2.5 py-1 font-mono text-[10px] text-teal-300 hover:bg-teal-500/25"
							onclick={() => financialStore.descargarSolicitudConsolidadaPdf(sol.id, sol.codigo)}
						>
							⬇ PDF Solicitud Consolidada
						</button>

						<div class="flex flex-wrap items-center gap-1.5">
							{#if sol.estado === EstadoSolicitud.CREACION && authStore.esGenerador}
								<button
									type="button"
									class="rounded bg-amber-500 px-2.5 py-1 font-bold text-neutral-950"
									onclick={() => financialStore.enviarSolicitudPago(sol.id)}
								>
									Enviar a Aprobación →
								</button>
							{/if}

							{#if sol.estado === EstadoSolicitud.ENVIO && authStore.esReceptor}
								<button
									type="button"
									class="rounded bg-emerald-500 px-2.5 py-1 font-bold text-neutral-950"
									onclick={() => financialStore.aprobarSolicitudPago(sol.id)}
								>
									✓ Aprobar
								</button>
								<input
									type="text"
									placeholder="Motivo rechazo..."
									class="rounded border border-white/20 bg-neutral-900 px-2 py-1 text-[10px]"
									bind:value={motivoRechazoMap[sol.id]}
								/>
								<button
									type="button"
									class="rounded bg-rose-600 px-2.5 py-1 font-bold text-white"
									onclick={() => handleRechazar(sol.id)}
								>
									✕ Rechazar
								</button>
							{/if}

							{#if (sol.estado === EstadoSolicitud.APROBACION || sol.estado === EstadoSolicitud.ENTREGA) && (authStore.esGenerador || authStore.esReceptor)}
								<button
									type="button"
									class="rounded border border-white/25 bg-white/10 px-2.5 py-1 font-mono text-[10px] hover:bg-white/20"
									onclick={() => financialStore.cerrarSolicitudPago(sol.id)}
								>
									🔒 Cerrar Solicitud
								</button>
							{/if}
						</div>
					</div>
				</div>
			{:else}
				<p class="text-neutral-400">No hay solicitudes de pago registradas.</p>
			{/each}
		</div>
	</div>
</section>

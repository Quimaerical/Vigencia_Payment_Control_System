<script lang="ts">
	import { pointerSkew } from '../../actions/pointerSkew';
	import { pettyCashStore } from '../../stores/pettyCashStore.svelte';
	import { catalogStore } from '../../stores/catalogStore.svelte';
	import { financialStore } from '../../stores/financialStore.svelte';
	import { authStore } from '../../stores/authStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import { EstadoCajaChica, EstadoValeCaja } from '@app/shared';
	import RbacNoticeBanner from '../layout/RbacNoticeBanner.svelte';

	// Apertura mensual de Caja Chica
	let cajaCodigo = $state(
		`CAJA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
	);
	let cajaNombre = $state('Caja Chica Operativa de Laboratorio');
	let cajaProyectoId = $state<number>(0);
	let cajaOrigenId = $state<number>(0);
	let cajaAnio = $state<number>(new Date().getFullYear());
	let cajaMes = $state<number>(new Date().getMonth() + 1);
	let cajaMontoAsignado = $state<number>(300);

	// Solicitud de Vale
	let valeCajaId = $state<number>(0);
	let valePersonaId = $state<number>(0);
	let valeMonto = $state<number>(50);
	let valeConcepto = $state('');

	// Filtro y UI
	let filtroProyectoId = $state<number>(0);
	let showCreateForms = $state(false);

	// Rendición / Rechazo / Anulación de Vales
	let rendirMontoMap = $state<Record<number, number>>({});
	let rendirComprobanteMap = $state<Record<number, string>>({});
	let motivoValeMap = $state<Record<number, string>>({});

	$effect(() => {
		const activeId = workspaceStore.activeProjectId;
		if (activeId && catalogStore.proyectos.some((p) => p.id === activeId)) {
			cajaProyectoId = activeId;
		} else if (!cajaProyectoId && catalogStore.proyectos.length > 0) {
			cajaProyectoId = catalogStore.proyectos[0].id;
		}
		if (!valePersonaId && catalogStore.personas.length > 0) {
			valePersonaId = catalogStore.personas[0].id;
		}
	});

	$effect(() => {
		const abiertas = pettyCashStore.cajasChicas.filter((c) => c.estado === EstadoCajaChica.ABIERTA);
		const lastId = pettyCashStore.lastCreatedCajaId;
		if (lastId && abiertas.some((c) => c.id === lastId)) {
			valeCajaId = lastId;
			pettyCashStore.lastCreatedCajaId = null;
		} else if ((!valeCajaId || !abiertas.some((c) => c.id === valeCajaId)) && abiertas.length > 0) {
			valeCajaId = abiertas[0].id;
		}
	});

	let formsExpanded = $derived(authStore.esGenerador || showCreateForms);

	let cajasCerradasMismoProyecto = $derived(
		pettyCashStore.cajasChicas.filter(
			(c) => c.proyectoId === Number(cajaProyectoId) && c.estado === EstadoCajaChica.CERRADA
		)
	);

	let cajasFiltradas = $derived(
		filtroProyectoId
			? pettyCashStore.cajasChicas.filter((c) => c.proyectoId === Number(filtroProyectoId))
			: pettyCashStore.cajasChicas
	);

	async function handleAbrirCaja(e: Event) {
		e.preventDefault();
		if (!cajaProyectoId) return;
		const ok = await pettyCashStore.abrirCaja(
			{
				codigo: cajaCodigo.trim(),
				nombre: cajaNombre.trim(),
				proyectoId: Number(cajaProyectoId),
				cajaOrigenId: cajaOrigenId ? Number(cajaOrigenId) : null,
				anio: Number(cajaAnio),
				mes: Number(cajaMes),
				montoAsignado: Number(cajaMontoAsignado)
			},
			true
		);
		if (ok) {
			cajaCodigo = `CAJA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
			cajaOrigenId = 0;
			await financialStore.syncFromBackend();
		}
	}

	async function handleSolicitarVale(e: Event) {
		e.preventDefault();
		if (!valeCajaId || !valePersonaId) return;
		const ok = await pettyCashStore.solicitarVale(
			Number(valeCajaId),
			{
				solicitantePersonaId: Number(valePersonaId),
				montoSolicitado: Number(valeMonto),
				concepto: valeConcepto.trim()
			},
			true
		);
		if (ok) {
			valeConcepto = '';
			await financialStore.syncFromBackend();
		}
	}

	async function handleRendirVale(valeId: number, montoSolicitado: number) {
		const monto = rendirMontoMap[valeId] ?? montoSolicitado;
		const comp = (rendirComprobanteMap[valeId] || '').trim();
		if (!comp) {
			workspaceStore.showToast('Ingrese la referencia del comprobante de rendición.', 'warning');
			return;
		}
		const ok = await pettyCashStore.rendirVale(
			valeId,
			{
				montoRendido: Number(monto),
				comprobanteReferencia: comp
			},
			true
		);
		if (ok) {
			await financialStore.syncFromBackend();
		}
	}
</script>

<section class="view-panel space-y-3" id="tab-petty-cash">
	<div
		use:pointerSkew
		class="modular-card-interactive chroma-glass-card space-y-3 rounded-2xl p-4 text-xs text-slate-900 dark:text-white"
	>
		<div
			class="flex flex-wrap items-center justify-between gap-2 border-b border-teal-900/12 pb-2 dark:border-white/10"
		>
			<div>
				<h2 class="text-sm font-bold text-slate-900 dark:text-white">
					2.4 Control de Cajas Chicas y Vales de Custodia
				</h2>
				<p class="text-[11px] text-slate-600 dark:text-neutral-400">
					Apertura mensual, arrastre de saldo, solicitud de vales, aprobación, desembolso, rendición
					y anulación
				</p>
			</div>
			<button
				type="button"
				class="surface-subcard rounded-lg px-2.5 py-1 font-mono text-[10px] font-semibold hover:bg-teal-50 dark:hover:bg-white/10"
				onclick={() => pettyCashStore.syncAll()}
			>
				↻ Actualizar
			</button>
		</div>

		{#if !authStore.isAuthenticated}
			<RbacNoticeBanner variant="unauthenticated" context="Cajas Chicas y Vales" />
		{:else if authStore.esAdmin}
			<RbacNoticeBanner variant="admin-restricted" context="Cajas Chicas y Vales" />
		{:else if authStore.esReceptor}
			<RbacNoticeBanner variant="receptor-readonly" context="Cajas Chicas y Vales" />
		{/if}

		{#if authStore.esReceptor || authStore.esAdmin}
			<div class="flex flex-wrap items-center justify-between gap-2">
				<span class="font-mono text-[10px] font-semibold text-slate-600 dark:text-neutral-400">
					Cajas abiertas y vales para aprobación/desembolso priorizados arriba
				</span>
				<button
					type="button"
					class="surface-subcard rounded-lg px-2.5 py-1 font-mono text-[10px] font-semibold text-teal-800 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-white/10"
					onclick={() => (showCreateForms = !showCreateForms)}
				>
					{formsExpanded
						? 'Ocultar formularios de apertura/vale'
						: 'Mostrar formularios (Rol Generador)'}
				</button>
			</div>
		{/if}

		{#if formsExpanded}
			<!-- Apertura Mensual de Caja Chica (Rol Generador) -->
			<form
				class="surface-subcard grid grid-cols-1 gap-2 rounded-xl p-3 sm:grid-cols-2 lg:grid-cols-3"
				onsubmit={handleAbrirCaja}
			>
				<div class="col-span-full font-bold text-teal-800 dark:text-teal-300">
					Apertura Mensual de Caja Chica con Arrastre de Saldo (Rol: Generador)
				</div>
				<input
					type="text"
					placeholder="Código (ej. CAJA-2026-11)"
					class="surface-input rounded px-2 py-1 font-mono"
					bind:value={cajaCodigo}
					required
				/>
				<input
					type="text"
					placeholder="Nombre de la Caja Chica"
					class="surface-input rounded px-2 py-1"
					bind:value={cajaNombre}
					required
				/>
				<div>
					<label
						for="cc-proy"
						class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
					>
						Proyecto
					</label>
					<select
						id="cc-proy"
						class="surface-input w-full rounded px-2 py-1"
						bind:value={cajaProyectoId}
					>
						{#each catalogStore.proyectos as p (p.id)}
							<option value={p.id}>{p.codigo} - {p.nombre}</option>
						{/each}
					</select>
				</div>
				<div>
					<label
						for="cc-origen"
						class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
					>
						Arrastrar Saldo de Caja Cerrada Anterior (opcional)
					</label>
					<select
						id="cc-origen"
						class="surface-input w-full rounded px-2 py-1"
						bind:value={cajaOrigenId}
					>
						<option value={0}>Sin arrastre ($0.00 inicial)</option>
						{#each cajasCerradasMismoProyecto as c (c.id)}
							<option value={c.id}>{c.codigo} (Saldo: ${Number(c.saldoActual).toFixed(2)})</option>
						{/each}
					</select>
				</div>
				<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
					<div>
						<label
							for="cc-anio"
							class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
						>
							Año
						</label>
						<input
							id="cc-anio"
							type="number"
							class="surface-input w-full rounded px-2 py-1 font-mono"
							bind:value={cajaAnio}
						/>
					</div>
					<div>
						<label
							for="cc-mes"
							class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
						>
							Mes (1-12)
						</label>
						<input
							id="cc-mes"
							type="number"
							min="1"
							max="12"
							class="surface-input w-full rounded px-2 py-1 font-mono"
							bind:value={cajaMes}
						/>
					</div>
				</div>
				<div>
					<label
						for="cc-monto"
						class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
					>
						Monto Asignado del Mes (USD)
					</label>
					<input
						id="cc-monto"
						type="number"
						min="0"
						step="0.01"
						class="surface-input w-full rounded px-2 py-1 font-mono"
						bind:value={cajaMontoAsignado}
						required
					/>
				</div>
				<button
					type="submit"
					disabled={!authStore.esGenerador}
					class="col-span-full rounded-lg bg-teal-600 py-1.5 font-bold text-white transition-colors hover:bg-teal-700 disabled:opacity-45 dark:bg-teal-500 dark:text-neutral-950 dark:hover:bg-teal-400"
				>
					+ Abrir Caja Chica Mensual {authStore.esGenerador ? '' : '(Requiere rol Generador)'}
				</button>
			</form>

			<!-- Solicitud de Vale -->
			<form
				class="surface-subcard grid grid-cols-1 gap-2 rounded-xl p-3 sm:grid-cols-2"
				onsubmit={handleSolicitarVale}
			>
				<div class="col-span-full font-bold text-amber-800 dark:text-amber-300">
					Solicitar Nuevo Vale de Caja Chica
				</div>
				<div>
					<label
						for="v-caja"
						class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
					>
						Caja Chica Abierta
					</label>
					<select
						id="v-caja"
						class="surface-input w-full rounded px-2 py-1"
						bind:value={valeCajaId}
					>
						{#each pettyCashStore.cajasChicas.filter((c) => c.estado === EstadoCajaChica.ABIERTA) as c (c.id)}
							<option value={c.id}>{c.codigo} — Saldo: ${Number(c.saldoActual).toFixed(2)}</option>
						{/each}
					</select>
				</div>
				<div>
					<label
						for="v-per"
						class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
					>
						Solicitante (Persona)
					</label>
					<select
						id="v-per"
						class="surface-input w-full rounded px-2 py-1"
						bind:value={valePersonaId}
					>
						{#each catalogStore.personas as per (per.id)}
							<option value={per.id}>{per.nombres} {per.apellidos}</option>
						{/each}
					</select>
				</div>
				<div>
					<label
						for="v-monto"
						class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
					>
						Monto Solicitado (USD)
					</label>
					<input
						id="v-monto"
						type="number"
						min="0.01"
						step="0.01"
						class="surface-input w-full rounded px-2 py-1 font-mono"
						bind:value={valeMonto}
						required
					/>
				</div>
				<div>
					<label
						for="v-conc"
						class="block text-[10px] font-medium text-slate-600 dark:text-neutral-400"
					>
						Concepto del Gasto
					</label>
					<input
						id="v-conc"
						type="text"
						placeholder="Ej. Compra reactivos laboratorio"
						class="surface-input w-full rounded px-2 py-1"
						bind:value={valeConcepto}
						required
					/>
				</div>
				<button
					type="submit"
					disabled={!authStore.esGenerador}
					class="col-span-full rounded-lg bg-amber-500 py-1.5 font-bold text-neutral-950 transition-colors hover:bg-amber-400 disabled:opacity-45"
				>
					+ Solicitar Vale de Caja {authStore.esGenerador ? '' : '(Requiere rol Generador)'}
				</button>
			</form>
		{/if}

		<!-- Filtro de Cajas -->
		<div class="flex flex-wrap items-center justify-between gap-2 pt-1">
			<span class="text-[11px] font-bold text-slate-800 dark:text-neutral-200">
				Cajas Chicas y Vales ({cajasFiltradas.length})
			</span>
			<select
				aria-label="Filtrar cajas chicas por proyecto"
				class="surface-input rounded-lg px-2 py-1 text-[10px]"
				bind:value={filtroProyectoId}
			>
				<option value={0}>Todos los proyectos</option>
				{#each catalogStore.proyectos as p (p.id)}
					<option value={p.id}>{p.codigo} - {p.nombre}</option>
				{/each}
			</select>
		</div>

		<!-- Listado de Cajas Chicas y sus Vales -->
		<div class="space-y-2.5">
			{#each cajasFiltradas as caja (caja.id)}
				<div class="surface-subcard space-y-2 rounded-xl p-3">
					<div
						class="flex flex-wrap items-center justify-between gap-2 border-b border-teal-900/12 pb-2 dark:border-white/10"
					>
						<div>
							<p class="font-bold text-teal-800 dark:text-teal-300">
								{caja.codigo} — {caja.nombre} ({caja.anio}/{String(caja.mes).padStart(2, '0')})
							</p>
							<p class="font-mono text-[10px] text-slate-600 dark:text-neutral-400">
								Proyecto: {caja.proyecto?.codigo ?? `#${caja.proyectoId}`} | Inicial (Arrastre): ${Number(
									caja.saldoInicial
								).toFixed(2)} | Asignado: ${Number(caja.montoAsignado).toFixed(2)} | Gastado: ${Number(
									caja.totalGastado ??
										Math.max(
											0,
											Number(caja.saldoInicial) +
												Number(caja.montoAsignado) -
												Number(caja.saldoActual)
										)
								).toFixed(2)}
							</p>
						</div>
						<div class="flex items-center gap-2">
							<div class="text-right">
								<span class="block font-mono text-sm font-bold text-slate-900 dark:text-white">
									Saldo: ${Number(caja.saldoActual).toFixed(2)} USD
								</span>
								<span
									class="font-mono text-[10px] font-semibold text-slate-600 uppercase dark:text-neutral-400"
								>
									Estado: {caja.estado}
								</span>
							</div>
							{#if caja.estado === EstadoCajaChica.ABIERTA && (authStore.esGenerador || authStore.esReceptor)}
								<button
									type="button"
									class="rounded border border-amber-600/35 bg-amber-500/15 px-2 py-1 font-mono text-[10px] font-semibold text-amber-900 hover:bg-amber-500/25 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-200"
									onclick={() => pettyCashStore.cerrarCaja(caja.id)}
								>
									Cerrar Mes
								</button>
							{/if}
						</div>
					</div>

					<!-- Vales asociados -->
					<div class="space-y-1.5">
						{#each caja.vales || [] as vale (vale.id)}
							<div
								class="space-y-1.5 rounded-lg border border-teal-900/12 bg-slate-50/90 p-2 dark:border-white/10 dark:bg-neutral-900/80"
							>
								<div class="flex flex-wrap items-center justify-between gap-1">
									<div>
										<span class="font-mono font-bold text-amber-800 dark:text-amber-300">
											{vale.numeroVale ?? `#VALE-${vale.id}`}
										</span>
										<span class="ml-1 font-semibold text-slate-900 dark:text-white">
											{vale.concepto}
										</span>
										<p class="font-mono text-[10px] text-slate-600 dark:text-neutral-400">
											Solicitante: {vale.solicitantePersona
												? `${vale.solicitantePersona.nombres} ${vale.solicitantePersona.apellidos}`
												: `#${vale.solicitantePersonaId}`}
											{#if vale.comprobanteReferencia}
												| Comprobante: {vale.comprobanteReferencia} (Rendido: ${Number(
													vale.montoRendido ?? 0
												).toFixed(2)})
											{/if}
										</p>
									</div>
									<div class="text-right font-mono">
										<span class="font-bold text-slate-900 dark:text-white">
											${Number(vale.montoSolicitado).toFixed(2)} USD
										</span>
										<span
											class="ml-1 rounded border border-slate-300/80 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-800 uppercase dark:border-transparent dark:bg-white/10 dark:text-neutral-200"
										>
											{vale.estado}
										</span>
									</div>
								</div>

								{#if authStore.esReceptor}
									<div class="flex flex-wrap items-center gap-1.5 pt-1">
										{#if vale.estado === EstadoValeCaja.SOLICITADO}
											<button
												type="button"
												class="rounded bg-emerald-600 px-2 py-0.5 font-bold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-neutral-950"
												onclick={() => pettyCashStore.aprobarVale(vale.id)}
											>
												✓ Aprobar
											</button>
											<input
												type="text"
												placeholder="Motivo rechazo..."
												class="surface-input rounded px-1.5 py-0.5 text-[10px]"
												bind:value={motivoValeMap[vale.id]}
											/>
											<button
												type="button"
												class="rounded bg-rose-600 px-2 py-0.5 font-bold text-white hover:bg-rose-700"
												onclick={() =>
													pettyCashStore.rechazarVale(
														vale.id,
														motivoValeMap[vale.id] || 'Rechazado por receptor'
													)}
											>
												✕ Rechazar
											</button>
										{/if}

										{#if vale.estado === EstadoValeCaja.APROBADO}
											<button
												type="button"
												class="rounded bg-teal-600 px-2 py-0.5 font-bold text-white hover:bg-teal-700 dark:bg-teal-400 dark:text-neutral-950"
												onclick={() => pettyCashStore.desembolsarVale(vale.id)}
											>
												💵 Desembolsar Fondos
											</button>
										{/if}

										{#if vale.estado === EstadoValeCaja.DESEMBOLSADO}
											<input
												type="number"
												step="0.01"
												min="0"
												max={Number(vale.montoSolicitado)}
												placeholder="Monto rendido"
												class="surface-input w-24 rounded px-1.5 py-0.5 font-mono text-[10px]"
												bind:value={rendirMontoMap[vale.id]}
											/>
											<input
												type="text"
												placeholder="Ref. Factura/Comprobante"
												class="surface-input rounded px-1.5 py-0.5 font-mono text-[10px]"
												bind:value={rendirComprobanteMap[vale.id]}
											/>
											<button
												type="button"
												class="rounded bg-emerald-600 px-2 py-0.5 font-bold text-white hover:bg-emerald-700 dark:bg-emerald-400 dark:text-neutral-950"
												onclick={() => handleRendirVale(vale.id, Number(vale.montoSolicitado))}
											>
												🧾 Rendir Vale
											</button>
										{/if}

										{#if vale.estado !== EstadoValeCaja.ANULADO && vale.estado !== EstadoValeCaja.RECHAZADO}
											<input
												type="text"
												placeholder="Motivo anulación..."
												class="surface-input rounded px-1.5 py-0.5 text-[10px]"
												bind:value={motivoValeMap[vale.id]}
											/>
											<button
												type="button"
												class="rounded border border-rose-600/35 bg-rose-500/12 px-2 py-0.5 text-[10px] font-semibold text-rose-800 hover:bg-rose-500/20 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-300"
												onclick={() =>
													pettyCashStore.anularVale(
														vale.id,
														motivoValeMap[vale.id] || 'Anulación administrativa justificada'
													)}
											>
												Anular Vale
											</button>
										{/if}
									</div>
								{/if}
							</div>
						{:else}
							<p class="text-[10px] text-slate-500 dark:text-neutral-500">
								Sin vales registrados en esta caja.
							</p>
						{/each}
					</div>
				</div>
			{:else}
				<p class="text-slate-600 dark:text-neutral-400">Sin cajas chicas registradas.</p>
			{/each}
		</div>
	</div>
</section>

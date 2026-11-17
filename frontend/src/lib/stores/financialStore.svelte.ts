import { StorageService } from '../services/storageService';
import { ApiClient } from '../services/apiClient';
import { workspaceStore } from './workspaceStore.svelte';
import { authStore } from './authStore.svelte';
import { catalogStore } from './catalogStore.svelte';
import { pettyCashStore } from './pettyCashStore.svelte';
import type {
	Proyecto,
	KPIsFinancieros,
	AsientoMayor,
	AsignacionTramite,
	DeudaFifoItem,
	AuditDiffItem,
	DeudaBackendDTO,
	SolicitudPagoDTO,
	PagoBackendDTO,
	ResumenReporteDTO,
	GenerarCausacionLoteDTO,
	CrearSolicitudPagoDTO,
	ProcesarPagoDTO
} from '../types/financial';
import { EstadoDeuda, EstadoPago, MetodoPago } from '@app/shared';

const EMPTY_KPIS: KPIsFinancieros = {
	totalCausado: 0,
	porcentajeCausadoVsPrev: 0,
	totalPagado: 0,
	porcentajeCubierto: 0,
	saldoExigible: 0,
	pasivosFifoCount: 0,
	cajaChicaSaldo: 0,
	valesCustodiaCount: 0
};

class FinancialStore {
	proyectos = $state<Proyecto[]>([]);
	kpis = $state<KPIsFinancieros>({ ...EMPTY_KPIS });
	asientos = $state<AsientoMayor[]>([]);
	asignaciones = $state<AsignacionTramite[]>([]);
	deudasFifo = $state<DeudaFifoItem[]>([]);
	auditDiffs = $state<AuditDiffItem[]>([]);
	isOffline = $state<boolean>(false);
	isSyncing = $state<boolean>(false);
	lastSyncTimestamp = $state<string>('');

	// Colecciones crudas del backend para vistas operativas completas
	deudasRaw = $state<DeudaBackendDTO[]>([]);
	solicitudesPago = $state<SolicitudPagoDTO[]>([]);
	pagosRaw = $state<PagoBackendDTO[]>([]);
	resumenReporte = $state<ResumenReporteDTO | null>(null);

	// Modal states
	voidModalOpen = $state<boolean>(false);
	selectedAsiento = $state<{ id: string; monto: number; pagoId?: number } | null>(null);

	fifoModalOpen = $state<boolean>(false);
	selectedDeudaForPayment = $state<DeudaFifoItem | null>(null);

	constructor() {
		this.init();
		authStore.onSessionSync(() => {
			void this.syncFromBackend();
		});
		authStore.onSessionClear(() => {
			this.resetState();
		});
	}

	private resetState() {
		this.proyectos = [];
		this.kpis = { ...EMPTY_KPIS };
		this.asientos = [];
		this.asignaciones = [];
		this.deudasFifo = [];
		this.auditDiffs = [];
		this.deudasRaw = [];
		this.solicitudesPago = [];
		this.pagosRaw = [];
		this.resumenReporte = null;
		this.isOffline = false;
		this.voidModalOpen = false;
		this.selectedAsiento = null;
		this.fifoModalOpen = false;
		this.selectedDeudaForPayment = null;
	}

	private init() {
		if (!ApiClient.getToken()) {
			this.resetState();
			return;
		}
		this.proyectos = StorageService.loadSnapshot('fin_proyectos', []);
		this.kpis = StorageService.loadSnapshot('fin_kpis', { ...EMPTY_KPIS });
		this.asientos = StorageService.loadSnapshot('fin_asientos', []);
		this.asignaciones = StorageService.loadSnapshot('fin_asignaciones', []);
		this.deudasFifo = StorageService.loadSnapshot('fin_deudas_fifo', []);
		this.auditDiffs = StorageService.loadSnapshot('fin_audit_diffs', []);
		this.deudasRaw = StorageService.loadSnapshot('fin_deudas_raw', []);
		this.solicitudesPago = StorageService.loadSnapshot('fin_solicitudes_pago', []);
		this.pagosRaw = StorageService.loadSnapshot('fin_pagos_raw', []);
		this.resumenReporte = StorageService.loadSnapshot('fin_resumen_reporte', null);
		this.lastSyncTimestamp = StorageService.loadSnapshot(
			'fin_last_sync',
			new Date().toLocaleTimeString('es-ES')
		);
	}

	/**
	 * Sincroniza el estado financiero completo con el backend (/api/v1/*)
	 */
	async syncFromBackend(): Promise<void> {
		if (!ApiClient.getToken() || this.isSyncing) return;
		this.isSyncing = true;

		try {
			const puedeLeerDetalle = authStore.esGenerador || authStore.esReceptor;

			const [resumenRes, causacionesRes, solicitudesRes, pagosRes] = await Promise.all([
				ApiClient.obtenerResumenReporte(),
				puedeLeerDetalle ? ApiClient.listarCausaciones() : Promise.resolve(null),
				puedeLeerDetalle ? ApiClient.listarSolicitudesPago() : Promise.resolve(null),
				puedeLeerDetalle ? ApiClient.listarPagos() : Promise.resolve(null)
			]);

			if (
				resumenRes.isOffline ||
				causacionesRes?.isOffline ||
				solicitudesRes?.isOffline ||
				pagosRes?.isOffline
			) {
				this.isOffline = true;
				return;
			}

			this.isOffline = false;
			await Promise.all([
				catalogStore.syncAll(),
				puedeLeerDetalle ? pettyCashStore.syncAll() : Promise.resolve()
			]);

			if (!puedeLeerDetalle) {
				this.deudasRaw = [];
				this.solicitudesPago = [];
				this.pagosRaw = [];
				this.asignaciones = [];
				this.deudasFifo = [];
				this.asientos = [];
				pettyCashStore.cajasChicas = [];
			}

			if (resumenRes.data) {
				this.resumenReporte = resumenRes.data;
				this.kpis = {
					totalCausado: Number(resumenRes.data.kpis.totalCausado ?? 0),
					porcentajeCausadoVsPrev: 0,
					totalPagado: Number(resumenRes.data.kpis.totalPagado ?? 0),
					porcentajeCubierto: Number(resumenRes.data.kpis.porcentajeCubierto ?? 0),
					saldoExigible: Number(resumenRes.data.kpis.saldoExigible ?? 0),
					pasivosFifoCount: Number(resumenRes.data.kpis.pasivosFifoCount ?? 0),
					cajaChicaSaldo: Number(resumenRes.data.kpis.cajaChicaSaldo ?? 0),
					valesCustodiaCount: Number(resumenRes.data.kpis.valesCustodiaCount ?? 0)
				};

				if (catalogStore.proyectos.length > 0) {
					this.proyectos = catalogStore.proyectos.map((p) => {
						const desglose = resumenRes.data?.porProyecto.find((rp) => rp.proyectoId === p.id);
						const causado = desglose?.totalCausado ?? 0;
						const pagado = desglose?.totalPagado ?? 0;
						const ejecucion = causado > 0 ? Number(((pagado / causado) * 100).toFixed(1)) : 0;
						return {
							id: p.id,
							codigo: p.codigo,
							nombre: p.nombre,
							descripcion: p.descripcion ?? undefined,
							area: p.area,
							ambito: p.ambito,
							fechaInicio: p.fechaInicio,
							fechaFin: p.fechaFin,
							presupuestoUsd: causado,
							porcentajeEjecucion: ejecucion,
							estaActivo: p.estaActivo
						};
					});
				}
			}

			if (causacionesRes?.data?.data) {
				this.deudasRaw = causacionesRes.data.data;

				const activas = this.deudasRaw.filter((d) => d.estado !== EstadoDeuda.ANULADA);
				this.asignaciones = activas.map((d) => {
					const nombres = d.persona
						? `${d.persona.nombres} ${d.persona.apellidos}`
						: `Persona #${d.personaId}`;
					const iniciales = d.persona
						? `${d.persona.nombres.charAt(0)}${d.persona.apellidos.charAt(0)}`.toUpperCase()
						: 'BN';
					const area = d.proyecto?.area ? d.proyecto.area.toUpperCase() : 'FISICA';
					const diasActivos = Number(d.diasActivos ?? 15);
					const diasPeriodo = Number(d.diasPeriodo ?? 15);
					const montoOrig = Number(d.montoOriginal ?? 0);
					const baseUsd = d.asignacion ? Number(d.asignacion.montoPeriodo) : montoOrig;

					return {
						id: d.id,
						deudaId: d.id,
						beneficiarioId: d.personaId,
						beneficiarioNombre: nombres,
						beneficiarioIniciales: iniciales,
						area,
						diasActivos,
						diasPeriodo,
						baseContractualUsd: baseUsd,
						montoCausadoUsd: montoOrig,
						estado:
							d.estado === EstadoDeuda.LIQUIDADA
								? 'liquidado'
								: d.estado === EstadoDeuda.ABONADO
									? 'abonado'
									: 'pendiente'
					};
				});

				this.deudasFifo = activas.map((d) => {
					const montoOrig = Number(d.montoOriginal ?? 0);
					const saldoPend = Number(d.saldoPendiente ?? 0);
					const amortizado = Number(Math.max(0, montoOrig - saldoPend).toFixed(2));
					const pct = montoOrig > 0 ? Number(((amortizado / montoOrig) * 100).toFixed(0)) : 0;
					const personaNombre = d.persona
						? `${d.persona.nombres} ${d.persona.apellidos}`
						: `Persona #${d.personaId}`;
					const proyCod = d.proyecto?.codigo ?? `PROY-${d.proyectoId}`;

					return {
						id: d.id,
						proyectoId: d.proyectoId,
						personaId: d.personaId,
						solicitudId: d.solicitudId ?? null,
						beneficiarioNombre: personaNombre,
						proyectoCodigo: proyCod,
						fechaVencimiento: String(d.fechaVencimiento).substring(0, 10),
						descripcion: `${proyCod} · ${personaNombre} (Vence: ${String(d.fechaVencimiento).substring(0, 10)})`,
						montoOriginal: montoOrig,
						saldoPendiente: saldoPend,
						montoAmortizado: amortizado,
						porcentajeAmortizado: pct,
						estado:
							d.estado === EstadoDeuda.LIQUIDADA
								? 'liquidada'
								: d.estado === EstadoDeuda.ABONADO
									? 'abonado'
									: 'pendiente'
					};
				});
			}

			if (solicitudesRes?.data?.data) {
				this.solicitudesPago = solicitudesRes.data.data;
			}

			if (pagosRes?.data?.data) {
				this.pagosRaw = pagosRes.data.data;
				this.asientos = this.pagosRaw.map((p) => {
					const personaNombre = p.persona
						? `${p.persona.nombres} ${p.persona.apellidos}`
						: `Beneficiario #${p.personaId}`;
					const proyCod = p.solicitudPago?.codigo ?? `SOL-${p.solicitudId ?? 'DIRECTO'}`;
					return {
						id: `#PAGO-${p.id}`,
						pagoId: p.id,
						timestamp: String(p.fechaPago).substring(0, 10),
						concepto: `Pago ${p.metodoPago.toUpperCase()} ${p.numeroReferencia ? `(${p.numeroReferencia})` : ''}`,
						beneficiarioNombre: personaNombre,
						proyectoCodigo: proyCod,
						montoUsd: Number(p.montoTotal),
						estado: p.estado === EstadoPago.ANULADO ? 'anulado' : 'asentado',
						motivoReverso: p.motivoAnulacion ?? undefined
					};
				});
			}

			if (authStore.esAdmin) {
				const auditRes = await ApiClient.listarAuditLogs({ limite: 100 });
				if (auditRes.data?.data) {
					this.auditDiffs = auditRes.data.data.map((log) => ({
						id: log.id,
						accion: log.accion,
						tablaAfectada: log.tablaAfectada,
						registroId: log.registroId,
						usuarioId:
							log.usuario?.username ?? (log.usuarioId ? `usr_${log.usuarioId}` : 'sistema'),
						usuarioRol: log.usuario?.rol ?? (log.usuarioId ? 'desconocido' : 'sistema'),
						timestamp: String(log.creadoEn).replace('T', ' ').substring(0, 19),
						ipOrigen: log.direccionIp ?? null,
						datosAnteriores: log.datosAnteriores,
						datosNuevos: log.datosNuevos ?? {}
					}));
				}
			} else {
				this.auditDiffs = [];
			}

			this.persist();
		} finally {
			this.isSyncing = false;
		}
	}

	calcularProrrateo(diasActivos: number, diasPeriodo: number, baseUsd: number): number {
		if (diasPeriodo <= 0 || diasActivos <= 0 || baseUsd <= 0) return 0;
		const ratio = Math.min(diasActivos, diasPeriodo) / diasPeriodo;
		return Number((ratio * baseUsd).toFixed(2));
	}

	async simularProrrateoBackend(montoPeriodo: number, diasActivos: number, diasPeriodo: number) {
		const res = await ApiClient.simularCausacion({ montoPeriodo, diasActivos, diasPeriodo });
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error en simulación de prorrateo', 'warning');
			return null;
		}
		return res.data;
	}

	async generarLoteCausacion(dto: GenerarCausacionLoteDTO): Promise<boolean> {
		const res = await ApiClient.generarLoteCausacion(dto);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'No se pudo generar el lote de causación', 'warning');
			return false;
		}
		const montoLote = Number(res.data.montoTotalLote ?? 0);
		workspaceStore.showToast(
			`${res.data.mensaje} (${res.data.cantidadCausaciones ?? 0} causaciones · $${montoLote.toFixed(2)} USD)`,
			'post_add'
		);
		await this.syncFromBackend();
		return true;
	}

	async anularCausacion(deudaId: number, motivoAnulacion: string): Promise<boolean> {
		const res = await ApiClient.anularCausacion(deudaId, motivoAnulacion);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'No se pudo anular la causación', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Causación anulada exitosamente', 'gavel');
		await this.syncFromBackend();
		return true;
	}

	async crearSolicitudPago(dto: CrearSolicitudPagoDTO): Promise<boolean> {
		const res = await ApiClient.crearSolicitudPago(dto);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al crear solicitud de pago', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Solicitud de pago creada', 'check_circle');
		await this.syncFromBackend();
		return true;
	}

	async enviarSolicitudPago(id: number): Promise<boolean> {
		const res = await ApiClient.enviarSolicitudPago(id);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al enviar solicitud', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Solicitud enviada a revisión', 'send');
		await this.syncFromBackend();
		return true;
	}

	async aprobarSolicitudPago(id: number): Promise<boolean> {
		const res = await ApiClient.aprobarSolicitudPago(id);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al aprobar solicitud', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Solicitud aprobada para entrega', 'verified');
		await this.syncFromBackend();
		return true;
	}

	async rechazarSolicitudPago(id: number, motivoRechazo: string): Promise<boolean> {
		const res = await ApiClient.rechazarSolicitudPago(id, motivoRechazo);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al rechazar solicitud', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Solicitud rechazada', 'block');
		await this.syncFromBackend();
		return true;
	}

	async cerrarSolicitudPago(id: number): Promise<boolean> {
		const res = await ApiClient.cerrarSolicitudPago(id);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al cerrar solicitud', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Solicitud cerrada', 'lock');
		await this.syncFromBackend();
		return true;
	}

	/**
	 * Anulación justificada de pago: exclusivamente server-side (sin mutaciones ficticias offline).
	 */
	async anularAsiento(asientoId: string, motivo: string): Promise<boolean> {
		if (!ApiClient.getToken() || !authStore.isAuthenticated) {
			workspaceStore.showToast('Debe iniciar sesión para anular un pago.', 'lock');
			return false;
		}

		const target = this.asientos.find((a) => a.id === asientoId);
		const pagoId =
			target?.pagoId ??
			(asientoId.startsWith('#PAGO-') ? Number(asientoId.replace('#PAGO-', '')) : null);

		if (!pagoId) {
			workspaceStore.showToast(
				'El registro seleccionado no corresponde a un pago persistido en servidor.',
				'warning'
			);
			return false;
		}

		const res = await ApiClient.anularPago(pagoId, motivo);
		if (res.isOffline) {
			this.isOffline = true;
			workspaceStore.showToast(
				'Operación bloqueada: anular un pago requiere conexión activa con el servidor.',
				'cloud_off'
			);
			return false;
		}

		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al anular el pago', 'warning');
			return false;
		}

		const totalRevertido =
			res.data.deudasRestituidas && res.data.deudasRestituidas.length > 0
				? res.data.deudasRestituidas.reduce((acc, d) => acc + Number(d.montoRevertido ?? 0), 0)
				: Number(res.data.data?.montoTotal ?? 0);
		workspaceStore.showToast(
			`${res.data.mensaje} ($${totalRevertido.toFixed(2)} USD revertidos)`,
			'done_all'
		);
		await this.syncFromBackend();
		return true;
	}

	/**
	 * Ejecución de pago FIFO: exclusivamente server-side (sin mutaciones ficticias offline).
	 */
	async procesarPagoFifo(dto: ProcesarPagoDTO): Promise<boolean> {
		if (!ApiClient.getToken() || !authStore.isAuthenticated) {
			workspaceStore.showToast('Debe iniciar sesión como Receptor para procesar pagos.', 'lock');
			return false;
		}

		const res = await ApiClient.procesarPago(dto);
		if (res.isOffline) {
			this.isOffline = true;
			workspaceStore.showToast(
				'Operación bloqueada: registrar pagos FIFO requiere conexión activa con el servidor.',
				'cloud_off'
			);
			return false;
		}

		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al procesar pago FIFO', 'warning');
			return false;
		}

		workspaceStore.showToast(
			`Pago #${res.data.pagoId} registrado: $${res.data.montoAplicado.toFixed(2)} USD (${res.data.deudasAmortizadas} deudas amortizadas)`,
			'verified'
		);
		await this.syncFromBackend();
		return true;
	}

	async descargarReciboPagoPdf(pagoId: number) {
		const res = await ApiClient.descargarReciboPagoPdf(pagoId);
		if (!res.ok) {
			workspaceStore.showToast(res.error || 'Error al descargar recibo PDF', 'warning');
			return;
		}
		workspaceStore.showToast(`Recibo de pago #${pagoId} descargado en PDF`, 'picture_as_pdf');
	}

	async descargarSolicitudConsolidadaPdf(solicitudId: number, codigo?: string) {
		const res = await ApiClient.descargarSolicitudConsolidadaPdf(solicitudId, codigo);
		if (!res.ok) {
			workspaceStore.showToast(res.error || 'Error al descargar solicitud PDF', 'warning');
			return;
		}
		workspaceStore.showToast(
			`Solicitud consolidada ${codigo || `#${solicitudId}`} descargada en PDF`,
			'picture_as_pdf'
		);
	}

	openVoidModal(id: string, monto: number, pagoId?: number) {
		this.selectedAsiento = { id, monto, pagoId };
		this.voidModalOpen = true;
	}

	closeVoidModal() {
		this.voidModalOpen = false;
		this.selectedAsiento = null;
	}

	openFifoPaymentModal(deuda: DeudaFifoItem) {
		this.selectedDeudaForPayment = deuda;
		this.fifoModalOpen = true;
	}

	closeFifoPaymentModal() {
		this.fifoModalOpen = false;
		this.selectedDeudaForPayment = null;
	}

	persist() {
		StorageService.saveSnapshot('fin_proyectos', this.proyectos);
		StorageService.saveSnapshot('fin_kpis', this.kpis);
		StorageService.saveSnapshot('fin_asientos', this.asientos);
		StorageService.saveSnapshot('fin_asignaciones', this.asignaciones);
		StorageService.saveSnapshot('fin_deudas_fifo', this.deudasFifo);
		StorageService.saveSnapshot('fin_audit_diffs', this.auditDiffs);
		StorageService.saveSnapshot('fin_deudas_raw', this.deudasRaw);
		StorageService.saveSnapshot('fin_solicitudes_pago', this.solicitudesPago);
		StorageService.saveSnapshot('fin_pagos_raw', this.pagosRaw);
		StorageService.saveSnapshot('fin_resumen_reporte', this.resumenReporte);
		StorageService.saveSnapshot('fin_last_sync', new Date().toLocaleTimeString('es-ES'));
		this.lastSyncTimestamp = new Date().toLocaleTimeString('es-ES');
	}
}

export const financialStore = new FinancialStore();
export { MetodoPago };

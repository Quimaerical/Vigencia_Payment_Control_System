import { StorageService } from '../services/storageService';
import { ApiClient } from '../services/apiClient';
import { workspaceStore } from './workspaceStore.svelte';
import { authStore } from './authStore.svelte';
import { catalogStore } from './catalogStore.svelte';
import { pettyCashStore } from './pettyCashStore.svelte';
import {
	MOCK_PROYECTOS,
	MOCK_KPIS,
	MOCK_ASIENTOS_MAYOR,
	MOCK_ASIGNACIONES,
	MOCK_DEUDAS_FIFO,
	MOCK_AUDIT_DIFFS
} from '../services/mockData';
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
import { EstadoDeuda, EstadoPago, MetodoPago, RolUsuario } from '@app/shared';

class FinancialStore {
	proyectos = $state<Proyecto[]>([]);
	kpis = $state<KPIsFinancieros>(MOCK_KPIS);
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
	}

	private init() {
		this.proyectos = StorageService.loadSnapshot('fin_proyectos', MOCK_PROYECTOS);
		this.kpis = StorageService.loadSnapshot('fin_kpis', MOCK_KPIS);
		this.asientos = StorageService.loadSnapshot('fin_asientos', MOCK_ASIENTOS_MAYOR);
		this.asignaciones = StorageService.loadSnapshot('fin_asignaciones', MOCK_ASIGNACIONES);
		this.deudasFifo = StorageService.loadSnapshot('fin_deudas_fifo', MOCK_DEUDAS_FIFO);
		this.auditDiffs = StorageService.loadSnapshot('fin_audit_diffs', MOCK_AUDIT_DIFFS);
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
		if (!ApiClient.getToken()) return;
		this.isSyncing = true;

		const [resumenRes, causacionesRes, solicitudesRes, pagosRes] = await Promise.all([
			ApiClient.obtenerResumenReporte(),
			ApiClient.listarCausaciones(),
			ApiClient.listarSolicitudesPago(),
			ApiClient.listarPagos(),
			catalogStore.syncAll(),
			pettyCashStore.syncAll()
		]);

		if (resumenRes.isOffline || causacionesRes.isOffline) {
			this.isOffline = true;
			this.isSyncing = false;
			return;
		}

		this.isOffline = false;

		if (resumenRes.data) {
			this.resumenReporte = resumenRes.data;
			this.kpis = {
				totalCausado: Number(resumenRes.data.kpis.totalCausado ?? 0),
				porcentajeCausadoVsPrev: this.kpis.porcentajeCausadoVsPrev || 100,
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
						presupuestoUsd: causado > 0 ? causado : 1000,
						porcentajeEjecucion: ejecucion,
						estaActivo: p.estaActivo
					};
				});
			}
		}

		if (causacionesRes.data?.data) {
			this.deudasRaw = causacionesRes.data.data;

			// Mapear a AsignacionTramite y DeudaFifoItem para las vistas existentes
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

		if (solicitudesRes.data?.data) {
			this.solicitudesPago = solicitudesRes.data.data;
		}

		if (pagosRes.data?.data) {
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
					hashSha256: `sha256_pago_${p.id}_${p.metodoPago}`,
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
					usuarioId: log.usuario?.username ?? (log.usuarioId ? `usr_${log.usuarioId}` : 'sistema'),
					usuarioRol: log.usuario?.rol ?? RolUsuario.ADMINISTRADOR,
					timestamp: String(log.creadoEn).replace('T', ' ').substring(0, 19),
					hashSha256: `audit_${log.id}_${log.tablaAfectada}_${log.registroId}`,
					datosAnteriores: log.datosAnteriores,
					datosNuevos: log.datosNuevos ?? {}
				}));
			}
		}

		this.persist();
		this.isSyncing = false;
	}

	// Calculadora de prorrateo local e integración con simulador backend
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
		workspaceStore.showToast(
			`${res.data.mensaje} (${res.data.cantidadCausaciones} causaciones · $${res.data.totalCausadoLote.toFixed(2)} USD)`,
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

	// Ciclo de Solicitudes de Pago
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

	// Anulación justificada de asiento/pago del Libro Mayor
	async anularAsiento(asientoId: string, motivo: string): Promise<boolean> {
		const target = this.asientos.find((a) => a.id === asientoId);
		const pagoId =
			target?.pagoId ??
			(asientoId.startsWith('#PAGO-') ? Number(asientoId.replace('#PAGO-', '')) : null);

		if (pagoId && ApiClient.getToken()) {
			const res = await ApiClient.anularPago(pagoId, motivo);
			if (!res.isOffline) {
				if (!res.data) {
					workspaceStore.showToast(res.error || 'Error al anular el pago', 'warning');
					return false;
				}
				workspaceStore.showToast(
					`${res.data.mensaje} ($${res.data.montoRevertido.toFixed(2)} USD revertidos)`,
					'done_all'
				);
				await this.syncFromBackend();
				return true;
			}
		}

		// Fallback local si estamos en modo offline sin conexión a BD
		if (!target) return false;
		target.estado = 'anulado';
		target.motivoReverso = motivo;

		const newAudit: AuditDiffItem = {
			id: Date.now(),
			accion: 'ANULAR_ASIENTO_REVERSO',
			tablaAfectada: 'libro_mayor',
			registroId: Math.floor(Math.random() * 1000),
			usuarioId: authStore.usuarioActual?.username ?? 'usr_actual',
			usuarioRol: workspaceStore.currentRole,
			timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
			hashSha256: Math.random().toString(36).substring(2, 15),
			datosAnteriores: {
				asiento_id: target.id,
				estado: 'asentado',
				monto_usd: target.montoUsd
			},
			datosNuevos: {
				asiento_id: target.id,
				estado: 'anulado',
				motivo_reverso: motivo,
				reversado_en: new Date().toISOString()
			}
		};

		this.auditDiffs.unshift(newAudit);
		this.persist();
		workspaceStore.showToast(
			`Asiento ${asientoId} anulado en caché local (Modo Offline)`,
			'done_all'
		);
		return true;
	}

	// Ejecución de pago FIFO conectado al backend con fallback offline
	async procesarPagoFifo(dto: ProcesarPagoDTO, fallbackDeudaId?: number): Promise<boolean> {
		if (ApiClient.getToken()) {
			const res = await ApiClient.procesarPago(dto);
			if (!res.isOffline) {
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
		}

		// Modo Offline
		if (fallbackDeudaId !== undefined) {
			this.registrarAmortizacionLocal(fallbackDeudaId, dto.montoTotal);
			workspaceStore.showToast(
				`Desembolso FIFO aplicado en caché offline: $${dto.montoTotal.toFixed(2)} USD`,
				'verified'
			);
			return true;
		}
		return false;
	}

	// Ejecución de amortización FIFO local (usado en modo offline)
	registrarAmortizacionLocal(deudaId: number, montoAAplicar: number) {
		const targetDeuda = this.deudasFifo.find((d) => d.id === deudaId);
		if (!targetDeuda) return;

		const saldoAnterior = targetDeuda.saldoPendiente;
		const nuevoSaldo = Number(Math.max(0, saldoAnterior - montoAAplicar).toFixed(2));
		targetDeuda.saldoPendiente = nuevoSaldo;
		targetDeuda.montoAmortizado = Number((targetDeuda.montoAmortizado + montoAAplicar).toFixed(2));
		targetDeuda.porcentajeAmortizado = Number(
			((targetDeuda.montoAmortizado / targetDeuda.montoOriginal) * 100).toFixed(0)
		);

		if (nuevoSaldo === 0) {
			targetDeuda.estado = 'liquidada';
		} else {
			targetDeuda.estado = 'abonado';
		}

		// Actualizar KPIs
		this.kpis.totalPagado = Number((this.kpis.totalPagado + montoAAplicar).toFixed(2));
		this.kpis.saldoExigible = Number(
			Math.max(0, this.kpis.saldoExigible - montoAAplicar).toFixed(2)
		);
		this.kpis.porcentajeCubierto =
			this.kpis.totalCausado > 0
				? Number(((this.kpis.totalPagado / this.kpis.totalCausado) * 100).toFixed(1))
				: 0;

		const nuevoAsiento: AsientoMayor = {
			id: `#AST-${Math.floor(1000 + Math.random() * 9000)}`,
			timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
			concepto: `Amortización FIFO Deuda #${targetDeuda.id}`,
			beneficiarioNombre: targetDeuda.beneficiarioNombre || 'Beneficiario Activo',
			proyectoCodigo: targetDeuda.proyectoCodigo || 'PROY-01',
			montoUsd: montoAAplicar,
			estado: 'asentado',
			hashSha256: Math.random().toString(36).substring(2, 15)
		};
		this.asientos.unshift(nuevoAsiento);

		const newAudit: AuditDiffItem = {
			id: Date.now(),
			accion: 'AMORTIZAR_DEUDA_FIFO',
			tablaAfectada: 'deudas',
			registroId: targetDeuda.id,
			usuarioId: authStore.usuarioActual?.username || 'usr_receptor',
			usuarioRol: RolUsuario.RECEPTOR,
			timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
			hashSha256: Math.random().toString(36).substring(2, 15),
			datosAnteriores: {
				deuda_id: targetDeuda.id,
				saldo_pendiente: saldoAnterior
			},
			datosNuevos: {
				deuda_id: targetDeuda.id,
				saldo_pendiente: nuevoSaldo,
				monto_aplicado: montoAAplicar
			}
		};
		this.auditDiffs.unshift(newAudit);

		this.persist();
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

import { StorageService } from '../services/storageService';
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
	AuditDiffItem
} from '../types/financial';
import { RolUsuario } from '@app/shared';

class FinancialStore {
	proyectos = $state<Proyecto[]>([]);
	kpis = $state<KPIsFinancieros>(MOCK_KPIS);
	asientos = $state<AsientoMayor[]>([]);
	asignaciones = $state<AsignacionTramite[]>([]);
	deudasFifo = $state<DeudaFifoItem[]>([]);
	auditDiffs = $state<AuditDiffItem[]>([]);
	isOffline = $state<boolean>(false);
	lastSyncTimestamp = $state<string>('');

	// Modal states
	voidModalOpen = $state<boolean>(false);
	selectedAsiento = $state<{ id: string; monto: number } | null>(null);

	fifoModalOpen = $state<boolean>(false);
	selectedDeudaForPayment = $state<DeudaFifoItem | null>(null);

	constructor() {
		this.init();
	}

	private init() {
		this.proyectos = StorageService.loadSnapshot('fin_proyectos', MOCK_PROYECTOS);
		this.kpis = StorageService.loadSnapshot('fin_kpis', MOCK_KPIS);
		this.asientos = StorageService.loadSnapshot('fin_asientos', MOCK_ASIENTOS_MAYOR);
		this.asignaciones = StorageService.loadSnapshot('fin_asignaciones', MOCK_ASIGNACIONES);
		this.deudasFifo = StorageService.loadSnapshot('fin_deudas_fifo', MOCK_DEUDAS_FIFO);
		this.auditDiffs = StorageService.loadSnapshot('fin_audit_diffs', MOCK_AUDIT_DIFFS);
		this.lastSyncTimestamp = StorageService.loadSnapshot(
			'fin_last_sync',
			new Date().toLocaleTimeString('es-ES')
		);
	}

	// Calculadora de prorrateo
	calcularProrrateo(diasActivos: number, diasPeriodo: number, baseUsd: number): number {
		if (diasPeriodo <= 0 || diasActivos <= 0 || baseUsd <= 0) return 0;
		const ratio = Math.min(diasActivos, diasPeriodo) / diasPeriodo;
		return Number((ratio * baseUsd).toFixed(2));
	}

	// Anulación justificada de asiento del Libro Mayor
	anularAsiento(asientoId: string, motivo: string) {
		const target = this.asientos.find((a) => a.id === asientoId);
		if (!target) return;

		target.estado = 'anulado';
		target.motivoReverso = motivo;

		// Añadir registro de auditoría
		const newAudit: AuditDiffItem = {
			id: Date.now(),
			accion: 'ANULAR_ASIENTO_REVERSO',
			tablaAfectada: 'libro_mayor',
			registroId: Math.floor(Math.random() * 1000),
			usuarioId: 'usr_actual',
			usuarioRol: RolUsuario.RECEPTOR,
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
	}

	// Ejecución de amortización FIFO
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
		}

		// Actualizar KPIs
		this.kpis.totalPagado = Number((this.kpis.totalPagado + montoAAplicar).toFixed(2));
		this.kpis.saldoExigible = Number(Math.max(0, this.kpis.saldoExigible - montoAAplicar).toFixed(2));
		this.kpis.porcentajeCubierto = Number(
			((this.kpis.totalPagado / this.kpis.totalCausado) * 100).toFixed(1)
		);

		// Asiento contable
		const nuevoAsiento: AsientoMayor = {
			id: `#AST-${Math.floor(1000 + Math.random() * 9000)}`,
			timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
			concepto: `Amortización FIFO Deuda #${targetDeuda.id}`,
			beneficiarioNombre: 'Dra. Elena Rostova',
			proyectoCodigo: 'FQ-2025',
			montoUsd: montoAAplicar,
			estado: 'asentado',
			hashSha256: Math.random().toString(36).substring(2, 15)
		};
		this.asientos.unshift(nuevoAsiento);

		// Auditoría
		const newAudit: AuditDiffItem = {
			id: Date.now(),
			accion: 'AMORTIZAR_DEUDA_FIFO',
			tablaAfectada: 'deudas',
			registroId: targetDeuda.id,
			usuarioId: 'usr_receptor',
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

	openVoidModal(id: string, monto: number) {
		this.selectedAsiento = { id, monto };
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
		StorageService.saveSnapshot('fin_last_sync', new Date().toLocaleTimeString('es-ES'));
		this.lastSyncTimestamp = new Date().toLocaleTimeString('es-ES');
	}
}

export const financialStore = new FinancialStore();

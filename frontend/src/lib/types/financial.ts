import type { MetodoPago, RolUsuario } from '@app/shared';

export interface Proyecto {
	id: number;
	codigo: string;
	nombre: string;
	descripcion?: string;
	presupuestoUsd: number;
	porcentajeEjecucion: number;
	estaActivo: boolean;
}

export interface Beneficiario {
	id: number;
	identificacion: string;
	nombres: string;
	apellidos: string;
	correo?: string;
	area: string;
	iniciales: string;
	estaActivo: boolean;
}

export interface KPIsFinancieros {
	totalCausado: number;
	porcentajeCausadoVsPrev: number;
	totalPagado: number;
	porcentajeCubierto: number;
	saldoExigible: number;
	pasivosFifoCount: number;
	cajaChicaSaldo: number;
	valesCustodiaCount: number;
}

export interface AsientoMayor {
	id: string; // e.g. '#AST-8832'
	timestamp: string;
	concepto: string;
	beneficiarioNombre: string;
	proyectoCodigo: string;
	montoUsd: number;
	estado: 'asentado' | 'anulado';
	hashSha256: string;
	motivoReverso?: string;
}

export interface AsignacionTramite {
	id: number;
	beneficiarioId: number;
	beneficiarioNombre: string;
	beneficiarioIniciales: string;
	area: string;
	diasActivos: number;
	diasPeriodo: number;
	baseContractualUsd: number;
	montoCausadoUsd: number;
	estado: 'pendiente' | 'abonado' | 'liquidado';
}

export interface DeudaFifoItem {
	id: number;
	proyectoId: number;
	personaId: number;
	fechaVencimiento: string;
	descripcion: string;
	montoOriginal: number;
	saldoPendiente: number;
	montoAmortizado: number;
	porcentajeAmortizado: number;
	estado: 'pendiente' | 'liquidada';
}

export interface AuditDiffItem {
	id: number;
	accion: string;
	tablaAfectada: string;
	registroId: number;
	usuarioId: string;
	usuarioRol: RolUsuario;
	timestamp: string;
	hashSha256: string;
	datosAnteriores: Record<string, unknown> | null;
	datosNuevos: Record<string, unknown>;
}

export interface ModuloWorkspace {
	id: string;
	nombre: string;
	subtitulo: string;
	icono: string;
	habilitado: boolean;
	orden: number;
}

export interface ProcesarPagoDTO {
	personaId: number;
	proyectoId: number;
	montoTotal: number;
	metodoPago: MetodoPago;
	numeroReferencia?: string;
	fechaPago: string; // YYYY-MM-DD
}

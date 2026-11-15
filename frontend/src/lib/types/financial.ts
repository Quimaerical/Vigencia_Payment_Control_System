import type {
	AmbitoProyecto,
	AreaProyecto,
	EstadoCajaChica,
	EstadoDeuda,
	EstadoPago,
	EstadoSolicitud,
	EstadoValeCaja,
	MetodoPago,
	PeriodicidadGrupoPago,
	RolUsuario
} from '@app/shared';

export interface Proyecto {
	id: number;
	codigo: string;
	nombre: string;
	descripcion?: string;
	area?: AreaProyecto;
	ambito?: AmbitoProyecto;
	fechaInicio?: string | null;
	fechaFin?: string | null;
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
	pagoId?: number;
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
	deudaId?: number;
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
	solicitudId?: number | null;
	beneficiarioNombre?: string;
	proyectoCodigo?: string;
	fechaVencimiento: string;
	descripcion: string;
	montoOriginal: number;
	saldoPendiente: number;
	montoAmortizado: number;
	porcentajeAmortizado: number;
	estado: 'pendiente' | 'abonado' | 'liquidada';
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
	solicitudId?: number | null;
	montoTotal: number;
	metodoPago: MetodoPago;
	numeroReferencia?: string | null;
	fechaPago: string; // YYYY-MM-DD
}

// ============================================================================
// DTOs de Integración con Backend (/api/v1/*)
// ============================================================================

export interface UsuarioDTO {
	id: number;
	username: string;
	rol: RolUsuario;
	estaActivo: boolean;
	creadoEn?: string;
}

export interface LoginPayloadDTO {
	username: string;
	password: string;
}

export interface LoginResponseDTO {
	user: UsuarioDTO;
	token: string;
}

export interface CrearUsuarioAdminDTO {
	username: string;
	password: string;
	rol: RolUsuario;
	estaActivo?: boolean;
}

export interface PersonaDTO {
	id: number;
	identificacion: string;
	nombres: string;
	apellidos: string;
	correo: string | null;
	estaActivo: boolean;
	creadoEn?: string;
}

export interface CrearPersonaDTO {
	identificacion: string;
	nombres: string;
	apellidos: string;
	correo?: string | null;
	estaActivo?: boolean;
}

export interface ActualizarPersonaDTO {
	nombres?: string;
	apellidos?: string;
	correo?: string | null;
	estaActivo?: boolean;
}

export interface ProyectoDTO {
	id: number;
	codigo: string;
	nombre: string;
	descripcion: string | null;
	area: AreaProyecto;
	ambito: AmbitoProyecto;
	fechaInicio: string | null;
	fechaFin: string | null;
	estaActivo: boolean;
	creadoEn?: string;
}

export interface CrearProyectoDTO {
	codigo: string;
	nombre: string;
	descripcion?: string | null;
	area: AreaProyecto;
	ambito: AmbitoProyecto;
	fechaInicio?: string | null;
	fechaFin?: string | null;
	estaActivo?: boolean;
}

export interface ActualizarProyectoDTO {
	nombre?: string;
	descripcion?: string | null;
	area?: AreaProyecto;
	ambito?: AmbitoProyecto;
	fechaInicio?: string | null;
	fechaFin?: string | null;
	estaActivo?: boolean;
}

export interface GrupoPagoDTO {
	id: number;
	nombre: string;
	descripcion: string | null;
	periodicidad: PeriodicidadGrupoPago;
	diaCorte1: number | null;
	diaCorte2: number | null;
	configuracionCorte: Record<string, unknown> | null;
	estaActivo: boolean;
	creadoEn?: string;
}

export interface CrearGrupoPagoDTO {
	nombre: string;
	descripcion?: string | null;
	periodicidad: PeriodicidadGrupoPago;
	diaCorte1?: number | null;
	diaCorte2?: number | null;
	configuracionCorte?: Record<string, unknown> | null;
	estaActivo?: boolean;
}

export interface ActualizarGrupoPagoDTO {
	nombre?: string;
	descripcion?: string | null;
	periodicidad?: PeriodicidadGrupoPago;
	diaCorte1?: number | null;
	diaCorte2?: number | null;
	configuracionCorte?: Record<string, unknown> | null;
	estaActivo?: boolean;
}

export interface AsignacionDTO {
	id: number;
	personaId: number;
	proyectoId: number;
	grupoPagoId: number;
	creadoPorId?: number | null;
	montoPeriodo: number | string;
	fechaInicio: string;
	fechaFin: string | null;
	estaActivo: boolean;
	persona?: PersonaDTO;
	proyecto?: ProyectoDTO;
	grupoPago?: GrupoPagoDTO;
}

export interface CrearAsignacionDTO {
	personaId: number;
	proyectoId: number;
	grupoPagoId: number;
	montoPeriodo: number;
	fechaInicio: string;
	fechaFin?: string | null;
	estaActivo?: boolean;
}

export interface ActualizarAsignacionDTO {
	montoPeriodo?: number;
	fechaInicio?: string;
	fechaFin?: string | null;
	estaActivo?: boolean;
}

export interface DeudaBackendDTO {
	id: number;
	personaId: number;
	proyectoId: number;
	grupoPagoId?: number | null;
	asignacionId?: number | null;
	solicitudId?: number | null;
	creadoPorId?: number | null;
	montoOriginal: number | string;
	saldoPendiente: number | string;
	fechaVencimiento: string;
	periodoInicio?: string | null;
	periodoFin?: string | null;
	diasActivos?: number;
	diasPeriodo?: number;
	estado: EstadoDeuda;
	motivoAnulacion?: string | null;
	anuladoPorId?: number | null;
	fechaAnulacion?: string | null;
	persona?: PersonaDTO;
	proyecto?: ProyectoDTO;
	grupoPago?: GrupoPagoDTO;
	asignacion?: AsignacionDTO;
}

export interface SimularProrrateoPayloadDTO {
	montoPeriodo: number;
	diasActivos: number;
	diasPeriodo: number;
}

export interface SimularProrrateoResponseDTO {
	montoPeriodo: number;
	diasActivos: number;
	diasPeriodo: number;
	factorProrrateo: number;
	montoCausado: number;
}

export interface GenerarCausacionLoteDTO {
	proyectoId: number;
	grupoPagoId?: number | null;
	periodoInicio: string;
	periodoFin: string;
	fechaVencimiento?: string;
	crearSolicitud?: boolean;
	codigoSolicitud?: string;
}

export interface SolicitudPagoDTO {
	id: number;
	codigo: string;
	proyectoId: number;
	grupoPagoId: number | null;
	periodoInicio: string;
	periodoFin: string;
	montoTotal: number | string;
	estado: EstadoSolicitud;
	creadoPorId: number;
	revisadoPorId: number | null;
	motivoRechazo: string | null;
	fechaEnvio: string | null;
	fechaRevision: string | null;
	fechaCierre: string | null;
	proyecto?: ProyectoDTO;
	grupoPago?: GrupoPagoDTO;
	creadoPor?: UsuarioDTO;
	revisadoPor?: UsuarioDTO;
	deudas?: DeudaBackendDTO[];
	pagos?: PagoBackendDTO[];
}

export interface CrearSolicitudPagoDTO {
	codigo: string;
	proyectoId: number;
	grupoPagoId?: number | null;
	periodoInicio: string;
	periodoFin: string;
	deudaIds?: number[];
}

export interface ProrrateoBackendDTO {
	id: number;
	pagoId: number;
	deudaId: number;
	montoAplicado: number | string;
	deuda?: DeudaBackendDTO;
}

export interface PagoBackendDTO {
	id: number;
	personaId: number;
	usuarioId: number;
	solicitudId: number | null;
	montoTotal: number | string;
	metodoPago: MetodoPago;
	numeroReferencia: string | null;
	fechaPago: string;
	estado: EstadoPago;
	motivoAnulacion: string | null;
	anuladoPorId: number | null;
	fechaAnulacion: string | null;
	creadoEn?: string;
	persona?: PersonaDTO;
	usuario?: UsuarioDTO;
	solicitudPago?: SolicitudPagoDTO;
	prorrateos?: ProrrateoBackendDTO[];
}

export interface ValeCajaDTO {
	id: number;
	cajaChicaId: number;
	numeroVale: string;
	solicitantePersonaId: number;
	tramitadoPorId: number;
	aprobadoPorId: number | null;
	montoSolicitado: number | string;
	montoRendido: number | string | null;
	concepto: string;
	comprobanteReferencia: string | null;
	estado: EstadoValeCaja;
	motivoRechazo: string | null;
	motivoAnulacion: string | null;
	fechaSolicitud: string;
	fechaAprobacion: string | null;
	fechaDesembolso: string | null;
	fechaRendicion: string | null;
	solicitantePersona?: PersonaDTO;
	tramitadoPor?: UsuarioDTO;
	aprobadoPor?: UsuarioDTO;
}

export interface CajaChicaDTO {
	id: number;
	codigo: string;
	nombre: string;
	proyectoId: number;
	responsableId: number;
	cajaOrigenId: number | null;
	anio: number;
	mes: number;
	saldoInicial: number | string;
	montoAsignado: number | string;
	totalGastado: number | string;
	saldoActual: number | string;
	estado: EstadoCajaChica;
	fechaApertura: string;
	fechaCierre: string | null;
	proyecto?: ProyectoDTO;
	responsable?: UsuarioDTO;
	cajaOrigen?: CajaChicaDTO | null;
	vales?: ValeCajaDTO[];
}

export interface AbrirCajaChicaDTO {
	codigo: string;
	nombre: string;
	proyectoId: number;
	cajaOrigenId?: number | null;
	anio: number;
	mes: number;
	montoAsignado: number;
}

export interface SolicitarValeCajaDTO {
	solicitantePersonaId: number;
	montoSolicitado: number;
	concepto: string;
}

export interface RendirValeCajaDTO {
	montoRendido: number;
	comprobanteReferencia: string;
}

export interface ResumenPorProyectoDTO {
	proyectoId: number;
	codigo: string;
	nombre: string;
	area: AreaProyecto;
	ambito: AmbitoProyecto;
	totalCausado: number;
	totalPagado: number;
	saldoAdeudado: number;
}

export interface ResumenPorPersonaDTO {
	personaId: number;
	identificacion: string;
	nombreCompleto: string;
	totalCausado: number;
	totalPagado: number;
	saldoAdeudado: number;
	fechaUltimoPago: string | null;
}

export interface ResumenReporteDTO {
	kpis: {
		totalCausado: number;
		totalPagado: number;
		porcentajeCubierto: number;
		saldoExigible: number;
		pasivosFifoCount: number;
		cajaChicaSaldo: number;
		valesCustodiaCount: number;
	};
	porProyecto: ResumenPorProyectoDTO[];
	porPersona: ResumenPorPersonaDTO[];
}

export interface AuditLogBackendDTO {
	id: number;
	usuarioId: number | null;
	accion: string;
	tablaAfectada: string;
	registroId: number;
	datosAnteriores: Record<string, unknown> | null;
	datosNuevos: Record<string, unknown> | null;
	ipOrigen: string | null;
	creadoEn: string;
	usuario?: UsuarioDTO | null;
}

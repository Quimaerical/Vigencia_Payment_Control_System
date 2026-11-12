import type {
	Proyecto,
	Beneficiario,
	KPIsFinancieros,
	AsientoMayor,
	AsignacionTramite,
	DeudaFifoItem,
	AuditDiffItem,
	ModuloWorkspace
} from '../types/financial';
import { RolUsuario } from '@app/shared';

export const MOCK_PROYECTOS: Proyecto[] = [
	{
		id: 1,
		codigo: 'FQ-2025',
		nombre: 'Lab de Física Cuántica FACYT',
		descripcion: 'Subvención Fonacit #8820 · Período Quincena 10',
		presupuestoUsd: 92000.0,
		porcentajeEjecucion: 48.7,
		estaActivo: true
	},
	{
		id: 2,
		codigo: 'SC-904',
		nombre: 'Síntesis Catalítica',
		descripcion: 'Investigación en nanoestructuras y catálisis química',
		presupuestoUsd: 54200.0,
		porcentajeEjecucion: 28.7,
		estaActivo: true
	},
	{
		id: 3,
		codigo: 'GM-110',
		nombre: 'Genómica Molecular',
		descripcion: 'Secuenciación y bioanálisis molecular celular',
		presupuestoUsd: 42700.0,
		porcentajeEjecucion: 22.6,
		estaActivo: true
	}
];

export const MOCK_BENEFICIARIOS: Beneficiario[] = [
	{
		id: 1,
		identificacion: 'V-12345678',
		nombres: 'Elena',
		apellidos: 'Rostova',
		correo: 'elena.rostova@facyt.uc.edu.ve',
		area: 'Física Teórica',
		iniciales: 'ER',
		estaActivo: true
	},
	{
		id: 2,
		identificacion: 'V-18765432',
		nombres: 'Carlos',
		apellidos: 'Méndez',
		correo: 'carlos.mendez@facyt.uc.edu.ve',
		area: 'Química Orgánica',
		iniciales: 'CM',
		estaActivo: true
	},
	{
		id: 3,
		identificacion: 'V-20123987',
		nombres: 'Sofía',
		apellidos: 'Valera',
		correo: 'sofia.valera@facyt.uc.edu.ve',
		area: 'Bioquímica Molecular',
		iniciales: 'SV',
		estaActivo: true
	}
];

export const MOCK_KPIS: KPIsFinancieros = {
	totalCausado: 148250.0,
	porcentajeCausadoVsPrev: 12.4,
	totalPagado: 112400.0,
	porcentajeCubierto: 75.8,
	saldoExigible: 35850.0,
	pasivosFifoCount: 6,
	cajaChicaSaldo: 4800.0,
	valesCustodiaCount: 3
};

export const MOCK_ASIENTOS_MAYOR: AsientoMayor[] = [
	{
		id: 'AST-8832',
		timestamp: '2025-05-14 09:12 UTC',
		concepto: 'Pago Parcial Nómina Q1',
		beneficiarioNombre: 'Dra. Elena Rostova',
		proyectoCodigo: 'FQ-2025',
		montoUsd: 1500.0,
		estado: 'asentado',
		hashSha256: '9f8a3c4bd12e87a21345'
	},
	{
		id: 'AST-8831',
		timestamp: '2025-05-13 16:45 UTC',
		concepto: 'Causación Honorarios Mes Completo',
		beneficiarioNombre: 'Lic. Sofía Valera',
		proyectoCodigo: 'GM-110',
		montoUsd: 2400.0,
		estado: 'asentado',
		hashSha256: '3c41ea78b12f4581aa90'
	},
	{
		id: 'AST-8829',
		timestamp: '2025-05-10 11:20 UTC',
		concepto: 'Desembolso Reactivo Orgánico Grado Espectro',
		beneficiarioNombre: 'Ing. Carlos Méndez',
		proyectoCodigo: 'SC-904',
		montoUsd: 3150.0,
		estado: 'anulado',
		hashSha256: 'e82b79a10fc432190871',
		motivoReverso: 'Duplicidad confirmada en factura fiscal (#REV-091)'
	}
];

export const MOCK_ASIGNACIONES: AsignacionTramite[] = [
	{
		id: 1,
		beneficiarioId: 1,
		beneficiarioNombre: 'Dra. Elena Rostova',
		beneficiarioIniciales: 'ER',
		area: 'Física Teórica',
		diasActivos: 22,
		diasPeriodo: 30,
		baseContractualUsd: 2500.0,
		montoCausadoUsd: 1833.33,
		estado: 'pendiente'
	},
	{
		id: 2,
		beneficiarioId: 2,
		beneficiarioNombre: 'Ing. Carlos Méndez',
		beneficiarioIniciales: 'CM',
		area: 'Química Orgánica',
		diasActivos: 15,
		diasPeriodo: 15,
		baseContractualUsd: 1250.0,
		montoCausadoUsd: 1250.0,
		estado: 'abonado'
	},
	{
		id: 3,
		beneficiarioId: 3,
		beneficiarioNombre: 'Lic. Sofía Valera',
		beneficiarioIniciales: 'SV',
		area: 'Bioquímica Molecular',
		diasActivos: 30,
		diasPeriodo: 30,
		baseContractualUsd: 2400.0,
		montoCausadoUsd: 2400.0,
		estado: 'pendiente'
	}
];

export const MOCK_DEUDAS_FIFO: DeudaFifoItem[] = [
	{
		id: 101,
		proyectoId: 1,
		personaId: 1,
		fechaVencimiento: '2025-01-15',
		descripcion: 'Deuda #101 (Causación Enero 2025)',
		montoOriginal: 850.0,
		montoAmortizado: 850.0,
		saldoPendiente: 0.0,
		porcentajeAmortizado: 100,
		estado: 'liquidada'
	},
	{
		id: 104,
		proyectoId: 1,
		personaId: 1,
		fechaVencimiento: '2025-02-15',
		descripcion: 'Deuda #104 (Causación Febrero 2025)',
		montoOriginal: 1200.0,
		montoAmortizado: 650.0,
		saldoPendiente: 550.0,
		porcentajeAmortizado: 54,
		estado: 'pendiente'
	}
];

export const MOCK_AUDIT_DIFFS: AuditDiffItem[] = [
	{
		id: 991,
		accion: 'AMORTIZAR_DEUDA_FIFO',
		tablaAfectada: 'deudas',
		registroId: 104,
		usuarioId: 'usr_891',
		usuarioRol: RolUsuario.RECEPTOR,
		timestamp: '2025-05-14 10:42:18 UTC',
		hashSha256: '4b71e89af902341cda129',
		datosAnteriores: {
			asiento_id: 'AST-8832',
			estado: 'PENDIENTE',
			saldo_deudor_usd: 1833.33,
			amortizado_fifo: 0.0,
			hash: '9f8a3c4b...d12'
		},
		datosNuevos: {
			asiento_id: 'AST-8832',
			estado: 'AMORTIZADO_PARCIAL',
			saldo_deudor_usd: 333.33,
			amortizado_fifo: 1500.0,
			hash: '4b71e89a...f90'
		}
	}
];

export const MOCK_DEFAULT_MODULES: ModuloWorkspace[] = [
	{
		id: 'mod-project-strip',
		nombre: 'Ficha de Proyecto',
		subtitulo: 'Indicador FACYT #FQ-2025',
		icono: 'domain',
		habilitado: true,
		orden: 1
	},
	{
		id: 'mod-kpi-grid',
		nombre: 'KPIs Ejecutivos Financieros',
		subtitulo: 'Causado, Pagado y Saldo',
		icono: 'analytics',
		habilitado: true,
		orden: 2
	},
	{
		id: 'mod-quick-actions',
		nombre: 'Atajos Frecuentes',
		subtitulo: 'Acceso rápido a operaciones',
		icono: 'bolt',
		habilitado: true,
		orden: 3
	},
	{
		id: 'mod-project-breakdown',
		nombre: 'Desglose por Proyecto',
		subtitulo: 'Distribución por proyectos',
		icono: 'pie_chart',
		habilitado: true,
		orden: 4
	},
	{
		id: 'mod-petty-cash',
		nombre: 'Caja Chica & Vales',
		subtitulo: 'Custodia de efectivo en lab',
		icono: 'receipt',
		habilitado: true,
		orden: 5
	}
];

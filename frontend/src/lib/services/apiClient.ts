import type {
	AbrirCajaChicaDTO,
	ActualizarAsignacionDTO,
	ActualizarGrupoPagoDTO,
	ActualizarPersonaDTO,
	ActualizarProyectoDTO,
	AsignacionDTO,
	AuditLogBackendDTO,
	CajaChicaDTO,
	CrearAsignacionDTO,
	CrearGrupoPagoDTO,
	CrearPersonaDTO,
	CrearProyectoDTO,
	CrearSolicitudPagoDTO,
	CrearUsuarioAdminDTO,
	DeudaBackendDTO,
	GenerarCausacionLoteDTO,
	GrupoPagoDTO,
	LoginPayloadDTO,
	LoginResponseDTO,
	PagoBackendDTO,
	PersonaDTO,
	ProcesarPagoDTO,
	ProyectoDTO,
	RendirValeCajaDTO,
	ResumenReporteDTO,
	SimularProrrateoPayloadDTO,
	SimularProrrateoResponseDTO,
	SolicitarValeCajaDTO,
	SolicitudPagoDTO,
	UsuarioDTO,
	ValeCajaDTO
} from '../types/financial';

export interface ApiResult<T> {
	data: T | null;
	isOffline: boolean;
	status?: number;
	error?: string;
	codigo?: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	total?: number;
	pagina?: number;
	limite?: number;
	totalPaginas?: number;
}

type UnauthorizedHandler = () => void;

/**
 * ApiClient con soporte de autenticación Bearer, manejo de errores RBAC/VineJS,
 * descarga de PDFs binarios y resiliencia ante desconexión.
 */
export class ApiClient {
	private static unauthorizedHandler: UnauthorizedHandler | null = null;

	public static onUnauthorized(handler: UnauthorizedHandler): void {
		this.unauthorizedHandler = handler;
	}

	public static getBaseUrl(): string {
		let rawUrl = '';
		if (typeof window !== 'undefined') {
			const win = window as unknown as { __ENV_API_URL__?: string };
			if (win.__ENV_API_URL__) {
				rawUrl = win.__ENV_API_URL__;
			}
		}

		if (!rawUrl) {
			rawUrl =
				import.meta.env.PUBLIC_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3333';
		}

		const normalized = rawUrl.trim().replace(/\/+$/, '');
		return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;
	}

	public static getToken(): string | null {
		if (typeof window === 'undefined') return null;
		return window.sessionStorage.getItem('vigencia_auth_token');
	}

	public static setToken(token: string | null): void {
		if (typeof window === 'undefined') return;
		if (token) {
			window.sessionStorage.setItem('vigencia_auth_token', token);
		} else {
			window.sessionStorage.removeItem('vigencia_auth_token');
		}
	}

	private static buildQuery(
		params?: Record<string, string | number | boolean | undefined | null>
	): string {
		if (!params) return '';
		const search = new URLSearchParams();
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== null && value !== '') {
				search.append(key, String(value));
			}
		}
		const qs = search.toString();
		return qs ? `?${qs}` : '';
	}

	private static extractError(
		errorJson: Record<string, unknown> | null,
		status: number
	): { error: string; codigo?: string } {
		if (!errorJson) {
			return { error: `Error HTTP ${status}` };
		}
		const codigo = typeof errorJson.codigo === 'string' ? errorJson.codigo : undefined;
		const sufijoReintento =
			status === 429 && typeof errorJson.reintentarEn === 'number'
				? ` (reintente en ${errorJson.reintentarEn}s)`
				: '';

		if (typeof errorJson.mensaje === 'string' && errorJson.mensaje) {
			return { error: `${errorJson.mensaje}${sufijoReintento}`, codigo };
		}
		if (typeof errorJson.message === 'string' && errorJson.message) {
			return { error: `${errorJson.message}${sufijoReintento}`, codigo };
		}
		if (Array.isArray(errorJson.errors) && errorJson.errors.length > 0) {
			const msgs = errorJson.errors
				.map((e: unknown) => {
					if (e && typeof e === 'object' && 'message' in e) {
						const field = 'field' in e && typeof e.field === 'string' ? `${e.field}: ` : '';
						return `${field}${String((e as { message: unknown }).message)}`;
					}
					return '';
				})
				.filter(Boolean);
			if (msgs.length > 0) {
				return { error: msgs.join(' | '), codigo: codigo || 'VALIDATION_ERROR' };
			}
		}
		return { error: `Error HTTP ${status}`, codigo };
	}

	public static async request<T>(
		endpoint: string,
		options: RequestInit = {},
		query?: Record<string, string | number | boolean | undefined | null>
	): Promise<ApiResult<T>> {
		const url = `${this.getBaseUrl()}${endpoint}${this.buildQuery(query)}`;
		const token = this.getToken();

		const headers: Record<string, string> = {
			Accept: 'application/json',
			...(options.headers as Record<string, string>)
		};

		if (options.body && !headers['Content-Type']) {
			headers['Content-Type'] = 'application/json';
		}

		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 8000);

			const response = await fetch(url, {
				...options,
				headers,
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorJson = (await response.json().catch(() => null)) as Record<
					string,
					unknown
				> | null;
				const { error, codigo } = this.extractError(errorJson, response.status);

				if (response.status === 401 && endpoint !== '/auth/login') {
					this.setToken(null);
					this.unauthorizedHandler?.();
				}

				return {
					data: null,
					isOffline: false,
					status: response.status,
					error,
					codigo
				};
			}

			const json = await response.json().catch(() => null);
			return { data: json as T, isOffline: false, status: response.status };
		} catch (err: unknown) {
			console.info(
				`[ApiClient] Red no disponible para '${endpoint}', activando modo offline:`,
				err
			);
			return {
				data: null,
				isOffline: true,
				error: 'Servidor no disponible (modo offline)'
			};
		}
	}

	public static async downloadPdf(
		endpoint: string,
		filename: string
	): Promise<{ ok: boolean; error?: string }> {
		const url = `${this.getBaseUrl()}${endpoint}`;
		const token = this.getToken();

		const headers: Record<string, string> = {
			Accept: 'application/pdf'
		};
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		try {
			const response = await fetch(url, { method: 'GET', headers });
			if (!response.ok) {
				const errorJson = (await response.json().catch(() => null)) as Record<
					string,
					unknown
				> | null;
				const { error } = this.extractError(errorJson, response.status);
				return { ok: false, error };
			}

			const blob = await response.blob();
			if (typeof window !== 'undefined') {
				const blobUrl = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = blobUrl;
				link.download = filename;
				document.body.appendChild(link);
				link.click();
				link.remove();
				setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
			}
			return { ok: true };
		} catch {
			return { ok: false, error: 'No se pudo descargar el PDF (servidor no disponible).' };
		}
	}

	// =========================================================================
	// Autenticación y Cuenta (/auth/* y /account/*)
	// =========================================================================

	public static async login(payload: LoginPayloadDTO): Promise<ApiResult<LoginResponseDTO>> {
		const res = await this.request<Record<string, unknown>>('/auth/login', {
			method: 'POST',
			body: JSON.stringify(payload)
		});

		if (!res.data) {
			return { ...res, data: null };
		}

		const raw = (
			'data' in res.data && res.data.data && typeof res.data.data === 'object'
				? res.data.data
				: res.data
		) as Record<string, unknown>;

		const rawUser = (
			raw.user && typeof raw.user === 'object' && 'data' in (raw.user as Record<string, unknown>)
				? (raw.user as { data: UsuarioDTO }).data
				: raw.user
		) as UsuarioDTO;
		const token = String(raw.token || '');

		return {
			...res,
			data: { user: rawUser, token }
		};
	}

	public static async getPerfil(): Promise<ApiResult<UsuarioDTO>> {
		const res = await this.request<Record<string, unknown>>('/account/perfil');
		if (!res.data) {
			return { ...res, data: null };
		}
		const user = ('data' in res.data && res.data.data ? res.data.data : res.data) as UsuarioDTO;
		return { ...res, data: user };
	}

	public static async logout() {
		return this.request<{ message: string }>('/account/logout', {
			method: 'POST'
		});
	}

	// =========================================================================
	// 2.1 Gestión de Catálogos y Usuarios
	// =========================================================================

	public static async listarUsuarios(filtros?: { pagina?: number; limite?: number }) {
		return this.request<PaginatedResponse<UsuarioDTO>>(
			'/usuarios',
			{},
			{ pagina: filtros?.pagina, limite: filtros?.limite ?? 100 }
		);
	}

	public static async crearUsuario(dto: CrearUsuarioAdminDTO) {
		return this.request<{ mensaje: string; data: UsuarioDTO }>('/usuarios', {
			method: 'POST',
			body: JSON.stringify(dto)
		});
	}

	public static async cambiarEstadoUsuario(id: number, estaActivo: boolean) {
		return this.request<{ mensaje: string; data: UsuarioDTO }>(`/usuarios/${id}/estado`, {
			method: 'PATCH',
			body: JSON.stringify({ estaActivo })
		});
	}

	public static async listarPersonas(soloActivas?: boolean, limite = 100) {
		return this.request<PaginatedResponse<PersonaDTO>>('/personas', {}, { soloActivas, limite });
	}

	public static async crearPersona(dto: CrearPersonaDTO) {
		return this.request<{ mensaje: string; data: PersonaDTO }>('/personas', {
			method: 'POST',
			body: JSON.stringify(dto)
		});
	}

	public static async actualizarPersona(id: number, dto: ActualizarPersonaDTO) {
		return this.request<{ mensaje: string; data: PersonaDTO }>(`/personas/${id}`, {
			method: 'PUT',
			body: JSON.stringify(dto)
		});
	}

	public static async cambiarEstadoPersona(id: number, estaActivo: boolean) {
		return this.request<{ mensaje: string; data: PersonaDTO }>(`/personas/${id}/estado`, {
			method: 'PATCH',
			body: JSON.stringify({ estaActivo })
		});
	}

	public static async listarProyectos(filtros?: {
		area?: string;
		ambito?: string;
		soloActivos?: boolean;
		pagina?: number;
		limite?: number;
	}) {
		return this.request<PaginatedResponse<ProyectoDTO>>(
			'/proyectos',
			{},
			{ ...filtros, limite: filtros?.limite ?? 100 }
		);
	}

	public static async crearProyecto(dto: CrearProyectoDTO) {
		return this.request<{ mensaje: string; data: ProyectoDTO }>('/proyectos', {
			method: 'POST',
			body: JSON.stringify(dto)
		});
	}

	public static async actualizarProyecto(id: number, dto: ActualizarProyectoDTO) {
		return this.request<{ mensaje: string; data: ProyectoDTO }>(`/proyectos/${id}`, {
			method: 'PUT',
			body: JSON.stringify(dto)
		});
	}

	public static async cambiarEstadoProyecto(id: number, estaActivo: boolean) {
		return this.request<{ mensaje: string; data: ProyectoDTO }>(`/proyectos/${id}/estado`, {
			method: 'PATCH',
			body: JSON.stringify({ estaActivo })
		});
	}

	public static async listarGruposPago(soloActivos?: boolean, limite = 100) {
		return this.request<PaginatedResponse<GrupoPagoDTO>>(
			'/grupos-pago',
			{},
			{ soloActivos, limite }
		);
	}

	public static async crearGrupoPago(dto: CrearGrupoPagoDTO) {
		return this.request<{ mensaje: string; data: GrupoPagoDTO }>('/grupos-pago', {
			method: 'POST',
			body: JSON.stringify(dto)
		});
	}

	public static async actualizarGrupoPago(id: number, dto: ActualizarGrupoPagoDTO) {
		return this.request<{ mensaje: string; data: GrupoPagoDTO }>(`/grupos-pago/${id}`, {
			method: 'PUT',
			body: JSON.stringify(dto)
		});
	}

	public static async cambiarEstadoGrupoPago(id: number, estaActivo: boolean) {
		return this.request<{ mensaje: string; data: GrupoPagoDTO }>(`/grupos-pago/${id}/estado`, {
			method: 'PATCH',
			body: JSON.stringify({ estaActivo })
		});
	}

	public static async listarAsignaciones(filtros?: {
		proyectoId?: number;
		personaId?: number;
		grupoPagoId?: number;
		soloActivas?: boolean;
		pagina?: number;
		limite?: number;
	}) {
		return this.request<PaginatedResponse<AsignacionDTO>>(
			'/asignaciones',
			{},
			{ ...filtros, limite: filtros?.limite ?? 100 }
		);
	}

	public static async crearAsignacion(dto: CrearAsignacionDTO) {
		return this.request<{ mensaje: string; data: AsignacionDTO }>('/asignaciones', {
			method: 'POST',
			body: JSON.stringify(dto)
		});
	}

	public static async actualizarAsignacion(id: number, dto: ActualizarAsignacionDTO) {
		return this.request<{ mensaje: string; data: AsignacionDTO }>(`/asignaciones/${id}`, {
			method: 'PUT',
			body: JSON.stringify(dto)
		});
	}

	public static async cambiarEstadoAsignacion(id: number, estaActivo: boolean) {
		return this.request<{ mensaje: string; data: AsignacionDTO }>(`/asignaciones/${id}/estado`, {
			method: 'PATCH',
			body: JSON.stringify({ estaActivo })
		});
	}

	// =========================================================================
	// 2.2 Motor de Causación y Prorrateo
	// =========================================================================

	public static async listarCausaciones(filtros?: {
		proyectoId?: number;
		personaId?: number;
		solicitudId?: number;
		estado?: string;
		pagina?: number;
		limite?: number;
	}) {
		return this.request<PaginatedResponse<DeudaBackendDTO>>(
			'/causaciones',
			{},
			{ ...filtros, limite: filtros?.limite ?? 100 }
		);
	}

	public static async simularCausacion(dto: SimularProrrateoPayloadDTO) {
		return this.request<SimularProrrateoResponseDTO>('/causaciones/simular', {
			method: 'POST',
			body: JSON.stringify(dto)
		});
	}

	public static async generarLoteCausacion(dto: GenerarCausacionLoteDTO) {
		return this.request<{
			mensaje: string;
			cantidadCausaciones: number;
			montoTotalLote: number;
			diasPeriodo?: number;
			solicitudPago?: SolicitudPagoDTO | null;
			causaciones?: DeudaBackendDTO[];
		}>('/causaciones/lote', {
			method: 'POST',
			body: JSON.stringify(dto)
		});
	}

	public static async anularCausacion(deudaId: number, motivoAnulacion: string) {
		return this.request<{ mensaje: string; data: DeudaBackendDTO }>(
			`/causaciones/${deudaId}/anular`,
			{
				method: 'POST',
				body: JSON.stringify({ motivoAnulacion })
			}
		);
	}

	// =========================================================================
	// 2.3 Ciclo de Solicitudes y Pagos
	// =========================================================================

	public static async listarSolicitudesPago(filtros?: {
		proyectoId?: number;
		estado?: string;
		pagina?: number;
		limite?: number;
	}) {
		return this.request<PaginatedResponse<SolicitudPagoDTO>>(
			'/solicitudes-pago',
			{},
			{ ...filtros, limite: filtros?.limite ?? 100 }
		);
	}

	public static async obtenerSolicitudPago(id: number) {
		return this.request<{ data: SolicitudPagoDTO }>(`/solicitudes-pago/${id}`);
	}

	public static async crearSolicitudPago(dto: CrearSolicitudPagoDTO) {
		return this.request<{ mensaje: string; data: SolicitudPagoDTO }>('/solicitudes-pago', {
			method: 'POST',
			body: JSON.stringify(dto)
		});
	}

	public static async enviarSolicitudPago(id: number) {
		return this.request<{ mensaje: string; data: SolicitudPagoDTO }>(
			`/solicitudes-pago/${id}/enviar`,
			{ method: 'PATCH' }
		);
	}

	public static async aprobarSolicitudPago(id: number) {
		return this.request<{ mensaje: string; data: SolicitudPagoDTO }>(
			`/solicitudes-pago/${id}/aprobar`,
			{ method: 'PATCH' }
		);
	}

	public static async rechazarSolicitudPago(id: number, motivoRechazo: string) {
		return this.request<{ mensaje: string; data: SolicitudPagoDTO }>(
			`/solicitudes-pago/${id}/rechazar`,
			{
				method: 'PATCH',
				body: JSON.stringify({ motivoRechazo })
			}
		);
	}

	public static async cerrarSolicitudPago(id: number) {
		return this.request<{ mensaje: string; data: SolicitudPagoDTO }>(
			`/solicitudes-pago/${id}/cerrar`,
			{ method: 'PATCH' }
		);
	}

	public static async listarPagos(filtros?: {
		personaId?: number;
		solicitudId?: number;
		estado?: string;
		pagina?: number;
		limite?: number;
	}) {
		return this.request<PaginatedResponse<PagoBackendDTO>>(
			'/pagos',
			{},
			{ ...filtros, limite: filtros?.limite ?? 100 }
		);
	}

	public static async procesarPago(dto: ProcesarPagoDTO) {
		return this.request<{
			mensaje: string;
			pagoId: number;
			montoAplicado: number;
			deudasAmortizadas: number;
		}>('/pagos', {
			method: 'POST',
			body: JSON.stringify(dto)
		});
	}

	public static async anularPago(pagoId: number, motivoAnulacion: string) {
		return this.request<{
			mensaje: string;
			data?: PagoBackendDTO;
			deudasRestituidas?: Array<{
				deudaId: number;
				montoRevertido: number;
				nuevoSaldo: number;
			}>;
		}>(`/pagos/${pagoId}/anular`, {
			method: 'POST',
			body: JSON.stringify({ motivoAnulacion })
		});
	}

	// =========================================================================
	// 2.4 Control de Cajas Chicas y Vales
	// =========================================================================

	public static async listarCajasChicas(filtros?: {
		proyectoId?: number;
		estado?: string;
		pagina?: number;
		limite?: number;
	}) {
		return this.request<PaginatedResponse<CajaChicaDTO>>(
			'/cajas-chicas',
			{},
			{ ...filtros, limite: filtros?.limite ?? 100 }
		);
	}

	public static async obtenerCajaChica(id: number) {
		return this.request<{ data: CajaChicaDTO }>(`/cajas-chicas/${id}`);
	}

	public static async abrirCajaChica(dto: AbrirCajaChicaDTO) {
		return this.request<{ mensaje: string; data: CajaChicaDTO }>('/cajas-chicas', {
			method: 'POST',
			body: JSON.stringify(dto)
		});
	}

	public static async cerrarCajaChica(id: number) {
		return this.request<{ mensaje: string; data: CajaChicaDTO }>(`/cajas-chicas/${id}/cerrar`, {
			method: 'PATCH'
		});
	}

	public static async solicitarValeCaja(cajaId: number, dto: SolicitarValeCajaDTO) {
		return this.request<{ mensaje: string; data: ValeCajaDTO }>(`/cajas-chicas/${cajaId}/vales`, {
			method: 'POST',
			body: JSON.stringify(dto)
		});
	}

	public static async aprobarValeCaja(valeId: number) {
		return this.request<{ mensaje: string; data: ValeCajaDTO }>(`/vales-caja/${valeId}/aprobar`, {
			method: 'PATCH'
		});
	}

	public static async rechazarValeCaja(valeId: number, motivoRechazo: string) {
		return this.request<{ mensaje: string; data: ValeCajaDTO }>(`/vales-caja/${valeId}/rechazar`, {
			method: 'PATCH',
			body: JSON.stringify({ motivoRechazo })
		});
	}

	public static async desembolsarValeCaja(valeId: number) {
		return this.request<{ mensaje: string; data: ValeCajaDTO }>(
			`/vales-caja/${valeId}/desembolsar`,
			{ method: 'PATCH' }
		);
	}

	public static async rendirValeCaja(valeId: number, dto: RendirValeCajaDTO) {
		return this.request<{ mensaje: string; data: ValeCajaDTO }>(`/vales-caja/${valeId}/rendir`, {
			method: 'PATCH',
			body: JSON.stringify(dto)
		});
	}

	public static async anularValeCaja(valeId: number, motivoAnulacion: string) {
		return this.request<{ mensaje: string; data: ValeCajaDTO }>(`/vales-caja/${valeId}/anular`, {
			method: 'POST',
			body: JSON.stringify({ motivoAnulacion })
		});
	}

	// =========================================================================
	// 2.5 Reportes, Documentos PDF y Auditoría
	// =========================================================================

	public static async obtenerResumenReporte() {
		return this.request<ResumenReporteDTO>('/reportes/resumen');
	}

	public static async listarAuditLogs(filtros?: {
		tablaAfectada?: string;
		accion?: string;
		usuarioId?: number;
		limite?: number;
	}) {
		return this.request<{ data: AuditLogBackendDTO[] }>('/audit-logs', {}, filtros);
	}

	public static async descargarReciboPagoPdf(pagoId: number) {
		return this.downloadPdf(`/reportes/pagos/${pagoId}/recibo.pdf`, `recibo-pago-${pagoId}.pdf`);
	}

	public static async descargarSolicitudConsolidadaPdf(solicitudId: number, codigo?: string) {
		const nombre = codigo
			? `solicitud-consolidada-${codigo}.pdf`
			: `solicitud-consolidada-${solicitudId}.pdf`;
		return this.downloadPdf(`/reportes/solicitudes/${solicitudId}/consolidado.pdf`, nombre);
	}
}

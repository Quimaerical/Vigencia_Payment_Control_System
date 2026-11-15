import { ApiClient } from '../services/apiClient';
import { StorageService } from '../services/storageService';
import { workspaceStore } from './workspaceStore.svelte';
import { authStore } from './authStore.svelte';
import type {
	ActualizarAsignacionDTO,
	ActualizarGrupoPagoDTO,
	ActualizarPersonaDTO,
	ActualizarProyectoDTO,
	AsignacionDTO,
	CrearAsignacionDTO,
	CrearGrupoPagoDTO,
	CrearPersonaDTO,
	CrearProyectoDTO,
	CrearUsuarioAdminDTO,
	GrupoPagoDTO,
	PersonaDTO,
	ProyectoDTO,
	UsuarioDTO
} from '../types/financial';

class CatalogStore {
	usuarios = $state<UsuarioDTO[]>([]);
	personas = $state<PersonaDTO[]>([]);
	proyectos = $state<ProyectoDTO[]>([]);
	gruposPago = $state<GrupoPagoDTO[]>([]);
	asignaciones = $state<AsignacionDTO[]>([]);
	isLoading = $state<boolean>(false);

	constructor() {
		this.usuarios = StorageService.loadSnapshot('cat_usuarios', []);
		this.personas = StorageService.loadSnapshot('cat_personas', []);
		this.proyectos = StorageService.loadSnapshot('cat_proyectos', []);
		this.gruposPago = StorageService.loadSnapshot('cat_grupos_pago', []);
		this.asignaciones = StorageService.loadSnapshot('cat_asignaciones', []);
	}

	async syncAll(): Promise<void> {
		if (!ApiClient.getToken()) return;
		this.isLoading = true;

		const [perRes, proyRes, grpRes, asigRes] = await Promise.all([
			ApiClient.listarPersonas(),
			ApiClient.listarProyectos(),
			ApiClient.listarGruposPago(),
			ApiClient.listarAsignaciones()
		]);

		if (perRes.data?.data) {
			this.personas = perRes.data.data;
			StorageService.saveSnapshot('cat_personas', this.personas);
		}
		if (proyRes.data?.data) {
			this.proyectos = proyRes.data.data;
			StorageService.saveSnapshot('cat_proyectos', this.proyectos);
		}
		if (grpRes.data?.data) {
			this.gruposPago = grpRes.data.data;
			StorageService.saveSnapshot('cat_grupos_pago', this.gruposPago);
		}
		if (asigRes.data?.data) {
			this.asignaciones = asigRes.data.data;
			StorageService.saveSnapshot('cat_asignaciones', this.asignaciones);
		}

		if (authStore.esAdmin) {
			const usrRes = await ApiClient.listarUsuarios();
			if (usrRes.data?.data) {
				this.usuarios = usrRes.data.data;
				StorageService.saveSnapshot('cat_usuarios', this.usuarios);
			}
		}

		this.isLoading = false;
	}

	// Usuarios (Rol Administrador)
	async crearUsuario(dto: CrearUsuarioAdminDTO): Promise<boolean> {
		const res = await ApiClient.crearUsuario(dto);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al crear usuario', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Usuario creado', 'check_circle');
		await this.syncAll();
		return true;
	}

	async cambiarEstadoUsuario(id: number, estaActivo: boolean): Promise<boolean> {
		const res = await ApiClient.cambiarEstadoUsuario(id, estaActivo);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al actualizar estado de usuario', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Estado de usuario actualizado', 'check_circle');
		await this.syncAll();
		return true;
	}

	// Personas (Beneficiarios)
	async crearPersona(dto: CrearPersonaDTO): Promise<boolean> {
		const res = await ApiClient.crearPersona(dto);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al crear persona', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Persona registrada', 'check_circle');
		await this.syncAll();
		return true;
	}

	async actualizarPersona(id: number, dto: ActualizarPersonaDTO): Promise<boolean> {
		const res = await ApiClient.actualizarPersona(id, dto);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al actualizar persona', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Persona actualizada', 'check_circle');
		await this.syncAll();
		return true;
	}

	async cambiarEstadoPersona(id: number, estaActivo: boolean): Promise<boolean> {
		const res = await ApiClient.cambiarEstadoPersona(id, estaActivo);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al cambiar estado de persona', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Estado actualizado', 'check_circle');
		await this.syncAll();
		return true;
	}

	// Proyectos
	async crearProyecto(dto: CrearProyectoDTO): Promise<boolean> {
		const res = await ApiClient.crearProyecto(dto);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al crear proyecto', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Proyecto creado', 'check_circle');
		await this.syncAll();
		return true;
	}

	async actualizarProyecto(id: number, dto: ActualizarProyectoDTO): Promise<boolean> {
		const res = await ApiClient.actualizarProyecto(id, dto);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al actualizar proyecto', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Proyecto actualizado', 'check_circle');
		await this.syncAll();
		return true;
	}

	async cambiarEstadoProyecto(id: number, estaActivo: boolean): Promise<boolean> {
		const res = await ApiClient.cambiarEstadoProyecto(id, estaActivo);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al cambiar estado del proyecto', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Estado de proyecto actualizado', 'check_circle');
		await this.syncAll();
		return true;
	}

	// Grupos de Pago
	async crearGrupoPago(dto: CrearGrupoPagoDTO): Promise<boolean> {
		const res = await ApiClient.crearGrupoPago(dto);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al crear grupo de pago', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Grupo de pago creado', 'check_circle');
		await this.syncAll();
		return true;
	}

	async actualizarGrupoPago(id: number, dto: ActualizarGrupoPagoDTO): Promise<boolean> {
		const res = await ApiClient.actualizarGrupoPago(id, dto);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al actualizar grupo de pago', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Grupo de pago actualizado', 'check_circle');
		await this.syncAll();
		return true;
	}

	async cambiarEstadoGrupoPago(id: number, estaActivo: boolean): Promise<boolean> {
		const res = await ApiClient.cambiarEstadoGrupoPago(id, estaActivo);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al cambiar estado del grupo', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Estado actualizado', 'check_circle');
		await this.syncAll();
		return true;
	}

	// Asignaciones
	async crearAsignacion(dto: CrearAsignacionDTO): Promise<boolean> {
		const res = await ApiClient.crearAsignacion(dto);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al crear asignación', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Asignación creada', 'check_circle');
		await this.syncAll();
		return true;
	}

	async actualizarAsignacion(id: number, dto: ActualizarAsignacionDTO): Promise<boolean> {
		const res = await ApiClient.actualizarAsignacion(id, dto);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al actualizar asignación', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Asignación actualizada', 'check_circle');
		await this.syncAll();
		return true;
	}

	async cambiarEstadoAsignacion(id: number, estaActivo: boolean): Promise<boolean> {
		const res = await ApiClient.cambiarEstadoAsignacion(id, estaActivo);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al cambiar estado de asignación', 'warning');
			return false;
		}
		workspaceStore.showToast(
			res.data.mensaje || 'Estado de asignación actualizado',
			'check_circle'
		);
		await this.syncAll();
		return true;
	}
}

export const catalogStore = new CatalogStore();

import { ApiClient } from '../services/apiClient';
import { StorageService } from '../services/storageService';
import { workspaceStore } from './workspaceStore.svelte';
import type { UsuarioDTO } from '../types/financial';
import { RolUsuario } from '@app/shared';

const DEFAULT_SEED_CREDENTIALS: Record<RolUsuario, { username: string; password: string }> = {
	[RolUsuario.ADMINISTRADOR]: {
		username: 'admin_sistema',
		password: 'Vigencia$2026!SecureKey#99'
	},
	[RolUsuario.GENERADOR]: {
		username: 'coordinador_generador',
		password: 'Vigencia$2026!SecureKey#99'
	},
	[RolUsuario.RECEPTOR]: {
		username: 'operador_receptor',
		password: 'Vigencia$2026!SecureKey#99'
	}
};

class AuthStore {
	usuarioActual = $state<UsuarioDTO | null>(null);
	token = $state<string | null>(null);
	isLoading = $state<boolean>(false);
	authError = $state<string | null>(null);

	isAuthenticated = $derived(Boolean(this.token && this.usuarioActual));
	esAdmin = $derived(
		(this.usuarioActual?.rol ?? workspaceStore.currentRole) === RolUsuario.ADMINISTRADOR
	);
	esGenerador = $derived(
		(this.usuarioActual?.rol ?? workspaceStore.currentRole) === RolUsuario.GENERADOR
	);
	esReceptor = $derived(
		(this.usuarioActual?.rol ?? workspaceStore.currentRole) === RolUsuario.RECEPTOR
	);

	private sessionListeners: Array<() => void> = [];

	constructor() {
		this.token = ApiClient.getToken();
		this.usuarioActual = StorageService.loadSnapshot<UsuarioDTO | null>('auth_user', null);
		if (this.usuarioActual?.rol) {
			workspaceStore.currentRole = this.usuarioActual.rol;
		}

		ApiClient.onUnauthorized(() => {
			this.clearLocalSession();
			workspaceStore.showToast('Sesión expirada o no autorizada. Inicie sesión.', 'lock');
		});
	}

	onSessionSync(listener: () => void) {
		this.sessionListeners.push(listener);
	}

	private notifySessionListeners() {
		for (const fn of this.sessionListeners) {
			fn();
		}
	}

	private clearLocalSession() {
		this.token = null;
		this.usuarioActual = null;
		ApiClient.setToken(null);
		StorageService.removeSnapshot('auth_user');
	}

	async initSession(): Promise<void> {
		const savedToken = ApiClient.getToken();
		if (!savedToken) {
			return;
		}
		this.isLoading = true;
		const res = await ApiClient.getPerfil();
		this.isLoading = false;

		if (res.data) {
			this.usuarioActual = res.data;
			this.token = savedToken;
			StorageService.saveSnapshot('auth_user', res.data);
			workspaceStore.currentRole = res.data.rol;
			this.notifySessionListeners();
		} else if (!res.isOffline) {
			this.clearLocalSession();
		}
	}

	async login(username: string, password: string): Promise<boolean> {
		this.isLoading = true;
		this.authError = null;

		const res = await ApiClient.login({ username: username.trim(), password });
		this.isLoading = false;

		if (!res.data || !res.data.token) {
			this.authError = res.error || 'Credenciales inválidas o servidor no disponible.';
			workspaceStore.showToast(this.authError, 'warning');
			return false;
		}

		this.token = res.data.token;
		this.usuarioActual = res.data.user;
		ApiClient.setToken(res.data.token);
		StorageService.saveSnapshot('auth_user', res.data.user);
		workspaceStore.setRole(res.data.user.rol);
		workspaceStore.loginModalOpen = false;
		workspaceStore.showToast(
			`Sesión iniciada: ${res.data.user.username} (${res.data.user.rol})`,
			'verified_user'
		);
		this.notifySessionListeners();
		return true;
	}

	async logout(): Promise<void> {
		if (this.token) {
			await ApiClient.logout();
		}
		this.clearLocalSession();
		workspaceStore.showToast('Sesión cerrada exitosamente', 'logout');
		this.notifySessionListeners();
	}

	/**
	 * Permite cambiar de rol en la barra superior autenticando contra el usuario semilla
	 * correspondiente en el backend, o aplicando el rol en modo offline si el backend está apagado.
	 */
	async switchRoleOrQuickLogin(rol: RolUsuario): Promise<void> {
		const creds = DEFAULT_SEED_CREDENTIALS[rol];
		if (!creds) {
			workspaceStore.setRole(rol);
			return;
		}

		const res = await ApiClient.login(creds);
		if (res.data && res.data.token) {
			this.token = res.data.token;
			this.usuarioActual = res.data.user;
			ApiClient.setToken(res.data.token);
			StorageService.saveSnapshot('auth_user', res.data.user);
			workspaceStore.setRole(res.data.user.rol);
			this.notifySessionListeners();
		} else {
			// Modo offline o usuario semilla modificado: actualizar rol visual y notificar
			workspaceStore.setRole(rol);
			if (!res.isOffline && res.error) {
				workspaceStore.showToast(`Login rápido (${creds.username}): ${res.error}`, 'info');
			}
		}
	}
}

export const authStore = new AuthStore();

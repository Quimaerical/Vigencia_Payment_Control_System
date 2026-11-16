import { ApiClient } from '../services/apiClient';
import { StorageService } from '../services/storageService';
import { workspaceStore } from './workspaceStore.svelte';
import type { UsuarioDTO } from '../types/financial';
import { RolUsuario } from '@app/shared';

const AUTH_USER_SESSION_KEY = 'vigencia_auth_user';

const SENSITIVE_STORAGE_KEYS = [
	'auth_token',
	'auth_user',
	'current_role',
	'cat_usuarios',
	'cat_personas',
	'cat_proyectos',
	'cat_grupos_pago',
	'cat_asignaciones',
	'fin_proyectos',
	'fin_kpis',
	'fin_asientos',
	'fin_asignaciones',
	'fin_deudas_fifo',
	'fin_audit_diffs',
	'fin_deudas_raw',
	'fin_solicitudes_pago',
	'fin_pagos_raw',
	'fin_resumen_reporte',
	'fin_cajas_chicas',
	'fin_last_sync'
];

class AuthStore {
	usuarioActual = $state<UsuarioDTO | null>(null);
	token = $state<string | null>(null);
	isLoading = $state<boolean>(false);
	authError = $state<string | null>(null);

	isAuthenticated = $derived(Boolean(this.token && this.usuarioActual));
	esAdmin = $derived(this.isAuthenticated && this.usuarioActual?.rol === RolUsuario.ADMINISTRADOR);
	esGenerador = $derived(this.isAuthenticated && this.usuarioActual?.rol === RolUsuario.GENERADOR);
	esReceptor = $derived(this.isAuthenticated && this.usuarioActual?.rol === RolUsuario.RECEPTOR);

	private sessionListeners: Array<() => void> = [];
	private logoutListeners: Array<() => void> = [];

	constructor() {
		this.token = ApiClient.getToken();
		this.usuarioActual = this.loadSessionUser();
		if (this.usuarioActual?.rol) {
			workspaceStore.currentRole = this.usuarioActual.rol;
		} else {
			workspaceStore.currentRole = null;
		}

		ApiClient.onUnauthorized(() => {
			this.clearLocalSession();
			workspaceStore.loginModalOpen = true;
			workspaceStore.showToast('Sesión expirada o no autorizada. Inicie sesión.', 'lock');
		});
	}

	private loadSessionUser(): UsuarioDTO | null {
		if (typeof window === 'undefined') return null;
		try {
			const raw = window.sessionStorage.getItem(AUTH_USER_SESSION_KEY);
			return raw ? (JSON.parse(raw) as UsuarioDTO) : null;
		} catch {
			return null;
		}
	}

	private saveSessionUser(user: UsuarioDTO | null): void {
		if (typeof window === 'undefined') return;
		if (user) {
			window.sessionStorage.setItem(AUTH_USER_SESSION_KEY, JSON.stringify(user));
		} else {
			window.sessionStorage.removeItem(AUTH_USER_SESSION_KEY);
		}
	}

	onSessionSync(listener: () => void) {
		this.sessionListeners.push(listener);
	}

	onSessionClear(listener: () => void) {
		this.logoutListeners.push(listener);
	}

	private notifySessionListeners() {
		for (const fn of this.sessionListeners) {
			fn();
		}
	}

	private notifyLogoutListeners() {
		for (const fn of this.logoutListeners) {
			fn();
		}
	}

	private clearLocalSession() {
		this.token = null;
		this.usuarioActual = null;
		ApiClient.setToken(null);
		this.saveSessionUser(null);
		workspaceStore.setRole(null);

		for (const key of SENSITIVE_STORAGE_KEYS) {
			StorageService.removeSnapshot(key);
		}
		this.notifyLogoutListeners();
	}

	async initSession(): Promise<void> {
		const savedToken = ApiClient.getToken();
		if (!savedToken) {
			this.clearLocalSession();
			return;
		}
		this.isLoading = true;
		const res = await ApiClient.getPerfil();
		this.isLoading = false;

		if (res.data) {
			this.usuarioActual = res.data;
			this.token = savedToken;
			this.saveSessionUser(res.data);
			workspaceStore.setRole(res.data.rol);
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
		this.saveSessionUser(res.data.user);
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
		workspaceStore.loginModalOpen = true;
		workspaceStore.showToast('Sesión cerrada y caché local limpiada', 'logout');
	}
}

export const authStore = new AuthStore();

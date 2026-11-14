import { StorageService } from './storageService';
import type { ProcesarPagoDTO } from '../types/financial';

export interface ApiResponse<T> {
	data?: T;
	mensaje?: string;
	error?: string;
	codigo?: string;
}

/**
 * ApiClient con soporte de autenticación, interceptores de error y
 * resiliencia para el patrón Stale-While-Revalidate ante desconexión.
 */
export class ApiClient {
	private static getBaseUrl(): string {
		if (typeof window !== 'undefined') {
			// Soporta anulación por variable de entorno o fallback a localhost:3333
			return (
				(window as unknown as { __ENV_API_URL__?: string }).__ENV_API_URL__ ||
				'http://localhost:3333/api/v1'
			);
		}
		return 'http://localhost:3333/api/v1';
	}

	public static getToken(): string | null {
		return StorageService.loadSnapshot<string | null>('auth_token', null);
	}

	public static setToken(token: string | null): void {
		if (token) {
			StorageService.saveSnapshot('auth_token', token);
		} else {
			StorageService.removeSnapshot('auth_token');
		}
	}

	private static async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<{ data: T | null; isOffline: boolean; error?: string }> {
		const url = `${this.getBaseUrl()}${endpoint}`;
		const token = this.getToken();

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			...(options.headers as Record<string, string>)
		};

		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

			const response = await fetch(url, {
				...options,
				headers,
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorJson = await response.json().catch(() => null);
				const errorMsg =
					errorJson?.mensaje || errorJson?.message || `HTTP Error ${response.status}`;
				return { data: null, isOffline: false, error: errorMsg };
			}

			const json = await response.json();
			return { data: json as T, isOffline: false };
		} catch (err: unknown) {
			// Caída de red o servidor no disponible: activar modo offline transparente
			console.info(`[ApiClient] Red no disponible para '${endpoint}', usando modo offline:`, err);
			return { data: null, isOffline: true };
		}
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
}

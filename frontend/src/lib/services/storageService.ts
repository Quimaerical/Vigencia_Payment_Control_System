/**
 * StorageService: Gestor de persistencia en localStorage sin base de datos.
 * Proporciona soporte de instantáneas (snapshots) resilientes para el modo offline
 * y desacoplamiento ante desconexiones del backend.
 */
export class StorageService {
	private static isClient(): boolean {
		return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
	}

	public static saveSnapshot<T>(key: string, data: T): void {
		if (!this.isClient()) return;
		try {
			const serialized = JSON.stringify(data);
			window.localStorage.setItem(`vigencia_${key}`, serialized);
		} catch (e) {
			console.warn(`[StorageService] Error guardando snapshot para clave '${key}':`, e);
		}
	}

	public static loadSnapshot<T>(key: string, fallback: T): T {
		if (!this.isClient()) return fallback;
		try {
			const item = window.localStorage.getItem(`vigencia_${key}`);
			if (!item) return fallback;
			return JSON.parse(item) as T;
		} catch (e) {
			console.warn(`[StorageService] Error leyendo snapshot para clave '${key}':`, e);
			return fallback;
		}
	}

	public static removeSnapshot(key: string): void {
		if (!this.isClient()) return;
		window.localStorage.removeItem(`vigencia_${key}`);
	}

	public static clearAllSnapshots(): void {
		if (!this.isClient()) return;
		const keysToRemove: string[] = [];
		for (let i = 0; i < window.localStorage.length; i++) {
			const k = window.localStorage.key(i);
			if (k?.startsWith('vigencia_')) {
				keysToRemove.push(k);
			}
		}
		for (const k of keysToRemove) {
			window.localStorage.removeItem(k);
		}
	}
}

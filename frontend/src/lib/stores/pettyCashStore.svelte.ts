import { ApiClient } from '../services/apiClient';
import { StorageService } from '../services/storageService';
import { workspaceStore } from './workspaceStore.svelte';
import type {
	AbrirCajaChicaDTO,
	CajaChicaDTO,
	RendirValeCajaDTO,
	SolicitarValeCajaDTO
} from '../types/financial';

class PettyCashStore {
	cajasChicas = $state<CajaChicaDTO[]>([]);
	isLoading = $state<boolean>(false);

	constructor() {
		this.cajasChicas = StorageService.loadSnapshot('fin_cajas_chicas', []);
	}

	async syncAll(proyectoId?: number): Promise<void> {
		if (!ApiClient.getToken()) return;
		this.isLoading = true;
		const res = await ApiClient.listarCajasChicas(proyectoId ? { proyectoId } : undefined);
		this.isLoading = false;

		if (res.data?.data) {
			this.cajasChicas = res.data.data;
			StorageService.saveSnapshot('fin_cajas_chicas', this.cajasChicas);
		}
	}

	async abrirCaja(dto: AbrirCajaChicaDTO): Promise<boolean> {
		const res = await ApiClient.abrirCajaChica(dto);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al abrir caja chica', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Caja chica abierta exitosamente', 'check_circle');
		await this.syncAll();
		return true;
	}

	async cerrarCaja(cajaId: number): Promise<boolean> {
		const res = await ApiClient.cerrarCajaChica(cajaId);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al cerrar caja chica', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Caja chica cerrada', 'check_circle');
		await this.syncAll();
		return true;
	}

	async solicitarVale(cajaId: number, dto: SolicitarValeCajaDTO): Promise<boolean> {
		const res = await ApiClient.solicitarValeCaja(cajaId, dto);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al solicitar vale', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Vale solicitado', 'receipt');
		await this.syncAll();
		return true;
	}

	async aprobarVale(valeId: number): Promise<boolean> {
		const res = await ApiClient.aprobarValeCaja(valeId);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al aprobar vale', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Vale aprobado por Gerencia', 'verified');
		await this.syncAll();
		return true;
	}

	async rechazarVale(valeId: number, motivoRechazo: string): Promise<boolean> {
		const res = await ApiClient.rechazarValeCaja(valeId, motivoRechazo);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al rechazar vale', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Vale rechazado', 'block');
		await this.syncAll();
		return true;
	}

	async desembolsarVale(valeId: number): Promise<boolean> {
		const res = await ApiClient.desembolsarValeCaja(valeId);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al desembolsar vale', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Fondos del vale desembolsados', 'payments');
		await this.syncAll();
		return true;
	}

	async rendirVale(valeId: number, dto: RendirValeCajaDTO): Promise<boolean> {
		const res = await ApiClient.rendirValeCaja(valeId, dto);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al rendir vale', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Vale rendido con comprobante', 'done_all');
		await this.syncAll();
		return true;
	}

	async anularVale(valeId: number, motivoAnulacion: string): Promise<boolean> {
		const res = await ApiClient.anularValeCaja(valeId, motivoAnulacion);
		if (!res.data) {
			workspaceStore.showToast(res.error || 'Error al anular vale', 'warning');
			return false;
		}
		workspaceStore.showToast(res.data.mensaje || 'Vale anulado y saldo ajustado', 'gavel');
		await this.syncAll();
		return true;
	}
}

export const pettyCashStore = new PettyCashStore();

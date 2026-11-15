import { StorageService } from '../services/storageService';
import { MOCK_DEFAULT_MODULES } from '../services/mockData';
import type { ModuloWorkspace } from '../types/financial';
import { RolUsuario } from '@app/shared';

export type WorkspaceTab =
	'overview' | 'catalogs' | 'accrual' | 'requests' | 'fifo' | 'petty-cash' | 'ledger' | 'audit';

class WorkspaceStore {
	currentTab = $state<WorkspaceTab>('overview');
	currentRole = $state<RolUsuario>(RolUsuario.ADMINISTRADOR);
	isCustomizing = $state<boolean>(false);
	isDarkMode = $state<boolean>(true);
	isDrawerOpen = $state<boolean>(false);
	loginModalOpen = $state<boolean>(false);
	activeProjectId = $state<number>(1);
	modules = $state<ModuloWorkspace[]>([]);

	esAdmin = $derived(this.currentRole === RolUsuario.ADMINISTRADOR);
	esGenerador = $derived(this.currentRole === RolUsuario.GENERADOR);
	esReceptor = $derived(this.currentRole === RolUsuario.RECEPTOR);

	toast = $state<{
		visible: boolean;
		message: string;
		icon: string;
	}>({
		visible: false,
		message: '',
		icon: 'check_circle'
	});

	private toastTimeout: ReturnType<typeof setTimeout> | null = null;

	constructor() {
		this.init();
	}

	private init() {
		const cachedModules = StorageService.loadSnapshot<ModuloWorkspace[]>(
			'workspace_modules',
			MOCK_DEFAULT_MODULES
		);
		this.modules = cachedModules;

		const cachedTab = StorageService.loadSnapshot<WorkspaceTab>('current_tab', 'overview');
		this.currentTab = cachedTab;

		const cachedRole = StorageService.loadSnapshot<RolUsuario>(
			'current_role',
			RolUsuario.ADMINISTRADOR
		);
		this.currentRole = cachedRole;

		const cachedDark = StorageService.loadSnapshot<boolean>('dark_mode', true);
		this.isDarkMode = cachedDark;
		this.applyTheme(cachedDark);
	}

	switchTab(tab: WorkspaceTab) {
		this.currentTab = tab;
		StorageService.saveSnapshot('current_tab', tab);
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	setRole(role: RolUsuario) {
		this.currentRole = role;
		StorageService.saveSnapshot('current_role', role);
		this.showToast(`Perfil cambiado a: ${role.toUpperCase()}`, 'badge');
	}

	toggleTheme() {
		this.isDarkMode = !this.isDarkMode;
		StorageService.saveSnapshot('dark_mode', this.isDarkMode);
		this.applyTheme(this.isDarkMode);
		this.showToast(
			this.isDarkMode ? 'Modo Oscuro OLED activado' : 'Modo Claro activado',
			this.isDarkMode ? 'dark_mode' : 'light_mode'
		);
	}

	private applyTheme(dark: boolean) {
		if (typeof document !== 'undefined') {
			if (dark) {
				document.documentElement.classList.add('dark');
				document.documentElement.classList.remove('light');
			} else {
				document.documentElement.classList.remove('dark');
				document.documentElement.classList.add('light');
			}
		}
	}

	toggleCustomizeMode() {
		this.isCustomizing = !this.isCustomizing;
		if (this.isCustomizing) {
			this.showToast(
				'Modo edición activo: Reordena con [↑][↓] o elimina módulos',
				'dashboard_customize'
			);
		} else {
			this.showToast('Lienzo modular guardado exitosamente', 'check_circle');
		}
	}

	toggleDrawer() {
		this.isDrawerOpen = !this.isDrawerOpen;
	}

	moveModuleUp(id: string) {
		const index = this.modules.findIndex((m) => m.id === id);
		if (index > 0) {
			const temp = this.modules[index];
			this.modules[index] = this.modules[index - 1];
			this.modules[index - 1] = temp;
			this.updateModuleOrders();
			this.showToast('Módulo desplazado hacia arriba ⇡');
		} else {
			this.showToast('El módulo ya está en la posición superior', 'info');
		}
	}

	moveModuleDown(id: string) {
		const index = this.modules.findIndex((m) => m.id === id);
		if (index >= 0 && index < this.modules.length - 1) {
			const temp = this.modules[index];
			this.modules[index] = this.modules[index + 1];
			this.modules[index + 1] = temp;
			this.updateModuleOrders();
			this.showToast('Módulo desplazado hacia abajo ⇣');
		} else {
			this.showToast('El módulo ya está en la última posición', 'info');
		}
	}

	deleteModule(id: string) {
		const target = this.modules.find((m) => m.id === id);
		if (target) {
			target.habilitado = false;
			this.modules = this.modules.filter((m) => m.id !== id);
			this.persistModules();
			this.showToast(
				`"${target.nombre}" eliminado. Puedes restaurarlo desde el Catálogo`,
				'delete'
			);
		}
	}

	restoreModule(id: string) {
		const existing = this.modules.find((m) => m.id === id);
		if (existing) {
			this.showToast('El módulo ya se encuentra activo en el lienzo', 'info');
			return;
		}

		const defaultItem = MOCK_DEFAULT_MODULES.find((m: ModuloWorkspace) => m.id === id);
		if (defaultItem) {
			const restored: ModuloWorkspace = {
				...defaultItem,
				habilitado: true,
				orden: this.modules.length + 1
			};
			this.modules.push(restored);
			this.persistModules();
			this.showToast(`"${restored.nombre}" añadido al lienzo`, 'add_circle');
		}
	}

	private updateModuleOrders() {
		this.modules.forEach((m, idx) => {
			m.orden = idx + 1;
		});
		this.persistModules();
	}

	private persistModules() {
		StorageService.saveSnapshot('workspace_modules', this.modules);
	}

	showToast(message: string, icon = 'check_circle') {
		if (this.toastTimeout) {
			clearTimeout(this.toastTimeout);
		}
		this.toast = {
			visible: true,
			message,
			icon
		};
		this.toastTimeout = setTimeout(() => {
			this.toast.visible = false;
		}, 2800);
	}
}

export const workspaceStore = new WorkspaceStore();

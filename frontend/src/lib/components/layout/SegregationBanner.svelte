<script lang="ts">
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import { authStore } from '../../stores/authStore.svelte';
	import { RolUsuario } from '@app/shared';
</script>

<div
	class="chroma-glass-card text-body-sm mx-2 mt-2 flex items-center justify-between rounded-xl border-teal-700/20 bg-teal-50/85 p-2.5 text-teal-900 shadow-sm dark:border-teal-500/30 dark:bg-teal-950/40 dark:text-teal-200"
>
	<div class="flex items-center gap-2">
		<span class="material-symbols-outlined text-[18px] text-teal-700 dark:text-teal-300">
			gavel
		</span>
		<div class="leading-tight">
			<span class="block text-[12px] font-bold text-slate-900 dark:text-white">
				Segregación de Funciones Activa
			</span>
			<span class="text-[11px] text-teal-900/85 dark:text-teal-200/80">
				{#if !authStore.isAuthenticated || !workspaceStore.currentRole}
					Sin sesión autenticada. Inicie sesión para operar según su rol RBAC.
				{:else if workspaceStore.currentRole === RolUsuario.ADMINISTRADOR}
					Perfil <strong>Administrador</strong>: Supervisión, usuarios, grupos de pago y auditoría.
					Restringido para operar dinero.
				{:else if workspaceStore.currentRole === RolUsuario.GENERADOR}
					Perfil <strong>Generador</strong>: Gestión de proyectos, personas, asignaciones,
					causaciones y solicitudes de pago.
				{:else}
					Perfil <strong>Receptor / Tesorero</strong>: Aprobación de solicitudes/vales, desembolso
					FIFO y amortización contable.
				{/if}
			</span>
		</div>
	</div>
	<span
		class="ml-2 shrink-0 rounded border border-teal-700/25 bg-teal-600/12 px-1.5 py-0.5 font-mono text-[10px] font-bold text-teal-800 dark:border-teal-500/40 dark:bg-teal-500/20 dark:text-teal-300"
	>
		ISO §A.9
	</span>
</div>

<script lang="ts">
	import { workspaceStore } from '../../stores/workspaceStore.svelte';

	interface Props {
		variant: 'unauthenticated' | 'admin-restricted' | 'receptor-readonly' | 'generador-readonly';
		context?: string;
	}

	let { variant, context }: Props = $props();
</script>

{#if variant === 'unauthenticated'}
	<div
		class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/35 bg-amber-50/90 p-3 text-xs text-amber-950 dark:border-amber-400/35 dark:bg-amber-950/35 dark:text-amber-200"
	>
		<div class="flex items-center gap-2">
			<span class="material-symbols-outlined text-[18px] text-amber-700 dark:text-amber-300">
				lock
			</span>
			<span>
				<strong>Sesión requerida:</strong> Inicie sesión para consultar y operar
				{context ? ` en ${context}` : ' este módulo'}.
			</span>
		</div>
		<button
			type="button"
			class="rounded-lg bg-teal-600 px-3 py-1 font-bold text-white transition-colors hover:bg-teal-700 dark:bg-teal-500 dark:text-neutral-950 dark:hover:bg-teal-400"
			onclick={() => (workspaceStore.loginModalOpen = true)}
		>
			Iniciar Sesión
		</button>
	</div>
{:else if variant === 'admin-restricted'}
	<div
		class="flex items-start gap-2 rounded-xl border border-amber-500/35 bg-amber-50/90 p-3 text-xs text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-200"
	>
		<span class="material-symbols-outlined mt-0.5 text-[18px] text-amber-700 dark:text-amber-300">
			shield_lock
		</span>
		<div>
			<p class="font-bold">Acceso restringido por segregación de funciones (Rol: ADMINISTRADOR)</p>
			<p class="mt-0.5 text-[11px] opacity-90">
				{#if context}
					<strong class="font-semibold">{context}:</strong>
				{/if}
				Por política de control interno (ISO §A.9), el Administrador supervisa KPIs agregados en Overview,
				gestiona Usuarios/Grupos de Pago en Catálogos y audita trazas en Inspector JSONB; no consulta
				detalles operativos ni ejecuta transacciones monetarias.
			</p>
		</div>
	</div>
{:else if variant === 'receptor-readonly'}
	<div
		class="flex items-start gap-2 rounded-xl border border-teal-600/25 bg-teal-50/85 p-2.5 text-[11px] text-teal-950 dark:border-teal-400/30 dark:bg-teal-950/35 dark:text-teal-200"
	>
		<span class="material-symbols-outlined mt-0.5 text-[17px] text-teal-700 dark:text-teal-300">
			info
		</span>
		<div>
			<span class="font-bold">Permisos de Receptor / Tesorero:</span>
			<span>
				{#if context}
					En <strong>{context}</strong>, las
				{:else}
					Las
				{/if}
				acciones de creación o emisión son exclusivas del rol GENERADOR. Tu rol puede revisar, aprobar,
				rechazar, desembolsar, rendir o anular según corresponda.
			</span>
		</div>
	</div>
{:else}
	<div
		class="flex items-start gap-2 rounded-xl border border-teal-600/25 bg-teal-50/85 p-2.5 text-[11px] text-teal-950 dark:border-teal-400/30 dark:bg-teal-950/35 dark:text-teal-200"
	>
		<span class="material-symbols-outlined mt-0.5 text-[17px] text-teal-700 dark:text-teal-300">
			info
		</span>
		<div>
			<span class="font-bold">Restricción por Segregación RBAC:</span>
			<span>
				{#if context}
					<strong>{context}:</strong>
				{/if}
				Esta operación está reservada a otro rol autorizado por segregación de funciones (RECEPTOR para
				desembolsos FIFO y reversos; ADMINISTRADOR para Auditoría JSONB).
			</span>
		</div>
	</div>
{/if}

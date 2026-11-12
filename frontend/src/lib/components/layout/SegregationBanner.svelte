<script lang="ts">
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import { RolUsuario } from '@app/shared';
</script>

<div
	class="mx-2 mt-2 chroma-glass-card rounded-xl p-2.5 border-teal-500/30 bg-teal-950/40 text-body-sm text-teal-200 shadow-sm flex items-center justify-between"
>
	<div class="flex items-center gap-2">
		<span class="material-symbols-outlined text-teal-300 text-[18px]">gavel</span>
		<div class="leading-tight">
			<span class="font-bold text-[12px] block text-white">Segregación de Funciones Activa</span>
			<span class="text-[11px] text-teal-200/80">
				{#if workspaceStore.currentRole === RolUsuario.ADMINISTRADOR}
					Perfil <strong>Administrador</strong>: Supervisión y catálogos. Restringido para operar dinero.
				{:else if workspaceStore.currentRole === RolUsuario.GENERADOR}
					Perfil <strong>Generador</strong>: Registro de causaciones y solicitudes de pago.
				{:else}
					Perfil <strong>Receptor / Tesorero</strong>: Desembolso FIFO y amortización contable habilitada.
				{/if}
			</span>
		</div>
	</div>
	<span
		class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 border border-teal-500/40 font-bold shrink-0 text-teal-300 ml-2"
	>
		ISO §A.9
	</span>
</div>

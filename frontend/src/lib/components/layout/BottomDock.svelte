<script lang="ts">
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import type { WorkspaceTab } from '../../stores/workspaceStore.svelte';

	interface DockItem {
		id: WorkspaceTab;
		label: string;
		icon: string;
	}

	const dockItems: DockItem[] = [
		{ id: 'overview', label: 'Overview', icon: 'monitoring' },
		{ id: 'catalogs', label: 'Catálogos', icon: 'folder_managed' },
		{ id: 'accrual', label: 'Causación', icon: 'calculate' },
		{ id: 'requests', label: 'Solicitudes', icon: 'approval_delegation' },
		{ id: 'fifo', label: 'FIFO', icon: 'account_tree' },
		{ id: 'petty-cash', label: 'Caja Chica', icon: 'savings' },
		{ id: 'ledger', label: 'Mayor', icon: 'receipt_long' },
		{ id: 'audit', label: 'Auditoría', icon: 'policy' }
	];
</script>

<nav
	class="chroma-glass-dock fixed right-2 bottom-2 left-2 z-40 mx-auto grid w-[calc(100%-1rem)] max-w-4xl grid-cols-4 gap-1 rounded-2xl px-2 py-1.5 shadow-2xl backdrop-blur-3xl sm:flex sm:items-center sm:justify-around sm:overflow-x-auto md:w-[86%] lg:w-3/4"
>
	{#each dockItems as item (item.id)}
		<button
			class="interactive-spring flex flex-col items-center justify-center rounded-xl px-1.5 py-1 transition-all duration-200 sm:px-2 {workspaceStore.currentTab ===
			item.id
				? 'scale-[1.03] bg-teal-600 font-bold text-white shadow-[0_0_12px_rgba(20,184,166,0.35)] dark:bg-teal-500 dark:text-neutral-950'
				: 'text-slate-600 hover:text-teal-700 dark:text-neutral-400 dark:hover:text-teal-300'}"
			onclick={() => workspaceStore.switchTab(item.id)}
			title={item.label}
		>
			<span class="material-symbols-outlined text-[18px]">{item.icon}</span>
			<span class="mt-0.5 font-mono text-[9px] font-medium tracking-tight">{item.label}</span>
		</button>
	{/each}
</nav>

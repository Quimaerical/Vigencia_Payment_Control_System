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
		{ id: 'ledger', label: 'Ledger', icon: 'receipt_long' },
		{ id: 'accrual', label: 'Accrual', icon: 'calculate' },
		{ id: 'fifo', label: 'FIFO', icon: 'account_tree' },
		{ id: 'audit', label: 'Audit', icon: 'policy' }
	];
</script>

<nav
	class="fixed bottom-2 left-2 right-2 z-40 chroma-glass-dock rounded-2xl px-2 py-1.5 flex justify-around items-center max-w-md mx-auto shadow-2xl backdrop-blur-3xl"
>
	{#each dockItems as item (item.id)}
		<button
			class="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 interactive-spring {workspaceStore.currentTab ===
			item.id
				? 'bg-teal-500 text-neutral-950 font-bold shadow-[0_0_12px_rgba(20,184,166,0.35)] scale-105'
				: 'text-neutral-400 hover:text-teal-300'}"
			onclick={() => workspaceStore.switchTab(item.id)}
			title={item.label}
		>
			<span class="material-symbols-outlined text-[19px]">{item.icon}</span>
			<span class="text-[9px] font-mono font-medium tracking-tight mt-0.5">{item.label}</span>
		</button>
	{/each}
</nav>

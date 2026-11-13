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
	class="chroma-glass-dock fixed right-2 bottom-2 left-2 z-40 mx-auto flex max-w-md items-center justify-around rounded-2xl px-2 py-1.5 shadow-2xl backdrop-blur-3xl"
>
	{#each dockItems as item (item.id)}
		<button
			class="interactive-spring flex flex-col items-center justify-center rounded-xl px-2.5 py-1 transition-all duration-200 {workspaceStore.currentTab ===
			item.id
				? 'scale-105 bg-teal-500 font-bold text-neutral-950 shadow-[0_0_12px_rgba(20,184,166,0.35)]'
				: 'text-neutral-400 hover:text-teal-300'}"
			onclick={() => workspaceStore.switchTab(item.id)}
			title={item.label}
		>
			<span class="material-symbols-outlined text-[19px]">{item.icon}</span>
			<span class="mt-0.5 font-mono text-[9px] font-medium tracking-tight">{item.label}</span>
		</button>
	{/each}
</nav>

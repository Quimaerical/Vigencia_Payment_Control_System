<script lang="ts">
	import { workspaceStore } from '#lib/stores/workspaceStore.svelte';
	import { financialStore } from '#lib/stores/financialStore.svelte';

	import AmbientAurora from '#lib/components/layout/AmbientAurora.svelte';
	import TopHeader from '#lib/components/layout/TopHeader.svelte';
	import SegregationBanner from '#lib/components/layout/SegregationBanner.svelte';
	import BottomDock from '#lib/components/layout/BottomDock.svelte';
	import Toast from '#lib/components/layout/Toast.svelte';

	import OverviewView from '#lib/components/views/OverviewView.svelte';
	import LedgerView from '#lib/components/views/LedgerView.svelte';
	import AccrualView from '#lib/components/views/AccrualView.svelte';
	import FifoView from '#lib/components/views/FifoView.svelte';
	import AuditView from '#lib/components/views/AuditView.svelte';

	import ModuleCatalogDrawer from '#lib/components/modals/ModuleCatalogDrawer.svelte';
	import VoidLedgerModal from '#lib/components/modals/VoidLedgerModal.svelte';
	import FifoPaymentModal from '#lib/components/modals/FifoPaymentModal.svelte';
</script>

<svelte:head>
	<title>Vigencia Core — Sistema de Control de Pagos</title>
</svelte:head>

<!-- 1. Ambient Iridescent Aurora Canvas (z-0 pointer-events-none) -->
<AmbientAurora />

<!-- 2. Toast Notifications (z-50) -->
<Toast />

<!-- 3. Modals and Slide-Over Drawer (z-50) -->
<ModuleCatalogDrawer />
<VoidLedgerModal />
<FifoPaymentModal />

<!-- 4. Main App Container (relative z-10) -->
<div class="relative z-10 flex flex-col min-h-screen pb-28 max-w-2xl mx-auto" id="appRoot">
	<!-- Top Sticky App Bar (z-30) -->
	<TopHeader />

	<!-- Segregation of Duties Security Banner -->
	<SegregationBanner />

	<!-- Stale-While-Revalidate Offline Status Indicator -->
	{#if financialStore.isOffline}
		<div class="mx-2 mt-1 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[10px] font-mono flex items-center justify-between">
			<span class="flex items-center gap-1.5">
				<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
				<span>Modo Offline: Datos servidos desde la caché local sin base de datos</span>
			</span>
			<span>{financialStore.lastSyncTimestamp}</span>
		</div>
	{/if}

	<!-- Main Multi-View Tabs Content -->
	<main class="px-2.5 mt-2 space-y-3.5" id="viewContainer">
		{#if workspaceStore.currentTab === 'overview'}
			<OverviewView />
		{:else if workspaceStore.currentTab === 'ledger'}
			<LedgerView />
		{:else if workspaceStore.currentTab === 'accrual'}
			<AccrualView />
		{:else if workspaceStore.currentTab === 'fifo'}
			<FifoView />
		{:else if workspaceStore.currentTab === 'audit'}
			<AuditView />
		{/if}
	</main>

	<!-- 5. Full Multi-View Navigation Dock (fixed bottom-2 z-40) -->
	<BottomDock />
</div>

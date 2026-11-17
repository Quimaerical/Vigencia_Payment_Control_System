<script lang="ts">
	import { onMount } from 'svelte';
	import { workspaceStore } from '#lib/stores/workspaceStore.svelte';
	import { financialStore } from '#lib/stores/financialStore.svelte';
	import { authStore } from '#lib/stores/authStore.svelte';

	import AmbientAurora from '#lib/components/layout/AmbientAurora.svelte';
	import TopHeader from '#lib/components/layout/TopHeader.svelte';
	import SegregationBanner from '#lib/components/layout/SegregationBanner.svelte';
	import BottomDock from '#lib/components/layout/BottomDock.svelte';
	import Toast from '#lib/components/layout/Toast.svelte';

	import OverviewView from '#lib/components/views/OverviewView.svelte';
	import CatalogsView from '#lib/components/views/CatalogsView.svelte';
	import AccrualView from '#lib/components/views/AccrualView.svelte';
	import RequestsView from '#lib/components/views/RequestsView.svelte';
	import FifoView from '#lib/components/views/FifoView.svelte';
	import PettyCashView from '#lib/components/views/PettyCashView.svelte';
	import LedgerView from '#lib/components/views/LedgerView.svelte';
	import AuditView from '#lib/components/views/AuditView.svelte';

	import ModuleCatalogDrawer from '#lib/components/modals/ModuleCatalogDrawer.svelte';
	import VoidLedgerModal from '#lib/components/modals/VoidLedgerModal.svelte';
	import FifoPaymentModal from '#lib/components/modals/FifoPaymentModal.svelte';
	import LoginModal from '#lib/components/modals/LoginModal.svelte';

	onMount(async () => {
		await authStore.initSession();
	});
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
<LoginModal />

<!-- 4. Main App Container (relative z-10) -->
<div
	class="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] flex-col pb-28 md:w-[90%] lg:w-[82%] xl:w-3/4"
	id="appRoot"
>
	<!-- Top Sticky App Bar (z-30) -->
	<TopHeader />

	<!-- Segregation of Duties Security Banner -->
	<SegregationBanner />

	<!-- Stale-While-Revalidate Offline Status Indicator -->
	{#if financialStore.isOffline}
		<div
			class="mx-2 mt-1 flex items-center justify-between rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1 font-mono text-[10px] text-amber-300"
		>
			<span class="flex items-center gap-1.5">
				<span class="h-2 w-2 animate-pulse rounded-full bg-amber-400"></span>
				<span>Modo Offline: Datos servidos desde la caché local sin base de datos</span>
			</span>
			<span>{financialStore.lastSyncTimestamp}</span>
		</div>
	{/if}

	<!-- Main Multi-View Tabs Content -->
	<main class="mt-2 space-y-3.5 px-2.5" id="viewContainer">
		{#if workspaceStore.currentTab === 'overview'}
			<OverviewView />
		{:else if workspaceStore.currentTab === 'catalogs'}
			<CatalogsView />
		{:else if workspaceStore.currentTab === 'accrual'}
			<AccrualView />
		{:else if workspaceStore.currentTab === 'requests'}
			<RequestsView />
		{:else if workspaceStore.currentTab === 'fifo'}
			<FifoView />
		{:else if workspaceStore.currentTab === 'petty-cash'}
			<PettyCashView />
		{:else if workspaceStore.currentTab === 'ledger'}
			<LedgerView />
		{:else if workspaceStore.currentTab === 'audit'}
			<AuditView />
		{/if}
	</main>

	<!-- 5. Full Multi-View Navigation Dock (fixed bottom-2 z-40) -->
	<BottomDock />
</div>

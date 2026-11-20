<script lang="ts">
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
</script>

<div
	role="status"
	class="pointer-events-none fixed bottom-32 left-1/2 z-50 w-max max-w-[92vw] -translate-x-1/2 transform transition-all duration-200 sm:bottom-24 {workspaceStore
		.toast.visible
		? 'translate-y-0 opacity-100'
		: 'translate-y-3 opacity-0'}"
>
	<div
		class="surface-modal flex items-center gap-2.5 rounded-2xl border-teal-600/35 px-4 py-2.5 text-xs font-semibold shadow-[0_8px_28px_rgba(15,118,110,0.22)] backdrop-blur-2xl dark:border-teal-400/40 dark:bg-black/90 dark:shadow-[0_0_24px_rgba(20,184,166,0.3)]"
	>
		<span class="material-symbols-outlined text-lg text-teal-700 dark:text-teal-300">
			{workspaceStore.toast.icon}
		</span>
		<span>{workspaceStore.toast.message}</span>
	</div>
</div>

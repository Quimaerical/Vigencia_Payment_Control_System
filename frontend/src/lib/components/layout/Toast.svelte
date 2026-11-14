<script lang="ts">
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
</script>

<div
	class="pointer-events-none fixed top-4 left-1/2 z-50 -translate-x-1/2 transform transition-all duration-300 {workspaceStore
		.toast.visible
		? 'translate-y-0 opacity-100'
		: '-translate-y-24 opacity-0'}"
>
	<div
		class="flex items-center gap-2.5 rounded-2xl border border-teal-400/40 bg-black/90 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_0_24px_rgba(20,184,166,0.3)] backdrop-blur-2xl"
	>
		<span class="material-symbols-outlined text-lg text-teal-300">
			{workspaceStore.toast.icon}
		</span>
		<span>{workspaceStore.toast.message}</span>
	</div>
</div>

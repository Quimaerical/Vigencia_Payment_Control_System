<script lang="ts">
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
</script>

<div
	class="fixed top-4 left-1/2 -translate-x-1/2 z-50 transform transition-all duration-300 pointer-events-none {workspaceStore
		.toast.visible
		? 'translate-y-0 opacity-100'
		: '-translate-y-24 opacity-0'}"
>
	<div
		class="px-4 py-2.5 rounded-2xl bg-black/90 text-white backdrop-blur-2xl border border-teal-400/40 shadow-[0_0_24px_rgba(20,184,166,0.3)] flex items-center gap-2.5 text-xs font-semibold"
	>
		<span class="material-symbols-outlined text-teal-300 text-lg">
			{workspaceStore.toast.icon}
		</span>
		<span>{workspaceStore.toast.message}</span>
	</div>
</div>

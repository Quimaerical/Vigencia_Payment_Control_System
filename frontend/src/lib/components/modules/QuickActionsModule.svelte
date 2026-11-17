<script lang="ts">
	import ModularCardWrapper from './ModularCardWrapper.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
</script>

<ModularCardWrapper id="mod-quick-actions" title="Atajos Frecuentes">
	<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
		<button
			class="interactive-spring group flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-950/70 p-2.5 text-left transition-all hover:border-teal-400/50"
			onclick={() => workspaceStore.switchTab('accrual')}
		>
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-400/25 bg-teal-400/15 text-teal-300 shadow-[0_0_8px_rgba(45,212,191,0.2)] transition-transform group-hover:scale-105"
			>
				<span class="material-symbols-outlined text-[18px]">calculate</span>
			</div>
			<div class="truncate">
				<p class="truncate text-[11px] leading-tight font-bold text-white">Calcular Prorrateo</p>
				<p class="truncate text-[10px] text-neutral-400">Causación de honorarios</p>
			</div>
		</button>

		<button
			class="interactive-spring group flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-950/70 p-2.5 text-left transition-all hover:border-teal-400/50"
			onclick={() => workspaceStore.switchTab('fifo')}
		>
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-400/25 bg-teal-500/15 text-teal-300 shadow-[0_0_8px_rgba(20,184,166,0.2)] transition-transform group-hover:scale-105"
			>
				<span class="material-symbols-outlined text-[18px]">account_tree</span>
			</div>
			<div class="truncate">
				<p class="truncate text-[11px] leading-tight font-bold text-white">Desembolso FIFO</p>
				<p class="truncate text-[10px] text-neutral-400">Antigüedad estricta</p>
			</div>
		</button>

		<button
			class="interactive-spring group flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-950/70 p-2.5 text-left transition-all hover:border-teal-400/50"
			onclick={() => workspaceStore.switchTab('ledger')}
		>
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-400/25 bg-teal-400/15 text-teal-300 shadow-[0_0_8px_rgba(45,212,191,0.2)] transition-transform group-hover:scale-105"
			>
				<span class="material-symbols-outlined text-[18px]">receipt_long</span>
			</div>
			<div class="truncate">
				<p class="truncate text-[11px] leading-tight font-bold text-white">Libro Mayor</p>
				<p class="truncate text-[10px] text-neutral-400">Auditar asientos</p>
			</div>
		</button>

		<button
			class="interactive-spring group flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-950/70 p-2.5 text-left transition-all hover:border-teal-400/50"
			onclick={() => workspaceStore.switchTab('audit')}
		>
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-500/15 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)] transition-transform group-hover:scale-105"
			>
				<span class="material-symbols-outlined text-[18px]">policy</span>
			</div>
			<div class="truncate">
				<p class="truncate text-[11px] leading-tight font-bold text-white">Inspector JSONB</p>
				<p class="truncate text-[10px] text-neutral-400">Diferenciales SQL</p>
			</div>
		</button>
	</div>
</ModularCardWrapper>

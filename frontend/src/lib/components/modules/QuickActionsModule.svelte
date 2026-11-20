<script lang="ts">
	import ModularCardWrapper from './ModularCardWrapper.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
</script>

<ModularCardWrapper id="mod-quick-actions" title="Atajos Frecuentes">
	<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
		<button
			class="surface-subcard interactive-spring group flex items-center gap-2 rounded-xl p-2.5 text-left transition-all hover:border-teal-600/45 dark:hover:border-teal-400/50"
			onclick={() => workspaceStore.switchTab('accrual')}
		>
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-600/25 bg-teal-600/12 text-teal-800 shadow-[0_0_8px_rgba(45,212,191,0.15)] transition-transform group-hover:scale-105 dark:border-teal-400/25 dark:bg-teal-400/15 dark:text-teal-300 dark:shadow-[0_0_8px_rgba(45,212,191,0.2)]"
			>
				<span class="material-symbols-outlined text-[18px]">calculate</span>
			</div>
			<div class="truncate">
				<p class="truncate text-[11px] leading-tight font-bold text-slate-900 dark:text-white">
					Calcular Prorrateo
				</p>
				<p class="truncate text-[10px] text-slate-600 dark:text-neutral-400">
					Causación de honorarios
				</p>
			</div>
		</button>

		<button
			class="surface-subcard interactive-spring group flex items-center gap-2 rounded-xl p-2.5 text-left transition-all hover:border-teal-600/45 dark:hover:border-teal-400/50"
			onclick={() => workspaceStore.switchTab('fifo')}
		>
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-600/25 bg-teal-600/12 text-teal-800 shadow-[0_0_8px_rgba(20,184,166,0.15)] transition-transform group-hover:scale-105 dark:border-teal-400/25 dark:bg-teal-500/15 dark:text-teal-300 dark:shadow-[0_0_8px_rgba(20,184,166,0.2)]"
			>
				<span class="material-symbols-outlined text-[18px]">account_tree</span>
			</div>
			<div class="truncate">
				<p class="truncate text-[11px] leading-tight font-bold text-slate-900 dark:text-white">
					Desembolso FIFO
				</p>
				<p class="truncate text-[10px] text-slate-600 dark:text-neutral-400">Antigüedad estricta</p>
			</div>
		</button>

		<button
			class="surface-subcard interactive-spring group flex items-center gap-2 rounded-xl p-2.5 text-left transition-all hover:border-teal-600/45 dark:hover:border-teal-400/50"
			onclick={() => workspaceStore.switchTab('ledger')}
		>
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-600/25 bg-teal-600/12 text-teal-800 shadow-[0_0_8px_rgba(45,212,191,0.15)] transition-transform group-hover:scale-105 dark:border-teal-400/25 dark:bg-teal-400/15 dark:text-teal-300 dark:shadow-[0_0_8px_rgba(45,212,191,0.2)]"
			>
				<span class="material-symbols-outlined text-[18px]">receipt_long</span>
			</div>
			<div class="truncate">
				<p class="truncate text-[11px] leading-tight font-bold text-slate-900 dark:text-white">
					Libro Mayor
				</p>
				<p class="truncate text-[10px] text-slate-600 dark:text-neutral-400">Auditar asientos</p>
			</div>
		</button>

		<button
			class="surface-subcard interactive-spring group flex items-center gap-2 rounded-xl p-2.5 text-left transition-all hover:border-teal-600/45 dark:hover:border-teal-400/50"
			onclick={() => workspaceStore.switchTab('audit')}
		>
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-600/25 bg-emerald-500/12 text-emerald-700 shadow-[0_0_8px_rgba(16,185,129,0.15)] transition-transform group-hover:scale-105 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-400 dark:shadow-[0_0_8px_rgba(16,185,129,0.2)]"
			>
				<span class="material-symbols-outlined text-[18px]">policy</span>
			</div>
			<div class="truncate">
				<p class="truncate text-[11px] leading-tight font-bold text-slate-900 dark:text-white">
					Inspector JSONB
				</p>
				<p class="truncate text-[10px] text-slate-600 dark:text-neutral-400">Diferenciales SQL</p>
			</div>
		</button>
	</div>
</ModularCardWrapper>

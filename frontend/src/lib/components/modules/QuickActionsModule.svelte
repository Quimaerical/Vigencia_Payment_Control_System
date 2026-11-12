<script lang="ts">
	import ModularCardWrapper from './ModularCardWrapper.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
</script>

<ModularCardWrapper id="mod-quick-actions" title="Atajos Frecuentes">
	<div class="grid grid-cols-2 gap-2">
		<button
			class="p-2.5 rounded-xl bg-neutral-950/70 border border-white/10 hover:border-teal-400/50 text-left transition-all flex items-center gap-2 interactive-spring group"
			onclick={() => workspaceStore.switchTab('accrual')}
		>
			<div
				class="w-8 h-8 rounded-lg bg-teal-400/15 text-teal-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-teal-400/25 shadow-[0_0_8px_rgba(45,212,191,0.2)]"
			>
				<span class="material-symbols-outlined text-[18px]">calculate</span>
			</div>
			<div class="truncate">
				<p class="text-[11px] font-bold text-white leading-tight truncate">Calcular Prorrateo</p>
				<p class="text-[10px] text-neutral-400 truncate">Causación de honorarios</p>
			</div>
		</button>

		<button
			class="p-2.5 rounded-xl bg-neutral-950/70 border border-white/10 hover:border-teal-400/50 text-left transition-all flex items-center gap-2 interactive-spring group"
			onclick={() => workspaceStore.switchTab('fifo')}
		>
			<div
				class="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-teal-400/25 shadow-[0_0_8px_rgba(20,184,166,0.2)]"
			>
				<span class="material-symbols-outlined text-[18px]">account_tree</span>
			</div>
			<div class="truncate">
				<p class="text-[11px] font-bold text-white leading-tight truncate">Desembolso FIFO</p>
				<p class="text-[10px] text-neutral-400 truncate">Antigüedad estricta</p>
			</div>
		</button>

		<button
			class="p-2.5 rounded-xl bg-neutral-950/70 border border-white/10 hover:border-teal-400/50 text-left transition-all flex items-center gap-2 interactive-spring group"
			onclick={() => workspaceStore.switchTab('ledger')}
		>
			<div
				class="w-8 h-8 rounded-lg bg-teal-400/15 text-teal-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-teal-400/25 shadow-[0_0_8px_rgba(45,212,191,0.2)]"
			>
				<span class="material-symbols-outlined text-[18px]">receipt_long</span>
			</div>
			<div class="truncate">
				<p class="text-[11px] font-bold text-white leading-tight truncate">Libro Mayor</p>
				<p class="text-[10px] text-neutral-400 truncate">Auditar asientos</p>
			</div>
		</button>

		<button
			class="p-2.5 rounded-xl bg-neutral-950/70 border border-white/10 hover:border-teal-400/50 text-left transition-all flex items-center gap-2 interactive-spring group"
			onclick={() => workspaceStore.switchTab('audit')}
		>
			<div
				class="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-emerald-400/25 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
			>
				<span class="material-symbols-outlined text-[18px]">policy</span>
			</div>
			<div class="truncate">
				<p class="text-[11px] font-bold text-white leading-tight truncate">Inspector JSONB</p>
				<p class="text-[10px] text-neutral-400 truncate">Diferenciales SQL</p>
			</div>
		</button>
	</div>
</ModularCardWrapper>

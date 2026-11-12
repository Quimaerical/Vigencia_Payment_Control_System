<script lang="ts">
	import ModularCardWrapper from './ModularCardWrapper.svelte';
</script>

<ModularCardWrapper id="mod-petty-cash" title="Caja Chica & Vales de Custodia">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div
				class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/25"
			>
				<span class="material-symbols-outlined text-[18px]">receipt</span>
			</div>
			<div>
				<p class="text-xs font-bold text-white">Vale de Custodia Activo #042</p>
				<p class="text-[10px] text-neutral-400 font-mono">Compra reactivos Sigma-Aldrich</p>
			</div>
		</div>
		<span class="font-mono text-[13px] font-bold text-teal-300">$320.00 USD</span>
	</div>
</ModularCardWrapper>

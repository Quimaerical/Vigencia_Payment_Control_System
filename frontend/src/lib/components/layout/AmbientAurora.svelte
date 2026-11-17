<script lang="ts">
	// AmbientAurora provides continuous ambient floating iridescent aurora mesh
	// Strictly placed at z-0 with pointer-events-none to avoid any mouse event interception.
</script>

<div class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
	<!-- Organic Iridescent Conic & Radial Base Mesh -->
	<div
		class="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen blur-[90px]"
		style="background: radial-gradient(circle at 15% 10%, rgba(14, 165, 233, 0.65) 0%, transparent 48%), radial-gradient(circle at 85% 18%, rgba(250, 204, 21, 0.55) 0%, transparent 45%), radial-gradient(circle at 80% 48%, rgba(168, 85, 247, 0.6) 0%, transparent 50%), radial-gradient(circle at 12% 58%, rgba(16, 185, 129, 0.55) 0%, transparent 45%), radial-gradient(circle at 65% 85%, rgba(244, 63, 94, 0.6) 0%, transparent 52%), radial-gradient(circle at 35% 42%, rgba(45, 212, 191, 0.35) 0%, transparent 40%);"
	></div>

	<!-- Cloud 1: Top-Left Cyan / Sky Blue drifting inwards -->
	<div
		class="aurora-dark-1 pointer-events-none absolute -top-16 -left-12 h-[380px] w-[380px] rounded-full opacity-70 mix-blend-screen blur-[80px]"
		style="background: radial-gradient(circle, rgba(14, 165, 233, 0.8) 0%, rgba(56, 189, 248, 0.5) 45%, transparent 75%);"
	></div>

	<!-- Cloud 2: Upper-Right Warm Amber / Yellow blooming diagonally -->
	<div
		class="aurora-dark-2 pointer-events-none absolute top-10 -right-20 h-[400px] w-[420px] rounded-full opacity-65 mix-blend-screen blur-[80px]"
		style="background: radial-gradient(circle, rgba(250, 204, 21, 0.75) 0%, rgba(245, 158, 11, 0.45) 48%, transparent 75%);"
	></div>

	<!-- Cloud 3: Mid-Right Electric Purple / Violet glowing towards center -->
	<div
		class="aurora-dark-3 pointer-events-none absolute top-[36%] right-[-10%] h-[440px] w-[440px] rounded-full opacity-70 mix-blend-screen blur-[85px]"
		style="background: radial-gradient(circle, rgba(168, 85, 247, 0.75) 0%, rgba(139, 92, 246, 0.5) 50%, transparent 75%);"
	></div>

	<!-- Cloud 4: Mid-Left Emerald / Mint radiant wash -->
	<div
		class="aurora-dark-1 pointer-events-none absolute top-[48%] -left-16 h-[390px] w-[390px] rounded-full opacity-70 mix-blend-screen blur-[80px]"
		style="background: radial-gradient(circle, rgba(16, 185, 129, 0.7) 0%, rgba(45, 212, 191, 0.45) 45%, transparent 75%);"
	></div>

	<!-- Cloud 5: Bottom-Center/Right Coral-Rose Flare -->
	<div
		class="aurora-dark-2 pointer-events-none absolute right-[15%] bottom-[-5%] h-[420px] w-[420px] rounded-full opacity-75 mix-blend-screen blur-[85px]"
		style="background: radial-gradient(circle, rgba(244, 63, 94, 0.8) 0%, rgba(239, 68, 68, 0.45) 50%, transparent 75%);"
	></div>

	<!-- Dark atmospheric overlay to preserve luminous contrast & prevent flat stripes -->
	<div class="absolute inset-0 bg-black/40 backdrop-blur-[1.5px]"></div>
	<div class="grid-pattern absolute inset-0 opacity-30"></div>

	<!-- Decorative Orbital Rings & Quantum Watermark -->
	<div
		class="pointer-events-none absolute top-28 right-8 h-64 w-64 animate-[spin_40s_linear_infinite] rounded-full border border-teal-400/25"
	>
		<div
			class="absolute -top-1.5 left-1/2 h-3 w-3 rounded-full bg-teal-400 opacity-90 shadow-[0_0_14px_#2DD4BF]"
		></div>
	</div>
	<div
		class="pointer-events-none absolute top-[48%] left-4 h-72 w-72 animate-[spin_60s_linear_infinite_reverse] rounded-full border border-fuchsia-500/25"
	>
		<div
			class="absolute -bottom-1.5 left-1/3 h-3 w-3 rounded-full bg-fuchsia-400 opacity-90 shadow-[0_0_14px_#E879F9]"
		></div>
	</div>
	<div
		class="pointer-events-none absolute top-[18%] left-1/2 -translate-x-1/2 font-mono text-4xl font-black whitespace-nowrap text-teal-400/[0.05] blur-[3.5px] select-none sm:text-6xl sm:blur-[4px] lg:text-[84px]"
	>
		Ψ(r,t) = Ae^(i(k·r - ωt))
	</div>
</div>

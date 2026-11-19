import type { Action } from 'svelte/action';

export interface PointerSkewOptions {
	disabled?: boolean;
}

const MAX_TRANSLATE_X_PX = 3.5;
const MAX_TRANSLATE_Y_PX = 2.5;
const MAX_SKEW_X_DEG = 0.35;
const MAX_SKEW_Y_DEG = 0.22;
const HOVER_SCALE = 1.003;
const LERP_EASE = 0.085;
const EPSILON = 0.0015;

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/**
 * Aplica un desplazamiento sutil de pocos píxeles y una inclinación (skew)
 * suave siguiendo la posición del puntero respecto al centro del bloque modular.
 */
export const pointerSkew: Action<HTMLElement, PointerSkewOptions | undefined> = (
	node,
	initialOptions
) => {
	let isDisabled = Boolean(initialOptions?.disabled);
	let rafId: number | null = null;

	const current = { tx: 0, ty: 0, sx: 0, sy: 0, scale: 1, glow: 0 };
	const target = { tx: 0, ty: 0, sx: 0, sy: 0, scale: 1, glow: 0 };

	const prefersReducedMotion = () =>
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function applyStyles() {
		node.style.setProperty('--card-tx', `${current.tx.toFixed(3)}px`);
		node.style.setProperty('--card-ty', `${current.ty.toFixed(3)}px`);
		node.style.setProperty('--card-skew-x', `${current.sx.toFixed(3)}deg`);
		node.style.setProperty('--card-skew-y', `${current.sy.toFixed(3)}deg`);
		node.style.setProperty('--card-scale', current.scale.toFixed(4));
		node.style.setProperty('--glow-opacity', current.glow.toFixed(3));
	}

	function resetStyles() {
		node.style.removeProperty('--card-tx');
		node.style.removeProperty('--card-ty');
		node.style.removeProperty('--card-skew-x');
		node.style.removeProperty('--card-skew-y');
		node.style.removeProperty('--card-scale');
		node.style.removeProperty('--glow-opacity');
		node.style.removeProperty('--glow-x');
		node.style.removeProperty('--glow-y');
	}

	function tick() {
		current.tx += (target.tx - current.tx) * LERP_EASE;
		current.ty += (target.ty - current.ty) * LERP_EASE;
		current.sx += (target.sx - current.sx) * LERP_EASE;
		current.sy += (target.sy - current.sy) * LERP_EASE;
		current.scale += (target.scale - current.scale) * LERP_EASE;
		current.glow += (target.glow - current.glow) * LERP_EASE;

		const settled =
			Math.abs(target.tx - current.tx) < EPSILON &&
			Math.abs(target.ty - current.ty) < EPSILON &&
			Math.abs(target.sx - current.sx) < EPSILON &&
			Math.abs(target.sy - current.sy) < EPSILON &&
			Math.abs(target.scale - current.scale) < EPSILON &&
			Math.abs(target.glow - current.glow) < EPSILON;

		if (settled) {
			Object.assign(current, target);
			applyStyles();
			rafId = null;
			return;
		}

		applyStyles();
		rafId = requestAnimationFrame(tick);
	}

	function scheduleTick() {
		if (rafId === null) {
			rafId = requestAnimationFrame(tick);
		}
	}

	function resetTargets() {
		target.tx = 0;
		target.ty = 0;
		target.sx = 0;
		target.sy = 0;
		target.scale = 1;
		target.glow = 0;
		scheduleTick();
	}

	function handlePointerMove(event: PointerEvent) {
		if (isDisabled || event.pointerType === 'touch' || prefersReducedMotion()) {
			return;
		}

		const rect = node.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) {
			return;
		}

		const nx = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
		const ny = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);

		target.tx = nx * MAX_TRANSLATE_X_PX;
		target.ty = ny * MAX_TRANSLATE_Y_PX;
		target.sx = nx * MAX_SKEW_X_DEG;
		target.sy = ny * MAX_SKEW_Y_DEG;
		target.scale = HOVER_SCALE;
		target.glow = 1;

		node.style.setProperty('--glow-x', `${((nx + 1) * 50).toFixed(2)}%`);
		node.style.setProperty('--glow-y', `${((ny + 1) * 50).toFixed(2)}%`);

		scheduleTick();
	}

	function handlePointerLeave() {
		resetTargets();
	}

	node.addEventListener('pointermove', handlePointerMove, { passive: true });
	node.addEventListener('pointerleave', handlePointerLeave, { passive: true });

	return {
		update(newOptions) {
			isDisabled = Boolean(newOptions?.disabled);
			if (isDisabled) {
				resetTargets();
			}
		},
		destroy() {
			node.removeEventListener('pointermove', handlePointerMove);
			node.removeEventListener('pointerleave', handlePointerLeave);
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
			resetStyles();
		}
	};
};

<script lang="ts">
	import { authStore } from '../../stores/authStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';
	import { RolUsuario } from '@app/shared';

	let username = $state('admin_sistema');
	let password = $state('Vigencia$2026!SecureKey#99');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!username.trim() || !password) return;
		await authStore.login(username, password);
	}

	function fillSeed(user: string) {
		username = user;
		password = 'Vigencia$2026!SecureKey#99';
	}
</script>

{#if workspaceStore.loginModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
		<div
			class="w-full max-w-md space-y-3 rounded-2xl border border-white/20 bg-neutral-950 p-5 text-xs text-white"
		>
			<div class="flex items-center justify-between border-b border-white/10 pb-2">
				<h3 class="text-sm font-bold">Autenticación del Sistema (/api/v1/auth/login)</h3>
				<button
					type="button"
					class="rounded px-2 py-1 text-neutral-400 hover:bg-white/10 hover:text-white"
					onclick={() => (workspaceStore.loginModalOpen = false)}
				>
					✕
				</button>
			</div>

			{#if authStore.isAuthenticated && authStore.usuarioActual}
				<div class="space-y-2 rounded-xl border border-teal-500/30 bg-teal-950/30 p-3">
					<p>
						Sesión activa: <strong>{authStore.usuarioActual.username}</strong>
						({authStore.usuarioActual.rol.toUpperCase()})
					</p>
					<button
						type="button"
						class="rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-500"
						onclick={() => authStore.logout()}
					>
						Cerrar Sesión (/api/v1/account/logout)
					</button>
				</div>
			{/if}

			<form class="space-y-2.5" onsubmit={handleSubmit}>
				<div>
					<label for="login-username" class="mb-1 block text-neutral-400">Usuario (username)</label>
					<input
						id="login-username"
						type="text"
						class="w-full rounded-lg border border-white/20 bg-neutral-900 px-3 py-1.5 font-mono text-white"
						bind:value={username}
						required
					/>
				</div>

				<div>
					<label for="login-password" class="mb-1 block text-neutral-400">Contraseña</label>
					<input
						id="login-password"
						type="password"
						class="w-full rounded-lg border border-white/20 bg-neutral-900 px-3 py-1.5 font-mono text-white"
						bind:value={password}
						required
					/>
				</div>

				{#if authStore.authError}
					<p class="rounded border border-rose-500/40 bg-rose-950/40 p-2 text-rose-300">
						{authStore.authError}
					</p>
				{/if}

				<div class="space-y-1 pt-1">
					<span class="block text-[10px] text-neutral-400"
						>Autocompletar usuarios de prueba (Seeder):</span
					>
					<div class="flex flex-wrap gap-1.5">
						<button
							type="button"
							class="rounded border border-white/15 bg-white/5 px-2 py-1 font-mono text-[10px] hover:bg-white/10"
							onclick={() => fillSeed('admin_sistema')}
						>
							admin_sistema ({RolUsuario.ADMINISTRADOR})
						</button>
						<button
							type="button"
							class="rounded border border-white/15 bg-white/5 px-2 py-1 font-mono text-[10px] hover:bg-white/10"
							onclick={() => fillSeed('coordinador_generador')}
						>
							coordinador_generador ({RolUsuario.GENERADOR})
						</button>
						<button
							type="button"
							class="rounded border border-white/15 bg-white/5 px-2 py-1 font-mono text-[10px] hover:bg-white/10"
							onclick={() => fillSeed('operador_receptor')}
						>
							operador_receptor ({RolUsuario.RECEPTOR})
						</button>
					</div>
				</div>

				<div class="flex justify-end gap-2 border-t border-white/10 pt-3">
					<button
						type="button"
						class="rounded-lg border border-white/15 px-3 py-1.5 text-neutral-300"
						onclick={() => (workspaceStore.loginModalOpen = false)}
					>
						Cerrar
					</button>
					<button
						type="submit"
						disabled={authStore.isLoading}
						class="rounded-lg bg-teal-500 px-4 py-1.5 font-bold text-neutral-950 disabled:opacity-50"
					>
						{authStore.isLoading ? 'Autenticando...' : 'Iniciar Sesión'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

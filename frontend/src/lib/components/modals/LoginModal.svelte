<script lang="ts">
	import { authStore } from '../../stores/authStore.svelte';
	import { workspaceStore } from '../../stores/workspaceStore.svelte';

	let username = $state('');
	let password = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!username.trim() || !password) return;
		const ok = await authStore.login(username, password);
		if (ok) {
			username = '';
			password = '';
		}
	}
</script>

{#if workspaceStore.loginModalOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm dark:bg-black/80"
	>
		<div class="surface-modal w-full max-w-md space-y-3 rounded-2xl p-5 text-xs shadow-2xl">
			<div
				class="flex items-center justify-between border-b border-slate-900/10 pb-2 dark:border-white/10"
			>
				<h3 class="text-sm font-bold text-slate-900 dark:text-white">
					Autenticación del Sistema (/api/v1/auth/login)
				</h3>
				<button
					type="button"
					class="rounded px-2 py-1 text-slate-500 hover:bg-slate-900/8 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
					onclick={() => (workspaceStore.loginModalOpen = false)}
				>
					✕
				</button>
			</div>

			{#if authStore.isAuthenticated && authStore.usuarioActual}
				<div
					class="space-y-2 rounded-xl border border-teal-600/25 bg-teal-50/90 p-3 text-slate-900 dark:border-teal-500/30 dark:bg-teal-950/30 dark:text-white"
				>
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
					<label for="login-username" class="mb-1 block text-slate-600 dark:text-neutral-400">
						Usuario (username)
					</label>
					<input
						id="login-username"
						type="text"
						placeholder="Ingrese su nombre de usuario"
						autocomplete="username"
						class="surface-input w-full rounded-lg px-3 py-1.5 font-mono"
						bind:value={username}
						required
					/>
				</div>

				<div>
					<label for="login-password" class="mb-1 block text-slate-600 dark:text-neutral-400">
						Contraseña
					</label>
					<input
						id="login-password"
						type="password"
						placeholder="Ingrese su contraseña"
						autocomplete="current-password"
						class="surface-input w-full rounded-lg px-3 py-1.5 font-mono"
						bind:value={password}
						required
					/>
				</div>

				{#if authStore.authError}
					<p
						class="rounded border border-rose-500/40 bg-rose-50 p-2 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
					>
						{authStore.authError}
					</p>
				{/if}

				<div class="flex justify-end gap-2 border-t border-slate-900/10 pt-3 dark:border-white/10">
					<button
						type="button"
						class="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-neutral-300 dark:hover:bg-white/10"
						onclick={() => (workspaceStore.loginModalOpen = false)}
					>
						Cerrar
					</button>
					<button
						type="submit"
						disabled={authStore.isLoading}
						class="rounded-lg bg-teal-600 px-4 py-1.5 font-bold text-white hover:bg-teal-700 disabled:opacity-50 dark:bg-teal-500 dark:text-neutral-950 dark:hover:bg-teal-400"
					>
						{authStore.isLoading ? 'Autenticando...' : 'Iniciar Sesión'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

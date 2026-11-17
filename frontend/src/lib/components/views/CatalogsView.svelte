<script lang="ts">
	import { catalogStore } from '../../stores/catalogStore.svelte';
	import { financialStore } from '../../stores/financialStore.svelte';
	import { authStore } from '../../stores/authStore.svelte';
	import { AmbitoProyecto, AreaProyecto, PeriodicidadGrupoPago, RolUsuario } from '@app/shared';

	type SubTab = 'proyectos' | 'personas' | 'grupos' | 'asignaciones' | 'usuarios';
	let activeSubTab = $state<SubTab>('proyectos');

	// Formulario Usuario (Admin)
	let usrUsername = $state('');
	let usrPassword = $state('');
	let usrRol = $state<RolUsuario>(RolUsuario.GENERADOR);

	// Formulario Proyecto
	let proyCodigo = $state('');
	let proyNombre = $state('');
	let proyDescripcion = $state('');
	let proyArea = $state<AreaProyecto>(AreaProyecto.FISICA);
	let proyAmbito = $state<AmbitoProyecto>(AmbitoProyecto.INTERNO);
	let proyFechaInicio = $state(new Date().toISOString().substring(0, 10));
	let proyFechaFin = $state('');

	// Formulario Persona (Beneficiario sin usuario)
	let perIdentificacion = $state('');
	let perNombres = $state('');
	let perApellidos = $state('');
	let perCorreo = $state('');

	// Formulario Grupo de Pago
	let grpNombre = $state('');
	let grpDescripcion = $state('');
	let grpPeriodicidad = $state<PeriodicidadGrupoPago>(PeriodicidadGrupoPago.QUINCENAL);
	let grpDiaCorte1 = $state<number>(15);
	let grpDiaCorte2 = $state<number>(30);

	// Formulario Asignación
	let asigPersonaId = $state<number>(0);
	let asigProyectoId = $state<number>(0);
	let asigGrupoId = $state<number>(0);
	let asigMonto = $state<number>(100);
	let asigFechaInicio = $state(new Date().toISOString().substring(0, 10));
	let asigFechaFin = $state('');

	$effect(() => {
		if (!asigPersonaId && catalogStore.personas.length > 0) {
			asigPersonaId = catalogStore.personas[0].id;
		}
		if (!asigProyectoId && catalogStore.proyectos.length > 0) {
			asigProyectoId = catalogStore.proyectos[0].id;
		}
		if (!asigGrupoId && catalogStore.gruposPago.length > 0) {
			asigGrupoId = catalogStore.gruposPago[0].id;
		}
	});

	async function handleCrearUsuario(e: Event) {
		e.preventDefault();
		const ok = await catalogStore.crearUsuario({
			username: usrUsername,
			password: usrPassword,
			rol: usrRol,
			estaActivo: true
		});
		if (ok) {
			usrUsername = '';
			usrPassword = '';
		}
	}

	async function handleCrearProyecto(e: Event) {
		e.preventDefault();
		const ok = await catalogStore.crearProyecto({
			codigo: proyCodigo,
			nombre: proyNombre,
			descripcion: proyDescripcion || null,
			area: proyArea,
			ambito: proyAmbito,
			fechaInicio: proyFechaInicio || null,
			fechaFin: proyFechaFin || null,
			estaActivo: true
		});
		if (ok) {
			proyCodigo = '';
			proyNombre = '';
			proyDescripcion = '';
			await financialStore.syncFromBackend();
		}
	}

	async function handleCrearPersona(e: Event) {
		e.preventDefault();
		const ok = await catalogStore.crearPersona({
			identificacion: perIdentificacion,
			nombres: perNombres,
			apellidos: perApellidos,
			correo: perCorreo || null,
			estaActivo: true
		});
		if (ok) {
			perIdentificacion = '';
			perNombres = '';
			perApellidos = '';
			perCorreo = '';
		}
	}

	async function handleCrearGrupo(e: Event) {
		e.preventDefault();
		const ok = await catalogStore.crearGrupoPago({
			nombre: grpNombre,
			descripcion: grpDescripcion || null,
			periodicidad: grpPeriodicidad,
			diaCorte1: grpDiaCorte1 || null,
			diaCorte2: grpPeriodicidad === PeriodicidadGrupoPago.QUINCENAL ? grpDiaCorte2 : null,
			estaActivo: true
		});
		if (ok) {
			grpNombre = '';
			grpDescripcion = '';
		}
	}

	async function handleCrearAsignacion(e: Event) {
		e.preventDefault();
		if (!asigPersonaId || !asigProyectoId || !asigGrupoId) return;
		const ok = await catalogStore.crearAsignacion({
			personaId: Number(asigPersonaId),
			proyectoId: Number(asigProyectoId),
			grupoPagoId: Number(asigGrupoId),
			montoPeriodo: Number(asigMonto),
			fechaInicio: asigFechaInicio,
			fechaFin: asigFechaFin || null,
			estaActivo: true
		});
		if (ok) {
			await financialStore.syncFromBackend();
		}
	}
</script>

<section class="view-panel space-y-3" id="tab-catalogs">
	<div class="chroma-glass-card space-y-3 rounded-2xl p-4 text-xs text-white">
		<div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
			<div>
				<h2 class="text-sm font-bold">2.1 Gestión de Catálogos, Asignaciones y Usuarios</h2>
				<p class="text-[11px] text-neutral-400">
					Plantilla funcional conectada a /api/v1/proyectos, /personas, /grupos-pago, /asignaciones
					y /usuarios
				</p>
			</div>
			<button
				type="button"
				class="rounded-lg border border-white/20 bg-white/5 px-2.5 py-1 font-mono text-[10px] hover:bg-white/10"
				onclick={() => catalogStore.syncAll()}
			>
				{catalogStore.isLoading ? 'Sincronizando...' : '↻ Recargar'}
			</button>
		</div>

		<!-- Selector de sub-catálogo -->
		<div class="flex flex-wrap gap-1.5">
			<button
				type="button"
				class="rounded-lg px-2.5 py-1 font-mono text-[11px] {activeSubTab === 'proyectos'
					? 'bg-teal-500 font-bold text-neutral-950'
					: 'border border-white/15 bg-neutral-900 text-neutral-300'}"
				onclick={() => (activeSubTab = 'proyectos')}
			>
				Proyectos ({catalogStore.proyectos.length})
			</button>
			<button
				type="button"
				class="rounded-lg px-2.5 py-1 font-mono text-[11px] {activeSubTab === 'personas'
					? 'bg-teal-500 font-bold text-neutral-950'
					: 'border border-white/15 bg-neutral-900 text-neutral-300'}"
				onclick={() => (activeSubTab = 'personas')}
			>
				Beneficiarios ({catalogStore.personas.length})
			</button>
			<button
				type="button"
				class="rounded-lg px-2.5 py-1 font-mono text-[11px] {activeSubTab === 'grupos'
					? 'bg-teal-500 font-bold text-neutral-950'
					: 'border border-white/15 bg-neutral-900 text-neutral-300'}"
				onclick={() => (activeSubTab = 'grupos')}
			>
				Grupos de Pago ({catalogStore.gruposPago.length})
			</button>
			<button
				type="button"
				class="rounded-lg px-2.5 py-1 font-mono text-[11px] {activeSubTab === 'asignaciones'
					? 'bg-teal-500 font-bold text-neutral-950'
					: 'border border-white/15 bg-neutral-900 text-neutral-300'}"
				onclick={() => (activeSubTab = 'asignaciones')}
			>
				Asignaciones ({catalogStore.asignaciones.length})
			</button>
			<button
				type="button"
				class="rounded-lg px-2.5 py-1 font-mono text-[11px] {activeSubTab === 'usuarios'
					? 'bg-teal-500 font-bold text-neutral-950'
					: 'border border-white/15 bg-neutral-900 text-neutral-300'}"
				onclick={() => (activeSubTab = 'usuarios')}
			>
				Usuarios ({catalogStore.usuarios.length})
			</button>
		</div>

		<!-- SUB-TAB: PROYECTOS -->
		{#if activeSubTab === 'proyectos'}
			<form
				class="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-neutral-950/70 p-3 sm:grid-cols-2 lg:grid-cols-3"
				onsubmit={handleCrearProyecto}
			>
				<div class="col-span-full font-bold text-teal-300">
					Nuevo Proyecto (Exclusivo Rol Generador)
				</div>
				<input
					type="text"
					placeholder="Código (ej. PROY-FQ-02)"
					class="rounded border border-white/15 bg-neutral-900 px-2 py-1"
					bind:value={proyCodigo}
					required
				/>
				<input
					type="text"
					placeholder="Nombre del Proyecto"
					class="rounded border border-white/15 bg-neutral-900 px-2 py-1"
					bind:value={proyNombre}
					required
				/>
				<select
					class="rounded border border-white/15 bg-neutral-900 px-2 py-1"
					bind:value={proyArea}
				>
					{#each Object.values(AreaProyecto) as area (area)}
						<option value={area}>Área: {area.toUpperCase()}</option>
					{/each}
				</select>
				<select
					class="rounded border border-white/15 bg-neutral-900 px-2 py-1"
					bind:value={proyAmbito}
				>
					{#each Object.values(AmbitoProyecto) as amb (amb)}
						<option value={amb}>Ámbito: {amb.toUpperCase()}</option>
					{/each}
				</select>
				<div>
					<label for="proy-inicio" class="block text-[10px] text-neutral-400">Inicio Vigencia</label
					>
					<input
						id="proy-inicio"
						type="date"
						class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1"
						bind:value={proyFechaInicio}
					/>
				</div>
				<div>
					<label for="proy-fin" class="block text-[10px] text-neutral-400"
						>Fin Vigencia (opcional)</label
					>
					<input
						id="proy-fin"
						type="date"
						class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1"
						bind:value={proyFechaFin}
					/>
				</div>
				<input
					type="text"
					placeholder="Descripción (opcional)"
					class="col-span-full rounded border border-white/15 bg-neutral-900 px-2 py-1"
					bind:value={proyDescripcion}
				/>
				<button
					type="submit"
					disabled={!authStore.esGenerador}
					class="col-span-full rounded-lg bg-teal-500 py-1.5 font-bold text-neutral-950 disabled:opacity-40"
				>
					+ Registrar Proyecto {authStore.esGenerador ? '' : '(Requiere rol Generador)'}
				</button>
			</form>

			<div class="space-y-1.5">
				{#each catalogStore.proyectos as p (p.id)}
					<div
						class="flex items-center justify-between rounded-xl border border-white/10 bg-neutral-950/60 p-2.5"
					>
						<div>
							<p class="font-bold">{p.codigo} — {p.nombre}</p>
							<p class="font-mono text-[10px] text-neutral-400">
								Área: {p.area} | Ámbito: {p.ambito} | Vigencia: {String(
									p.fechaInicio ?? 'N/A'
								).substring(0, 10)} → {String(p.fechaFin ?? 'Abierto').substring(0, 10)}
							</p>
						</div>
						<button
							type="button"
							disabled={!authStore.esGenerador}
							class="rounded border px-2 py-1 font-mono text-[10px] disabled:opacity-40 {p.estaActivo
								? 'border-emerald-500/40 text-emerald-300'
								: 'border-rose-500/40 text-rose-300'}"
							onclick={() => catalogStore.cambiarEstadoProyecto(p.id, !p.estaActivo)}
						>
							{p.estaActivo ? 'Activo (Desactivar)' : 'Inactivo (Activar)'}
						</button>
					</div>
				{:else}
					<p class="text-neutral-400">Sin proyectos cargados desde el servidor.</p>
				{/each}
			</div>
		{/if}

		<!-- SUB-TAB: PERSONAS (BENEFICIARIOS SIN USUARIO) -->
		{#if activeSubTab === 'personas'}
			<form
				class="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-neutral-950/70 p-3 sm:grid-cols-2"
				onsubmit={handleCrearPersona}
			>
				<div class="col-span-full font-bold text-teal-300">
					Nuevo Beneficiario (Personal que cobra — sin usuario en el sistema)
				</div>
				<input
					type="text"
					placeholder="Identificación (ej. V-20111222)"
					class="rounded border border-white/15 bg-neutral-900 px-2 py-1"
					bind:value={perIdentificacion}
					required
				/>
				<input
					type="email"
					placeholder="Correo (opcional)"
					class="rounded border border-white/15 bg-neutral-900 px-2 py-1"
					bind:value={perCorreo}
				/>
				<input
					type="text"
					placeholder="Nombres"
					class="rounded border border-white/15 bg-neutral-900 px-2 py-1"
					bind:value={perNombres}
					required
				/>
				<input
					type="text"
					placeholder="Apellidos"
					class="rounded border border-white/15 bg-neutral-900 px-2 py-1"
					bind:value={perApellidos}
					required
				/>
				<button
					type="submit"
					disabled={!authStore.esGenerador}
					class="col-span-full rounded-lg bg-teal-500 py-1.5 font-bold text-neutral-950 disabled:opacity-40"
				>
					+ Registrar Persona Beneficiaria {authStore.esGenerador ? '' : '(Requiere rol Generador)'}
				</button>
			</form>

			<div class="space-y-1.5">
				{#each catalogStore.personas as per (per.id)}
					<div
						class="flex items-center justify-between rounded-xl border border-white/10 bg-neutral-950/60 p-2.5"
					>
						<div>
							<p class="font-bold">{per.nombres} {per.apellidos} ({per.identificacion})</p>
							<p class="font-mono text-[10px] text-neutral-400">{per.correo || 'Sin correo'}</p>
						</div>
						<button
							type="button"
							disabled={!authStore.esGenerador}
							class="rounded border px-2 py-1 font-mono text-[10px] disabled:opacity-40 {per.estaActivo
								? 'border-emerald-500/40 text-emerald-300'
								: 'border-rose-500/40 text-rose-300'}"
							onclick={() => catalogStore.cambiarEstadoPersona(per.id, !per.estaActivo)}
						>
							{per.estaActivo ? 'Activo' : 'Inactivo'}
						</button>
					</div>
				{:else}
					<p class="text-neutral-400">Sin personas registradas.</p>
				{/each}
			</div>
		{/if}

		<!-- SUB-TAB: GRUPOS DE PAGO -->
		{#if activeSubTab === 'grupos'}
			<form
				class="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-neutral-950/70 p-3 sm:grid-cols-2"
				onsubmit={handleCrearGrupo}
			>
				<div class="col-span-full font-bold text-teal-300">
					Nuevo Grupo de Pago (Periodicidad y Cortes)
				</div>
				<input
					type="text"
					placeholder="Nombre del Grupo"
					class="rounded border border-white/15 bg-neutral-900 px-2 py-1"
					bind:value={grpNombre}
					required
				/>
				<select
					class="rounded border border-white/15 bg-neutral-900 px-2 py-1"
					bind:value={grpPeriodicidad}
				>
					{#each Object.values(PeriodicidadGrupoPago) as per (per)}
						<option value={per}>{per.toUpperCase()}</option>
					{/each}
				</select>
				<div>
					<label for="grp-corte1" class="block text-[10px] text-neutral-400">Día Corte 1</label>
					<input
						id="grp-corte1"
						type="number"
						min="1"
						max="31"
						class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1"
						bind:value={grpDiaCorte1}
					/>
				</div>
				<div>
					<label for="grp-corte2" class="block text-[10px] text-neutral-400"
						>Día Corte 2 (Quincenal)</label
					>
					<input
						id="grp-corte2"
						type="number"
						min="1"
						max="31"
						class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1"
						bind:value={grpDiaCorte2}
					/>
				</div>
				<input
					type="text"
					placeholder="Descripción"
					class="col-span-full rounded border border-white/15 bg-neutral-900 px-2 py-1"
					bind:value={grpDescripcion}
				/>
				<button
					type="submit"
					disabled={!authStore.esAdmin}
					class="col-span-full rounded-lg bg-teal-500 py-1.5 font-bold text-neutral-950 disabled:opacity-40"
				>
					+ Crear Grupo de Pago {authStore.esAdmin ? '' : '(Requiere rol Administrador)'}
				</button>
			</form>

			<div class="space-y-1.5">
				{#each catalogStore.gruposPago as g (g.id)}
					<div
						class="flex items-center justify-between rounded-xl border border-white/10 bg-neutral-950/60 p-2.5"
					>
						<div>
							<p class="font-bold">{g.nombre} ({g.periodicidad.toUpperCase()})</p>
							<p class="font-mono text-[10px] text-neutral-400">
								Cortes: {g.diaCorte1 ?? '-'}
								{g.diaCorte2 ? `/ ${g.diaCorte2}` : ''}
							</p>
						</div>
						<button
							type="button"
							disabled={!authStore.esAdmin}
							class="rounded border px-2 py-1 font-mono text-[10px] disabled:opacity-40 {g.estaActivo
								? 'border-emerald-500/40 text-emerald-300'
								: 'border-rose-500/40 text-rose-300'}"
							onclick={() => catalogStore.cambiarEstadoGrupoPago(g.id, !g.estaActivo)}
						>
							{g.estaActivo ? 'Activo' : 'Inactivo'}
						</button>
					</div>
				{:else}
					<p class="text-neutral-400">Sin grupos de pago registrados.</p>
				{/each}
			</div>
		{/if}

		<!-- SUB-TAB: ASIGNACIONES -->
		{#if activeSubTab === 'asignaciones'}
			<form
				class="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-neutral-950/70 p-3 sm:grid-cols-2 lg:grid-cols-3"
				onsubmit={handleCrearAsignacion}
			>
				<div class="col-span-full font-bold text-teal-300">
					Nueva Asignación (Persona + Proyecto + Grupo de Pago + Monto USD)
				</div>
				<div>
					<label for="asig-per" class="block text-[10px] text-neutral-400">Persona</label>
					<select
						id="asig-per"
						class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1"
						bind:value={asigPersonaId}
					>
						{#each catalogStore.personas as per (per.id)}
							<option value={per.id}>{per.nombres} {per.apellidos} ({per.identificacion})</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="asig-proy" class="block text-[10px] text-neutral-400">Proyecto</label>
					<select
						id="asig-proy"
						class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1"
						bind:value={asigProyectoId}
					>
						{#each catalogStore.proyectos as proy (proy.id)}
							<option value={proy.id}>{proy.codigo} - {proy.nombre}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="asig-grp" class="block text-[10px] text-neutral-400">Grupo de Pago</label>
					<select
						id="asig-grp"
						class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1"
						bind:value={asigGrupoId}
					>
						{#each catalogStore.gruposPago as grp (grp.id)}
							<option value={grp.id}>{grp.nombre} ({grp.periodicidad})</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="asig-monto" class="block text-[10px] text-neutral-400"
						>Monto por Período (USD)</label
					>
					<input
						id="asig-monto"
						type="number"
						min="0.01"
						step="0.01"
						class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1 font-mono"
						bind:value={asigMonto}
						required
					/>
				</div>
				<div>
					<label for="asig-ini" class="block text-[10px] text-neutral-400">Fecha Inicio</label>
					<input
						id="asig-ini"
						type="date"
						class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1"
						bind:value={asigFechaInicio}
						required
					/>
				</div>
				<div>
					<label for="asig-fin" class="block text-[10px] text-neutral-400"
						>Fecha Fin (opcional)</label
					>
					<input
						id="asig-fin"
						type="date"
						class="w-full rounded border border-white/15 bg-neutral-900 px-2 py-1"
						bind:value={asigFechaFin}
					/>
				</div>
				<button
					type="submit"
					disabled={!authStore.esGenerador}
					class="col-span-full rounded-lg bg-teal-500 py-1.5 font-bold text-neutral-950 disabled:opacity-40"
				>
					+ Crear Asignación {authStore.esGenerador ? '' : '(Requiere rol Generador)'}
				</button>
			</form>

			<div class="space-y-1.5">
				{#each catalogStore.asignaciones as a (a.id)}
					<div
						class="flex items-center justify-between rounded-xl border border-white/10 bg-neutral-950/60 p-2.5"
					>
						<div>
							<p class="font-bold">
								{a.persona
									? `${a.persona.nombres} ${a.persona.apellidos}`
									: `Persona #${a.personaId}`}
								→ {a.proyecto?.codigo ?? `Proyecto #${a.proyectoId}`}
							</p>
							<p class="font-mono text-[10px] text-neutral-400">
								Grupo: {a.grupoPago?.nombre ?? `#${a.grupoPagoId}`} | Monto: ${Number(
									a.montoPeriodo
								).toFixed(2)} USD | Inicio: {String(a.fechaInicio).substring(0, 10)}
							</p>
						</div>
						<button
							type="button"
							disabled={!authStore.esGenerador}
							class="rounded border px-2 py-1 font-mono text-[10px] disabled:opacity-40 {a.estaActivo
								? 'border-emerald-500/40 text-emerald-300'
								: 'border-rose-500/40 text-rose-300'}"
							onclick={() => catalogStore.cambiarEstadoAsignacion(a.id, !a.estaActivo)}
						>
							{a.estaActivo ? 'Activa' : 'Inactiva'}
						</button>
					</div>
				{:else}
					<p class="text-neutral-400">Sin asignaciones registradas.</p>
				{/each}
			</div>
		{/if}

		<!-- SUB-TAB: USUARIOS (SOLO ADMINISTRADOR) -->
		{#if activeSubTab === 'usuarios'}
			{#if !authStore.esAdmin}
				<div class="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-amber-200">
					Segregación RBAC: La gestión de usuarios del sistema está restringida exclusivamente al
					rol <strong>ADMINISTRADOR</strong>.
				</div>
			{:else}
				<form
					class="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-neutral-950/70 p-3 sm:grid-cols-3"
					onsubmit={handleCrearUsuario}
				>
					<div class="col-span-full font-bold text-teal-300">
						Nuevo Usuario del Sistema (Exclusivo Administrador)
					</div>
					<input
						type="text"
						placeholder="Username (mín. 3)"
						class="rounded border border-white/15 bg-neutral-900 px-2 py-1 font-mono"
						bind:value={usrUsername}
						required
					/>
					<input
						type="password"
						placeholder="Contraseña (mín. 6)"
						class="rounded border border-white/15 bg-neutral-900 px-2 py-1 font-mono"
						bind:value={usrPassword}
						required
					/>
					<select
						class="rounded border border-white/15 bg-neutral-900 px-2 py-1"
						bind:value={usrRol}
					>
						{#each Object.values(RolUsuario) as rol (rol)}
							<option value={rol}>{rol.toUpperCase()}</option>
						{/each}
					</select>
					<button
						type="submit"
						class="col-span-full rounded-lg bg-teal-500 py-1.5 font-bold text-neutral-950"
					>
						+ Crear Usuario
					</button>
				</form>

				<div class="space-y-1.5">
					{#each catalogStore.usuarios as u (u.id)}
						<div
							class="flex items-center justify-between rounded-xl border border-white/10 bg-neutral-950/60 p-2.5"
						>
							<div>
								<p class="font-mono font-bold">{u.username}</p>
								<p class="font-mono text-[10px] text-neutral-400">Rol: {u.rol.toUpperCase()}</p>
							</div>
							<button
								type="button"
								class="rounded border px-2 py-1 font-mono text-[10px] {u.estaActivo
									? 'border-emerald-500/40 text-emerald-300'
									: 'border-rose-500/40 text-rose-300'}"
								onclick={() => catalogStore.cambiarEstadoUsuario(u.id, !u.estaActivo)}
							>
								{u.estaActivo ? 'Activo (Revocar/Desactivar)' : 'Inactivo (Activar)'}
							</button>
						</div>
					{:else}
						<p class="text-neutral-400">Sin usuarios cargados.</p>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</section>

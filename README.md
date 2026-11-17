<div align="center">

# Vigencia Payment Control System

### *Sistema Integral y Auditable de Control de Pagos, Causaciones y Asignaciones Multidisciplinarias*

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Svelte 5](https://img.shields.io/badge/Svelte_5-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)](https://svelte.dev/)
[![AdonisJS v6](https://img.shields.io/badge/AdonisJS_v6-5A45FF?style=for-the-badge&logo=adonisjs&logoColor=white)](https://adonisjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Cloudflare Tunnels](https://img.shields.io/badge/Cloudflare_Tunnels-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

<p align="center">
  <b>Universidad de Carabobo</b> • Facultad de Ciencias y Tecnología (FACYT) • Escuela de Computación<br>
  <i>Cátedra de Sistemas de Información — Octubre 2026</i>
</p>

---

</div>

## Visión General del Proyecto

**Vigencia Payment Control System** es una plataforma cliente-servidor de alta fidelidad, precisión matemática y auditoría continua, diseñada para sustituir los esquemas de gestión manuales en hojas de cálculo por un entorno inmutable y automatizado.

El sistema administra asignaciones económicas en **dólares estadounidenses (USD)** para equipos de investigación multidisciplinarios (física, química, biología y afines). Responde en tiempo real a las preguntas operativas esenciales:
- **¿Cuánto se ha causado?**
- **¿Cuánto se ha pagado?**
- **¿Cuándo y a quién?**
- **¿Con cargo a qué proyecto de investigación?**
- **¿Cuál es el saldo deudor consolidado e individual por beneficiario?**

> [!IMPORTANT]
> **Modelo Operativo:** No se trata de nómina parafiscal formal laboral. Los **beneficiarios (personal que cobra) NO poseen credenciales de acceso ni interactúan con el sistema**; sus registros son operados y controlados exclusivamente por los roles asignados (`Administrador`, `Generador`, `Receptor`).

---

## Arquitectura de Despliegue Híbrida

El monorepo está organizado bajo una topología híbrida desacoplada para optimizar latencia, costos y soberanía de datos:

```
[ Navegador del Usuario / Cliente ]
               │
               ▼
   [ Vercel Global Edge Network ]
      Frontend Svelte 5 / SvelteKit
      (Despliegue Serverless / SSR)
               │
               │ HTTPS (Peticiones AJAX / REST API)
               │ URL: https://api.tudominio.com
               ▼
     [ Cloudflare Edge Network ]
         DNS Seguro + SSL + WAF
               │
               │ Túnel Encriptado (cloudflared)
               ▼
   [ Servidor Local de Desarrollo / On-Premise ]
      ┌────────────────────────────────────────┐
      │  cloudflared daemon                    │
      │  (Escucha en el túnel y rutea tráfico) │
      │               │                        │
      │               ▼ HTTP (localhost:3333)  │
      │  AdonisJS v6 API RESTful               │
      │  (Proceso Node.js persistente)         │
      │               │                        │
      │               ▼ TCP (localhost:5432)   │
      │  PostgreSQL 16 Alpine (Docker Compose) │
      │  Volumen Persistente: postgres_data    │
      └────────────────────────────────────────┘
```

---

## Prerrequisitos del Entorno

Asegúrate de contar con las siguientes herramientas instaladas localmente:

| Herramienta | Versión Requerida | Comando de Verificación |
| :--- | :--- | :--- |
| **Node.js** | 20 LTS o superior | `node -v` |
| **pnpm** | 10.x / 12.x (vía Corepack) | `pnpm -v` |
| **Docker & Docker Compose** | Engine 24+ / Compose v2 | `docker compose version` |
| **Cloudflare CLI** | cloudflared versión estable | `cloudflared --version` |

---

## Estructura del Monorepo

```plaintext
Vigencia_Payment_Control_System/
├── frontend/                       # Aplicación SvelteKit con @sveltejs/adapter-vercel
│   ├── src/                        # Runes, componentes y páginas de la interfaz
│   ├── .env.example                # Variables públicas (PUBLIC_API_URL)
│   ├── vite.config.ts              # Configuración Vite con adapter-vercel
│   └── package.json                # @app/frontend
├── backend/                        # API RESTful en AdonisJS v6
│   ├── app/                        # Controladores, modelos, bouncer policies
│   ├── config/                     # CORS dinámico, base de datos y seguridad
│   ├── database/                   # Migraciones DDL y seeders
│   ├── .env.example                # Plantilla de variables para PostgreSQL local
│   └── package.json                # @app/backend
├── packages/
│   └── shared/                     # Tipos y contratos compartidos TypeScript (@app/shared)
├── deploy/
│   └── cloudflared/                # Plantillas y scripts para Cloudflare Tunnel
│       ├── config.yml.example      # Archivo de configuración ingress
│       ├── run-tunnel.sh           # Script auxiliar ejecutable para levantar el túnel
│       └── cloudflared-vigencia.service.example # Servicio systemd
├── docker-compose.yml              # Orquestación de PostgreSQL 16 con named volume
├── pnpm-workspace.yaml             # Configuración de workspaces del monorepo
├── vercel.json                     # Configuración de build de Vercel
└── README.md                       # Documentación operativa
```

---

## Guía de Inicialización Local Paso a Paso

Sigue esta secuencia para iniciar el entorno en tu máquina:

### 1. Levantar la Base de Datos con Docker Compose
Inicia el contenedor de PostgreSQL en segundo plano con persistencia y verificación de salud:

```bash
docker compose up -d postgres
```

Para verificar que el contenedor esté sano (`healthy`):
```bash
docker compose ps
```

### 2. Configurar el Backend y Ejecutar Migraciones
Crea tu archivo `.env` en la carpeta `backend/` a partir de la plantilla:

```bash
cp backend/.env.example backend/.env
```

Genera la clave de aplicación y ejecuta las migraciones pendientes:
```bash
cd backend
node ace generate:key
node ace migration:run
cd ..
```

Inicia el servidor backend en modo desarrollo:
```bash
pnpm --filter @app/backend dev
```
*El backend escuchará en `http://localhost:3333`.*

### 2.1. Ejecutar las Pruebas del Backend
Las pruebas usan una base propia, `vigencia_test`, en el mismo contenedor. Créala una vez:
```bash
docker exec vigencia-postgres createdb -U postgres vigencia_test
```
Después, desde `backend/`:
```bash
node ace test
```
La suite recrea el esquema de `vigencia_test` al empezar (`migration:fresh`) y nunca toca
`vigencia_db`: aborta si `DB_DATABASE` no termina en `_test` o si hay una `DATABASE_URL`.
Cada prueba corre en una transacción que se revierte, salvo los grupos `[concurrencia]`.

### 2.2. Rol de base de datos de la aplicación (ADR 0017)
El servidor se conecta con el rol `vigencia_app`, que solo puede leer y escribir filas: no
puede desactivar triggers, borrar la auditoría ni cambiar el esquema. Las migraciones lo crean
sin `LOGIN`; cada entorno lo activa **una vez**:

1. Migrar con el dueño de las tablas (la variable del comando gana a la del `.env`):
   ```bash
   DATABASE_URL=postgres://<dueño>:<clave>@<host>:5432/<bd> node ace migration:run
   ```
2. Como dueño, darle acceso con una contraseña aleatoria (`openssl rand -base64 32`):
   ```sql
   ALTER ROLE vigencia_app LOGIN PASSWORD '<contraseña>';
   ```
   En Neon, hacerlo por SQL; **no** crear el rol desde la consola (lo añadiría a `neon_superuser`).
3. Cambiar la credencial del servidor a `vigencia_app` (`DB_USER`/`DB_PASSWORD` o
   `DATABASE_URL`). La credencial del dueño no se guarda en el servidor.
4. Comprobar como dueño que todo sale `f`:
   ```sql
   SELECT rolsuper, rolcreaterole, rolcreatedb, rolbypassrls,
          has_schema_privilege('vigencia_app', 'public', 'CREATE')
   FROM pg_roles WHERE rolname = 'vigencia_app';
   ```
   y hacer un login de prueba contra la API.

Volver atrás: poner otra vez la credencial anterior en el servidor (no hace falta revertir la
migración). Toda tabla nueva necesita su `GRANT` en una migración nueva; las pruebas fallan si falta.

### 3. Configurar y Activar el Túnel de Cloudflare (cloudflared)
Para exponer tu API local de forma segura hacia Vercel:

1. **Autenticar con Cloudflare (solo primera vez):**
   ```bash
   cloudflared tunnel login
   ```
2. **Crear el túnel:**
   ```bash
   cloudflared tunnel create vigencia-api
   ```
   *Guarda el UUID emitido por la terminal y la ruta del archivo de credenciales JSON.*

3. **Asignar el subdominio DNS:**
   ```bash
   cloudflared tunnel route dns vigencia-api api.tudominio.com
   ```

4. **Configurar el archivo ingress:**
   Copia la plantilla y reemplaza el UUID y la ruta de credenciales:
   ```bash
   cp deploy/cloudflared/config.yml.example deploy/cloudflared/config.yml
   ```

5. **Arrancar el túnel:**
   Puedes usar el script auxiliar provisto:
   ```bash
   ./deploy/cloudflared/run-tunnel.sh vigencia-api
   ```
   *(O de forma directa: `cloudflared tunnel --config deploy/cloudflared/config.yml run vigencia-api`)*

---

## Guía de Despliegue del Frontend en Vercel

1. **Importar el Repositorio:**
   - Ingresa a tu panel en [Vercel](https://vercel.com/dashboard).
   - Haz clic en **Add New Project** y selecciona `Vigencia_Payment_Control_System`.

2. **Configuración del Proyecto en Vercel:**
   - **Framework Preset:** `SvelteKit`.
   - **Root Directory:** Haz clic en *Edit* y selecciona `frontend`.
   - **Build Command:** Déjalo por defecto (`vite build`) o utiliza la directiva de monorepo gestionada por `vercel.json`.

3. **Variables de Entorno en Vercel Dashboard:**
   En la sección **Environment Variables**, define:
   - `PUBLIC_API_URL`: La URL pública expuesta por tu túnel de Cloudflare, por ejemplo:
     ```
     https://api.tudominio.com
     ```

4. **Desplegar:**
   Haz clic en **Deploy**. Vercel compilará la aplicación utilizando `@sveltejs/adapter-vercel`.

---

## Troubleshooting y Resolución de Problemas

### 1. Errores de CORS en el Navegador
- **Síntoma:** `Access to fetch at 'https://api.tudominio.com' from origin 'https://tu-proyecto.vercel.app' has been blocked by CORS policy`.
- **Solución:** En `backend/.env`, agrega tu dominio de Vercel en `CORS_ALLOWED_ORIGINS`:
  ```env
  CORS_ALLOWED_ORIGINS=https://tu-proyecto.vercel.app
  ```
  *(El validador de `backend/config/cors.ts` permite dinámicamente cualquier subdominio `.vercel.app`, pero si utilizas un dominio personalizado en Vercel debes incluirlo explícitamente).*

### 2. El Túnel de Cloudflare no Responde o Devuelve Error 502 Bad Gateway
- **Causa:** El daemon `cloudflared` está activo pero no puede comunicarse con `http://localhost:3333`.
- **Verificación:**
  1. Comprueba que el backend esté arriba:
     ```bash
     curl -I http://localhost:3333
     ```
  2. Verifica que el puerto en `deploy/cloudflared/config.yml` coincida con la variable `PORT` configurada en `backend/.env`.

### 3. PostgreSQL en Docker No Responde
- **Verificación de logs:**
  ```bash
  docker compose logs -f postgres
  ```
- **Comprobación manual de conexión local:**
  ```bash
  docker compose exec postgres pg_isready -U postgres -d vigencia_db
  ```
- **Reset de volumen (solo si se requiere reiniciar la BD en desarrollo):**
  ```bash
  docker compose down -v
  docker compose up -d postgres
  ```

---

<div align="center">
  <small>Desarrollado con dedicación por el equipo de Sistemas de Información • FACYT • Universidad de Carabobo</small>
</div>

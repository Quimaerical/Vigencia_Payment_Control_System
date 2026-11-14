# Despliegue local del backend y conexión al frontend (Cloudflare Tunnel)

Este documento explica cómo poner a correr el **backend** de AdonisJS en tu máquina
local (`localhost:3333`) y exponerlo a Internet mediante **Cloudflare Tunnel**, para
que el **frontend ya desplegado** pueda consumirlo.

---

## 1. Flujo de red

```
Frontend (ya desplegado, ej. Vercel)
        │
        ▼ https://api.VigenciaPCS.quimaerical-dev.win
  Cloudflare Tunnel (cloudflared)
        │  localhost:3333
        ▼
Backend AdonisJS (local) ──► PostgreSQL (local)
```

El túnel toma el tráfico de `https://api.VigenciaPCS.quimaerical-dev.win` y lo envía al backend que
tienes corriendo localmente en el puerto `3333`.

---

## 2. Prerrequisitos

- Node.js y `pnpm` instalados.
- PostgreSQL corriendo localmente (el repositorio trae un `docker-compose.yml` en
  la raíz; `docker-compose up -d` levanta la base de datos).
- `cloudflared` instalado en tu sistema.
  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/installing/

---

## 3. Pasos para poner el backend en local

### 3.1 Instalar dependencias

Desde la raíz del repositorio:

```bash
pnpm install
```

### 3.2 Configurar el backend

```bash
cd backend
cp .env.example .env
```

Edita `backend/.env` y ajusta al menos lo siguiente:

| Variable | Valor local sugerido |
|---|---|
| `PORT` | `3333` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` | según tu Postgres local (`localhost:5432`, `postgres`/`postgres`/`vigencia_db` por defecto) |
| `APP_KEY` | genera uno con `node ace generate:key` y pégalo aquí |
| `CORS_ALLOWED_ORIGINS` | agrega el origen de tu frontend desplegado (ej. `https://tu-proyecto.vercel.app`) además de `http://localhost:5173` |
| `TUNNEL_HOSTNAME` | `api.VigenciaPCS.quimaerical-dev.win` (subdominio de tu túnel Cloudflare) |

El archivo `.env` del backend **no se commitea** (está en `.gitignore`).

### 3.3 Base de datos

Si usas Docker:

```bash
# desde la raíz del repositorio
docker-compose up -d
```

Luego corre las migraciones:

```bash
cd backend
node ace migration:run
```

### 3.4 Arrancar el backend

```bash
# desde la raíz del repositorio (usa el script del workspace)
pnpm run dev:backend
```

O directamente:

```bash
cd backend
node ace serve
```

Verifica que responde: `curl http://localhost:3333` o abre `http://localhost:3333`
en el navegador. El script del túnel comprueba precisamente esto antes de rutear tráfico.

---

## 4. Arrancar el túnel de Cloudflare

El token ya está guardado de forma segura en `deploy/cloudflared/.env`
(`chmod 600`, ignorado por Git). El script lo carga automáticamente:

```bash
./deploy/cloudflared/run-tunnel.sh
```

Resultado esperado: cloudflared autentica el túnel `42d8a096-afa7-41c2-938b-47877216e6b4`
y comienza a enviar tráfico de `https://api.VigenciaPCS.quimaerical-dev.win` a tu
`localhost:3333`.

Si quieres instalarlo como servicio del sistema (que arranque solo al iniciar sesión):

```bash
sudo cp deploy/cloudflared/cloudflared-vigencia.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cloudflared-vigencia.service
```

---

## 5. Conectar el frontend ya desplegado

Tu frontend está desplegado y lee la URL del backend de la variable:

```env
PUBLIC_API_URL=https://api.VigenciaPCS.quimaerical-dev.win
```

1. Configura `PUBLIC_API_URL=https://api.VigenciaPCS.quimaerical-dev.win` (o el
   subdominio real de tu túnel) en el entorno de despliegue del frontend.
2. Redéploya el frontend.
3. Asegúrate de que ese mismo origen esté listado en `CORS_ALLOWED_ORIGINS` del
   `backend/.env`, de lo contrario el navegador bloqueará las peticiones (CORS).

**Para pruebas locales** del frontend contra tu backend local, usa en su lugar:

```env
PUBLIC_API_URL=http://localhost:3333
```

---

## 6. Seguridad del token

- El token de Cloudflare vive en `deploy/cloudflared/.env` **únicamente en tu máquina**.
- Permisos: `chmod 600 deploy/cloudflared/.env`.
- Nunca lo commitees ni lo envíes por canales no cifrados: está incluido en
  `.gitignore` (`deploy/cloudflared/.env` y `deploy/cloudflared/*.json`).
- Si sospechas que se filtró, revócalo desde el dashboard de Cloudflare y genera uno
  nuevo con `cloudflared tunnel create <nombre>` o rotando el token del túnel existente.

---

## 7. Comandos útiles y troubleshooting

| Situación | Comando |
|---|---|
| ¿El backend está arriba? | `curl -s http://localhost:3333` |
| ¿El túnel está activo? | Mira los logs de cloudflared o `sudo journalctl -u cloudflared-vigencia -f` |
| Reiniciar el servicio | `sudo systemctl restart cloudflared-vigencia` |
| Backend en desarrollo con HMR | `pnpm run dev:backend` |
| Generar APP_KEY | `cd backend && node ace generate:key` |

Si el frontend desplegado no puede alcanzar el backend, verifica:
1. Que el backend responda en `http://localhost:3333`.
2. Que `./deploy/cloudflared/run-tunnel.sh` esté corriendo sin errores.
3. Que el origen del frontend esté en `CORS_ALLOWED_ORIGINS` del backend.
4. Que `PUBLIC_API_URL` del frontend apunte a `https://api.VigenciaPCS.quimaerical-dev.win` y no a `localhost`.

#!/usr/bin/env bash
# ==============================================================================
# Script Auxiliar de Inicialización del Túnel de Cloudflare
# Uso futuro: ./deploy/cloudflared/run-tunnel.sh [NOMBRE_O_UUID_DEL_TUNEL]
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/config.yml"

echo "============================================================"
echo " Cloudflare Tunnel Launcher - Vigencia Payment Control System"
echo "============================================================"

# 1. Verificar binario de cloudflared
if ! command -v cloudflared &>/dev/null; then
  echo "[-] ERROR: 'cloudflared' no está instalado en el sistema."
  echo "    Instálalo siguiendo: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/"
  exit 1
fi

# 2. Verificar existencia de archivo de configuración
if [ ! -f "$CONFIG_FILE" ]; then
  if [ -f "${CONFIG_FILE}.example" ]; then
    echo "[-] AVISO: No se encontró '${CONFIG_FILE}'."
    echo "    Copia '${CONFIG_FILE}.example' a '${CONFIG_FILE}' y configura tu TUNNEL_UUID y dominio."
  else
    echo "[-] ERROR: Archivo de configuración no encontrado."
  fi
  exit 1
fi

# 3. Comprobar si AdonisJS está respondiendo en localhost:3333 antes de rutear tráfico
if ! curl -s --connect-timeout 2 http://localhost:3333 >/dev/null 2>&1; then
  echo "[!] ADVERTENCIA: No se detecta un servidor HTTP en http://localhost:3333."
  echo "    Asegúrate de haber arrancado AdonisJS ('node ace serve' o 'pnpm run dev:backend')."
  read -rp "¿Deseas iniciar el túnel de todas formas? (s/N): " CONTINUE
  if [[ ! "$CONTINUE" =~ ^[sSyY]$ ]]; then
    echo "Operación cancelada."
    exit 0
  fi
fi

TUNNEL_IDENTIFIER="${1:-}"

if [ -n "$TUNNEL_IDENTIFIER" ]; then
  echo "[+] Iniciando túnel identificado: '${TUNNEL_IDENTIFIER}'..."
  exec cloudflared tunnel --config "$CONFIG_FILE" run "$TUNNEL_IDENTIFIER"
else
  echo "[+] Iniciando túnel según configuración en '${CONFIG_FILE}'..."
  exec cloudflared tunnel --config "$CONFIG_FILE" run
fi

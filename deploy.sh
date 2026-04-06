#!/usr/bin/env bash

set -euo pipefail

APP_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="${SERVICE_NAME:-image-studio}"

if ! command -v bun >/dev/null 2>&1; then
  echo "bun no esta instalado o no esta en PATH" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node no esta instalado o no esta en PATH" >&2
  exit 1
fi

cd "$APP_DIR"

echo "==> Instalando dependencias"
bun install --frozen-lockfile

echo "==> Build de produccion"
bun run build

echo "==> Ejecutando migraciones"
bun run db:migrate

if command -v systemctl >/dev/null 2>&1; then
  if systemctl is-enabled "$SERVICE_NAME" >/dev/null 2>&1 || systemctl status "$SERVICE_NAME" >/dev/null 2>&1; then
    echo "==> Reiniciando servicio ${SERVICE_NAME}"
    sudo systemctl restart "$SERVICE_NAME"
    sudo systemctl status "$SERVICE_NAME" --no-pager
  else
    echo "==> Servicio ${SERVICE_NAME}.service no encontrado; omitiendo restart"
  fi
else
  echo "==> systemctl no disponible; omitiendo restart"
fi

echo "==> Deploy completado"

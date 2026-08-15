#!/usr/bin/env bash
# Runner de los contratos e2e (tests de integración y seguridad de Fase 8).
# Requiere el stack local de Supabase corriendo (supabase status).
# Cada contrato crea usuarios frescos y verifica el comportamiento real por API.
set -o pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS=(
  "$HERE/rls_security.sh"
  "$HERE/auth_contract.sh"
  "$HERE/publish_contract.sh"
  "$HERE/help_contract.sh"
  "$HERE/moderation_contract.sh"
  "$HERE/notifications_contract.sh"
)

FAILED=0
for script in "${SCRIPTS[@]}"; do
  echo
  echo "▸ $(basename "$script")"
  if bash "$script"; then
    echo "✓ $(basename "$script")"
  else
    echo "✗ $(basename "$script") FALLÓ"
    FAILED=1
  fi
done

echo
if [ "$FAILED" = "0" ]; then
  echo "Todos los contratos pasaron."
else
  echo "Hay contratos fallidos."
  exit 1
fi

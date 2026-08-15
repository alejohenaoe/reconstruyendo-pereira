#!/usr/bin/env bash
# Verificación e2e del flujo de auth (contrato que usa authService) contra el stack local.
set -o pipefail
API=http://127.0.0.1:54421
AUTH=$API/auth/v1
REST=$API/rest/v1
KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
MAIL=http://127.0.0.1:54424/api/v1
TS=$(date +%s)
P=0; F=0
ok(){ P=$((P+1)); echo "PASS  $1"; }
ko(){ F=$((F+1)); echo "FAIL  $1"; }
require(){ [ -n "$2" ] && ok "$1" || ko "$1 (vacío)"; }

latest_link(){ # extrae el enlace del correo más reciente a un destinatario
  local to="$1" mid
  mid=$(curl -s "$MAIL/messages?to=$to" | jq -r '.messages[0].ID')
  [ -z "$mid" ] || [ "$mid" = "null" ] && { echo ""; return 0; }
  curl -s "$MAIL/message/$mid" | python3 -c "
import sys,json,re,urllib.parse
d=json.load(sys.stdin)
body=d.get('Text') or d.get('HTML') or ''
m=re.search(r'(http[^\"\s<>]+/auth/v1/[^\"\s<>]+)', body)
print(urllib.parse.unquote(m.group(1)) if m else '')
"
}

echo "=== Flujo 1: registro + perfil + confirmación ==="
curl -s -X POST "$AUTH/signup?redirect_to=http%3A%2F%2F127.0.0.1%3A5173%2Fauth%2Fcallback%3Fredirect%3D%252Faccount" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"e2e1${TS}@test.local\",\"password\":\"Passw0rd!ABC\",\"data\":{\"display_name\":\"E2E Uno\",\"municipality\":\"dosquebradas\"}}" > /tmp/opencode/s1.json
J1=$(cat /tmp/opencode/s1.json)
ID1=$(echo "$J1" | jq -r .id)
[ "$(echo "$J1" | jq -r .user_metadata.municipality)" = "dosquebradas" ] && ok "user_metadata.municipality=dosquebradas" || ko "user_metadata.municipality"
[ "$(echo "$J1" | jq -r '.confirmation_sent_at != null')" = "true" ] && ok "confirmation_sent_at presente (confirmaciones ON)" || ko "confirmation_sent_at"

# perfil auto-creado con municipio resuelto por el trigger
PROF=$(curl -s "$REST/profiles?select=display_name,municipality_id&id=eq.$ID1" -H "apikey: $KEY")
[ "$(echo "$PROF" | jq -r '.[0].display_name')" = "E2E Uno" ] && ok "trigger: perfil con display_name" || ko "perfil display_name: $PROF"
[ "$(echo "$PROF" | jq -r '.[0].municipality_id')" != "null" ] && ok "trigger: municipality_id resuelto (dosquebradas)" || ko "municipality_id null: $PROF"

# enlace de confirmación conserva /auth/callback y el redirect
LINK=$(latest_link "e2e1${TS}@test.local")
echo "  link: $LINK"
[[ "$LINK" == *"/auth/callback"* ]] && ok "emailRedirectTo -> /auth/callback" || ko "callback no presente en enlace"
# el enlace debe contener ?redirect= (lo añade authService)
[[ "$LINK" == *"redirect="* ]] && ok "enlace conserva parámetro redirect" || ko "enlace sin redirect"

# canjear el enlace: debe redirigir a /auth/callback#access_token=
LOC=$(curl -s -o /dev/null -w "%{redirect_url}" "$LINK")
echo "  redirect: $LOC"
[[ "$LOC" == *"/auth/callback"* && "$LOC" == *"access_token"* ]] && ok "verify 303 -> /auth/callback con token en fragmento" || ko "redirect inesperada: $LOC"

# login tras confirmar
TK1=$(curl -s -X POST "$AUTH/token?grant_type=password" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"e2e1${TS}@test.local\",\"password\":\"Passw0rd!ABC\"}" | jq -r .access_token)
[ -n "$TK1" ] && [ "$TK1" != "null" ] && ok "login tras confirmación" || ko "login tras confirmación"

echo "=== Flujo 2: login de usuario NO verificado ==="
curl -s -X POST "$AUTH/signup" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"e2e2${TS}@test.local\",\"password\":\"Passw0rd!ABC\"}" > /dev/null
LOGIN2=$(curl -s -X POST "$AUTH/token?grant_type=password" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"e2e2${TS}@test.local\",\"password\":\"Passw0rd!ABC\"}")
echo "$LOGIN2" | jq -e '(.msg // .error_description // "") | contains("Email not confirmed")' >/dev/null 2>&1 \
  && ok "login no verificado -> error 'Email not confirmed'" || ko "login no verificado: $(echo "$LOGIN2" | jq -c '{msg,error_description,has_token:(.access_token!=null)}')"

echo "=== Flujo 3: recuperar contraseña -> enlace a /reset-password ==="
curl -s -o /dev/null -X POST "$AUTH/recover?redirect_to=http%3A%2F%2F127.0.0.1%3A5173%2Freset-password" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"e2e1${TS}@test.local\"}"
sleep 1
RLINK=$(latest_link "e2e1${TS}@test.local")
[[ "$RLINK" == *"redirect_to"* && "$RLINK" == *"reset-password"* ]] && ok "enlace de recuperación -> /reset-password" || ko "enlace recuperación: $RLINK"

echo ""
echo "PASS=$P FAIL=$F"

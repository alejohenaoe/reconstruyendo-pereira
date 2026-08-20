#!/usr/bin/env bash
# Verificación e2e del flujo de auth (contrato que usa authService) contra el stack local.
set -o pipefail
# Directorio temporal propio del contrato (no depender de rutas de otras herramientas).
TMPD="${TMPDIR:-/tmp}/reconstruyendo-tests"
mkdir -p "$TMPD"
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

# Mailpit ignora el parámetro `to` de /messages (devuelve la bandeja entera):
# el filtro por destinatario solo funciona con /search?query=to:<dirección>.
mails_to(){ curl -s --get "$MAIL/search" --data-urlencode "query=to:$1" | jq '.messages_count'; }

latest_link(){ # extrae el enlace del correo más reciente a un destinatario
  local to="$1" mid
  mid=$(curl -s --get "$MAIL/search" --data-urlencode "query=to:$to" | jq -r '.messages[0].ID')
  [ -z "$mid" ] || [ "$mid" = "null" ] && { echo ""; return 0; }
  curl -s "$MAIL/message/$mid" | python3 -c "
import sys,json,re,urllib.parse
d=json.load(sys.stdin)
body=d.get('Text') or d.get('HTML') or ''
m=re.search(r'(http[^\"\s<>]+/auth/v1/[^\"\s<>]+)', body)
print(urllib.parse.unquote(m.group(1)) if m else '')
"
}

# El alta autoconfirma el correo (ARCHITECTURE_GUIDELINES.md §7.2.1), así que /signup
# devuelve una sesión y el usuario viaja en `.user`, no en la raíz de la respuesta.
user_field(){ echo "$1" | jq -r "(.user // .).$2"; }

echo "=== Flujo 1: registro autoconfirmado + perfil ==="
curl -s -X POST "$AUTH/signup?redirect_to=http%3A%2F%2F127.0.0.1%3A5173%2Fauth%2Fcallback%3Fredirect%3D%252Faccount" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"e2e1${TS}@test.local\",\"password\":\"Passw0rd!ABC\",\"data\":{\"display_name\":\"E2E Uno\",\"municipality\":\"dosquebradas\",\"capabilities\":[\"labor\",\"advice\",\"slug_inexistente\"]}}" > $TMPD/s1.json
J1=$(cat $TMPD/s1.json)
ID1=$(user_field "$J1" "id")
[ "$(user_field "$J1" "user_metadata.municipality")" = "dosquebradas" ] && ok "user_metadata.municipality=dosquebradas" || ko "user_metadata.municipality"
[ "$(user_field "$J1" "email_confirmed_at != null")" = "true" ] && ok "email_confirmed_at puesto en el alta (autoconfirmación)" || ko "email_confirmed_at ausente tras el registro"
[ "$(echo "$J1" | jq -r '.access_token != null')" = "true" ] && ok "el registro devuelve sesión: no hay paso intermedio" || ko "el registro no devolvió sesión"

# perfil auto-creado con municipio resuelto por el trigger
PROF=$(curl -s "$REST/profiles?select=display_name,municipality_id&id=eq.$ID1" -H "apikey: $KEY")
[ "$(echo "$PROF" | jq -r '.[0].display_name')" = "E2E Uno" ] && ok "trigger: perfil con display_name" || ko "perfil display_name: $PROF"
[ "$(echo "$PROF" | jq -r '.[0].municipality_id')" != "null" ] && ok "trigger: municipality_id resuelto (dosquebradas)" || ko "municipality_id null: $PROF"

# capacidades declaradas al registrarse (MVP §19): el trigger las materializa
CAPS=$(curl -s "$REST/profile_capabilities?select=capabilities(slug)&profile_id=eq.$ID1" -H "apikey: $KEY" | jq -r '[.[].capabilities.slug] | sort | join(",")')
[ "$CAPS" = "advice,labor" ] && ok "trigger: capacidades del registro (slug inexistente ignorado)" || ko "capacidades: $CAPS"

# el registro no manda ningún correo: la bandeja del recién registrado está vacía
MSGS1=$(mails_to "e2e1${TS}@test.local")
[ "$MSGS1" = "0" ] && ok "el registro no envía correo de confirmación" || ko "correos inesperados tras el registro: $MSGS1"

# login inmediato, sin pasar por la bandeja de entrada
TK1=$(curl -s -X POST "$AUTH/token?grant_type=password" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"e2e1${TS}@test.local\",\"password\":\"Passw0rd!ABC\"}" | jq -r .access_token)
[ -n "$TK1" ] && [ "$TK1" != "null" ] && ok "login inmediato tras el registro" || ko "login inmediato tras el registro"

echo "=== Flujo 2: registro mínimo -> entrada directa ==="
# El requisito de correo verificado sigue vivo en la base de datos: rls_security.sh §7
# comprueba que un usuario con email_confirmed_at en null no puede publicar ni ofrecer.
curl -s -X POST "$AUTH/signup" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"e2e2${TS}@test.local\",\"password\":\"Passw0rd!ABC\"}" > /dev/null
LOGIN2=$(curl -s -X POST "$AUTH/token?grant_type=password" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"e2e2${TS}@test.local\",\"password\":\"Passw0rd!ABC\"}")
[ "$(echo "$LOGIN2" | jq -r '.access_token != null')" = "true" ] \
  && ok "registro sin metadata -> login sin verificación previa" || ko "login bloqueado: $(echo "$LOGIN2" | jq -c '{msg,error_description,has_token:(.access_token!=null)}')"

echo "=== Flujo 3: recuperar contraseña -> enlace a /reset-password ==="
curl -s -o /dev/null -X POST "$AUTH/recover?redirect_to=http%3A%2F%2F127.0.0.1%3A5173%2Freset-password" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"e2e1${TS}@test.local\"}"
sleep 1
RLINK=$(latest_link "e2e1${TS}@test.local")
[[ "$RLINK" == *"redirect_to"* && "$RLINK" == *"reset-password"* ]] && ok "enlace de recuperación -> /reset-password" || ko "enlace recuperación: $RLINK"
echo "=== Flujo 1b: metadata de capacidades inválida no rompe el registro ==="
curl -s -X POST "$AUTH/signup" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"e2e1b${TS}@test.local\",\"password\":\"Passw0rd!ABC\",\"data\":{\"display_name\":\"E2E Uno B\",\"capabilities\":\"labor\"}}" > $TMPD/s1b.json
ID1B=$(user_field "$(cat $TMPD/s1b.json)" "id")
[ -n "$ID1B" ] && [ "$ID1B" != "null" ] && ok "registro con capabilities no-arreglo: usuario creado" || ko "registro con capabilities no-arreglo: $(cat $TMPD/s1b.json | head -c 200)"
PROF1B=$(curl -s "$REST/profiles?select=display_name&id=eq.$ID1B" -H "apikey: $KEY" | jq -r '.[0].display_name')
[ "$PROF1B" = "E2E Uno B" ] && ok "perfil creado pese a metadata inválida" || ko "perfil no creado: $PROF1B"
CAPS1B=$(curl -s "$REST/profile_capabilities?select=capability_id&profile_id=eq.$ID1B" -H "apikey: $KEY" | jq 'length')
[ "$CAPS1B" = "0" ] && ok "sin capacidades cuando la metadata no es un arreglo" || ko "capacidades inesperadas: $CAPS1B"

echo ""
echo "PASS=$P FAIL=$F"

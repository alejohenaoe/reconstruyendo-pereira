#!/usr/bin/env bash
# Contrato e2e de ayuda y hilo de colaboración (Fase 5, MVP §33 pasos 7-13):
#  - oferta de ayuda (visibilidad pública, sin duplicados, sin auto-oferta)
#  - hilo de comentarios
#  - contacto privado por RPC (dueño/oferente) + contact_access_log
#  - transiciones de oferta (oferente cancela; dueño avanza a CONFIRMED)
#  - transiciones de necesidad (OPEN → IN_PROGRESS → RESOLVED → CLOSED; no reabrir)
#  - concurrencia: oferta en necesidad no activa rechazada (UX §40)
set -o pipefail
# Directorio temporal propio del contrato (no depender de rutas de otras herramientas).
TMPD="${TMPDIR:-/tmp}/reconstruyendo-tests"
mkdir -p "$TMPD"

API=http://127.0.0.1:54421
REST=$API/rest/v1
AUTH=$API/auth/v1
KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
OUT=$TMPD/help_out.json
DB=supabase_db_rpbpwwwvakpxzdinvojw
P=0; F=0
TS=$(date +%s)
docker exec "$DB" psql -U postgres -d postgres -c "select pg_notify('pgrst', 'reload schema');" >/dev/null 2>&1

ok(){ P=$((P+1)); echo "PASS  $1"; }
ko(){ F=$((F+1)); echo "FAIL  $1"; }
check(){ [ "$2" = "$3" ] && ok "$1 (HTTP $3)" || ko "$1 (want $3 got $2)"; }
check2xx(){ { [ "$2" = "200" ] || [ "$2" = "201" ] || [ "$2" = "204" ]; } && ok "$1 (HTTP $2)" || ko "$1 (want 2xx got $2)"; }
require(){ [ -n "$2" ] && ok "$1" || ko "$1 (vacío)"; }

signup(){ curl -s -X POST "$AUTH/signup" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"$1\",\"password\":\"Passw0rd!ABC\",\"data\":{\"display_name\":\"$2\",\"municipality\":\"pereira\"}}"; }
login(){ curl -s -X POST "$AUTH/token?grant_type=password" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"$1\",\"password\":\"Passw0rd!ABC\"}"; }
confirm(){ docker exec "$DB" psql -U postgres -d postgres \
  -c "update auth.users set email_confirmed_at = now() where id = '$1';" >/dev/null 2>&1; }

api(){ # method path token body
  local m="$1" p="$2" t="$3" b="$4"
  local curl_cmd=(curl -s -o "$OUT" -w "%{http_code}" -X "$m" -H "apikey: $KEY" -H "Content-Type: application/json")
  [ "$m" = "POST" ] && curl_cmd+=(-H "Prefer: return=representation")
  [ -n "$t" ] && curl_cmd+=(-H "Authorization: Bearer $t")
  [ -n "$b" ] && curl_cmd+=(-d "$b")
  OUT_CODE=$("${curl_cmd[@]}" "$REST$p")
}

echo "=== 1. Usuarios, teléfonos, necesidad y dirección ==="
EM_A="help_a${TS}@test.local"; EM_B="help_b${TS}@test.local"; EM_C="help_c${TS}@test.local"; EM_D="help_d${TS}@test.local"
UID_A=$(signup "$EM_A" "María Autora" | jq -r .id)
UID_B=$(signup "$EM_B" "Juan Ayudante" | jq -r .id)
UID_C=$(signup "$EM_C" "Carlos Extraño" | jq -r .id)
UID_D=$(signup "$EM_D" "Diana Oferta" | jq -r .id)
confirm "$UID_A"; confirm "$UID_B"; confirm "$UID_C"; confirm "$UID_D"
TOK_A=$(login "$EM_A" | jq -r .access_token)
TOK_B=$(login "$EM_B" | jq -r .access_token)
TOK_C=$(login "$EM_C" | jq -r .access_token)
TOK_D=$(login "$EM_D" | jq -r .access_token)
require "tokens de sesión" "$TOK_A$TOK_B$TOK_C$TOK_D"

api POST "/profile_phone" "$TOK_A" "{\"profile_id\":\"$UID_A\",\"phone\":\"3001111111\"}"
check2xx "dueño guarda teléfono" "$OUT_CODE"
api POST "/profile_phone" "$TOK_B" "{\"profile_id\":\"$UID_B\",\"phone\":\"3002222222\"}"
check2xx "ayudante guarda teléfono" "$OUT_CODE"

api POST "/needs" "$TOK_A" "{\"user_id\":\"$UID_A\",\"title\":\"Necesito ayuda con la puerta principal\",\"description\":\"La puerta principal no cierra bien desde el sismo y necesito ayuda para repararla o cambiarla por una nueva.\",\"category_id\":2,\"municipality_id\":1,\"neighborhood\":\"Boston\",\"status\":\"OPEN\"}"
check "crear necesidad (201)" "$OUT_CODE" 201
NID=$(jq -r '.[0].id' "$OUT")
require "id de la necesidad" "$NID"
api POST "/need_address" "$TOK_A" "{\"need_id\":\"$NID\",\"address\":\"Carrera 8 # 45-12, casa 3\"}"
check "guardar dirección (201)" "$OUT_CODE" 201

echo "=== 2. Oferta de ayuda + visibilidad + sin duplicados ==="
api POST "/help_offers" "$TOK_B" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_B\",\"capability_id\":2,\"message\":\"Soy albañil y puedo ayudarte con la puerta este fin de semana.\",\"status\":\"OFFERED\"}"
check "Juan ofrece ayuda (201)" "$OUT_CODE" 201
OFFER_ID=$(jq -r '.[0].id' "$OUT")
require "id de la oferta" "$OFFER_ID"

api GET "/need_offer_details?need_id=eq.$NID" "" ""
check "anon ve la oferta (200)" "$OUT_CODE" 200
jq -r '.[0].display_name' "$OUT" | grep -q "Juan Ayudante" && ok "anon ve el nombre del oferente" || ko "anon ve el nombre del oferente"
jq -r '.[0].capability_label' "$OUT" | grep -q "Mano de obra" && ok "la oferta incluye la capacidad" || ko "la oferta incluye la capacidad"

api POST "/help_offers" "$TOK_B" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_B\",\"capability_id\":3,\"message\":\"Segunda oferta duplicada de Juan\",\"status\":\"OFFERED\"}"
check "oferta duplicada rechazada (409)" "$OUT_CODE" 409
grep -q "one_offer_per_user_per_need" "$OUT" && ok "menciona one_offer_per_user_per_need" || ko "menciona one_offer_per_user_per_need"

api POST "/help_offers" "$TOK_A" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_A\",\"capability_id\":2,\"message\":\"Auto oferta del autor\",\"status\":\"OFFERED\"}"
check "auto-oferta rechazada (400)" "$OUT_CODE" 400
grep -q "No puedes ofrecer ayuda en tu propia necesidad" "$OUT" && ok "mensaje de auto-oferta" || ko "mensaje de auto-oferta"

echo "=== 3. Hilo de comentarios ==="
api POST "/need_comments" "$TOK_B" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_B\",\"body\":\"Hola, yo puedo acercarme el sábado en la mañana.\"}"
check2xx "Juan comenta (201)" "$OUT_CODE"
api POST "/need_comments" "$TOK_C" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_C\",\"body\":\"También puedo colaborar si hace falta más gente.\"}"
check2xx "Carlos comenta (201)" "$OUT_CODE"
api GET "/need_comments?need_id=eq.$NID&select=id,body" "" ""
check "anon lee el hilo (200)" "$OUT_CODE" 200
[ "$(jq length "$OUT")" = "2" ] && ok "hilo con 2 comentarios" || ko "hilo con 2 comentarios (got $(jq length "$OUT"))"

# El cliente DEBE enviar user_id: la columna no tiene default y la RLS exige
# user_id = auth.uid(). Omitirlo fue un bug real del cliente (403 silencioso).
api POST "/need_comments" "$TOK_B" "{\"need_id\":\"$NID\",\"body\":\"Comentario sin user_id explícito.\"}"
check "comentar sin user_id se rechaza (403)" "$OUT_CODE" 403

# Tipos de mensaje del hilo (MVP §14): por defecto COMMENT.
api GET "/need_comments?need_id=eq.$NID&select=kind" "" ""
[ "$(jq -r '[.[].kind] | unique | join(",")' "$OUT")" = "COMMENT" ] && ok "los mensajes existentes quedan como COMMENT" || ko "kind por defecto: $(jq -c '[.[].kind]' "$OUT")"
api POST "/need_comments" "$TOK_C" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_C\",\"kind\":\"MATERIAL\",\"body\":\"Puedo aportar dos bultos de cemento.\"}"
check2xx "Carlos ofrece material en el hilo (201)" "$OUT_CODE"
api GET "/need_comments?need_id=eq.$NID&kind=eq.MATERIAL&select=id,body" "" ""
[ "$(jq length "$OUT")" = "1" ] && ok "la oferta de material se distingue en el hilo" || ko "oferta de material: $(jq length "$OUT")"
api POST "/need_comments" "$TOK_C" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_C\",\"kind\":\"INVENTADO\",\"body\":\"Tipo que no existe en el enum.\"}"
check "un tipo inexistente se rechaza (400)" "$OUT_CODE" 400

echo "=== 4. Contacto privado (RPC + log) ==="
RPC_BODY=$(curl -s -X POST "$REST/rpc/get_need_contact" -H "apikey: $KEY" -H "Content-Type: application/json" -H "Authorization: Bearer $TOK_C" -H "Prefer: return=representation" -d "{\"need_id\":\"$NID\"}")
{ [ "$RPC_BODY" = "null" ] || [ -z "$RPC_BODY" ]; } && ok "extraño no obtiene contacto (null)" || ko "extraño obtiene contacto: $RPC_BODY"

api POST "/rpc/get_need_contact" "$TOK_B" "{\"need_id\":\"$NID\"}"
check2xx "Juan (oferente) pide contacto" "$OUT_CODE"
jq -r '.owner.display_name' "$OUT" | grep -q "María Autora" && ok "oferente ve al autor" || ko "oferente ve al autor"
jq -r '.owner.phone' "$OUT" | grep -q "3001111111" && ok "oferente ve el teléfono del autor" || ko "oferente ve el teléfono del autor"
jq -r '.owner.address' "$OUT" | grep -q "Carrera 8" && ok "oferente ve la dirección" || ko "oferente ve la dirección"

api POST "/rpc/get_need_contact" "$TOK_A" "{\"need_id\":\"$NID\"}"
check2xx "María (autora) pide contacto" "$OUT_CODE"
jq -r '.offerers[0].display_name' "$OUT" | grep -q "Juan Ayudante" && ok "autora ve al oferente" || ko "autora ve al oferente"
jq -r '.offerers[0].phone' "$OUT" | grep -q "3002222222" && ok "autora ve el teléfono del oferente" || ko "autora ve el teléfono del oferente"

NLOG=$(docker exec "$DB" psql -U postgres -d postgres -tA -c "select count(*) from public.contact_access_log where need_id = '$NID';")
[ "$NLOG" = "2" ] && ok "contact_access_log registra 2 revelaciones" || ko "contact_access_log=$NLOG (esperado 2)"

echo "=== 5. Transiciones de oferta ==="
api PATCH "/help_offers?id=eq.$OFFER_ID" "$TOK_B" '{"status":"CONTACTED"}'
check "oferente no puede avanzar su oferta (400)" "$OUT_CODE" 400
grep -q "Un oferente solo puede cancelar su oferta" "$OUT" && ok "mensaje de oferente" || ko "mensaje de oferente"
api PATCH "/help_offers?id=eq.$OFFER_ID" "$TOK_B" '{"status":"CONFIRMED"}'
check "oferente no puede confirmarse (400)" "$OUT_CODE" 400

api PATCH "/help_offers?id=eq.$OFFER_ID" "$TOK_B" '{"status":"CANCELLED"}'
check2xx "oferente cancela su oferta (204)" "$OUT_CODE"
api GET "/need_offer_details?need_id=eq.$NID" "" ""
[ "$(jq length "$OUT")" = "0" ] && ok "ofertas canceladas no aparecen en público" || ko "ofertas canceladas aparecen en público"

api POST "/help_offers" "$TOK_B" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_B\",\"capability_id\":2,\"message\":\"Reoferta: sigo disponible con la puerta.\",\"status\":\"OFFERED\"}"
check "Juan re-ofrece tras cancelar (201)" "$OUT_CODE" 201
OFFER_ID=$(jq -r '.[0].id' "$OUT")
require "id de la reoferta" "$OFFER_ID"

for s in CONTACTED AGREED COMPLETED CONFIRMED; do
  api PATCH "/help_offers?id=eq.$OFFER_ID" "$TOK_A" "{\"status\":\"$s\"}"
  check2xx "autora avanza a $s" "$OUT_CODE"
done
api PATCH "/help_offers?id=eq.$OFFER_ID" "$TOK_A" '{"status":"OFFERED"}'
check "retroceso de estado rechazado (400)" "$OUT_CODE" 400

api GET "/need_offer_details?need_id=eq.$NID" "" ""
jq -r '.[0].offer_status' "$OUT" | grep -q "CONFIRMED" && ok "público ve oferta confirmada" || ko "público ve oferta confirmada"
DIR=$(cd "$(dirname "$0")" && pwd)
grep -q "Ayuda confirmada" "$DIR/../../src/features/help/types.ts" && ok "lenguaje preciso (no 'ayudó')" || ko "lenguaje preciso"

echo "=== 6. Transiciones de necesidad (0008) y concurrencia (UX §40) ==="
api PATCH "/needs?id=eq.$NID" "$TOK_C" '{"status":"IN_PROGRESS"}'
check "extraño no cambia estado (204 sin filas)" "$OUT_CODE" 204
api GET "/needs?id=eq.$NID&select=status" "" ""
jq -r '.[0].status' "$OUT" | grep -q "OPEN" && ok "la necesidad sigue OPEN tras el intento ajeno" || ko "la necesidad sigue OPEN tras el intento ajeno"

api PATCH "/needs?id=eq.$NID" "$TOK_A" '{"status":"RESOLVED"}'
check "salto OPEN→RESOLVED bloqueado (400)" "$OUT_CODE" 400
grep -q "Transición de estado no permitida" "$OUT" && ok "mensaje de transición inválida" || ko "mensaje de transición inválida"

api PATCH "/needs?id=eq.$NID" "$TOK_A" '{"status":"IN_PROGRESS"}'
check2xx "autora marca en proceso (204)" "$OUT_CODE"

api POST "/help_offers" "$TOK_D" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_D\",\"capability_id\":3,\"message\":\"Diana también se ofrece mientras la necesidad sigue en proceso.\",\"status\":\"OFFERED\"}"
check "oferta en IN_PROGRESS permitida (201)" "$OUT_CODE" 201

api PATCH "/needs?id=eq.$NID" "$TOK_A" '{"status":"RESOLVED"}'
check2xx "autora marca solucionada (204)" "$OUT_CODE"
api POST "/help_offers" "$TOK_C" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_C\",\"capability_id\":2,\"message\":\"Carlos intenta ofrecer cuando ya no se aceptan ofertas.\",\"status\":\"OFFERED\"}"
check "oferta en necesidad resuelta rechazada (400)" "$OUT_CODE" 400
grep -q "no acepta nuevas ofertas" "$OUT" && ok "mensaje de concurrencia (UX §40)" || ko "mensaje de concurrencia"

api PATCH "/needs?id=eq.$NID" "$TOK_A" '{"status":"CLOSED"}'
check2xx "autora cierra la necesidad (204)" "$OUT_CODE"
api PATCH "/needs?id=eq.$NID" "$TOK_A" '{"status":"OPEN"}'
check "necesidad cerrada no reabre (400)" "$OUT_CODE" 400

echo ""
echo "=================================="
echo "PASS=$P FAIL=$F"
echo "=================================="
[ "$F" = "0" ]

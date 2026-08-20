#!/usr/bin/env bash
# Contrato e2e de notificaciones in-app (Fase 7):
#  - los triggers crean notificaciones ante eventos de dominio (no el frontend):
#    oferta -> dueño; comentario -> dueño; ayuda confirmada -> oferente;
#    cambio de estado -> oferentes
#  - sin auto-notificación (el actor no se notifica a sí mismo)
#  - RLS: cada usuario solo ve/marca/borra las suyas; no se puede insertar por API
#  - marcar leída no afecta a las demás; conteo de no leídas (índice parcial)
#  - paginación por cursor (created_at desc, id desc), misma forma que el frontend
set -o pipefail
# Directorio temporal propio del contrato (no depender de rutas de otras herramientas).
TMPD="${TMPDIR:-/tmp}/reconstruyendo-tests"
mkdir -p "$TMPD"

API=http://127.0.0.1:54421
REST=$API/rest/v1
AUTH=$API/auth/v1
KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
OUT=$TMPD/notif_out.json
DB=supabase_db_rpbpwwwvakpxzdinvojw
P=0; F=0
TS=$(date +%s)
docker exec "$DB" psql -U postgres -d postgres -c "select pg_notify('pgrst', 'reload schema');" >/dev/null 2>&1
docker exec "$DB" psql -U postgres -d postgres -c "delete from public.notifications;" >/dev/null

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

# count: conteo exacto (misma consulta del badge: select=id + read_at is.null)
count(){ # path token
  local p="$1" t="$2"
  local curl_cmd=(curl -s -o /dev/null -D $TMPD/notif_h.txt -w "%{http_code}" -X GET \
    -H "apikey: $KEY" -H "Prefer: count=exact" -H "Range: 0-0")
  [ -n "$t" ] && curl_cmd+=(-H "Authorization: Bearer $t")
  OUT_CODE=$("${curl_cmd[@]}" "$REST$p")
  OUT_COUNT=$(grep -i '^content-range:' $TMPD/notif_h.txt | tr -d '\r' | sed 's/.*\///')
}

nlist(){ # token user_id
  curl -s -H "apikey: $KEY" -H "Authorization: Bearer $1" "$REST/notifications?user_id=eq.$2&select=id,type,payload,read_at" > "$OUT"
}

echo "=== 1. Usuarios y necesidad ==="
EM_A="notif_a${TS}@test.local"; EM_B="notif_b${TS}@test.local"; EM_C="notif_c${TS}@test.local"
UID_A=$(signup "$EM_A" "Nora Autora" | jq -r '(.user // .).id')
UID_B=$(signup "$EM_B" "Nico Ayudante" | jq -r '(.user // .).id')
UID_C=$(signup "$EM_C" "Carla Extraña" | jq -r '(.user // .).id')
confirm "$UID_A"; confirm "$UID_B"; confirm "$UID_C"
TOK_A=$(login "$EM_A" | jq -r .access_token)
TOK_B=$(login "$EM_B" | jq -r .access_token)
TOK_C=$(login "$EM_C" | jq -r .access_token)
require "tokens de sesión" "$TOK_A$TOK_B$TOK_C"

api POST "/needs" "$TOK_A" "{\"user_id\":\"$UID_A\",\"title\":\"Necesito reparar el techo\",\"description\":\"El techo tiene una gotera grande y necesito ayuda para repararla este fin de semana.\",\"category_id\":2,\"municipality_id\":1,\"status\":\"OPEN\"}"
check "crear necesidad (201)" "$OUT_CODE" 201
NID=$(jq -r '.[0].id' "$OUT")
require "id de la necesidad" "$NID"

echo "=== 2. Oferta y comentarios -> notifican al dueño ==="
api POST "/help_offers" "$TOK_B" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_B\",\"capability_id\":2,\"message\":\"Tengo experiencia en techos y puedo ayudarte.\",\"status\":\"OFFERED\"}"
check "Nico ofrece ayuda (201)" "$OUT_CODE" 201
OFFER_ID=$(jq -r '.[0].id' "$OUT")
require "id de la oferta" "$OFFER_ID"

nlist "$TOK_A" "$UID_A"
jq -r '.[] | select(.type=="HELP_OFFER") | .type' "$OUT" | grep -q "HELP_OFFER" && ok "la oferta notifica al dueño" || ko "la oferta notifica al dueño"
nlist "$TOK_B" "$UID_B"
[ "$(jq length "$OUT")" = "0" ] && ok "el oferente no se auto-notifica" || ko "el oferente no se auto-notifica"

api POST "/need_comments" "$TOK_B" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_B\",\"body\":\"Hola, ¿el fin de semana te sirve?\"}"
check2xx "Nico comenta (201)" "$OUT_CODE"
api POST "/need_comments" "$TOK_C" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_C\",\"kind\":\"MATERIAL\",\"body\":\"Yo también puedo ayudar con material.\"}"
check2xx "Carla ofrece material (201)" "$OUT_CODE"
api POST "/need_comments" "$TOK_A" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_A\",\"body\":\"Gracias a ambos por ofrecerse.\"}"
check2xx "Nora comenta en su necesidad (201)" "$OUT_CODE"

nlist "$TOK_A" "$UID_A"
CNT_A=$(jq length "$OUT")
[ "$CNT_A" = "3" ] && ok "el dueño recibió 3 notificaciones (oferta + 2 comentarios)" || ko "dueño recibió $CNT_A (esperado 3)"
jq -r '.[] | select(.type=="COMMENT") | .payload.actor_name' "$OUT" | grep -q "Nico Ayudante" && ok "comentario de Nico notificado" || ko "comentario de Nico notificado"
jq -r '.[] | select(.type=="COMMENT") | .payload.actor_name' "$OUT" | grep -q "Carla Extraña" && ok "comentario de Carla notificado" || ko "comentario de Carla notificado"
jq -r '.[] | select(.type=="COMMENT") | .payload.actor_name' "$OUT" | grep -q "Nora Autora" && ko "el autor no se auto-notifica su comentario" || ok "el autor no se auto-notifica su comentario"
jq -r '.[0].payload.title' "$OUT" | grep -q "Necesito reparar el techo" && ok "payload incluye el título" || ko "payload incluye el título"
# El payload lleva el tipo del mensaje para distinguir "ofreció materiales" (MVP §27).
jq -r '.[] | select(.type=="COMMENT" and .payload.actor_name=="Carla Extraña") | .payload.kind' "$OUT" | grep -q "MATERIAL" && ok "el aviso distingue la oferta de material" || ko "payload sin kind=MATERIAL: $(jq -c '[.[] | select(.type=="COMMENT") | .payload]' "$OUT")"
jq -r '.[] | select(.type=="COMMENT" and .payload.actor_name=="Nico Ayudante") | .payload.kind' "$OUT" | grep -q "COMMENT" && ok "un comentario normal viaja como COMMENT" || ko "payload de comentario normal sin kind"
nlist "$TOK_C" "$UID_C"
[ "$(jq length "$OUT")" = "0" ] && ok "la extraña no recibe notificaciones" || ko "la extraña no recibe notificaciones"

echo "=== 3. Confirmación y cambio de estado -> notifican al oferente ==="
for s in CONTACTED AGREED COMPLETED CONFIRMED; do
  api PATCH "/help_offers?id=eq.$OFFER_ID" "$TOK_A" "{\"status\":\"$s\"}"
  check2xx "dueño avanza a $s" "$OUT_CODE"
done
api PATCH "/needs?id=eq.$NID" "$TOK_A" '{"status":"IN_PROGRESS"}'
check2xx "dueño marca en proceso" "$OUT_CODE"

nlist "$TOK_B" "$UID_B"
CNT_B=$(jq length "$OUT")
[ "$CNT_B" = "2" ] && ok "el oferente recibió 2 notificaciones" || ko "oferente recibió $CNT_B (esperado 2)"
jq -r '.[] | select(.type=="HELP_CONFIRMED") | .type' "$OUT" | grep -q "HELP_CONFIRMED" && ok "ayuda confirmada notifica al oferente" || ko "ayuda confirmada notifica al oferente"
jq -r '.[] | select(.type=="NEED_STATUS_CHANGE") | .payload.status' "$OUT" | grep -q "IN_PROGRESS" && ok "cambio de estado incluye el estado" || ko "cambio de estado incluye el estado"
jq -r '.[] | select(.type=="NEED_STATUS_CHANGE") | .payload.actor_name' "$OUT" | grep -q "Nora Autora" && ok "cambio de estado atribuye al autor" || ko "cambio de estado atribuye al autor"

echo "=== 4. RLS: cada quien solo ve las suyas; sin insert por API ==="
api POST "/notifications" "$TOK_B" "{\"user_id\":\"$UID_B\",\"type\":\"COMMENT\",\"payload\":{\"title\":\"falso\",\"actor_name\":\"X\"}}"
check "no se pueden crear notificaciones por API (403)" "$OUT_CODE" 403
grep -q "permission denied" "$OUT" && ok "mensaje de permiso" || ko "mensaje de permiso"

nlist "$TOK_B" "$UID_A"
[ "$(jq length "$OUT")" = "0" ] && ok "Nico no ve las notificaciones de Nora" || ko "Nico no ve las notificaciones de Nora"

FIRST_ID=$(docker exec "$DB" psql -U postgres -d postgres -tA -c "select id from public.notifications where user_id = '$UID_A' order by created_at limit 1;")
api PATCH "/notifications?id=eq.$FIRST_ID" "$TOK_B" '{"read_at":"2026-01-01T00:00:00Z"}'
check "Nico no puede marcar las de Nora (204 sin filas)" "$OUT_CODE" 204
nlist "$TOK_A" "$UID_A"
jq -r --arg id "$FIRST_ID" '.[] | select(.id==$id) | .read_at' "$OUT" | grep -q "null" && ok "la de Nora sigue sin leer" || ko "la de Nora sigue sin leer"

echo "=== 5. Marcar leída y conteo de no leídas ==="
api GET "/notifications?user_id=eq.$UID_A&select=id,type" "$TOK_A" ""
check "Nora lee su bandeja (200)" "$OUT_CODE" 200
[ "$(jq length "$OUT")" = "3" ] && ok "bandeja de Nora con 3" || ko "bandeja de Nora (got $(jq length "$OUT"))"
count "/notifications?select=id&read_at=is.null" "$TOK_A"
[ "$OUT_COUNT" = "3" ] && ok "3 sin leer" || ko "sin leer=$OUT_COUNT (esperado 3)"

api PATCH "/notifications?id=eq.$FIRST_ID" "$TOK_A" '{"read_at":"2026-01-01T00:00:00Z"}'
check "Nora marca una leída (204)" "$OUT_CODE" 204
count "/notifications?select=id&read_at=is.null" "$TOK_A"
[ "$OUT_COUNT" = "2" ] && ok "2 sin leer tras marcar una" || ko "sin leer=$OUT_COUNT (esperado 2)"
nlist "$TOK_A" "$UID_A"
[ "$(jq '[.[] | select(.read_at == null)] | length' "$OUT")" = "2" ] && ok "las demás no se afectaron" || ko "las demás no se afectaron"

api PATCH "/notifications?user_id=eq.$UID_A&read_at=is.null" "$TOK_A" '{"read_at":"2026-01-01T00:00:00Z"}'
check "marcar todas como leídas (204)" "$OUT_CODE" 204
count "/notifications?select=id&read_at=is.null" "$TOK_A"
[ "$OUT_COUNT" = "0" ] && ok "0 sin leer tras marcar todas" || ko "sin leer=$OUT_COUNT (esperado 0)"

echo "=== 6. Paginación por cursor (misma forma que el frontend) ==="
api GET "/notifications?user_id=eq.$UID_A&select=id,created_at&order=created_at.desc,id.desc&limit=2" "$TOK_A" ""
check "primera página de 2 (200)" "$OUT_CODE" 200
[ "$(jq length "$OUT")" = "2" ] && ok "2 notificaciones en la primera página" || ko "primera página (got $(jq length "$OUT"))"
LID=$(jq -r '.[1].id' "$OUT")
LCT=$(jq -r '.[1].created_at' "$OUT")
require "cursor id" "$LID"
OR_VAL="and(created_at.lt.${LCT}),and(created_at.eq.${LCT},id.lt.${LID})"
OR_ENC=$(printf '%s' "$OR_VAL" | sed -e 's/(/%28/g' -e 's/)/%29/g' -e 's/,/%2C/g' -e 's/+/%2B/g' -e 's/:/%3A/g')
OR_FILTER="/notifications?user_id=eq.$UID_A&select=id,created_at&order=created_at.desc,id.desc&or=%28${OR_ENC}%29"
api GET "$OR_FILTER" "$TOK_A" ""
check "segunda página (200)" "$OUT_CODE" 200
[ "$(jq length "$OUT")" = "1" ] && ok "1 notificación en la segunda página" || ko "segunda página (got $(jq length "$OUT"))"
FIRST_ID_2=$(jq -r '.[0].id' "$OUT")
[ "$FIRST_ID_2" != "$LID" ] && ok "sin solapamiento entre páginas" || ko "sin solapamiento entre páginas"
[ "$(jq -r '.[0].created_at' "$OUT")" \< "$LCT" ] && ok "la segunda página es más antigua" || ko "la segunda página es más antigua"

echo "=== 7. Borrar notificación ==="
api DELETE "/notifications?id=eq.$FIRST_ID" "$TOK_A" ""
check "Nora borra una notificación (204)" "$OUT_CODE" 204
api GET "/notifications?user_id=eq.$UID_A&select=id" "$TOK_A" ""
[ "$(jq length "$OUT")" = "2" ] && ok "quedan 2 notificaciones" || ko "quedan $(jq length "$OUT")"

echo
echo "=================================="
echo "PASS=$P FAIL=$F"
echo "=================================="
[ "$F" = "0" ]

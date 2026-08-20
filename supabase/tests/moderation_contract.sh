#!/usr/bin/env bash
# Contrato e2e de moderación (Fase 6, MVP §26, ARCH §36/§49):
#  - reportes (3 tipos de objetivo, sin auto-reporte, sin duplicados)
#  - panel admin: ver todos, cambiar estado, eliminar; estadísticas RPC
#  - moderar necesidad (ocultar/restaurar/cerrar) y comentario (ocultar)
#  - suspender usuario (is_banned bloquea necesidad/comentario/reporte)
#  - un usuario normal NO puede ejecutar acciones de admin (verificado por GET)
set -o pipefail
# Directorio temporal propio del contrato (no depender de rutas de otras herramientas).
TMPD="${TMPDIR:-/tmp}/reconstruyendo-tests"
mkdir -p "$TMPD"

API=http://127.0.0.1:54421
REST=$API/rest/v1
AUTH=$API/auth/v1
KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
OUT=$TMPD/mod_out.json
DB=supabase_db_rpbpwwwvakpxzdinvojw
P=0; F=0
TS=$(date +%s)
docker exec "$DB" psql -U postgres -d postgres -c "select pg_notify('pgrst', 'reload schema');" >/dev/null 2>&1

# Limpieza de reportes de corridas anteriores (los reportes son globales y
# solo el admin puede borrarlos, así que se limpian por SQL).
docker exec "$DB" psql -U postgres -d postgres -c "delete from public.reports;" >/dev/null

ok(){ P=$((P+1)); echo "PASS  $1"; }
ko(){ F=$((F+1)); echo "FAIL  $1"; }
check(){ [ "$2" = "$3" ] && ok "$1 (HTTP $3)" || ko "$1 (want $3 got $2)"; }
check2xx(){ { [ "$2" = "200" ] || [ "$2" = "201" ] || [ "$2" = "204" ]; } && ok "$1 (HTTP $2)" || ko "$1 (want 2xx got $2)"; }
not2xx(){ { [ "$2" = "200" ] || [ "$2" = "201" ] || [ "$2" = "204" ]; } && ko "$1 (se esperaba bloqueo, HTTP $2)" || ok "$1 (bloqueado, HTTP $2)"; }
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

echo "=== 1. Usuarios, necesidad y comentario ==="
EM_A="mod_a${TS}@test.local"; EM_B="mod_b${TS}@test.local"; EM_C="mod_c${TS}@test.local"; EM_ADM="mod_adm${TS}@test.local"
UID_A=$(signup "$EM_A" "Ana Reportada" | jq -r '(.user // .).id')
UID_B=$(signup "$EM_B" "Bruno Reportero" | jq -r '(.user // .).id')
UID_C=$(signup "$EM_C" "Camilo Neutral" | jq -r '(.user // .).id')
UID_ADM=$(signup "$EM_ADM" "Diana Admin" | jq -r '(.user // .).id')
for u in "$UID_A" "$UID_B" "$UID_C" "$UID_ADM"; do confirm "$u"; done
TOK_A=$(login "$EM_A" | jq -r .access_token)
TOK_B=$(login "$EM_B" | jq -r .access_token)
TOK_C=$(login "$EM_C" | jq -r .access_token)
TOK_ADM=$(login "$EM_ADM" | jq -r .access_token)
require "tokens de sesión" "$TOK_A$TOK_B$TOK_C$TOK_ADM"

api POST "/needs" "$TOK_A" "{\"user_id\":\"$UID_A\",\"title\":\"Necesito ayuda con el techo\",\"description\":\"Tengo una filtración en el techo desde las lluvias de la semana pasada y necesito orientación para repararla.\",\"category_id\":1,\"municipality_id\":1,\"neighborhood\":\"Boston\",\"status\":\"OPEN\"}"
check "crear necesidad (201)" "$OUT_CODE" 201
NID=$(jq -r '.[0].id' "$OUT")
require "id de la necesidad" "$NID"

api POST "/need_comments" "$TOK_A" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_A\",\"body\":\"Busco a alguien que conozca de techos y pueda pasar a verlo.\"}"
check "Ana comenta en su necesidad (201)" "$OUT_CODE" 201
COMMENT_ID=$(jq -r '.[0].id' "$OUT")
require "id del comentario" "$COMMENT_ID"

echo "=== 2. Reportes: necesidad, comentario y usuario ==="
api POST "/reports" "$TOK_B" "{\"reporter_id\":\"$UID_B\",\"need_id\":\"$NID\",\"reason\":\"FALSE_INFO\",\"details\":\"La descripción parece engañosa\"}"
check "reporta la necesidad (201)" "$OUT_CODE" 201
R_NEED=$(jq -r '.[0].id' "$OUT")
api POST "/reports" "$TOK_B" "{\"reporter_id\":\"$UID_B\",\"comment_id\":\"$COMMENT_ID\",\"reason\":\"OFFENSIVE\"}"
check "reporta el comentario (201)" "$OUT_CODE" 201
R_COMMENT=$(jq -r '.[0].id' "$OUT")
api POST "/reports" "$TOK_B" "{\"reporter_id\":\"$UID_B\",\"reported_user_id\":\"$UID_A\",\"reason\":\"FRAUD\"}"
check "reporta al usuario (201)" "$OUT_CODE" 201
R_USER=$(jq -r '.[0].id' "$OUT")

api POST "/reports" "$TOK_B" "{\"reporter_id\":\"$UID_B\",\"reported_user_id\":\"$UID_B\",\"reason\":\"SPAM\"}"
not2xx "auto-reporte rechazado" "$OUT_CODE"
api POST "/reports" "$TOK_B" "{\"reporter_id\":\"$UID_B\",\"need_id\":\"$NID\",\"reason\":\"SPAM\"}"
check "reporte duplicado rechazado (409)" "$OUT_CODE" 409

# El cliente DEBE enviar reporter_id: la RLS lo compara con auth.uid().
api POST "/reports" "$TOK_B" "{\"need_id\":\"$NID\",\"reason\":\"SPAM\",\"details\":\"Reporte sin reporter_id explícito.\"}"
check "reportar sin reporter_id se rechaza (403)" "$OUT_CODE" 403

echo "=== 3. Promoción a admin y estadísticas RPC ==="
docker exec "$DB" psql -U postgres -d postgres -c "update public.profiles set app_role = 'ADMIN' where id = '$UID_ADM';" >/dev/null
api POST "/rpc/admin_stats" "$TOK_ADM" '{}'
check2xx "admin_stats para admin" "$OUT_CODE"
jq -r '.reports_pending' "$OUT" | grep -q "3" && ok "3 reportes pendientes" || ko "reports_pending=$(jq -r '.reports_pending' "$OUT")"
api POST "/rpc/admin_stats" "$TOK_B" '{}'
not2xx "admin_stats bloqueado para no-admin" "$OUT_CODE"

echo "=== 4. Panel: reportes ==="
api GET "/reports?select=id,status" "$TOK_ADM" ""
check "admin ve todos los reportes (200)" "$OUT_CODE" 200
[ "$(jq length "$OUT")" = "3" ] && ok "admin ve 3 reportes" || ko "admin ve $(jq length "$OUT") reportes"

api PATCH "/reports?id=eq.$R_NEED" "$TOK_ADM" '{"status":"ACTIONED"}'
check2xx "admin atiende un reporte (204)" "$OUT_CODE"
api GET "/reports?id=eq.$R_NEED&select=status" "$TOK_ADM" ""
jq -r '.[0].status' "$OUT" | grep -q "ACTIONED" && ok "estado del reporte cambió" || ko "estado del reporte no cambió"

api DELETE "/reports?id=eq.$R_NEED" "$TOK_ADM" ""
check2xx "admin elimina un reporte (204)" "$OUT_CODE"
api GET "/reports?select=id" "$TOK_ADM" ""
[ "$(jq length "$OUT")" = "2" ] && ok "quedan 2 reportes" || ko "quedan $(jq length "$OUT") reportes"

echo "=== 5. Moderar necesidad: ocultar / restaurar / cerrar ==="
api PATCH "/needs?id=eq.$NID" "$TOK_ADM" '{"is_hidden":true,"hidden_at":"'$(date -u +%FT%TZ)'"}'
check2xx "admin oculta la necesidad (204)" "$OUT_CODE"
api GET "/needs?id=eq.$NID&select=id" "" ""
[ "$(jq length "$OUT")" = "0" ] && ok "anon ya no ve la necesidad oculta" || ko "anon ve la necesidad oculta"

api PATCH "/needs?id=eq.$NID" "$TOK_ADM" '{"is_hidden":false,"hidden_at":null}'
check2xx "admin restaura la necesidad (204)" "$OUT_CODE"
api GET "/needs?id=eq.$NID&select=id" "" ""
[ "$(jq length "$OUT")" = "1" ] && ok "anon vuelve a ver la necesidad" || ko "anon no ve la necesidad restaurada"

api PATCH "/needs?id=eq.$NID" "$TOK_ADM" '{"status":"CLOSED"}'
check2xx "admin cierra la necesidad (204)" "$OUT_CODE"
api GET "/needs?id=eq.$NID&select=status" "$TOK_ADM" ""
jq -r '.[0].status' "$OUT" | grep -q "CLOSED" && ok "necesidad cerrada por admin" || ko "necesidad no quedó CLOSED"

echo "=== 6. Moderar comentario: ocultar / restaurar ==="
api PATCH "/need_comments?id=eq.$COMMENT_ID" "$TOK_ADM" '{"is_hidden":true,"hidden_at":"'$(date -u +%FT%TZ)'"}'
check2xx "admin oculta el comentario (204)" "$OUT_CODE"
api GET "/need_comments?need_id=eq.$NID&select=id" "" ""
[ "$(jq length "$OUT")" = "0" ] && ok "anon ya no ve el comentario oculto" || ko "anon ve el comentario oculto"
# El autor sigue viendo lo suyo (RLS: not is_hidden or auth.uid() = user_id).
api GET "/need_comments?id=eq.$COMMENT_ID&select=id,is_hidden" "$TOK_A" ""
[ "$(jq length "$OUT")" = "1" ] && ok "el autor sigue viendo su comentario oculto" || ko "el autor perdió su comentario"
# Listado del panel: filtrar por ocultos es lo que usa /admin/comments.
api GET "/need_comments?is_hidden=eq.true&select=id,body,need:needs(title)" "$TOK_ADM" ""
[ "$(jq length "$OUT")" -ge 1 ] && ok "el panel lista los comentarios ocultados" || ko "el panel no lista ocultados"
jq -e '.[0].need.title != null' "$OUT" >/dev/null && ok "el embed del pedido llega como objeto (no arreglo)" || ko "embed inesperado: $(jq -c '.[0].need' "$OUT")"
api PATCH "/need_comments?id=eq.$COMMENT_ID" "$TOK_ADM" '{"is_hidden":false,"hidden_at":null}'
check2xx "admin restaura el comentario (204)" "$OUT_CODE"

echo "=== 6b. El hilo de un pedido oculto queda congelado (MVP §21, §25) ==="
api PATCH "/needs?id=eq.$NID" "$TOK_ADM" '{"is_hidden":true,"hidden_at":"'$(date -u +%FT%TZ)'"}'
check2xx "admin oculta la necesidad para la prueba del hilo" "$OUT_CODE"
api POST "/need_comments" "$TOK_B" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_B\",\"body\":\"Intento comentar en un pedido oculto.\"}"
check "no se puede comentar en un pedido oculto (400)" "$OUT_CODE" 400
api GET "/need_comments?need_id=eq.$NID&select=id" "" ""
[ "$(jq length "$OUT")" = "0" ] && ok "anon no lee el hilo de un pedido oculto" || ko "anon lee el hilo oculto ($(jq length "$OUT"))"
api GET "/need_comments?need_id=eq.$NID&select=id" "$TOK_A" ""
[ "$(jq length "$OUT")" -ge 1 ] && ok "el autor del comentario lo sigue viendo" || ko "el autor perdió su comentario"
api PATCH "/needs?id=eq.$NID" "$TOK_ADM" '{"is_hidden":false,"hidden_at":null}'
check2xx "admin restaura la necesidad" "$OUT_CODE"
api GET "/need_comments?need_id=eq.$NID&select=id" "" ""
[ "$(jq length "$OUT")" -ge 1 ] && ok "restaurada: el hilo vuelve a ser público" || ko "el hilo no volvió"

echo "=== 7. Suspender usuario (is_banned) ==="
api PATCH "/profiles?id=eq.$UID_A" "$TOK_ADM" '{"banned_at":"'$(date -u +%FT%TZ)'"}'
check2xx "admin suspende a Ana (204)" "$OUT_CODE"
api POST "/needs" "$TOK_A" "{\"user_id\":\"$UID_A\",\"title\":\"Otra necesidad prohibida\",\"description\":\"Esta no debería poder crearse porque la usuaria está suspendida.\",\"category_id\":1,\"municipality_id\":1,\"status\":\"OPEN\"}"
not2xx "suspendida no crea necesidad" "$OUT_CODE"
api POST "/need_comments" "$TOK_A" "{\"need_id\":\"$NID\",\"user_id\":\"$UID_A\",\"body\":\"Comentario de persona suspendida\"}"
not2xx "suspendida no comenta" "$OUT_CODE"
api POST "/reports" "$TOK_A" "{\"reporter_id\":\"$UID_A\",\"reported_user_id\":\"$UID_B\",\"reason\":\"SPAM\"}"
not2xx "suspendida no reporta" "$OUT_CODE"

api PATCH "/profiles?id=eq.$UID_A" "$TOK_ADM" '{"banned_at":null}'
check2xx "admin restaura a Ana (204)" "$OUT_CODE"

echo "=== 8. Un usuario normal NO puede moderar ==="
api PATCH "/reports?id=eq.$R_COMMENT" "$TOK_B" '{"status":"DISMISSED"}'
api GET "/reports?id=eq.$R_COMMENT&select=status" "$TOK_ADM" ""
jq -r '.[0].status' "$OUT" | grep -q "PENDING" && ok "Bruno no cambió el estado del reporte" || ko "Bruno cambió el estado del reporte"

api PATCH "/needs?id=eq.$NID" "$TOK_B" '{"is_hidden":true,"hidden_at":"'$(date -u +%FT%TZ)'"}'
check "Bruno no oculta necesidad (204 sin filas)" "$OUT_CODE" 204
api GET "/needs?id=eq.$NID&select=is_hidden" "$TOK_ADM" ""
jq -r '.[0].is_hidden' "$OUT" | grep -q "false" && ok "la necesidad sigue visible" || ko "la necesidad fue ocultada por Bruno"

api PATCH "/profiles?id=eq.$UID_C" "$TOK_B" '{"banned_at":"'$(date -u +%FT%TZ)'"}'
check "Bruno no suspende (204 sin filas)" "$OUT_CODE" 204
api GET "/profiles?id=eq.$UID_C&select=banned_at" "$TOK_ADM" ""
jq -r '.[0].banned_at' "$OUT" | grep -q "null" && ok "Camilo sigue activo" || ko "Camilo fue suspendido por Bruno"

api PATCH "/need_comments?id=eq.$COMMENT_ID" "$TOK_B" '{"is_hidden":true}'
check "Bruno no oculta comentario (204 sin filas)" "$OUT_CODE" 204
api GET "/need_comments?id=eq.$COMMENT_ID&select=is_hidden" "" ""
jq -r '.[0].is_hidden' "$OUT" | grep -q "false" && ok "el comentario sigue visible" || ko "el comentario fue ocultado"

echo ""
echo "=================================="
echo "PASS=$P FAIL=$F"
echo "=================================="
[ "$F" = "0" ]

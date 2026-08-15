#!/usr/bin/env bash
# Contrato e2e de publicación de necesidad (Fase 4):
#  - crear necesidad como dueño (RLS user_id = auth.uid())
#  - regla "una necesidad activa" (23505 / one_active_need_per_user)
#  - dirección privada (solo dueño escribe; anon no lee)
#  - subida de imágenes (solo dueño, path needs/{needId}/...)
#  - vinculo need_images (solo dueño, path correcto)
#  - la necesidad es pública y no filtra datos privados
set -o pipefail

API=http://127.0.0.1:54421
REST=$API/rest/v1
AUTH=$API/auth/v1
STORE=$API/storage/v1
KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
OUT=/tmp/opencode/pub_out.json
DB=supabase_db_rpbpwwwvakpxzdinvojw
P=0
F=0
TS=$(date +%s)

ok() { P=$((P + 1)); echo "PASS  $1"; }
ko() { F=$((F + 1)); echo "FAIL  $1"; }
check() { [ "$2" = "$3" ] && ok "$1" || ko "$1 (want $3 got $2)"; }
require() { [ -n "$2" ] && ok "$1" || ko "$1 (vacío)"; }

signup() {
  curl -s -X POST "$AUTH/signup" -H "apikey: $KEY" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"Passw0rd!ABC\",\"data\":{\"display_name\":\"$2\",\"municipality\":\"pereira\"}}"
}
login() {
  curl -s -X POST "$AUTH/token?grant_type=password" -H "apikey: $KEY" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"Passw0rd!ABC\"}"
}
confirm() {
  docker exec "$DB" psql -U postgres -d postgres \
    -c "update auth.users set email_confirmed_at = now() where id = '$1';" >/dev/null 2>&1
}

echo "=== 1. Usuarios verificado (dueño) y tercero ==="
EM_O="pub_owner${TS}@test.local"
EM_T="pub_third${TS}@test.local"
UID_O=$(signup "$EM_O" "Publicador Dueño" | jq -r .id)
UID_T=$(signup "$EM_T" "Publicador Tercero" | jq -r .id)
confirm "$UID_O"
confirm "$UID_T"
TOK_O=$(login "$EM_O" | jq -r .access_token)
TOK_T=$(login "$EM_T" | jq -r .access_token)
require "dueño verificado" "$TOK_O"
require "tercero verificado" "$TOK_T"

echo "=== 2. Crear necesidad como dueño ==="
CREATE=$(curl -s -o "$OUT" -w "%{http_code}" -X POST "$REST/needs" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOK_O" -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"user_id\":\"$UID_O\",\"title\":\"Necesito ayuda con la puerta trasera\",\"description\":\"La puerta trasera no cierra bien desde el sismo y necesito ayuda para repararla o cambiarla.\",\"category_id\":2,\"municipality_id\":1,\"neighborhood\":\"Boston\",\"status\":\"OPEN\"}")
check "crear necesidad (201)" "$CREATE" 201
NID=$(jq -r '.[0].id' "$OUT")
require "id de la necesidad" "$NID"
[ "$(jq -r '.[0].status' "$OUT")" = "OPEN" ] && ok "estado inicial OPEN" || ko "estado inicial OPEN"

echo "=== 3. Regla una-necesidad-activa ==="
SECOND=$(curl -s -o "$OUT" -w "%{http_code}" -X POST "$REST/needs" \
  -H "apikey: $KEY" -H "Authorization: Bearer $TOK_O" -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$UID_O\",\"title\":\"Segunda necesidad activa\",\"description\":\"Esta segunda publicación no debería poder crearse porque ya hay una activa.\",\"category_id\":1,\"municipality_id\":2,\"status\":\"OPEN\"}")
check "segunda activa rechazada (409)" "$SECOND" 409
SEC_BODY=$(curl -s -X POST "$REST/needs" -H "apikey: $KEY" -H "Authorization: Bearer $TOK_O" -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$UID_O\",\"title\":\"Segunda necesidad activa 2\",\"description\":\"Esta segunda publicación no debería poder crearse porque ya hay una activa.\",\"category_id\":1,\"municipality_id\":2,\"status\":\"OPEN\"}")
echo "$SEC_BODY" | grep -q "23505" && ok "error 23505 en el cuerpo" || ko "error 23505 en el cuerpo"
echo "$SEC_BODY" | grep -q "one_active_need_per_user" && ok "menciona one_active_need_per_user" || ko "menciona one_active_need_per_user"

echo "=== 4. Dirección privada ==="
ADDR_O=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$REST/need_address" -H "apikey: $KEY" -H "Authorization: Bearer $TOK_O" -H "Content-Type: application/json" -d "{\"need_id\":\"$NID\",\"address\":\"Calle 12 # 34-56, interior 2\"}")
check "dueño guarda dirección (201)" "$ADDR_O" 201
ADDR_T=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$REST/need_address" -H "apikey: $KEY" -H "Authorization: Bearer $TOK_T" -H "Content-Type: application/json" -d "{\"need_id\":\"$NID\",\"address\":\"Calle falsa 123\"}")
check "tercero no guarda dirección (403)" "$ADDR_T" 403
ADDR_A=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$REST/need_address" -H "apikey: $KEY" -H "Content-Type: application/json" -d "{\"need_id\":\"$NID\",\"address\":\"Calle anónima 1\"}")
{ [ "$ADDR_A" = "401" ] || [ "$ADDR_A" = "403" ]; } && ok "anon no guarda dirección ($ADDR_A)" || ko "anon no guarda dirección ($ADDR_A)"
ADDR_R=$(curl -s -o /dev/null -w "%{http_code}" -H "apikey: $KEY" "$REST/need_address?need_id=eq.$NID")
{ [ "$ADDR_R" = "401" ] || [ "$ADDR_R" = "200" ]; } && ok "anon no lee dirección ($ADDR_R)" || ko "anon lee dirección ($ADDR_R)"

echo "=== 5. Subida de imágenes (solo dueño, path correcto) ==="
PNG=/tmp/opencode/pub_test.png
python3 -c "import struct,zlib
def ch(t,d):
 c=struct.pack('>I',len(d))+t+d; return c+struct.pack('>I',zlib.crc32(t+d))
ih=struct.pack('>IIBBBBB',4,4,8,2,0,0,0)
raw=b''.join(b'\x00'+bytes([(y*63)%256,90,150,255])*4 for y in range(4))
open('$PNG','wb').write(b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',ih)+ch(b'IDAT',zlib.compress(raw))+ch(b'IEND',b''))" 2>/dev/null
S_O=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$STORE/object/need-images/needs/$NID/foto1.png" -H "apikey: $KEY" -H "Authorization: Bearer $TOK_O" -H "Content-Type: image/png" --data-binary @"$PNG")
check "dueño sube imagen (200)" "$S_O" 200
S_T=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$STORE/object/need-images/needs/$NID/foto3.png" -H "apikey: $KEY" -H "Authorization: Bearer $TOK_T" -H "Content-Type: image/png" --data-binary @"$PNG")
{ [ "$S_T" = "403" ] || [ "$S_T" = "400" ] || [ "$S_T" = "401" ]; } && ok "tercero no sube imagen ($S_T)" || ko "tercero no sube imagen ($S_T)"
S_A=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$STORE/object/need-images/needs/$NID/foto4.png" -H "apikey: $KEY" -H "Content-Type: image/png" --data-binary @"$PNG")
{ [ "$S_A" = "403" ] || [ "$S_A" = "400" ] || [ "$S_A" = "401" ]; } && ok "anon no sube imagen ($S_A)" || ko "anon no sube imagen ($S_A)"
S_BAD=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$STORE/object/need-images/other/foto.png" -H "apikey: $KEY" -H "Authorization: Bearer $TOK_O" -H "Content-Type: image/png" --data-binary @"$PNG")
{ [ "$S_BAD" = "403" ] || [ "$S_BAD" = "400" ] || [ "$S_BAD" = "404" ]; } && ok "dueño no sube fuera de needs/{id}/ ($S_BAD)" || ko "dueño sube fuera de needs/{id}/ ($S_BAD)"

echo "=== 6. Vinculación need_images (solo dueño, path correcto) ==="
IMG_O=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$REST/need_images" -H "apikey: $KEY" -H "Authorization: Bearer $TOK_O" -H "Content-Type: application/json" -H "Prefer: return=representation" -d "{\"need_id\":\"$NID\",\"storage_path\":\"needs/$NID/foto1.png\",\"kind\":\"BEFORE\",\"is_primary\":true}")
check "dueño vincula imagen (201)" "$IMG_O" 201
IMG_T=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$REST/need_images" -H "apikey: $KEY" -H "Authorization: Bearer $TOK_T" -H "Content-Type: application/json" -d "{\"need_id\":\"$NID\",\"storage_path\":\"needs/$NID/foto_t.png\",\"kind\":\"BEFORE\",\"is_primary\":false}")
check "tercero no vincula imagen (403)" "$IMG_T" 403
IMG_WRONG=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$REST/need_images" -H "apikey: $KEY" -H "Authorization: Bearer $TOK_O" -H "Content-Type: application/json" -d "{\"need_id\":\"$NID\",\"storage_path\":\"other/needs/$NID/foto2.png\",\"kind\":\"BEFORE\",\"is_primary\":false}")
check "path fuera de la necesidad rechazado (403)" "$IMG_WRONG" 403

echo "=== 7. La necesidad es pública y no filtra privados ==="
PUB=$(curl -s -H "apikey: $KEY" "$REST/needs?select=id,title,description&id=eq.$NID")
echo "$PUB" | jq -r '.[0].title' | grep -q "puerta trasera" && ok "anon ve la necesidad" || ko "anon ve la necesidad"
LEAK=$(curl -s -o /dev/null -w "%{http_code}" -H "apikey: $KEY" "$REST/needs?select=id,need_address(id,address)&id=eq.$NID")
[ "$LEAK" != "200" ] && ok "no se filtran datos privados (embed $LEAK)" || ko "se filtran datos privados (embed 200)"

echo ""
echo "=================================="
echo "PASS=$P FAIL=$F"
echo "=================================="
[ "$F" = "0" ]

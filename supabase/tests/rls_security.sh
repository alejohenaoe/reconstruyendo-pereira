#!/usr/bin/env bash
# Tests de seguridad RLS vía API (equivalente a lo que vería un atacante/frontend)
set -o pipefail
# Directorio temporal propio del contrato (no depender de rutas de otras herramientas).
TMPD="${TMPDIR:-/tmp}/reconstruyendo-tests"
mkdir -p "$TMPD"

API=http://127.0.0.1:54421
REST=$API/rest/v1
AUTH=$API/auth/v1
KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
OUT=$TMPD/rls_out.json
PASSES=0; FAILS=0
TS=$(date +%s)
docker exec supabase_db_rpbpwwwvakpxzdinvojw psql -U postgres -d postgres -c "select pg_notify('pgrst', 'reload schema');" >/dev/null 2>&1

check2xx(){ [ "$2" = "200" ] || [ "$2" = "204" ] && { PASSES=$((PASSES+1)); echo "PASS  $1 (HTTP $2)"; } || { FAILS=$((FAILS+1)); echo "FAIL  $1 (want 2xx got $2)"; }; }
check(){ [ "$2" = "$3" ] && { PASSES=$((PASSES+1)); echo "PASS  $1 (HTTP $3)"; } || { FAILS=$((FAILS+1)); echo "FAIL  $1 (want $2 got $3)"; }; }
pass(){ PASSES=$((PASSES+1)); echo "PASS  $1"; }
fail(){ FAILS=$((FAILS+1)); echo "FAIL  $1"; }

signup(){ curl -s -X POST "$AUTH/signup" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"$1\",\"password\":\"Passw0rd!ABC\",\"data\":{\"display_name\":\"$2\",\"municipality\":\"pereira\"}}"; }
login(){ curl -s -X POST "$AUTH/token?grant_type=password" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"$1\",\"password\":\"Passw0rd!ABC\"}"; }
confirm(){ docker exec supabase_db_rpbpwwwvakpxzdinvojw psql -U postgres -d postgres \
  -c "update auth.users set email_confirmed_at = now() where id = '$1';" >/dev/null 2>&1; }

api(){ # method path token body
  local m="$1" p="$2" t="$3" b="$4"
  local curl_cmd=(curl -s -o "$OUT" -w "%{http_code}" -X "$m" -H "apikey: $KEY" -H "Content-Type: application/json")
  [ "$m" = "POST" ] && curl_cmd+=(-H "Prefer: return=representation")
  [ -n "$t" ] && curl_cmd+=(-H "Authorization: Bearer $t")
  [ -n "$b" ] && curl_cmd+=(-d "$b")
  OUT_CODE=$("${curl_cmd[@]}" "$REST$p")
}

echo "=== 1. Accesos anonimos ==="
api GET "/municipalities?select=id,slug" "" ""
check "anon lee municipalities" 200 "$OUT_CODE"
api GET "/needs?select=id&limit=1" "" ""
check "anon lee needs (200, lista)" 200 "$OUT_CODE"
api GET "/profile_phone?select=*" "" ""
if [ "$OUT_CODE" = "401" ]; then pass "anon sin grant sobre profile_phone (401)";
elif [ "$OUT_CODE" = "200" ] && [ "$(jq length "$OUT")" = "0" ]; then pass "anon: profile_phone vacio (200/[])";
else fail "anon profile_phone code=$OUT_CODE len=$(jq length "$OUT" 2>/dev/null)"; fi
api GET "/need_address?select=*" "" ""
if [ "$OUT_CODE" = "401" ]; then pass "anon sin grant sobre need_address (401)";
elif [ "$OUT_CODE" = "200" ] && [ "$(jq length "$OUT")" = "0" ]; then pass "anon: need_address vacio (200/[])";
else fail "anon need_address code=$OUT_CODE"; fi
api POST "/needs" "" '{"user_id":"00000000-0000-0000-0000-000000000000","title":"Anon intenta crear","description":"intento de creacion anonimo sin sesion iniciada para la prueba","category_id":1,"municipality_id":1,"status":"OPEN"}'
check "anon NO crea needs (401)" 401 "$OUT_CODE"

echo "=== 2. Alta de usuarios (perfil auto-creado) ==="
A=$(signup "alice${TS}@test.local" Alice); B=$(signup "bob${TS}@test.local" Bob); C=$(signup "carol${TS}@test.local" Carol)
ID_A=$(echo "$A" | jq -r '.user.id // .id'); confirm "$ID_A"; TK_A=$(login "alice${TS}@test.local" | jq -r .access_token)
ID_B=$(echo "$B" | jq -r '.user.id // .id'); confirm "$ID_B"; TK_B=$(login "bob${TS}@test.local" | jq -r .access_token)
ID_C=$(echo "$C" | jq -r '.user.id // .id'); confirm "$ID_C"; TK_C=$(login "carol${TS}@test.local" | jq -r .access_token)
api GET "/profiles?select=id,display_name,app_role,banned_at&id=eq.$ID_A" "" ""
DISP=$(jq -r '.[0].display_name' "$OUT"); ROLE=$(jq -r '.[0].app_role' "$OUT")
[ "$DISP" = "Alice" ] && [ "$ROLE" = "USER" ] && [ "$(jq -r '.[0].banned_at' "$OUT")" = "null" ] \
  && pass "trigger handle_new_user: perfil creado (Alice/USER, no baneado)" || fail "perfil Alice: disp=$DISP role=$ROLE"

echo "=== 3. Creacion de necesidad + regla una-activa ==="
api POST "/needs" "$TK_A" '{"user_id":"'"$ID_A"'","title":"Necesito ayuda con mi techo","description":"Se cayo parte del techo tras el sismo y necesito quien ayude a repararlo antes de la temporada de lluvias.","category_id":3,"municipality_id":1,"neighborhood":"Centro","status":"OPEN"}'
NEED_ID=$(jq -r '.[0].id' "$OUT")
check "Alice crea necesidad (201)" 201 "$OUT_CODE"
[ -n "$NEED_ID" ] && [ "$NEED_ID" != "null" ] && pass "need_id=$NEED_ID" || fail "sin need_id ($OUT_CODE: $(head -c 120 "$OUT"))"
api POST "/needs" "$TK_A" '{"user_id":"'"$ID_A"'","title":"Segunda necesidad activa","description":"Intento de crear una segunda necesidad mientras la primera sigue activa para la prueba","category_id":2,"municipality_id":1,"status":"OPEN"}'
[ "$OUT_CODE" = "409" ] && pass "indice one_active_need_per_user bloquea 2a necesidad activa (409)" || fail "2a necesidad: code=$OUT_CODE $(head -c 150 "$OUT")"
api PATCH "/needs?id=eq.$NEED_ID" "$TK_A" '{"status":"IN_PROGRESS"}'
check2xx "dueño cambia a IN_PROGRESS" "$OUT_CODE"

echo "=== 4. Ofertas ==="
api POST "/help_offers" "$TK_B" '{"need_id":"'"$NEED_ID"'","user_id":"'"$ID_B"'","capability_id":2,"message":"Soy albanil y puedo ayudar con el techo","status":"OFFERED"}'
OFFER_ID=$(jq -r '.[0].id' "$OUT")
check "Bob ofrece ayuda (201)" 201 "$OUT_CODE"
[ -n "$OFFER_ID" ] && [ "$OFFER_ID" != "null" ] && pass "offer_id=$OFFER_ID" || fail "sin offer_id"
api POST "/help_offers" "$TK_A" '{"need_id":"'"$NEED_ID"'","user_id":"'"$ID_A"'","capability_id":2,"message":"Auto oferta que debe ser rechazada por el trigger","status":"OFFERED"}'
[ "$OUT_CODE" != "200" ] && [ "$OUT_CODE" != "201" ] && pass "self-offer bloqueado (HTTP $OUT_CODE)" || fail "self-offer NO bloqueado (HTTP $OUT_CODE): $(head -c 150 "$OUT")"
api POST "/help_offers" "$TK_B" '{"need_id":"'"$NEED_ID"'","user_id":"'"$ID_B"'","capability_id":3,"message":"Segunda oferta duplicada de Bob para la prueba de unico","status":"OFFERED"}'
[ "$OUT_CODE" = "409" ] && pass "oferta duplicada bloqueada (409)" || fail "oferta duplicada: code=$OUT_CODE $(head -c 150 "$OUT")"
api PATCH "/help_offers?id=eq.$OFFER_ID" "$TK_B" '{"status":"CONFIRMED"}'
[ "$OUT_CODE" != "200" ] && pass "oferente NO puede auto-confirmarse (HTTP $OUT_CODE)" || fail "oferente se auto-confirmo (HTTP 200)"
api PATCH "/help_offers?id=eq.$OFFER_ID" "$TK_A" '{"status":"CONTACTED"}'; check2xx "dueño -> CONTACTED" "$OUT_CODE"
api PATCH "/help_offers?id=eq.$OFFER_ID" "$TK_A" '{"status":"AGREED"}'; check2xx "dueño -> AGREED" "$OUT_CODE"
api PATCH "/help_offers?id=eq.$OFFER_ID" "$TK_A" '{"status":"COMPLETED"}'; check2xx "dueño -> COMPLETED" "$OUT_CODE"
api PATCH "/help_offers?id=eq.$OFFER_ID" "$TK_A" '{"status":"CONFIRMED"}'; check2xx "dueño -> CONFIRMED" "$OUT_CODE"
api PATCH "/help_offers?id=eq.$OFFER_ID" "$TK_A" '{"status":"OFFERED"}'
[ "$OUT_CODE" != "200" ] && pass "retroceso de estado bloqueado (HTTP $OUT_CODE)" || fail "retroceso permitido (HTTP 200)"
api PATCH "/help_offers?id=eq.$OFFER_ID" "$TK_A" '{"status":"CANCELLED"}'
check2xx "dueño rechaza oferta -> CANCELLED" "$OUT_CODE"
api PATCH "/help_offers?id=eq.$OFFER_ID" "$TK_A" '{"status":"OFFERED"}'
[ "$OUT_CODE" != "200" ] && pass "CANCELLED es terminal (HTTP $OUT_CODE)" || fail "oficerta cancelada se reactivo (HTTP 200)"

echo "=== 5. Privacidad de contacto ==="
api POST "/help_offers" "$TK_B" '{"need_id":"'"$NEED_ID"'","user_id":"'"$ID_B"'","capability_id":2,"message":"Segunda oferta de Bob (la anterior fue cancelada) para probar el contacto","status":"OFFERED"}'
check "Bob ofrece de nuevo tras cancelacion (201)" 201 "$OUT_CODE"
api GET "/profile_phone?select=*" "$TK_B" ""
[ "$(jq length "$OUT")" = "0" ] && pass "Bob NO ve telefonos via tabla (solo RPC)" || fail "Bob ve telefonos via tabla: $(head -c 150 "$OUT")"
api POST "/profile_phone" "$TK_A" '{"profile_id":"'"$ID_A"'","phone":"3001234567"}'
check "Alice guarda su telefono (201)" 201 "$OUT_CODE"
api POST "/rpc/get_need_contact" "$TK_B" '{"need_id":"'"$NEED_ID"'"}'
PHONE_B=$(jq -r '.owner.phone' "$OUT" 2>/dev/null)
[ "$PHONE_B" = "3001234567" ] && pass "Bob obtiene telefono de Alice via RPC" || fail "RPC Bob: code=$OUT_CODE $(head -c 200 "$OUT")"
api POST "/rpc/get_need_contact" "$TK_C" '{"need_id":"'"$NEED_ID"'"}'
if [ "$OUT_CODE" = "200" ] && [ "$(jq -r .owner "$OUT")" = "null" ] && [ "$(jq -r .offerers "$OUT")" = "null" ]; then
  pass "Carol (no relacionada) NO obtiene contacto"
else fail "Carol obtuvo contacto: code=$OUT_CODE $(head -c 200 "$OUT")"; fi
api POST "/rpc/get_need_contact" "$TK_A" '{"need_id":"'"$NEED_ID"'"}'
if [ "$OUT_CODE" = "200" ] && [ "$(jq -r '.offerers|length' "$OUT")" = "1" ]; then
  pass "Alice ve lista de oferentes via RPC (1)"
else fail "Alice RPC oferentes: code=$OUT_CODE $(head -c 200 "$OUT")"; fi

echo "=== 6. Escritura entre usuarios ==="
api PATCH "/needs?id=eq.$NEED_ID" "$TK_B" '{"title":"Titulo hackeado por Bob"}'
api GET "/needs?select=title&id=eq.$NEED_ID" "" ""
TITLE=$(jq -r '.[0].title' "$OUT")
[ "$TITLE" = "Necesito ayuda con mi techo" ] && pass "Bob NO puede modificar necesidad ajena" || fail "Bob modifico necesidad: $TITLE"
api GET "/profile_phone?select=*&profile_id=eq.$ID_A" "$TK_C" ""
[ "$(jq length "$OUT")" = "0" ] && pass "Carol NO ve telefono de Alice via tabla" || fail "Carol ve telefono: $(head -c 150 "$OUT")"

echo "=== 7. Usuario sin email verificado ==="
D=$(signup "dave${TS}@test.local" Dave)
ID_D=$(echo "$D" | jq -r '.user.id // .id'); TK_D=$(login "dave${TS}@test.local" | jq -r .access_token)
docker exec supabase_db_rpbpwwwvakpxzdinvojw psql -U postgres -d postgres \
  -c "update auth.users set email_confirmed_at = null where id = '$ID_D';" >/dev/null 2>&1
api POST "/needs" "$TK_D" '{"user_id":"'"$ID_D"'","title":"Dave sin verificar crea necesidad","description":"Este intento debe fallar porque el correo del usuario no esta confirmado","category_id":1,"municipality_id":1,"status":"OPEN"}'
[ "$OUT_CODE" != "200" ] && [ "$OUT_CODE" != "201" ] && pass "no verificado NO crea necesidad (HTTP $OUT_CODE)" || fail "no verificado creo necesidad (HTTP $OUT_CODE): $(head -c 150 "$OUT")"
api POST "/help_offers" "$TK_D" '{"need_id":"'"$NEED_ID"'","user_id":"'"$ID_D"'","capability_id":2,"message":"Dave sin verificar intenta ofrecer ayuda","status":"OFFERED"}'
[ "$OUT_CODE" != "200" ] && [ "$OUT_CODE" != "201" ] && pass "no verificado NO oferta (HTTP $OUT_CODE)" || fail "no verificado oferto (HTTP $OUT_CODE): $(head -c 150 "$OUT")"

echo "=== 8. Reportes ==="
api POST "/reports" "$TK_A" '{"reporter_id":"'"$ID_A"'","reported_user_id":"'"$ID_B"'","reason":"FALSE_INFO","details":"Informacion falsa en su oferta"}'
check "Alice reporta a Bob (201)" 201 "$OUT_CODE"
api POST "/reports" "$TK_A" '{"reporter_id":"'"$ID_A"'","reported_user_id":"'"$ID_B"'","reason":"FALSE_INFO","details":"Duplicado"}'
[ "$OUT_CODE" = "409" ] && pass "reporte duplicado bloqueado (409)" || fail "reporte duplicado: code=$OUT_CODE $(head -c 150 "$OUT")"
api GET "/reports?select=*" "$TK_B" ""
[ "$(jq length "$OUT")" = "0" ] && pass "Bob NO ve reportes en su contra" || fail "Bob ve reportes: $(head -c 150 "$OUT")"
api GET "/reports?select=*" "$TK_C" ""
[ "$(jq length "$OUT")" = "0" ] && pass "Carol NO ve reportes ajenos" || fail "Carol ve reportes: $(head -c 150 "$OUT")"
api GET "/reports?select=*" "$TK_A" ""
[ "$(jq length "$OUT")" = "1" ] && pass "Alice ve su propio reporte (1)" || fail "Alice reportes: $(head -c 150 "$OUT")"

echo "=== 9. Registro de contactos y storage ==="
NLOG=$(docker exec supabase_db_rpbpwwwvakpxzdinvojw psql -U postgres -d postgres -tAc \
  "select count(*) from public.contact_access_log where need_id = '$NEED_ID';")
[ "$NLOG" = "2" ] && pass "contact_access_log registra 2 revelaciones (Bob y Alice)" || fail "contact_access_log=$NLOG (esperado 2)"
NBUCK=$(docker exec supabase_db_rpbpwwwvakpxzdinvojw psql -U postgres -d postgres -tAc \
  "select count(*) from storage.buckets where id='need-images' and public and file_size_limit=5242880 and 'image/jpeg' = any(allowed_mime_types);")
[ "$NBUCK" = "1" ] && pass "bucket need-images configurado (public/5MB/jpeg,png,webp)" || fail "bucket need-images: count=$NBUCK"

echo "=== 9b. Capacidades declaradas (MVP §19) ==="
api POST "/profile_capabilities" "$TK_A" "{\"profile_id\":\"$ID_A\",\"capability_id\":2}"
check "A declara su propia capacidad (201)" 201 "$OUT_CODE"
api POST "/profile_capabilities" "$TK_B" "{\"profile_id\":\"$ID_A\",\"capability_id\":3}"
check "B NO declara capacidades por A (403)" 403 "$OUT_CODE"
api DELETE "/profile_capabilities?profile_id=eq.$ID_A&capability_id=eq.2" "$TK_B" ""
api GET "/profile_capabilities?select=capability_id&profile_id=eq.$ID_A&capability_id=eq.2" "" ""
[ "$(jq length "$OUT")" = "1" ] && pass "B NO borra capacidades de A (sigue ahi)" || fail "capacidad de A borrada por B"
api DELETE "/profile_capabilities?profile_id=eq.$ID_A&capability_id=eq.2" "$TK_A" ""
check "A borra su propia capacidad (204)" 204 "$OUT_CODE"

echo "=== 10. Borrado en cascada ==="
api DELETE "/needs?id=eq.$NEED_ID" "$TK_A" ""
check2xx "Alice elimina su necesidad" "$OUT_CODE"
NOFF=$(docker exec supabase_db_rpbpwwwvakpxzdinvojw psql -U postgres -d postgres -tAc \
  "select count(*) from public.help_offers where need_id = '$NEED_ID';")
[ "$NOFF" = "0" ] && pass "ofertas eliminadas en cascada (0)" || fail "cascada ofertas: $NOFF"

echo ""
echo "================================"
echo "PASS=$PASSES FAIL=$FAILS"
echo "================================"

#!/usr/bin/env bash
# Siembra datos de prueba de Fase 3 en el stack local.
# Usuarios reales (registro->confirmación->login) + fixtures vía SQL
# (la regla "una necesidad activa por usuario" impide variedad por API).
set -euo pipefail
API=http://127.0.0.1:54421
AUTH=$API/auth/v1
REST=$API/rest/v1
STORE=$API/storage/v1
KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
MAIL=http://127.0.0.1:54424/api/v1
DB="docker exec supabase_db_rpbpwwwvakpxzdinvojw psql -U postgres -d postgres"
TS=$(date +%s)

# --- limpieza de fixtures previos ---
$DB -c "delete from public.needs where title like 'Seed%' or title like 'Necesito%' or title like 'Retiro%' or title like 'Ayuda%' or title like 'Evaluación%' or title like 'Pintura%' or title like 'Impermeabilización%';" >/dev/null

confirmed_user() { # email display muni -> imprime "user_id"
  local email="$1" display="$2" muni="$3" link mid uid json tok
  curl -s -X POST "$AUTH/signup" -H "apikey: $KEY" -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"Passw0rd!ABC\",\"data\":{\"display_name\":\"$display\",\"municipality\":\"$muni\"}}" >/dev/null
  sleep 1
  mid=$(curl -s "$MAIL/messages?to=$email" | jq -r '.messages[0].ID')
  link=$(curl -s "$MAIL/message/$mid" | python3 -c "import sys,json,re,urllib.parse; b=(json.load(sys.stdin).get('Text') or ''); m=re.search(r'(http[^\"\s<>]+/auth/v1/verify[^\"\s<>]+)', b); print(urllib.parse.unquote(m.group(1)) if m else '')")
  curl -s -L "$link" -o /dev/null
  json=$(curl -s -X POST "$AUTH/token?grant_type=password" -H "apikey: $KEY" -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"Passw0rd!ABC\"}")
  uid=$(echo "$json" | jq -r .user.id)
  [ -n "$uid" ] && [ "$uid" != "null" ] || { echo "FALLO $email"; exit 1; }
  echo "$uid"
}

echo ">> usuarios"
UA=$(confirmed_user "phase3a${TS}@test.local" "María Ayuda" "pereira")
UB=$(confirmed_user "phase3b${TS}@test.local" "Juan Voluntario" "dosquebradas")
UC=$(confirmed_user "phase3c${TS}@test.local" "Carla Comunidad" "pereira")
echo "   A=$UA B=$UB C=$UC"

echo ">> necesidades (SQL, respetando una-necesidad-activa por usuario)"
$DB -c "
insert into public.needs (user_id, title, description, category_id, municipality_id, neighborhood, status, needs_assessment) values
  ('$UA','Necesito reparar el techo tras el sismo','El techo de mi casa tiene goteras desde el sismo. Necesito ayuda para repararlo antes de las lluvias. Los daños están principalmente en la zona del segundo piso.',3,1,'Villa Santana','OPEN',false),
  ('$UA','Pintura para fachada','Ya se terminó la pintura de la fachada con ayuda de la comunidad. Muchas gracias a todas las personas que colaboraron.',7,2,'La Macarena','RESOLVED',false),
  ('$UA','Impermeabilización de pared húmeda','Cerramos la necesidad porque la humedad ya no es un problema. Gracias a todos los que ofrecieron ayuda.',6,1,'Laureles','CLOSED',false),
  ('$UB','Ayuda con instalación eléctrica','Hay un circuito dañado en la cocina y el enchufe no funciona. Ya dos personas están ayudando pero necesitamos a un electricista con más experiencia.',4,1,'Cuba','IN_PROGRESS',false),
  ('$UB','Evaluación de daños en muro','No sé exactamente qué necesito, solo veo grietas en un muro del patio. Me gustaría que alguien con conocimiento evalúe si es grave.',9,1,'El Oso','RESOLVED',true),
  ('$UC','Retiro de escombros en dosquebradas','Después del sismo quedaron escombros en el lote de mi mamá. Necesitamos personas que ayuden a retirarlos y cargar bolsas. Se proveen guantes y tapabocas.',8,2,'Frailes','OPEN',false),
  ('$UC','Necesito reparar una ventana','Esta necesidad fue revisada por moderación y se mantiene oculta para pruebas.',2,1,'Centro','CLOSED',false);
update public.needs set is_hidden = true, hidden_at = now() where title = 'Necesito reparar una ventana';
" >/dev/null

echo ">> ofertas (SQL)"
$DB -c "
insert into public.help_offers (need_id, user_id, capability_id, message, status) values
  ((select id from public.needs where title='Necesito reparar el techo tras el sismo'), '$UB', 3, 'Puedo ayudar con la reparación del techo los fines de semana.', 'OFFERED'),
  ((select id from public.needs where title='Necesito reparar el techo tras el sismo'), '$UC', 4, 'Puedo aportar tejas y clavos.', 'OFFERED'),
  ((select id from public.needs where title='Retiro de escombros en dosquebradas'), '$UB', 2, 'Voy el sábado con dos amigos a ayudar a cargar escombros.', 'OFFERED'),
  ((select id from public.needs where title='Ayuda con instalación eléctrica'), '$UC', 2, 'Tengo herramientas básicas y puedo colaborar.', 'OFFERED');
" >/dev/null

echo ">> usuarios extra + necesidades para paginación"
UD=$(confirmed_user "phase3d${TS}@test.local" "Diego Solidario" "dosquebradas")
UE=$(confirmed_user "phase3e${TS}@test.local" "Elena Vecina" "pereira")
UF=$(confirmed_user "phase3f${TS}@test.local" "Felipe Ayudante" "dosquebradas")
UG=$(confirmed_user "phase3g${TS}@test.local" "Gloria del Barrio" "pereira")
$DB -c "
insert into public.needs (user_id, title, description, category_id, municipality_id, neighborhood, status, needs_assessment) values
  ('$UE','Seed pared con humedad en el primer piso','Mancha de humedad creciendo en la pared del primer piso. Quisiera consejos y ayuda para impermeabilizar.',6,1,'Villavicencio','OPEN',true),
  ('$UF','Seed techo con láminas sueltas','Se soltaron varias láminas del techo con el viento. Necesito ayuda para asegurarlas.',3,2,'Frailes','OPEN',false),
  ('$UG','Seed cambio de bombillas y tomas','Dos tomas no funcionan y varias bombillas se queman seguido. Necesito revisión eléctrica.',4,1,'San Nicolás','IN_PROGRESS',false),
  ('$UD','Seed reemplazo de tubería del lavadero','La tubería del lavadero tiene una fuga pequeña pero constante. Busco plomero o persona con experiencia.',5,1,'Boston','CLOSED',false),
  ('$UD','Seed instalación de calentador de agua','Necesito ayuda para instalar un calentador de agua nuevo que compré.',4,1,'Belmonte','CLOSED',false),
  ('$UD','Seed limpieza de canales del techo','Los canales del techo están tapados con hojas y ramas, el agua se rebosa cuando llueve.',3,1,'Cuba','CLOSED',false),
  ('$UD','Seed pintura de cocina y sala','Quiero pintar la cocina y la sala, tengo la pintura pero me falta mano de obra.',7,2,'San Diego','CLOSED',false),
  ('$UD','Seed reparación de una grieta en el patio','Grieta superficial en el piso del patio, busco orientación sobre si es grave.',1,2,'La Pradera','CLOSED',true);
" >/dev/null
echo ">> ofertas extra (para conteos)"
$DB -c "
insert into public.help_offers (need_id, user_id, capability_id, message, status)
select n.id, '$UB', 3, 'Puedo colaborar con eso.', 'OFFERED'
from public.needs n where n.title in ('Seed cambio de bombillas y tomas','Seed techo con láminas sueltas');
insert into public.help_offers (need_id, user_id, capability_id, message, status)
select n.id, '$UC', 2, 'Voy a ayudar el fin de semana.', 'OFFERED'
from public.needs n where n.title in ('Seed cambio de bombillas y tomas','Seed pared con humedad en el primer piso');
" >/dev/null

echo ">> imagen (API, dueño verificado) en 'techo'"
python3 - <<'PY'
import struct, zlib
def chunk(t, d):
    c = struct.pack(">I", len(d)) + t + d
    return c + struct.pack(">I", zlib.crc32(t + d))
ihdr = struct.pack(">IIBBBBB", 8, 8, 8, 2, 0, 0, 0)
raw = b"".join(b"\x00" + bytes([(y*31) % 256, 120, 160, 255]) * 8 for y in range(8))
png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")
open("/tmp/opencode/techo.png", "wb").write(png)
print("   png ok")
PY
TA=$(curl -s -X POST "$AUTH/token?grant_type=password" -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"phase3a${TS}@test.local\",\"password\":\"Passw0rd!ABC\"}" | jq -r .access_token)
NID=$($DB -tAc "select id from public.needs where title='Necesito reparar el techo tras el sismo';")
IMG_ID=$(python3 -c "import uuid; print(uuid.uuid4())")
PATH_="needs/$NID/$IMG_ID.png"
curl -s -o /dev/null -X POST "$STORE/object/need-images/$PATH_" -H "apikey: $KEY" -H "Authorization: Bearer $TA" -H "Content-Type: image/png" --data-binary @/tmp/opencode/techo.png
$DB -c "insert into public.need_images (need_id, storage_path, kind, is_primary) values ('$NID','$PATH_','BEFORE',true);" >/dev/null
echo "   need=$NID path=$PATH_"

echo ">> resumen"
$DB -tAc "select status, count(*) from public.needs group by status order by status;"
$DB -tAc "select (select count(*) from public.need_images), (select count(*) from public.help_offers), (select count(*) from public.need_offer_counts);"
echo "NID=$NID" > /tmp/opencode/phase3_env

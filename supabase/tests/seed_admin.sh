#!/usr/bin/env bash
# Promueve un usuario existente a ADMIN (Fase 6: moderación).
# Uso: supabase/tests/seed_admin.sh <email>
# Ejemplo: supabase/tests/seed_admin.sh tu@correo.local
set -euo pipefail
DB="docker exec supabase_db_rpbpwwwvakpxzdinvojw psql -U postgres -d postgres"
EMAIL="${1:?Usa: seed_admin.sh <email>}"
DISP=$($DB -tA -c "select display_name from public.profiles p join auth.users u on u.id = p.id where u.email = '$EMAIL';" | head -1)
[ -n "$DISP" ] || { echo "No existe un perfil para $EMAIL"; exit 1; }
$DB -c "update public.profiles set app_role = 'ADMIN' where id = (select id from auth.users where email = '$EMAIL');" >/dev/null
echo "OK: '$EMAIL' ($DISP) ahora es ADMIN."

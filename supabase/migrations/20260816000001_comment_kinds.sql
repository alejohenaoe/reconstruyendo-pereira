-- ============================================================
-- 20260816000001_comment_kinds.sql
-- Tipos de mensaje en el hilo de colaboración (MVP §13, §14).
--
-- El hilo debe dejar claro cuándo un mensaje es una opinión, una oferta de
-- material o una recomendación profesional. La oferta de ayuda formal no entra
-- aquí: ya existe como `help_offers`, con su propio ciclo de estados, y
-- duplicarla en el hilo confundiría "se ofreció" con "ayudó" (MVP §10, §16).
--
-- `COMMENT` es el valor por defecto, así que los mensajes existentes quedan
-- como comentarios y nada cambia para quien no elija tipo.
-- ============================================================

create type public.comment_kind as enum ('COMMENT', 'MATERIAL', 'RECOMMENDATION');

alter table public.need_comments
  add column kind public.comment_kind not null default 'COMMENT';

comment on column public.need_comments.kind is
  'Qué representa el mensaje en el hilo: opinión, oferta de material o recomendación profesional (MVP §14).';

-- El aviso al dueño distingue "comentó" de "ofreció materiales" (MVP §27).
-- Se añade `kind` al payload; `notificationMessage` en el cliente lo traduce.
create or replace function public.notify_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_title text;
  v_name text;
begin
  if new.is_hidden then
    return new;
  end if;
  select n.user_id, n.title into v_owner, v_title
    from public.needs n where n.id = new.need_id;
  if v_owner is null or v_owner = new.user_id then
    return new;
  end if;
  select display_name into v_name from public.profiles where id = new.user_id;
  insert into public.notifications (user_id, type, actor_id, need_id, payload)
  values (v_owner, 'COMMENT', new.user_id, new.need_id,
          jsonb_build_object('title', coalesce(v_title, ''),
                             'actor_name', coalesce(v_name, 'Alguien'),
                             'kind', new.kind::text));
  return new;
end;
$$;

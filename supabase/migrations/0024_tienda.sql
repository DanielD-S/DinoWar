-- DinoWar — la tienda: comprar y equipar cosméticos con dinomonedas.
--
-- ORDEN AL APLICAR: primero la 0006 regenerada (`node tools/generar-cartas.mjs`),
-- que crea `catalogo_cosmeticos` y lo rellena desde src/data/cosmeticos.js; luego
-- ésta, que lo lee.
--
-- La regla del autor manda sobre todo lo que hay aquí: nada de lo que se vende
-- cambia una carta, un mazo ni lo rápido que se progresa. Sólo estética.
--
-- Qué hay:
--
-- - `jugador_cosmeticos`: lo que cada uno ha comprado. Sin políticas: se lee a
--   través de `mi_perfil()` y se escribe sólo con `comprar_cosmetico`.
-- - `jugadores.equipado`: lo que lleva puesto, un jsonb {tipo: id}. Vacío es el
--   artículo gratuito de cada tipo.
-- - `comprar_cosmetico(p_id)`: cobra el precio del CATÁLOGO, no uno que venga
--   en la petición, con la fila del jugador bloqueada —entre mirar el saldo y
--   gastarlo cabe otra petición—. No se compra dos veces lo mismo.
-- - `equipar_cosmetico(p_id)`: sólo lo que es tuyo o el gratuito.
-- - `mi_perfil()`: dice qué has comprado y qué llevas puesto.

create table if not exists public.jugador_cosmeticos (
  jugador_id    uuid not null references public.jugadores (id) on delete cascade,
  cosmetico_id  text not null references public.catalogo_cosmeticos (id),
  comprado_en   timestamptz not null default now(),
  primary key (jugador_id, cosmetico_id)
);

alter table public.jugador_cosmeticos enable row level security;
revoke all on public.jugador_cosmeticos from anon, authenticated;

alter table public.jugadores
  add column if not exists equipado jsonb not null default '{}'::jsonb;

-- ------------------------------------------------------------------ comprar
create or replace function public.comprar_cosmetico(p_id text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id       uuid := auth.uid();
  v_precio   int;
  v_defecto  boolean;
  v_monedas  bigint;
begin
  if v_id is null then raise exception 'sin sesión'; end if;

  select precio, por_defecto into v_precio, v_defecto
    from public.catalogo_cosmeticos where id = p_id;
  if not found then raise exception 'ese artículo no existe'; end if;
  if v_defecto then raise exception 'ese ya es tuyo'; end if;

  select monedas into v_monedas from public.jugadores where id = v_id for update;
  if not found then raise exception 'no has entrado'; end if;

  if exists (select 1 from public.jugador_cosmeticos
              where jugador_id = v_id and cosmetico_id = p_id) then
    raise exception 'ya lo tienes';
  end if;
  if v_monedas < v_precio then
    raise exception 'te faltan % dinomonedas', v_precio - v_monedas;
  end if;

  insert into public.jugador_cosmeticos (jugador_id, cosmetico_id) values (v_id, p_id);
  update public.jugadores set monedas = monedas - v_precio where id = v_id;
  return public.mi_perfil();
end;
$$;

-- ------------------------------------------------------------------ equipar
create or replace function public.equipar_cosmetico(p_id text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id       uuid := auth.uid();
  v_tipo     text;
  v_defecto  boolean;
begin
  if v_id is null then raise exception 'sin sesión'; end if;

  select tipo, por_defecto into v_tipo, v_defecto
    from public.catalogo_cosmeticos where id = p_id;
  if not found then raise exception 'ese artículo no existe'; end if;

  if not v_defecto and not exists (
    select 1 from public.jugador_cosmeticos where jugador_id = v_id and cosmetico_id = p_id
  ) then
    raise exception 'ese artículo no es tuyo';
  end if;

  update public.jugadores
     set equipado = equipado || jsonb_build_object(v_tipo, p_id)
   where id = v_id;
  if not found then raise exception 'no has entrado'; end if;
  return public.mi_perfil();
end;
$$;

-- Revocar a PUBLIC antes de conceder: una función nace con `execute` para
-- PUBLIC y anon es miembro. Ver «Misiones diarias» en CLAUDE.md.
revoke all on function public.comprar_cosmetico(text) from public, anon;
grant execute on function public.comprar_cosmetico(text) to authenticated;
revoke all on function public.equipar_cosmetico(text) from public, anon;
grant execute on function public.equipar_cosmetico(text) to authenticated;

-- -------------------------------------------------------------- el perfil
-- El de la 0023 con `cosmeticos` y `equipado`.
create or replace function public.mi_perfil()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid := auth.uid(); j record;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  select * into j from public.jugadores where id = v_id;
  if not found then raise exception 'no has entrado'; end if;

  return jsonb_build_object(
    'apodo', j.apodo,
    'apodo_cambios', j.apodo_cambios,
    'apodo_restantes', greatest(0, 1 - j.apodo_cambios),
    'monedas', j.monedas,
    'elo', j.elo,
    'sobres_abiertos', j.sobres_abiertos,
    'activo', j.mazo_activo,
    'sembrado', j.sembrado,
    'cosmeticos', coalesce((select jsonb_agg(cosmetico_id order by comprado_en)
                              from public.jugador_cosmeticos where jugador_id = v_id), '[]'::jsonb),
    'equipado', j.equipado,
    'cartas', coalesce((select jsonb_object_agg(card_id, copias)
                          from public.coleccion where jugador_id = v_id), '{}'::jsonb),
    'mazos', coalesce((select jsonb_agg(jsonb_build_object(
                                'id', m.id, 'nombre', m.nombre, 'cartas', m.cartas)
                              order by m.actualizado_en)
                         from public.mazos m where m.jugador_id = v_id), '[]'::jsonb)
  );
end;
$$;

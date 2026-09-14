-- DinoWar — las Expediciones: primeras victorias contra los rivales del mapa.
--
-- Aquí vive SÓLO lo que el servidor tiene que recordar: a qué rivales has
-- vencido ya. Los rivales, sus mazos y sus premios están en
-- `src/data/expediciones.js` y viajan en la llamada desde la Edge Function,
-- por lo mismo que las misiones: una copia del catálogo en SQL traería la
-- trampa de siempre —regenerar no es aplicar— y lo único que el SQL hace con
-- un rival es apuntar que lo venciste y pagar una vez.
--
-- Es seguro porque `aplicar_expedicion` está revocada a todo el mundo y sólo la
-- alcanza la clave de servicio, después de que la función haya re-jugado la
-- partida entera contra el mazo del rival que ELLA buscó en los datos.

-- ------------------------------------------------------------------ tabla
create table if not exists public.expediciones_victorias (
  jugador_id uuid        not null references public.jugadores (id) on delete cascade,
  -- El id del rival para los del camino, o `id@semana` para el visitante de
  -- la semana: así el camino se cobra una vez para siempre y el visitante una
  -- vez por semana, con la misma tabla y la misma clave primaria.
  clave      text        not null,
  rival_id   text        not null,
  premio     int         not null default 0 check (premio >= 0),
  ganada_en  timestamptz not null default now(),
  primary key (jugador_id, clave)
);

alter table public.expediciones_victorias enable row level security;

drop policy if exists expediciones_leer_las_mias on public.expediciones_victorias;
create policy expediciones_leer_las_mias on public.expediciones_victorias
  for select to authenticated using (jugador_id = auth.uid());
revoke insert, update, delete on public.expediciones_victorias from anon, authenticated;
revoke select on public.expediciones_victorias from anon;

-- ----------------------------------------------------------------- pagar

/**
 * Apunta una victoria contra un rival y paga su premio si es la primera.
 *
 * Paga CERO, sin fallar, en dos casos: si ya estaba apuntada —rejugar un nodo
 * vale lo que una partida normal— y si el nodo anterior del camino no está
 * vencido. Jugar un nodo cerrado se puede, que el navegador no lo ofrece pero
 * nada impide pedirlo; cobrar su primera victoria, no.
 *
 * El `on conflict do nothing` y el `get diagnostics` son lo que la hace
 * idempotente: dos peticiones con la misma victoria a la vez apuntan una fila
 * y pagan una vez.
 */
create or replace function public.aplicar_expedicion(
  p_jugador uuid, p_clave text, p_rival text, p_requisito text, p_premio int
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_filas   int;
  v_monedas bigint;
begin
  if p_requisito is not null and not exists (
    select 1 from public.expediciones_victorias
     where jugador_id = p_jugador and clave = p_requisito
  ) then
    return jsonb_build_object('premio', 0, 'primera', false, 'cerrado', true);
  end if;

  insert into public.expediciones_victorias (jugador_id, clave, rival_id, premio)
  values (p_jugador, p_clave, p_rival, greatest(0, p_premio))
  on conflict (jugador_id, clave) do nothing;
  get diagnostics v_filas = row_count;

  if v_filas = 0 then
    return jsonb_build_object('premio', 0, 'primera', false, 'cerrado', false);
  end if;

  update public.jugadores set monedas = monedas + greatest(0, p_premio)
   where id = p_jugador returning monedas into v_monedas;

  return jsonb_build_object('premio', greatest(0, p_premio), 'primera', true,
    'cerrado', false, 'monedas', v_monedas);
end;
$$;

-- --------------------------------------------------------------- leer

/**
 * Lo que el mapa necesita: a quién has vencido, y qué día es para el
 * servidor. El día viaja porque el visitante de la semana se calcula con él,
 * y con la fecha del navegador alguien en Auckland vería el de otra semana.
 */
create or replace function public.mis_expediciones()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  return jsonb_build_object(
    'dia', to_char((now() at time zone 'utc')::date, 'YYYY-MM-DD'),
    'vencidos', coalesce((
      select jsonb_agg(v.clave order by v.ganada_en)
        from public.expediciones_victorias v
       where v.jugador_id = v_id), '[]'::jsonb)
  );
end;
$$;

-- --------------------------------------------------------------- permisos
-- Revocar ANTES de conceder: una función creada por `postgres` nace con
-- execute para PUBLIC, del que anon es miembro (ver CLAUDE.md, misiones).
revoke all on function public.aplicar_expedicion(uuid, text, text, text, int) from public, anon, authenticated;
revoke all on function public.mis_expediciones() from public, anon;
grant execute on function public.mis_expediciones() to authenticated;

-- DinoWar — rejugar un nodo de expedición paga según el RIVAL.
--
-- El problema, dicho con los números del propio juego: la primera victoria
-- contra un nodo paga su premio —de 30 a 450— y volver a ganarle pagaba las 50
-- planas de cualquier partida. El último rey, que es el rival más duro del
-- juego y se le gana el 47 % de las veces, pagaba lo mismo que el primer nodo
-- de la Morrison, que se gana el 100 %. Así que los 32 nodos eran contenido de
-- un solo uso y lo óptimo era repetir el MÁS FÁCIL.
--
-- Ahora rejugar paga un tercio del premio del nodo y nunca menos que una
-- victoria normal. Los números viven en `src/data/rejugar.js` y se repiten
-- aquí porque quien paga es esta función; `test/rejugar.test.js` compara los
-- dos sitios y falla si se separan.
--
-- `aplicar_expedicion` CONSERVA SU FIRMA a propósito: la llama la Edge
-- Function, y cambiarla obliga a re-empaquetar, re-anclar y desplegar. Por eso
-- paga la DIFERENCIA sobre la victoria normal, que ya cobra `aplicar_partida`,
-- y lee las 50 de `catalogo_economia` en vez de recibirlas.

-- Cuántas veces has cobrado por rejugar cada nodo hoy. El día lo pone el
-- servidor: con la fecha del navegador, alguien en Auckland cobraría dos días.
create table if not exists public.expediciones_rejugadas (
  jugador_id uuid not null references public.jugadores (id) on delete cascade,
  rival_id   text not null,
  dia        date not null,
  veces      int  not null default 0 check (veces >= 0),
  primary key (jugador_id, rival_id, dia)
);

alter table public.expediciones_rejugadas enable row level security;
drop policy if exists rejugadas_leer_las_mias on public.expediciones_rejugadas;
create policy rejugadas_leer_las_mias on public.expediciones_rejugadas
  for select to authenticated using (jugador_id = auth.uid());
revoke insert, update, delete on public.expediciones_rejugadas from anon, authenticated;
revoke select on public.expediciones_rejugadas from anon;

create or replace function public.aplicar_expedicion(
  p_jugador uuid, p_clave text, p_rival text, p_requisito text, p_premio int
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_filas    int;
  v_monedas  bigint;
  v_victoria int;
  v_dia      date := (now() at time zone 'utc')::date;
  v_veces    int;
  v_extra    int;
  -- Los dos números de src/data/rejugar.js.
  c_divisor  constant int := 3;
  c_por_dia  constant int := 3;
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

  -- Ya estaba vencido: se paga por REJUGARLO, hasta el tope del día. El
  -- contador se sube primero y con `returning`, que dos peticiones a la vez no
  -- pueden cobrar las dos el último plazo.
  if v_filas = 0 then
    select monedas_victoria into v_victoria from public.catalogo_economia where id = 1;
    v_extra := greatest(0, round(greatest(0, p_premio)::numeric / c_divisor)::int
                           - coalesce(v_victoria, 0));
    if v_extra = 0 then
      return jsonb_build_object('premio', 0, 'primera', false, 'cerrado', false,
        'rejugada', true, 'veces', 0, 'tope', c_por_dia);
    end if;

    insert into public.expediciones_rejugadas (jugador_id, rival_id, dia, veces)
    values (p_jugador, p_rival, v_dia, 1)
    on conflict (jugador_id, rival_id, dia) do update
      set veces = public.expediciones_rejugadas.veces + 1
      where public.expediciones_rejugadas.veces < c_por_dia
    returning veces into v_veces;

    if v_veces is null then
      return jsonb_build_object('premio', 0, 'primera', false, 'cerrado', false,
        'rejugada', true, 'veces', c_por_dia, 'tope', c_por_dia);
    end if;

    update public.jugadores set monedas = monedas + v_extra
     where id = p_jugador returning monedas into v_monedas;

    return jsonb_build_object('premio', v_extra, 'primera', false, 'cerrado', false,
      'rejugada', true, 'veces', v_veces, 'tope', c_por_dia, 'monedas', v_monedas);
  end if;

  update public.jugadores set monedas = monedas + greatest(0, p_premio)
   where id = p_jugador returning monedas into v_monedas;

  return jsonb_build_object('premio', greatest(0, p_premio), 'primera', true,
    'cerrado', false, 'monedas', v_monedas);
end;
$$;

revoke all on function public.aplicar_expedicion(uuid, text, text, text, int)
  from public, anon, authenticated;

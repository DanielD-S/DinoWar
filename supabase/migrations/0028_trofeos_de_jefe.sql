-- DinoWar — trofeos de jefe, cosméticos exclusivos y los logros de lo ya jugado.
--
-- ORDEN AL APLICAR: primero la 0006 regenerada (`node tools/generar-cartas.mjs`),
-- que mete en el catálogo los cuatro cosméticos exclusivos (dos retratos de
-- jefe, el dorso «Cazador de jefes» y el estandarte «Campeón»); luego ésta; y
-- DESPUÉS la Edge Function re-anclada y desplegada, porque el logro «Leyenda
-- del duelo» viaja con la recompensa `cosmetico`, que sólo entiende esta
-- `avanzar_logros`: con la 0027, un tipo desconocido se marcaba cobrado sin
-- entregar nada.
--
-- Qué hay:
--
-- - `private.catalogo_logros()`: la copia del catálogo de src/data/logros.js
--   que usan las dos cosas de aquí que no pasan por la Edge Function. Es una
--   copia a propósito y con guardián: test/logros.test.js falla si se separa.
-- - `private.avanzar_logros` entiende `cosmetico`.
-- - `reclamar_jefe` avanza los logros de las cartas de jefe cuando la carta
--   entra por PRIMERA vez: el retrato de ese jefe, y el dorso con las dos.
-- - Y un recuento de lo jugado ANTES de que la función desplegada empezara a
--   apuntar logros (2026-09-15 02:38 UTC): quien ya había ganado 10 partidas o
--   jugado un duelo tiene su logro. Lo posterior ya lo apuntó la función en
--   vivo, así que se cuenta sólo lo anterior al corte y no hay doble cuenta.
--   El golpe final a un jefe no se puede reconstruir y no se cuenta.

create or replace function private.catalogo_logros()
returns jsonb
language sql immutable as $$
  -- LOGROS:INICIO
  select '[{"id":"duelista","mide":"duelos","meta":1,"recompensa":{"tipo":"titulo","id":"titulo_duelista"}},{"id":"asaltante","mide":"asaltos","meta":5,"recompensa":{"tipo":"titulo","id":"titulo_asaltante"}},{"id":"cazador","mide":"jefesVencidos","meta":1,"recompensa":{"tipo":"titulo","id":"titulo_cazador"}},{"id":"trofeo_saurophaganax","mide":"jefe:saurophaganax","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_saurophaganax"}},{"id":"trofeo_barosaurus","mide":"jefe:barosaurus","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_barosaurus"}},{"id":"cazador_mayor","mide":"cartasJefe","meta":2,"recompensa":{"tipo":"cosmetico","id":"dorso_cazador"}},{"id":"campeon","mide":"duelosGanados","meta":10,"recompensa":{"tipo":"titulo","id":"titulo_campeon"}},{"id":"explorador","mide":"victorias","meta":10,"recompensa":{"tipo":"sobres","n":3}},{"id":"demoledor","mide":"danoJefe","meta":300,"recompensa":{"tipo":"sobres","n":5}},{"id":"morrison","mide":"expedicionNuevos","meta":8,"recompensa":{"tipo":"mazo"}},{"id":"veterano","mide":"duelosGanados","meta":25,"recompensa":{"tipo":"mazo"}},{"id":"leyenda","mide":"duelosGanados","meta":50,"recompensa":{"tipo":"cosmetico","id":"estandarte_campeon"}}]'::jsonb
  -- LOGROS:FIN
$$;
revoke all on function private.catalogo_logros() from public, anon, authenticated;

-- ------------------------------------------------------------ los logros
create or replace function private.avanzar_logros(p_jugador uuid, p_logros jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  a           jsonb;
  r           jsonb;
  v_progreso  int;
  v_cobrado   boolean;
  v_cumplidos jsonb := '[]'::jsonb;
begin
  for a in select * from jsonb_array_elements(coalesce(p_logros, '[]'::jsonb))
  loop
    insert into public.logros (jugador_id, logro_id, progreso)
    values (p_jugador, a->>'id', greatest(0, (a->>'avance')::int))
    on conflict (jugador_id, logro_id)
      do update set progreso = public.logros.progreso + greatest(0, (a->>'avance')::int)
    returning progreso, cobrado into v_progreso, v_cobrado;

    if not v_cobrado and v_progreso >= greatest(1, (a->>'meta')::int) then
      update public.logros set cobrado = true, cobrado_en = now()
       where jugador_id = p_jugador and logro_id = a->>'id' and not cobrado;
      if found then
        r := a->'recompensa';
        case r->>'tipo'
          when 'titulo' then perform private.otorgar_cosmetico(p_jugador, r->>'id');
          when 'cosmetico' then perform private.otorgar_cosmetico(p_jugador, r->>'id');
          when 'mazo' then update public.jugadores set mazos_extra = mazos_extra + 1 where id = p_jugador;
          when 'sobres' then update public.jugadores set sobres_gratis = sobres_gratis + greatest(1, (r->>'n')::int) where id = p_jugador;
          -- Un tipo que no se entiende NO se da por cobrado: se deshace la
          -- marca y queda para cuando el SQL sepa entregarlo.
          else
            update public.logros set cobrado = false, cobrado_en = null
             where jugador_id = p_jugador and logro_id = a->>'id';
            continue;
        end case;
        v_cumplidos := v_cumplidos || jsonb_build_array(a->>'id');
      end if;
    end if;
  end loop;
  return v_cumplidos;
end;
$$;
revoke all on function private.avanzar_logros(uuid, jsonb) from public, anon, authenticated;

-- ------------------------------------------------------ reclamar la carta
-- El de la 0022 con los logros de las cartas de jefe al final.
create or replace function public.reclamar_jefe(p_evento text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_id         uuid := auth.uid();
  v_tribu      uuid := private.mi_tribu();
  v_ciclo      int;
  v_recompensa text;
  v_nueva      boolean;
begin
  if v_tribu is null then raise exception 'no estás en ninguna tribu'; end if;
  if not exists (select 1 from public.jefes j
                  where j.tribu_id = v_tribu and j.evento_id = p_evento) then
    raise exception 'ese jefe no está abierto';
  end if;

  select a.ciclo into v_ciclo
    from public.aportes a
    join public.jefes j on j.tribu_id = a.tribu_id
                       and j.evento_id = a.evento_id
                       and j.ciclo = a.ciclo
   where a.tribu_id = v_tribu and a.evento_id = p_evento and a.jugador_id = v_id
     and not a.reclamado and a.dano > 0 and j.vida <= 0
   order by a.ciclo
   limit 1
   for update of a;

  if v_ciclo is null then return null; end if;

  update public.aportes set reclamado = true
   where tribu_id = v_tribu and evento_id = p_evento
     and jugador_id = v_id and ciclo = v_ciclo;

  select recompensa into v_recompensa from public.catalogo_eventos where evento_id = p_evento;
  if v_recompensa is not null then
    -- ¿Es la primera copia? Hay que mirarlo ANTES de darla.
    v_nueva := not exists (select 1 from public.coleccion
                            where jugador_id = v_id and card_id = v_recompensa and copias > 0);
    perform private.dar_cartas(v_id, jsonb_build_object(v_recompensa, 1));
    -- La carta es `jefe_<id>` y el contador `jefe:<id>`. Con la primera copia
    -- avanzan el logro de ese jefe y el de las cartas de jefe distintas.
    if v_nueva then
      perform private.avanzar_logros(v_id, coalesce((
        select jsonb_agg(d || jsonb_build_object('avance', 1))
          from jsonb_array_elements(private.catalogo_logros()) d
         where d->>'mide' in ('jefe:' || substr(v_recompensa, 6), 'cartasJefe')), '[]'::jsonb));
    end if;
  end if;
  return v_recompensa;
end;
$$;

-- ------------------------------------------------- lo jugado antes de ayer
do $$
declare
  corte constant timestamptz := '2026-09-15 02:38:00+00';
  j     record;
  c     jsonb;
begin
  for j in select id from public.jugadores loop
    c := jsonb_build_object(
      'victorias', (select count(*) from public.partidas p
                     where p.jugador_id = j.id and p.ganada and p.jugado_en < corte),
      'duelos', (select count(*) from public.duelos x
                  where x.estado = 'terminado' and x.actualizado_en < corte
                    and j.id in (x.jugador_a, x.jugador_b)),
      'duelosGanados', (select count(*) from public.duelos x
                         where x.estado = 'terminado' and x.actualizado_en < corte
                           and ((x.ganador = 0 and x.jugador_a = j.id) or (x.ganador = 1 and x.jugador_b = j.id))),
      'asaltos', (select count(*) from public.asaltos a
                   where a.jugador_id = j.id and a.jugado_en < corte),
      'danoJefe', (select coalesce(sum(a.dano), 0) from public.asaltos a
                    where a.jugador_id = j.id and a.jugado_en < corte),
      'expedicionNuevos', (select count(*) from public.expediciones_victorias v
                            where v.jugador_id = j.id and v.ganada_en < corte),
      'jefe:saurophaganax', (select count(*) from public.coleccion
                              where jugador_id = j.id and card_id = 'jefe_saurophaganax' and copias > 0),
      'jefe:barosaurus', (select count(*) from public.coleccion
                           where jugador_id = j.id and card_id = 'jefe_barosaurus' and copias > 0),
      'cartasJefe', (select count(*) from public.coleccion
                      where jugador_id = j.id and card_id like 'jefe\_%' and copias > 0)
    );
    perform private.avanzar_logros(j.id, coalesce((
      select jsonb_agg(d || jsonb_build_object('avance', (c->>(d->>'mide'))::int))
        from jsonb_array_elements(private.catalogo_logros()) d
       where coalesce((c->>(d->>'mide'))::int, 0) > 0), '[]'::jsonb));
  end loop;
end;
$$;

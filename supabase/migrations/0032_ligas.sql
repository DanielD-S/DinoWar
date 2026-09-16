-- DinoWar — lo que le faltaba a la liga: escudo de descenso, temporadas y la
-- tabla de la Extinción. Y DESPUÉS, la Edge Function re-empaquetada y
-- re-anclada: `duelo_cerrar` cambia de firma y la función es quien la llama.
--
-- Las REGLAS viven en src/data/ligas.js —umbrales, derrotas de margen, cuánto
-- dura una temporada, cómo se reinicia el ELO— y las aplica la Edge Function
-- al cerrar cada duelo. Aquí sólo se guarda lo que ella decide:
--
-- - `jugadores.escudo`: derrotas de margen que quedan antes de bajar de liga.
--   Nace a tres, que es lo que se trae al llegar a una liga.
-- - `jugadores.temporada`: la temporada en que se escribió el ELO. Si el
--   cierre ve una temporada más nueva, reinicia el ELO antes de moverlo.
-- - `duelo_cerrar` recibe los dos y los escribe con el ELO.
-- - `tabla_extincion()`: los de la liga de arriba con nombre y puesto. Es lo
--   único de la liga que se enseña con número —los puntos por encima del
--   umbral—, y sólo ahí, que es la cola de los que llegaron al final.

alter table public.jugadores
  add column if not exists escudo    int not null default 3 check (escudo >= 0),
  add column if not exists temporada int not null default 0 check (temporada >= 0);

-- -------------------------------------------------------------- el duelo
-- El de la 0027 con el escudo y la temporada de cada bando.
drop function if exists public.duelo_cerrar(uuid, int, text, int, int, int, int, date, jsonb, jsonb, jsonb, jsonb);

create or replace function public.duelo_cerrar(
  p_id uuid, p_ganador int, p_motivo text, p_turnos int,
  p_elo_a int, p_elo_b int, p_monedas_victoria int,
  p_dia date default null,
  p_avances_a jsonb default '[]'::jsonb, p_avances_b jsonb default '[]'::jsonb,
  p_logros_a jsonb default '[]'::jsonb, p_logros_b jsonb default '[]'::jsonb,
  p_escudo_a int default null, p_escudo_b int default null,
  p_temporada int default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  d public.duelos%rowtype;
begin
  select * into d from public.duelos where id = p_id for update;
  if not found then raise exception 'duelo inexistente'; end if;
  if d.estado = 'terminado' then
    return jsonb_build_object('ya', true, 'ganador', d.ganador, 'motivo', d.motivo);
  end if;
  if d.jugador_b is null then
    delete from public.duelos where id = p_id;
    return jsonb_build_object('ya', false, 'borrado', true);
  end if;

  update public.duelos
     set estado = 'terminado', ganador = p_ganador, motivo = p_motivo,
         actualizado_en = now()
   where id = p_id;

  update public.jugadores
     set elo = p_elo_a, duelos = duelos + 1,
         escudo = coalesce(p_escudo_a, escudo),
         temporada = coalesce(p_temporada, temporada)
   where id = d.jugador_a;
  update public.jugadores
     set elo = p_elo_b, duelos = duelos + 1,
         escudo = coalesce(p_escudo_b, escudo),
         temporada = coalesce(p_temporada, temporada)
   where id = d.jugador_b;

  perform public.aplicar_partida(d.jugador_a, d.semilla, p_turnos, p_ganador = 0,
    case when p_ganador = 0 then p_monedas_victoria else 0 end, p_dia, p_avances_a, p_logros_a);
  perform public.aplicar_partida(d.jugador_b, d.semilla, p_turnos, p_ganador = 1,
    case when p_ganador = 1 then p_monedas_victoria else 0 end, p_dia, p_avances_b, p_logros_b);

  return jsonb_build_object('ya', false, 'ganador', p_ganador, 'motivo', p_motivo,
    'elo_a', p_elo_a, 'elo_b', p_elo_b);
end;
$$;
revoke all on function public.duelo_cerrar(uuid, int, text, int, int, int, int, date, jsonb, jsonb, jsonb, jsonb, int, int, int)
  from public, anon, authenticated;

-- ------------------------------------------------------------ el perfil
-- El de la 0029 con el escudo y la temporada: el cliente pinta la liga con
-- `eloVigente(elo, temporada, hoy)`, que reinicia lo que el servidor aún no
-- ha tocado, y enseña las derrotas de margen que quedan.
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
    'esquirlas', j.esquirlas,
    'elo', j.elo,
    'escudo', j.escudo,
    'temporada', j.temporada,
    'sobres_abiertos', j.sobres_abiertos,
    'sobres_gratis', j.sobres_gratis,
    'mazos_extra', j.mazos_extra,
    'iniciales_tomados', to_jsonb(j.iniciales_tomados),
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

-- ------------------------------------------------------- la Extinción
-- Los `p_desde` de arriba, ordenados por ELO. El umbral viene del cliente
-- porque vive en ligas.js y aquí no hay copia: no es una decisión de dinero
-- ni de cartas —sólo qué filas se enseñan— así que no hace falta cerrarlo.
-- Se devuelve el ELO crudo y la temporada de cada fila: el cliente aplica el
-- mismo reinicio que a sí mismo, y como el reinicio conserva el orden, el
-- puesto no cambia. Se limita a cien: una tabla no es una exportación.
create or replace function public.tabla_extincion(p_desde int default 1750)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid := auth.uid();
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  return jsonb_build_object(
    'filas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'apodo', t.apodo, 'elo', t.elo, 'temporada', t.temporada, 'duelos', t.duelos,
        'yo', t.id = v_id) order by t.elo desc, t.duelos desc, t.creado_en)
      from (select id, apodo, elo, temporada, duelos, creado_en
              from public.jugadores where elo >= p_desde
             order by elo desc, duelos desc, creado_en limit 100) t), '[]'::jsonb),
    'total', (select count(*) from public.jugadores where elo >= p_desde)
  );
end;
$$;
revoke all on function public.tabla_extincion(int) from public, anon;
grant execute on function public.tabla_extincion(int) to authenticated;

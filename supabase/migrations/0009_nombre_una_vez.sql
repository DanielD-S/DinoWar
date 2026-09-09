-- DinoWar — el nombre de jugador se cambia UNA vez, y sólo una.
--
-- El nombre es lo único tuyo que ven los demás y va a salir en una tabla de
-- ELO. Si se puede cambiar cuando uno quiera, deja de identificar a nadie:
-- pierdes tres partidas, te renombras y la clasificación te ha perdido la
-- pista. Un cambio cubre el arrepentimiento del primer día sin abrir esa
-- puerta.
--
-- El que se pone AL CREAR la cuenta no gasta el cambio: lo pone `entrar()` en
-- el insert de la fila, que es un `on conflict do nothing` sobre el apodo y no
-- pasa por aquí.

alter table public.jugadores
  add column if not exists apodo_cambios int not null default 0;

-- Los que ya existían y llevan un nombre autogenerado no han gastado nada. Los
-- que se renombraron a mano en la sesión anterior tampoco: no había regla que
-- gastar, y cobrarles ahora un cambio que no sabían que costaba sería una
-- trampa. Se empieza a contar desde aquí.


-- La firma cambia de `returns text` a `returns jsonb`. `create or replace` NO
-- puede cambiar el tipo de retorno —da «cannot change return type»— así que hay
-- que tirar la vieja primero. Y da igual el orden a efectos de PostgREST: dos
-- funciones con el mismo nombre y los mismos argumentos no pueden coexistir.
drop function if exists public.cambiar_apodo(text);

create function public.cambiar_apodo(p_apodo text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id      uuid := auth.uid();
  v_apodo   text;
  v_cambios int;
  v_tope    constant int := 1;
begin
  if v_id is null then raise exception 'sin sesión'; end if;

  select apodo_cambios into v_cambios from public.jugadores where id = v_id for update;
  if v_cambios is null then raise exception 'no has entrado'; end if;
  if v_cambios >= v_tope then
    raise exception 'ya has usado tu cambio de nombre';
  end if;

  v_apodo := left(trim(coalesce(p_apodo, '')), 24);
  if char_length(v_apodo) < 3 then
    raise exception 'el nombre de jugador necesita al menos 3 letras';
  end if;

  update public.jugadores
     set apodo = v_apodo, apodo_cambios = apodo_cambios + 1
   where id = v_id;

  return jsonb_build_object('apodo', v_apodo, 'restantes', v_tope - (v_cambios + 1));
exception
  -- El índice único es quien decide si está libre, no una consulta previa:
  -- entre mirar y escribir cabe otro registro con el mismo nombre. Y como la
  -- excepción aborta el UPDATE entero, el cambio NO se gasta si el nombre
  -- estaba cogido.
  when unique_violation then
    raise exception 'ese nombre ya lo lleva alguien';
end;
$$;

revoke all on function public.cambiar_apodo(text) from public, anon;
grant execute on function public.cambiar_apodo(text) to authenticated;

-- `mi_perfil` tiene que decir cuántos cambios te quedan: la pantalla necesita
-- avisarlo ANTES, no después de gastarlo.
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
    'cartas', coalesce((select jsonb_object_agg(card_id, copias)
                          from public.coleccion where jugador_id = v_id), '{}'::jsonb),
    'mazos', coalesce((select jsonb_agg(jsonb_build_object(
                                'id', m.id, 'nombre', m.nombre, 'cartas', m.cartas)
                              order by m.actualizado_en)
                         from public.mazos m where m.jugador_id = v_id), '[]'::jsonb)
  );
end;
$$;

-- DinoWar — elegir el mazo inicial.
--
-- Hasta aquí `entrar()` sembraba a todo jugador nuevo con la misma colección,
-- el mazo de referencia. Ahora se elige uno de tres —Cazadores, Gigantes o
-- Manadas, uno por clado— y esa elección es la colección de salida entera.
--
-- ORDEN AL APLICAR: primero la 0006 regenerada (`node tools/generar-cartas.mjs`),
-- que crea `catalogo_iniciales` y la rellena desde src/data/iniciales.js; luego
-- ésta, que la lee.
--
-- Qué cambia y por qué:
--
-- - `entrar()` YA NO SIEMBRA. Si sembrara, una cuenta que llegase sin elegir
--   —otra pestaña, un cierre a medias— se quedaría con un mazo que no eligió.
--   Crea la fila y el yacimiento, como antes, y la deja con `sembrado = false`.
-- - `elegir_mazo_inicial(p_mazo)` siembra. El cliente sólo manda el id; qué
--   cartas son lo dice la tabla, nunca la petición. Si ya estaba sembrada no
--   hace nada y devuelve el perfil: un doble toque no regala otra colección.
-- - `mi_perfil()` dice `sembrado`, que es lo que hace que el cliente enseñe la
--   elección. El cliente trata un perfil SIN ese campo como sembrado, así que
--   la versión del navegador puede ir por delante de esta migración.
--
-- Los ocho jugadores que ya existen tienen `sembrado = true` y nada de esto los
-- toca. Para comprobarlo antes de aplicar:
--
--   select count(*) filter (where not sembrado) from public.jugadores;  -- 0

-- ------------------------------------------------------------ sembrar
-- El cuerpo de la 0007, con el mazo como parámetro. Se llama distinto de
-- `private.sembrar(uuid)` para que no convivan dos firmas del mismo nombre: la
-- vieja se borra más abajo, cuando `entrar()` ya no la llama.
create or replace function private.sembrar_inicial(p_jugador uuid, p_mazo text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_mazo    uuid;
  v_monedas int;
  v_nombre  text;
begin
  -- El `for update` es lo que impide que dos toques a la vez siembren dos
  -- veces, igual que en la 0007.
  perform 1 from public.jugadores
   where id = p_jugador and not sembrado for update;
  if not found then return false; end if;

  select min(nombre) into v_nombre from public.catalogo_iniciales where mazo = p_mazo;
  if v_nombre is null then raise exception 'ese mazo inicial no existe'; end if;

  select monedas_inicio into v_monedas from public.catalogo_economia where id = 1;

  insert into public.coleccion (jugador_id, card_id, copias)
    select p_jugador, card_id, copias from public.catalogo_iniciales where mazo = p_mazo
  on conflict (jugador_id, card_id) do nothing;

  insert into public.mazos (jugador_id, nombre, cartas)
    values (p_jugador, v_nombre,
            (select jsonb_object_agg(card_id, copias)
               from public.catalogo_iniciales where mazo = p_mazo))
    returning id into v_mazo;

  update public.jugadores
     set monedas = v_monedas, sembrado = true, mazo_activo = v_mazo
   where id = p_jugador;
  return true;
end;
$$;

revoke all on function private.sembrar_inicial(uuid, text) from public, anon, authenticated;

-- ------------------------------------------------------------------ entrar
-- El de la 0008 sin `perform private.sembrar(v_id)`.
create or replace function public.entrar(p_apodo text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_apodo text;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  v_apodo := left(coalesce(nullif(trim(p_apodo), ''),
                           'Excavador-' || substr(v_id::text, 1, 4)), 24);

  insert into public.jugadores (id, apodo) values (v_id, v_apodo)
  on conflict (id) do update set visto_en = now();

  insert into public.yacimientos (jugador_id) values (v_id)
  on conflict (jugador_id) do nothing;

  return v_id;
end;
$$;

drop function if exists private.sembrar(uuid);

-- ---------------------------------------------------------------- elegir
create or replace function public.elegir_mazo_inicial(p_mazo text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  perform 1 from public.jugadores where id = v_id;
  if not found then raise exception 'no has entrado'; end if;

  perform private.sembrar_inicial(v_id, p_mazo);
  return public.mi_perfil();
end;
$$;

-- Revocar a PUBLIC antes de conceder: una función nace con `execute` para
-- PUBLIC y anon es miembro. Ver «Misiones diarias» en CLAUDE.md.
revoke all on function public.elegir_mazo_inicial(text) from public, anon;
grant execute on function public.elegir_mazo_inicial(text) to authenticated;

-- -------------------------------------------------------------- el perfil
-- El de la 0009 con `sembrado`.
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
    'cartas', coalesce((select jsonb_object_agg(card_id, copias)
                          from public.coleccion where jugador_id = v_id), '{}'::jsonb),
    'mazos', coalesce((select jsonb_agg(jsonb_build_object(
                                'id', m.id, 'nombre', m.nombre, 'cartas', m.cartas)
                              order by m.actualizado_en)
                         from public.mazos m where m.jugador_id = v_id), '[]'::jsonb)
  );
end;
$$;

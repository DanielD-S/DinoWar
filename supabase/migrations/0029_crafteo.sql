-- DinoWar — el crafteo: fundir lo que sobra en esquirlas y crear lo que falta.
--
-- ORDEN AL APLICAR: primero la 0006 regenerada (`node tools/generar-cartas.mjs`),
-- que crea `catalogo_crafteo` con los números de src/data/crafteo.js; luego ésta.
-- No toca la Edge Function: fundir y crear los llama el navegador por RPC.
--
-- Qué cambia:
--
-- - `jugadores.esquirlas`: el material del crafteo. Empieza en cero.
-- - `fundir_excedente()` ya NO da dinomonedas: da esquirlas, según la rareza de
--   cada copia sobrante. Las monedas salen de jugar y compran sobres; lo que
--   sobra paga crear la carta que eliges.
-- - `crear_carta(p_card)`: cobra las esquirlas del CATÁLOGO —el cliente sólo
--   manda el id—, con la fila del jugador bloqueada, y sólo hasta el tope de
--   copias: lo creado nunca vuelve a ser sobrante, así que no hay bucle. Las
--   cartas de jefe no se crean: se ganan en la cuenca.
-- - `mi_perfil()` dice cuántas esquirlas tienes.

alter table public.jugadores
  add column if not exists esquirlas bigint not null default 0 check (esquirlas >= 0);

-- ------------------------------------------------------------------ fundir
-- El de la 0007 con esquirlas en vez de monedas y la fila bloqueada: fundir y
-- crear a la vez desde dos pestañas no pueden leer el mismo saldo.
create or replace function public.fundir_excedente()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id        uuid := auth.uid();
  v_esquirlas bigint := 0;
  v_fundidas  int := 0;
  v_saldo     bigint;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  perform 1 from public.jugadores where id = v_id for update;
  if not found then raise exception 'no has entrado'; end if;

  select coalesce(sum((col.copias - c.copias_max) * k.fundir), 0),
         coalesce(sum(col.copias - c.copias_max), 0)
    into v_esquirlas, v_fundidas
    from public.coleccion col
    join public.catalogo_cartas c on c.card_id = col.card_id
    join public.catalogo_crafteo k on k.rareza = c.rareza
   where col.jugador_id = v_id and not c.es_jefe and col.copias > c.copias_max;

  update public.coleccion col
     set copias = c.copias_max
    from public.catalogo_cartas c
   where c.card_id = col.card_id and col.jugador_id = v_id
     and not c.es_jefe and col.copias > c.copias_max;

  update public.jugadores set esquirlas = esquirlas + v_esquirlas
   where id = v_id returning esquirlas into v_saldo;

  return jsonb_build_object('esquirlas', v_saldo, 'ganadas', v_esquirlas, 'fundidas', v_fundidas);
end;
$$;

revoke all on function public.fundir_excedente() from public, anon;
grant execute on function public.fundir_excedente() to authenticated;

-- ------------------------------------------------------------------- crear
create or replace function public.crear_carta(p_card text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id        uuid := auth.uid();
  v_rareza    text;
  v_max       int;
  v_jefe      boolean;
  v_coste     int;
  v_esquirlas bigint;
  v_tengo     int;
begin
  if v_id is null then raise exception 'sin sesión'; end if;

  select rareza, copias_max, es_jefe into v_rareza, v_max, v_jefe
    from public.catalogo_cartas where card_id = p_card;
  if not found then raise exception 'esa carta no existe'; end if;
  if v_jefe then raise exception 'las cartas de jefe se ganan en la cuenca'; end if;

  select crear into v_coste from public.catalogo_crafteo where rareza = v_rareza;
  if v_coste is null then raise exception 'esa rareza no se puede crear'; end if;

  select esquirlas into v_esquirlas from public.jugadores where id = v_id for update;
  if not found then raise exception 'no has entrado'; end if;

  v_tengo := coalesce((select copias from public.coleccion
                        where jugador_id = v_id and card_id = p_card), 0);
  if v_tengo >= v_max then
    raise exception 'ya tienes todas las copias que caben en un mazo';
  end if;
  if v_esquirlas < v_coste then
    raise exception 'te faltan % esquirlas', v_coste - v_esquirlas;
  end if;

  perform private.dar_cartas(v_id, jsonb_build_object(p_card, 1));
  update public.jugadores set esquirlas = esquirlas - v_coste where id = v_id;
  return public.mi_perfil();
end;
$$;

revoke all on function public.crear_carta(text) from public, anon;
grant execute on function public.crear_carta(text) to authenticated;

-- -------------------------------------------------------------- el perfil
-- El de la 0027 con las esquirlas.
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

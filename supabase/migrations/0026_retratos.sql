-- DinoWar — los retratos: un artículo gratuito que no es el de por defecto.
--
-- ORDEN AL APLICAR: primero la 0006 regenerada (`node tools/generar-cartas.mjs`),
-- que mete los retratos y los artículos nuevos en `catalogo_cosmeticos`; luego
-- ésta.
--
-- Hasta ahora «gratis» y «por defecto» eran lo mismo: un artículo por tipo. Los
-- retratos estrenan dos personas para elegir sin pagar, así que cada tipo sigue
-- teniendo UN artículo por defecto —lo que se ve sin haber tocado nada— y puede
-- tener otros con precio 0. Las dos funciones de la 0024 cambian en eso y sólo
-- en eso:
--
-- - `comprar_cosmetico`: lo gratuito no se compra, ya es tuyo.
-- - `equipar_cosmetico`: se puede poner lo gratuito sin haberlo comprado.
--
-- Lo del rival (`equipado_en_duelo`, 0025) no cambia: ya devuelve el jsonb
-- entero de lo equipado, así que el retrato viaja con el dorso y el estandarte.

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
  if v_defecto or v_precio = 0 then raise exception 'ese ya es tuyo'; end if;

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

create or replace function public.equipar_cosmetico(p_id text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id       uuid := auth.uid();
  v_tipo     text;
  v_defecto  boolean;
  v_precio   int;
begin
  if v_id is null then raise exception 'sin sesión'; end if;

  select tipo, por_defecto, precio into v_tipo, v_defecto, v_precio
    from public.catalogo_cosmeticos where id = p_id;
  if not found then raise exception 'ese artículo no existe'; end if;

  if not v_defecto and v_precio > 0 and not exists (
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

-- `create or replace` conserva los permisos de la 0024, pero se repiten: si
-- algún día esta migración corre sola, no puede dejar las funciones abiertas.
revoke all on function public.comprar_cosmetico(text) from public, anon;
grant execute on function public.comprar_cosmetico(text) to authenticated;
revoke all on function public.equipar_cosmetico(text) from public, anon;
grant execute on function public.equipar_cosmetico(text) to authenticated;

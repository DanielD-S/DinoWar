-- El asalto no se registraba nunca: «column reference "almacen" is ambiguous».
--
-- `aplicar_asalto` se declara `returns table (vida, cayo, almacen)`, y en
-- PL/pgSQL las columnas de salida son VARIABLES dentro del cuerpo. Así que un
-- `select almacen from public.tribus` no sabe si quiere la columna de la tabla
-- o la variable de salida, y falla. Lo mismo con `vida` contra `public.jefes`.
--
-- Y falla EN EJECUCIÓN, no al crear la función: el cuerpo de una función
-- PL/pgSQL no se analiza hasta que se la llama. Por eso esto venía desde
-- 0001_cuenca.sql sin que lo cazara nada y sólo se vio al terminar un asalto
-- de verdad: la partida se jugaba, el daño se calculaba, y la tribu no se
-- enteraba —«No se pudo registrar el asalto»—.
--
-- El arreglo es cualificar toda columna que se llame como una de salida
-- (`t.almacen`, `j.vida`), no renombrar las de salida: esos nombres son los
-- que lee la Edge Function en la respuesta.
--
-- Misma firma, mismos nombres de salida y misma lógica que 0001: aquí sólo
-- cambian los prefijos de tabla.
--
-- Aplicada en producción el 14-09-2026. Comprobado en ejecución con una copia
-- temporal de sus lecturas —crear la función no prueba nada, que el cuerpo no
-- se analiza hasta llamarla— y comprobado que sólo la alcanza `service_role`.
create or replace function public.aplicar_asalto(
  p_tribu     uuid,
  p_evento    text,
  p_jugador   uuid,
  p_semilla   bigint,
  p_dano      int,
  p_turnos    int,
  p_ganada    boolean,
  p_coste     int
) returns table (vida bigint, cayo boolean, almacen bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vida_antes bigint;
  v_vida       bigint;
  v_almacen    bigint;
begin
  -- Siempre en el mismo orden —tribu y luego jefe— o dos asaltos simultáneos
  -- se abrazan en un interbloqueo.
  select t.almacen into v_almacen from public.tribus t where t.id = p_tribu for update;
  if not found then raise exception 'tribu inexistente'; end if;
  if v_almacen < p_coste then raise exception 'almacén insuficiente'; end if;

  select j.vida into v_vida_antes from public.jefes j
    where j.tribu_id = p_tribu and j.evento_id = p_evento for update;
  if not found then raise exception 'ese jefe no está abierto para tu tribu'; end if;
  if v_vida_antes <= 0 then raise exception 'el jefe ya ha caído'; end if;

  insert into public.asaltos (tribu_id, evento_id, jugador_id, semilla, dano, turnos, ganada)
  values (p_tribu, p_evento, p_jugador, p_semilla, p_dano, p_turnos, p_ganada);

  v_vida := greatest(0, v_vida_antes - p_dano);

  update public.jefes j
     set vida = v_vida,
         caido_en = case when v_vida = 0 and j.caido_en is null then now() else j.caido_en end
   where j.tribu_id = p_tribu and j.evento_id = p_evento;

  update public.tribus t set almacen = t.almacen - p_coste where t.id = p_tribu
    returning t.almacen into v_almacen;

  insert into public.aportes (tribu_id, evento_id, jugador_id, dano, asaltos)
  values (p_tribu, p_evento, p_jugador, p_dano, 1)
  on conflict (tribu_id, evento_id, jugador_id)
  do update set dano = public.aportes.dano + excluded.dano,
                asaltos = public.aportes.asaltos + 1;

  return query select v_vida, (v_vida = 0 and v_vida_antes > 0), v_almacen;
end;
$$;

-- `create or replace` conserva los permisos, pero repetirlo deja la migración
-- completa por sí sola: sólo la clave de servicio llama a esto.
revoke all on function public.aplicar_asalto(uuid, text, uuid, bigint, int, int, boolean, int)
  from public, anon, authenticated;

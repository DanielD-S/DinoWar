-- DinoWar — quién manda en una tribu, y cómo se sale de ella.
--
-- Hasta ahora una tribu era una lista de gente sin dueño: nadie podía echar a
-- nadie y NADIE PODÍA IRSE. Entrar en otra cuenca era pisar `tribu_id` y dejar
-- la anterior atrás sin decirlo; con la lista de tribus eso pasa de ser un caso
-- raro a ser el camino normal, así que salir tiene que existir y ser explícito.
--
-- Un capataz por tribu. Se llama capataz y no «jefe» porque un jefe en este
-- juego es el Saurophaganax, y dos cosas con el mismo nombre en la misma
-- pantalla no hay quien las lea. Las mismas reglas están en
-- `src/data/mando.js` para poder decir POR QUÉ antes de mandar la petición;
-- las de aquí son las que mandan, porque salen de `auth.uid()`.

alter table public.jugadores
  add column if not exists rol text not null default 'miembro',
  add column if not exists tribu_desde timestamptz;

alter table public.jugadores drop constraint if exists jugadores_rol_ck;
alter table public.jugadores add constraint jugadores_rol_ck
  check (rol in ('capataz', 'miembro'));

-- Relleno de lo que ya existe: en cada tribu manda quien lleva más tiempo, que
-- es el que la fundó. Sin tribu no hay rol que valga.
update public.jugadores j set rol = 'capataz'
 where j.tribu_id is not null
   and j.id = (select p.id from public.jugadores p
                where p.tribu_id = j.tribu_id order by p.creado_en, p.id limit 1);
update public.jugadores set tribu_desde = creado_en
 where tribu_id is not null and tribu_desde is null;
update public.jugadores set rol = 'miembro', tribu_desde = null where tribu_id is null;

-- Fundar una cuenca: quien la funda la manda. Y ya no se puede fundar con una
-- tribu puesta — antes se podía, y dejaba la anterior huérfana sin avisar.
create or replace function public.crear_tribu(p_nombre text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_codigo text;
  v_tribu uuid;
  v_intentos int := 0;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  if private.mi_tribu() is not null then raise exception 'ya estás en una cuenca: sal antes de fundar otra'; end if;
  if length(trim(coalesce(p_nombre,''))) < 3 then raise exception 'el nombre es muy corto'; end if;

  loop
    v_codigo := upper(string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
                (floor(random()*32)+1)::int, 1), '')) from generate_series(1,6);
    exit when not exists (select 1 from public.tribus where codigo = v_codigo);
    v_intentos := v_intentos + 1;
    if v_intentos > 20 then raise exception 'no se pudo generar un código'; end if;
  end loop;

  insert into public.tribus (nombre, codigo, almacen)
  values (left(trim(p_nombre), 32), v_codigo, 600)
  returning id into v_tribu;

  update public.jugadores set tribu_id = v_tribu, rol = 'capataz', tribu_desde = now()
   where id = v_id;
  return v_codigo;
end;
$$;

-- Entrar con el código. El código es una invitación privada, así que entra sin
-- pedir permiso aunque la cuenca esté cerrada a la lista: quien lo tiene es
-- porque alguien de dentro se lo dio.
create or replace function public.entrar_en_tribu(p_codigo text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid;
  v_cuantos int;
  v_tope int;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  if private.mi_tribu() is not null then raise exception 'ya estás en una cuenca: sal antes de entrar en otra'; end if;
  select id into v_tribu from public.tribus where codigo = upper(trim(p_codigo));
  if v_tribu is null then raise exception 'ese código no existe'; end if;

  select miembros_maximo into v_tope from public.catalogo_cuenca where id = 1;
  select count(*) into v_cuantos from public.jugadores where tribu_id = v_tribu;
  if v_cuantos >= v_tope then raise exception 'esa cuenca está llena'; end if;

  update public.jugadores set tribu_id = v_tribu, rol = 'miembro', tribu_desde = now()
   where id = v_id;
  return v_tribu;
end;
$$;

-- Salir. Si se va el capataz, el mando pasa solo al más antiguo: una tribu sin
-- capataz no podría aceptar ni echar a nadie. Y si se va el último, la tribu se
-- BORRA con su almacén: una guarida vacía con fósiles dentro no es de nadie, y
-- dejarla en la lista sería ofrecer una cuenca en la que no hay nadie.
create or replace function public.salir_de_tribu()
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid;
  v_rol text;
  v_quedan int;
  v_relevo uuid;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  select j.tribu_id, j.rol into v_tribu, v_rol
    from public.jugadores j where j.id = v_id for update;
  if v_tribu is null then raise exception 'no estás en ninguna cuenca'; end if;

  update public.jugadores set tribu_id = null, rol = 'miembro', tribu_desde = null
   where id = v_id;

  select count(*) into v_quedan from public.jugadores where tribu_id = v_tribu;
  if v_quedan = 0 then
    delete from public.tribus where id = v_tribu;
    return;
  end if;

  if v_rol = 'capataz' then
    select p.id into v_relevo from public.jugadores p
     where p.tribu_id = v_tribu
     order by p.tribu_desde nulls last, p.creado_en, p.id limit 1;
    update public.jugadores set rol = 'capataz' where id = v_relevo;
  end if;
end;
$$;

-- Echar a alguien. Sólo el capataz, sólo de SU cuenca y nunca a sí mismo —para
-- eso está salir—. Lo que pierde es el sitio, no lo aportado: sus filas de
-- `aportes` se quedan, que son el registro de lo que hizo de verdad.
create or replace function public.expulsar(p_jugador uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  if p_jugador = v_id then raise exception 'para irte tú está salir de la cuenca'; end if;
  select j.tribu_id into v_tribu from public.jugadores j
   where j.id = v_id and j.rol = 'capataz';
  if v_tribu is null then raise exception 'sólo el capataz echa a alguien'; end if;
  if not exists (select 1 from public.jugadores p
                  where p.id = p_jugador and p.tribu_id = v_tribu) then
    raise exception 'esa persona no está en tu cuenca';
  end if;

  update public.jugadores set tribu_id = null, rol = 'miembro', tribu_desde = null
   where id = p_jugador;
end;
$$;

-- Pasar el mando. Las dos filas se tocan en la misma transacción: una tribu no
-- puede quedarse ni con dos capataces ni con ninguno.
create or replace function public.ceder_mando(p_jugador uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  if p_jugador = v_id then raise exception 'ya eres el capataz'; end if;
  select j.tribu_id into v_tribu from public.jugadores j
   where j.id = v_id and j.rol = 'capataz' for update;
  if v_tribu is null then raise exception 'no eres el capataz'; end if;
  if not exists (select 1 from public.jugadores p
                  where p.id = p_jugador and p.tribu_id = v_tribu) then
    raise exception 'esa persona no está en tu cuenca';
  end if;

  update public.jugadores set rol = 'capataz' where id = p_jugador;
  update public.jugadores set rol = 'miembro' where id = v_id;
end;
$$;

-- El estado de la cuenca, con el ROL y la antigüedad de cada miembro: la
-- pantalla necesita saber quién manda para enseñar sus botones, y el relevo se
-- calcula con la antigüedad.
--
-- Ojo con las columnas de `returns table` en PL/pgSQL: aquí no las hay porque
-- esto devuelve jsonb, pero es la trampa que dejó el asalto sin registrar
-- durante meses (ver 0013).
create or replace function public.estado_cuenca()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid := private.mi_tribu();
  y record;
  v_dia int;
  v_ciclo int;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  select * into y from private.cobrar_fosiles(v_id) limit 1;
  select ciclo_dias into v_ciclo from public.catalogo_cuenca where id = 1;

  if v_tribu is not null then
    select floor(extract(epoch from (now() - creada_en)) / 86400)::int % v_ciclo
      into v_dia from public.tribus where id = v_tribu;
  end if;

  return jsonb_build_object(
    'ahora', extract(epoch from now()) * 1000,
    'yo', v_id,
    'yacimiento', jsonb_build_object('nivel', y.nivel, 'fosiles', y.fosiles, 'deposito', y.deposito),
    'dia', v_dia,
    'tribu', (select jsonb_build_object('id', t.id, 'nombre', t.nombre, 'codigo', t.codigo,
                                        'almacen', t.almacen, 'creada_en', t.creada_en)
              from public.tribus t where t.id = v_tribu),
    'miembros', coalesce((select jsonb_agg(jsonb_build_object(
                            'id', p.id, 'apodo', p.apodo, 'rol', p.rol,
                            'desde', p.tribu_desde)
                            order by p.tribu_desde nulls first, p.creado_en)
                          from public.jugadores p where p.tribu_id = v_tribu), '[]'::jsonb),
    'jefes', coalesce((select jsonb_agg(jsonb_build_object(
                          'evento_id', j.evento_id, 'vida', j.vida,
                          'vida_maxima', j.vida_maxima, 'caido_en', j.caido_en))
                       from public.jefes j where j.tribu_id = v_tribu), '[]'::jsonb),
    'aportes', coalesce((select jsonb_agg(jsonb_build_object(
                          'evento_id', a.evento_id, 'jugador_id', a.jugador_id,
                          'apodo', p.apodo, 'dano', a.dano, 'reclamado', a.reclamado))
                         from public.aportes a join public.jugadores p on p.id = a.jugador_id
                         where a.tribu_id = v_tribu), '[]'::jsonb),
    'asaltos_hoy', (select count(*) from public.asaltos s
                    where s.jugador_id = v_id and s.jugado_en > now() - interval '24 hours')
  );
end;
$$;

-- Como todas las lecturas y escrituras del jugador: revocar a PUBLIC antes de
-- conceder, que una función creada por `postgres` nace con execute para PUBLIC
-- y anon es miembro.
revoke all on function public.salir_de_tribu(), public.expulsar(uuid),
  public.ceder_mando(uuid) from public, anon;
grant execute on function public.salir_de_tribu(), public.expulsar(uuid),
  public.ceder_mando(uuid) to authenticated;

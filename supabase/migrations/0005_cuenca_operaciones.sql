-- DinoWar — las operaciones de la cuenca que NO necesitan re-jugar una partida.
--
-- El asalto pasa por la Edge Function porque hay que reproducir la partida con
-- el motor. Todo lo demás —entrar, fundar una tribu, cobrar fósiles, aportar,
-- mejorar el yacimiento— es aritmética, y la aritmética se hace mejor en SQL,
-- en una transacción, que en un servidor que va y vuelve.
--
-- Todas son SECURITY DEFINER porque las tablas están cerradas a escritura, y
-- todas sacan QUIÉN ERES de auth.uid(), nunca de un parámetro: un jugador_id
-- que llegara en la llamada sería un «soy quien yo diga».

-- Los fósiles NO se guardan como un contador que el cliente incrementa: se
-- derivan del tiempo transcurrido desde el último cobro. Adelantar el reloj del
-- móvil no hace nada porque el reloj que cuenta es el de este servidor.
create or replace function private.cobrar_fosiles(p_jugador uuid)
returns table (nivel int, fosiles int, deposito int)
language plpgsql security definer set search_path = public as $$
declare
  y record;
  cat record;
  ganados bigint;
  horas numeric;
begin
  select * into y from public.yacimientos where jugador_id = p_jugador for update;
  if not found then raise exception 'no tienes yacimiento'; end if;
  select * into cat from public.catalogo_yacimiento where catalogo_yacimiento.nivel = y.nivel;

  -- Un reloj que va hacia atrás no produce, y tampoco resta.
  horas := greatest(0, extract(epoch from (now() - y.cobrado_en)) / 3600.0);
  ganados := floor(horas * cat.fosiles_hora);

  if ganados > 0 then
    update public.yacimientos
       set fosiles = least(cat.deposito, yacimientos.fosiles + ganados),
           -- El reloj avanza SÓLO lo que costó lo que se cobró: el resto de
           -- hora queda pendiente, para que entrar a menudo no pierda nada.
           cobrado_en = case
             when least(cat.deposito, yacimientos.fosiles + ganados) >= cat.deposito then now()
             else y.cobrado_en + make_interval(secs => (ganados::numeric / cat.fosiles_hora) * 3600)
           end
     where jugador_id = p_jugador;
  end if;

  return query
    select y2.nivel, y2.fosiles, cat.deposito
    from public.yacimientos y2 where y2.jugador_id = p_jugador;
end;
$$;

-- Entrar. Crea tu jugador y tu yacimiento si no los tienes. Idempotente: se
-- llama en cada arranque del juego sin pensarlo.
create or replace function public.entrar(p_apodo text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_apodo text;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  v_apodo := coalesce(nullif(trim(p_apodo), ''), 'Excavador');
  v_apodo := left(v_apodo, 24);

  insert into public.jugadores (id, apodo) values (v_id, v_apodo)
  on conflict (id) do update set visto_en = now();

  insert into public.yacimientos (jugador_id) values (v_id)
  on conflict (jugador_id) do nothing;

  return v_id;
end;
$$;

-- Fundar una tribu. El código es corto y legible porque hay que dictarlo en voz
-- alta; se evitan las letras que se confunden (I, O, 0, 1).
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

  update public.jugadores set tribu_id = v_tribu where id = v_id;
  return v_codigo;
end;
$$;

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
  select id into v_tribu from public.tribus where codigo = upper(trim(p_codigo));
  if v_tribu is null then raise exception 'ese código no existe'; end if;

  select miembros_maximo into v_tope from public.catalogo_cuenca where id = 1;
  select count(*) into v_cuantos from public.jugadores where tribu_id = v_tribu;
  if v_cuantos >= v_tope then raise exception 'esa tribu está llena'; end if;

  update public.jugadores set tribu_id = v_tribu where id = v_id;
  return v_tribu;
end;
$$;

-- Abrir el jefe que toque. La ventana la decide el SERVIDOR contra el catálogo
-- y la fecha de fundación de la tribu: el cliente sólo dice a cuál quiere
-- entrar, no cuánta vida tiene ni si está abierto.
create or replace function public.abrir_jefe(p_evento text)
returns table (vida bigint, vida_maxima bigint)
language plpgsql security definer set search_path = public as $$
declare
  v_tribu uuid := private.mi_tribu();
  ev record;
  v_ciclo int;
  v_dia int;
begin
  if v_tribu is null then raise exception 'no estás en ninguna tribu'; end if;
  select * into ev from public.catalogo_eventos where evento_id = p_evento and tipo = 'JEFE';
  if not found then raise exception 'ese evento no es una caza'; end if;

  select ciclo_dias into v_ciclo from public.catalogo_cuenca where id = 1;
  select floor(extract(epoch from (now() - creada_en)) / 86400)::int % v_ciclo
    into v_dia from public.tribus where id = v_tribu;

  if v_dia < ev.dia or v_dia >= ev.dia + ev.dura then
    raise exception 'la ventana de ese jefe no está abierta';
  end if;

  insert into public.jefes (tribu_id, evento_id, vida, vida_maxima)
  values (v_tribu, p_evento, ev.vida_maxima, ev.vida_maxima)
  on conflict (tribu_id, evento_id) do nothing;

  return query select j.vida, j.vida_maxima from public.jefes j
    where j.tribu_id = v_tribu and j.evento_id = p_evento;
end;
$$;

-- Aportar al común. Cobra primero lo que haya producido el yacimiento, para que
-- «aportar todo» signifique todo de verdad y no lo que hubiera la última vez.
create or replace function public.aportar(p_cantidad int)
returns table (fosiles int, almacen bigint)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid := private.mi_tribu();
  v_tengo int;
  v_da int;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  if v_tribu is null then raise exception 'no estás en ninguna tribu'; end if;

  select y.fosiles into v_tengo from private.cobrar_fosiles(v_id) y;
  v_da := least(greatest(coalesce(p_cantidad, 0), 0), v_tengo);
  if v_da = 0 then
    return query select v_tengo, t.almacen from public.tribus t where t.id = v_tribu;
    return;
  end if;

  update public.yacimientos set fosiles = yacimientos.fosiles - v_da where jugador_id = v_id;
  update public.tribus set almacen = tribus.almacen + v_da where id = v_tribu;

  return query
    select y.fosiles, t.almacen
    from public.yacimientos y, public.tribus t
    where y.jugador_id = v_id and t.id = v_tribu;
end;
$$;

create or replace function public.mejorar_yacimiento()
returns table (nivel int, fosiles int)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_nivel int;
  v_tengo int;
  v_coste bigint;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  select y.nivel, y.fosiles into v_nivel, v_tengo from private.cobrar_fosiles(v_id) y;

  select coste_mejora into v_coste from public.catalogo_yacimiento where catalogo_yacimiento.nivel = v_nivel;
  if v_coste is null then raise exception 'tu yacimiento ya está al máximo'; end if;
  if v_tengo < v_coste then raise exception 'te faltan fósiles'; end if;

  update public.yacimientos
     set nivel = v_nivel + 1, fosiles = yacimientos.fosiles - v_coste
   where jugador_id = v_id;

  return query select y.nivel, y.fosiles from public.yacimientos y where y.jugador_id = v_id;
end;
$$;

-- Reclamar la carta de un jefe caído. Con haber aportado basta: el premio es
-- por participar, no por rematar.
create or replace function public.reclamar_jefe(p_evento text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid := private.mi_tribu();
  v_vida bigint;
  v_dano bigint;
  v_recompensa text;
begin
  if v_tribu is null then raise exception 'no estás en ninguna tribu'; end if;
  select j.vida into v_vida from public.jefes j
    where j.tribu_id = v_tribu and j.evento_id = p_evento;
  if v_vida is null then raise exception 'ese jefe no está abierto'; end if;
  if v_vida > 0 then raise exception 'ese jefe sigue en pie'; end if;

  select a.dano into v_dano from public.aportes a
    where a.tribu_id = v_tribu and a.evento_id = p_evento and a.jugador_id = v_id
      and not a.reclamado;
  if v_dano is null or v_dano <= 0 then return null; end if;

  update public.aportes set reclamado = true
   where tribu_id = v_tribu and evento_id = p_evento and jugador_id = v_id;

  select recompensa into v_recompensa from public.catalogo_eventos where evento_id = p_evento;
  return v_recompensa;
end;
$$;

-- Toda la cuenca en una llamada. La pantalla necesita ocho cosas a la vez y
-- ocho viajes desde un móvil se notan.
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
    'yacimiento', jsonb_build_object('nivel', y.nivel, 'fosiles', y.fosiles, 'deposito', y.deposito),
    'dia', v_dia,
    'tribu', (select jsonb_build_object('id', t.id, 'nombre', t.nombre, 'codigo', t.codigo,
                                        'almacen', t.almacen, 'creada_en', t.creada_en)
              from public.tribus t where t.id = v_tribu),
    'miembros', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'apodo', p.apodo))
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

-- Lo que puede llamar un jugador, y nada más. cobrar_fosiles vive en `private`
-- justo para que no sea un endpoint: se llama desde las otras, no desde fuera.
revoke all on function public.entrar(text), public.crear_tribu(text),
  public.entrar_en_tribu(text), public.abrir_jefe(text), public.aportar(int),
  public.mejorar_yacimiento(), public.reclamar_jefe(text), public.estado_cuenca()
  from public, anon;
grant execute on function public.entrar(text), public.crear_tribu(text),
  public.entrar_en_tribu(text), public.abrir_jefe(text), public.aportar(int),
  public.mejorar_yacimiento(), public.reclamar_jefe(text), public.estado_cuenca()
  to authenticated;
revoke all on function private.cobrar_fosiles(uuid) from public, anon, authenticated;

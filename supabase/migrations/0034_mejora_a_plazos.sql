-- DinoWar — la mejora del yacimiento se paga A PLAZOS.
--
-- El botón «Mejorar · 300» llevaba apagado desde el primer día para todo el
-- mundo, y no por un fallo del botón: por una cuenta que no cuadra. La mejora
-- se paga con los fósiles del DEPÓSITO —es la decisión de diseño: ayudar hoy
-- o producir más mañana— y el depósito de nivel 1 se llena a 168 (12 por hora
-- durante 14 horas). Con 300 de coste no se puede pagar NUNCA, y a nivel 2 es
-- peor: 252 de tope contra 1.200. La escalera entera (300·n²) está por encima
-- de lo que cabe en el depósito en todos los niveles.
--
-- La salida no es bajar el coste hasta que quepa: entonces cada nivel sería
-- un día de producción y la escalera se acabaría en una semana. Es dejar
-- INVERTIR lo que hay, las veces que haga falta, hasta juntar el coste. La
-- tensión con aportar se conserva —cada fósil va a un sitio o al otro— y los
-- números del catálogo no cambian, así que `tribu.js` no se toca y la Edge
-- Function no hay que re-anclarla.
--
-- Lo invertido se guarda en `yacimientos.invertido` y se descuenta del coste
-- del nivel en curso. No se puede sacar: es una obra, no una hucha.

alter table public.yacimientos
  add column if not exists invertido int not null default 0 check (invertido >= 0);

-- Invierte lo que hay en el depósito, hasta lo que falta. Si con eso se llega
-- al coste, sube el nivel y lo invertido vuelve a cero. Misma firma que antes
-- —sin argumentos— para que un cliente viejo siga llamando a lo mismo; pero
-- devuelve una columna más, y Postgres no deja cambiar el tipo de salida con
-- `create or replace`: hay que tirarla antes.
drop function if exists public.mejorar_yacimiento();
create function public.mejorar_yacimiento()
returns table (nivel int, fosiles int, invertido int)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_nivel int;
  v_tengo int;
  v_puesto int;
  v_coste bigint;
  v_pongo int;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  select y.nivel, y.fosiles into v_nivel, v_tengo from private.cobrar_fosiles(v_id) y;
  select ya.invertido into v_puesto from public.yacimientos ya where ya.jugador_id = v_id;

  select coste_mejora into v_coste from public.catalogo_yacimiento where catalogo_yacimiento.nivel = v_nivel;
  if v_coste is null then raise exception 'tu yacimiento ya está al máximo'; end if;
  if v_tengo <= 0 then raise exception 'no tienes fósiles que invertir'; end if;

  v_pongo := least(v_tengo, greatest(0, v_coste - v_puesto));
  if v_pongo <= 0 then raise exception 'la mejora ya está pagada'; end if;

  if v_puesto + v_pongo >= v_coste then
    update public.yacimientos
       set nivel = v_nivel + 1, fosiles = yacimientos.fosiles - v_pongo, invertido = 0
     where jugador_id = v_id;
  else
    update public.yacimientos
       set fosiles = yacimientos.fosiles - v_pongo, invertido = yacimientos.invertido + v_pongo
     where jugador_id = v_id;
  end if;

  return query select y.nivel, y.fosiles, y.invertido from public.yacimientos y where y.jugador_id = v_id;
end;
$$;

revoke all on function public.mejorar_yacimiento() from public, anon;
grant execute on function public.mejorar_yacimiento() to authenticated;

-- `estado_cuenca` tiene que decir cuánto hay invertido, y es una función
-- larga que no conviene reescribir a mano por una clave: se coge la
-- definición puesta y se le añade la clave, como hizo la 0018 con los
-- mensajes. Repetible: si ya la lleva, no se toca.
do $do$
declare
  d text;
  viejo text := $v$'yacimiento', jsonb_build_object('nivel', y.nivel, 'fosiles', y.fosiles, 'deposito', y.deposito),$v$;
  nuevo text := $n$'yacimiento', jsonb_build_object('nivel', y.nivel, 'fosiles', y.fosiles, 'deposito', y.deposito,
                                        'invertido', (select ya.invertido from public.yacimientos ya where ya.jugador_id = v_id)),$n$;
begin
  d := pg_get_functiondef('public.estado_cuenca()'::regprocedure);
  if position('''invertido''' in d) > 0 then return; end if;
  if position(viejo in d) = 0 then raise exception 'estado_cuenca no tiene la línea del yacimiento que se esperaba'; end if;
  execute replace(d, viejo, nuevo);
end $do$;

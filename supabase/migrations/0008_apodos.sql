-- DinoWar — el nombre de jugador.
--
-- El apodo existe desde la 0001 y es lo único tuyo que ven los demás: sale en
-- la lista de tu tribu y en el reparto de daño a un jefe. Pero no lo elegía
-- nadie. `entrar()` lo ponía en «Excavador» y ahí se quedaba, así que una tribu
-- de ocho eran ocho Excavadores.
--
-- Ahora se elige al crear la cuenta y se puede cambiar después.
--
-- Y se hace ÚNICO. No es capricho: es el nombre que va a salir en una tabla de
-- ELO, y dos jugadores con el mismo nombre en una clasificación es un problema
-- que sólo se puede arreglar antes de que la gente tenga nombre. Después ya no.

-- ------------------------------------------------------------ los empates
-- Antes de poder poner el índice hay que deshacer los que ya hay: todos los
-- jugadores existentes se llaman igual y el índice no se crearía.
--
-- Se conserva el nombre del más antiguo y a los demás se les pega un trozo de
-- su uuid. 18 + 1 + 4 = 23, por debajo del límite de 24 que ya tenía la tabla.
with empatados as (
  select id,
         row_number() over (partition by lower(apodo) order by creado_en, id) as n
    from public.jugadores
)
update public.jugadores j
   set apodo = left(j.apodo, 18) || '-' || substr(j.id::text, 1, 4)
  from empatados e
 where e.id = j.id and e.n > 1;

-- `lower()` y no el texto tal cual: «Torvo» y «torvo» son el mismo nombre para
-- cualquiera que lo lea, y dejar pasar el segundo sería una suplantación barata.
create unique index if not exists jugadores_apodo_unico
  on public.jugadores (lower(apodo));

-- ------------------------------------------------------------------ entrar
-- `entrar()` tiene que dejar de poner a todo el mundo «Excavador»: con el
-- índice puesto, el segundo jugador que llegara chocaría y no podría entrar.
-- El nombre de salida lleva un trozo del uuid, y se cambia desde la pantalla
-- de cuenta en cuanto quieras.
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

  -- El apodo sólo se pone al CREAR el jugador. Si ya existe no se toca: sería
  -- pisarle en cada arranque el nombre que eligió con el de por defecto.
  insert into public.jugadores (id, apodo) values (v_id, v_apodo)
  on conflict (id) do update set visto_en = now();

  insert into public.yacimientos (jugador_id) values (v_id)
  on conflict (jugador_id) do nothing;

  perform private.sembrar(v_id);

  return v_id;
end;
$$;

-- --------------------------------------------------------------- cambiarlo
-- Devuelve el apodo que quedó guardado, no un booleano: se recorta a 24 y la
-- pantalla tiene que enseñar lo que de verdad se guardó, no lo que se escribió.
create or replace function public.cambiar_apodo(p_apodo text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_apodo text;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  v_apodo := left(trim(coalesce(p_apodo, '')), 24);
  if char_length(v_apodo) < 3 then
    raise exception 'el nombre de jugador necesita al menos 3 letras';
  end if;

  update public.jugadores set apodo = v_apodo where id = v_id;
  if not found then raise exception 'no has entrado'; end if;
  return v_apodo;
exception
  -- El índice es quien decide si está libre, no una consulta previa: entre
  -- mirar y escribir cabe otro registro con el mismo nombre.
  when unique_violation then
    raise exception 'ese nombre ya lo lleva alguien';
end;
$$;

revoke all on function public.cambiar_apodo(text) from public, anon;
grant execute on function public.cambiar_apodo(text) to authenticated;

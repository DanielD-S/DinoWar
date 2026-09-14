-- DinoWar — deshacer una cuenca en la que sólo estás tú.
--
-- Una tribu NO es del capataz: es de quien está dentro. El almacén lo llenaron
-- entre todos y los aportes al jefe son de cada uno, así que nadie puede borrar
-- el progreso de otros siete. Por eso no hay un «disolver» general.
--
-- Pero el caso de fundar una cuenca, no aparecer nadie y querer empezar otra sí
-- existe, y hasta ahora se resolvía por un camino escondido: «Salir» ya borra
-- la tribu cuando se va el último. Hacía lo correcto sin decirlo.
--
-- Esto es lo mismo dicho con todas las letras, y es una función APARTE de
-- `salir_de_tribu` por una razón: el botón promete «deshacer», y si alguien ha
-- entrado por la lista entre que se pinta la pantalla y se pulsa, salir te
-- sacaría a ti y le dejaría el mando a esa persona — que es lo correcto, pero
-- NO es lo que decía el botón. Aquí eso es un error con su motivo.
--
-- Aplicada en producción el 14-09-2026.
create or replace function public.deshacer_tribu()
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid;
  v_rol text;
  v_cuantos int;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  select j.tribu_id, j.rol into v_tribu, v_rol from public.jugadores j where j.id = v_id;
  if v_tribu is null then raise exception 'no estás en ninguna cuenca'; end if;

  -- El bloqueo va sobre la fila de la TRIBU, que es la que también bloquea
  -- `unirse_a_tribu`: lo que hay que impedir es que alguien entre justo entre
  -- la cuenta de miembros y el borrado.
  perform 1 from public.tribus where id = v_tribu for update;

  select count(*) into v_cuantos from public.jugadores where tribu_id = v_tribu;
  if v_cuantos > 1 then raise exception 'ya no estás solo: alguien ha entrado en la cuenca'; end if;
  if v_rol <> 'capataz' then raise exception 'sólo el capataz deshace la cuenca'; end if;

  update public.jugadores set tribu_id = null, rol = 'miembro', tribu_desde = null
   where id = v_id;
  -- Se lleva por delante jefes, aportes y solicitudes: todo cuelga de la tribu
  -- con `on delete cascade`, y no queda nadie a quien le sirvan.
  delete from public.tribus where id = v_tribu;
end;
$$;

revoke all on function public.deshacer_tribu() from public, anon;
grant execute on function public.deshacer_tribu() to authenticated;

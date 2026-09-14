-- DinoWar — lo que lleva puesto tu rival en un duelo.
--
-- La tienda vende dorsos y estandartes que tiene que ver también el rival. Lo
-- equipado vive en `jugadores.equipado` y ningún jugador puede leer la fila de
-- otro, así que lo cuenta esta función: sólo a quien está EN ESE duelo, y
-- sólo lo equipado —ni monedas, ni colección, ni nada más de la cuenta—.
--
-- Por qué una función de lectura y no un campo más en lo que devuelve la Edge
-- Function del duelo: tocar la función obliga a re-empaquetar, re-anclar y
-- desplegar, que son los tres sitios donde este proyecto ya se ha equivocado.
-- Esto es SQL y no mueve nada más.
--
-- Lo equipado ya está validado: `equipar_cosmetico` (0024) sólo deja ponerse
-- lo comprado o lo gratuito, así que aquí no hay que volver a comprobarlo.

create or replace function public.equipado_en_duelo(p_duelo uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id     uuid := auth.uid();
  d        record;
  v_rival  uuid;
begin
  if v_id is null then raise exception 'sin sesión'; end if;

  select jugador_a, jugador_b into d from public.duelos where id = p_duelo;
  if not found then raise exception 'ese duelo no existe'; end if;

  if v_id = d.jugador_a then
    v_rival := d.jugador_b;
  elsif v_id = d.jugador_b then
    v_rival := d.jugador_a;
  else
    raise exception 'ese duelo no es tuyo';
  end if;

  return jsonb_build_object(
    'rival', coalesce((select equipado from public.jugadores where id = v_rival), '{}'::jsonb)
  );
end;
$$;

-- Revocar a PUBLIC antes de conceder: una función nace con `execute` para
-- PUBLIC y anon es miembro. Ver «Misiones diarias» en CLAUDE.md.
revoke all on function public.equipado_en_duelo(uuid) from public, anon;
grant execute on function public.equipado_en_duelo(uuid) to authenticated;

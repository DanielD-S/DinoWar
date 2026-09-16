-- DinoWar — el tope de criaturas legendarias por mazo.
--
-- Decisión del autor (16-09-2026): un mazo lleva como mucho TRES criaturas
-- legendarias entre todas. El tope por carta ya era 1, así que hasta hoy quien
-- tuviera la colección entera metía las nueve del set más las de jefe.
--
-- Va aquí y no sólo en el navegador por lo de siempre: si el servidor no lo
-- comprueba, un cliente hostil guarda el mazo por la puerta de atrás y juega
-- con él. Y si sólo lo comprobara el servidor, el jugador se encontraría un
-- «no se pudo guardar» sin saber por qué. Las dos mitades, la misma regla.
--
-- El número NO se escribe aquí: sale de `catalogo_economia.legendarias_dino_max`,
-- que pone la 0006 regenerada desde `BALANCE.legendariasDinoPorMazo`. Aplicar
-- la 0006 ANTES que ésta, que lee esa columna.
--
-- Esto es una re-creación de `private.validar_mazo` con un bloque más; lo
-- demás va palabra por palabra como estaba en la 0007.
--
-- Aplicada en producción el 16-09-2026, después del delta de la 0006 —la
-- columna `legendarias_dino_max` y la fila de `catalogo_economia`, que es lo
-- único que la regeneración cambió—. Comprobado en ejecución y no sólo al
-- crearla, que el cuerpo de una PL/pgSQL no se analiza hasta llamarla: de los
-- ocho mazos guardados, los siete legales pasan y el «PRUEBA» con nueve
-- legendarias es el único que rebota. Y comprobado que anon sigue sin poder
-- llamarla.

create or replace function private.validar_mazo(p_jugador uuid, p_cartas jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_tam   int;
  v_leg   int;
  v_total int;
  v_mal   text;
begin
  if p_cartas is null or jsonb_typeof(p_cartas) <> 'object' then
    raise exception 'mazo mal formado';
  end if;
  select tamano_mazo, legendarias_dino_max into v_tam, v_leg
    from public.catalogo_economia where id = 1;

  select string_agg(e.key, ', ') into v_mal
    from jsonb_each_text(p_cartas) e
   where e.value !~ '^[1-9][0-9]*$';
  if v_mal is not null then raise exception 'copias inválidas: %', v_mal; end if;

  select string_agg(e.key, ', ') into v_mal
    from jsonb_each_text(p_cartas) e
    left join public.catalogo_cartas c on c.card_id = e.key
   where c.card_id is null;
  if v_mal is not null then raise exception 'carta desconocida: %', v_mal; end if;

  select string_agg(format('%s lleva %s copias y el máximo es %s', e.key, e.value, c.copias_max), '; ')
    into v_mal
    from jsonb_each_text(p_cartas) e
    join public.catalogo_cartas c on c.card_id = e.key
   where e.value::int > c.copias_max;
  if v_mal is not null then raise exception 'copias por encima de la rareza: %', v_mal; end if;

  -- El tope de FAMILIA. Criatura Y legendaria: las de jefe cumplen las dos
  -- cosas y entran; las legendarias de soporte —climas, eventos, recursos,
  -- Biomasa— no, que lo que se acumula es el cuerpo.
  select coalesce(sum(e.value::int), 0) into v_total
    from jsonb_each_text(p_cartas) e
    join public.catalogo_cartas c on c.card_id = e.key
   where c.tipo = 'DINOSAURIO' and c.rareza = 'LEGENDARIO';
  if v_total > v_leg then
    raise exception 'un mazo lleva como mucho % criaturas legendarias y ése lleva %', v_leg, v_total;
  end if;

  select string_agg(format('de %s tienes %s y el mazo pide %s',
                           e.key, coalesce(col.copias, 0), e.value), '; ')
    into v_mal
    from jsonb_each_text(p_cartas) e
    left join public.coleccion col
      on col.jugador_id = p_jugador and col.card_id = e.key
   where e.value::int > coalesce(col.copias, 0);
  if v_mal is not null then raise exception 'ese mazo no es tuyo: %', v_mal; end if;

  select coalesce(sum(e.value::int), 0) into v_total from jsonb_each_text(p_cartas) e;
  if v_total <> v_tam then
    raise exception 'un mazo son % cartas exactas y ése lleva %', v_tam, v_total;
  end if;
end;
$$;

-- Una función recreada nace con execute para PUBLIC, y anon es miembro.
revoke all on function private.validar_mazo(uuid, jsonb) from public, anon, authenticated;

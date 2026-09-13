-- DinoWar — la Pradera de helechos y el mazo de 55.
--
-- Esta migración NO crea la carta: eso lo hace 0006_catalogo_cartas.sql, que se
-- regenera desde el código y ya la trae con su tope de 7 copias y el tamaño de
-- mazo en 55. Los dos ficheros van juntos y en ese orden: primero 0006, que
-- mete la carta en el catálogo, y luego éste, que reparte.
--
-- Lo que hace éste es lo que un generador no puede hacer: arreglar a los
-- jugadores que YA existen.
--
-- El problema, dicho sin adornos. `catalogo_inicial` es la colección con la que
-- ARRANCA una cuenta nueva, así que quien se registre a partir de ahora recibe
-- sus 7 Praderas y puede construir un mazo de 55 el primer minuto. Quien ya
-- tiene cuenta, no: su colección se sembró con las 50 de antes, no tiene
-- ninguna Pradera, y en el momento en que `tamano_mazo` pasa a 55 sus mazos
-- guardados dejan de ser legales y no puede ni arreglarlos, porque le faltan
-- cartas que no tiene forma de conseguir salvo comprando sobres.
--
-- Así que se le regalan las 7. No es generosidad: es que el cambio de tamaño se
-- lo impusimos nosotros y dejarle el problema sería cobrarle nuestro rediseño.

-- ------------------------------------------------------------------ reparto

-- `on conflict do nothing` y no `do update`: si alguien ya tiene Praderas
-- —porque le salieron en un sobre entre que se aplica 0006 y esto— no se le
-- pisan las que tenga. Y así la migración es repetible, que es la regla de la
-- casa: aplicarla dos veces tiene que dar lo mismo que aplicarla una.
insert into public.coleccion (jugador_id, card_id, copias)
select j.id, 'biomasa', 7
  from public.jugadores j
on conflict (jugador_id, card_id) do nothing;

-- ------------------------------------------------- los mazos que se quedaron
--
-- Los mazos guardados siguen sumando 50 y ahora un mazo son 55. NO se tocan
-- aquí, y es a propósito: completarlos por su dueño significa elegir qué cartas
-- lleva, y eso es justo la parte del juego que es suya. El editor ya dice
-- cuántas faltan y por qué, que para eso `validarMazo` devuelve los problemas
-- en vez de un booleano.
--
-- La factura, escrita para que no sorprenda a nadie: al aplicar esto, todo
-- jugador con un mazo guardado tiene que entrar al editor y añadir 5 cartas
-- antes de poder jugar otra partida. Con ocho jugadores y cinco mazos es un
-- rato. Con ochocientos no se haría, y por eso este cambio se hace ahora.

-- Cuántos quedan por arreglar. No falla si hay alguno: es un aviso para quien
-- aplica la migración, no una condición.
do $$
declare
  v_mazos int;
  v_tam   int;
begin
  select tamano_mazo into v_tam from public.catalogo_economia where id = 1;

  select count(*) into v_mazos
    from public.mazos m
   where (select coalesce(sum((e.value)::int), 0)
            from jsonb_each(m.cartas) e) <> v_tam;

  if v_mazos > 0 then
    raise notice 'Hay % mazos guardados que ya no suman % cartas. Sus dueños tienen que reeditarlos.', v_mazos, v_tam;
  end if;
end $$;

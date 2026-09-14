-- DinoWar — una sola palabra para el grupo: TRIBU.
--
-- El juego usaba las dos a la vez. En la misma pantalla convivían «todavía no
-- estás en ninguna TRIBU», «fundar la CUENCA» y «almacén de la TRIBU», y por
-- dentro mandaba tribu desde el principio: la tabla es `tribus` y las funciones
-- son `crear_tribu` y `mi_tribu`.
--
-- La cuenca es un SITIO y la tribu es la GENTE, y todo lo que hace el jugador
-- es sobre la gente: fundarla, entrar, salir, echar, mandar, buscarla en una
-- lista. Un sitio no se funda ni se abandona. Así que gana «tribu» en todo lo
-- que se lee, y «cuenca» se queda para el lugar —bajar a ella, lo que pasa en
-- ella, el jefe que hay en ella—.
--
-- Aquí sólo cambian MENSAJES: estos `raise exception` salen por pantalla tal
-- cual, así que son texto de interfaz aunque vivan en SQL. Ni una línea de
-- lógica se toca.
--
-- Y no se toca a mano: se coge la definición que hay puesta, se le cambia la
-- palabra y se vuelve a crear. Reescribir nueve funciones enteras para cambiar
-- una palabra es la forma segura de colar una errata en la que sí importa.
--
-- Las LLAVES no se tocan —`catalogo_cuenca` se protege antes del cambio—, por
-- lo mismo que los climas siguen teniendo el id `sabana` aunque la carta se
-- llame «Monzón de verano»: renombrar una llave es una migración de datos que
-- no cambia nada de lo que se ve. `estado_cuenca` y `avisos_cuenca` tampoco
-- aparecen aquí dentro, así que se quedan como están.
--
-- Aplicada en producción el 14-09-2026.
do $do$
declare
  f text;
  d text;
begin
  foreach f in array array[
    'crear_tribu(text)', 'entrar_en_tribu(text)', 'salir_de_tribu()',
    'expulsar(uuid)', 'ceder_mando(uuid)', 'unirse_a_tribu(uuid)',
    'solicitar_entrada(uuid)', 'responder_solicitud(uuid,boolean)',
    'deshacer_tribu()'
  ]
  loop
    d := pg_get_functiondef(('public.' || f)::regprocedure);
    -- La única llave con «cuenca» dentro de estos nueve cuerpos.
    d := replace(d, 'catalogo_cuenca', '@@CATALOGO@@');
    d := replace(replace(d, 'Cuencas', 'Tribus'), 'cuencas', 'tribus');
    d := replace(replace(d, 'Cuenca', 'Tribu'), 'cuenca', 'tribu');
    d := replace(d, '@@CATALOGO@@', 'catalogo_cuenca');
    execute d;
  end loop;
end
$do$;

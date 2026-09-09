# CLAUDE.md — notas para desarrollo asistido

Guía para que cualquiera —persona o asistente— pueda tocar DinoWar sin romper lo
que ya está resuelto. No repite lo que cuenta el [README](README.md): esto es lo
que se aprende chocándose.

## Verificar un cambio

```bash
npm test              # 138 tests. Es la verificación canónica.
npm run sim           # 2.000 partidas IA vs IA → BALANCE.md
node sim/set.js       # regenera SET_DE_CARTAS.md desde el código
python -m http.server 8000
```

**No hay build step y no debe haberlo.** El juego se sirve tal cual: sin
frameworks, sin dependencias, sin CDNs. Eso no es una pose, es por qué arranca
en medio segundo, y es la razón de que el cliente de Supabase sean ochenta
líneas de `fetch` en vez de `supabase-js`.

## La frontera que sostiene todo lo demás

`src/engine/` y `src/data/` son **puros**: `(estado, acción) → estado`, sin DOM,
deterministas con la semilla. `test/pureza.test.js` falla si eso deja de ser
cierto.

No es higiene: es lo que permite que **el mismo motor corra en el navegador y en
el servidor**. La Edge Function que valida los asaltos importa `src/engine/` tal
cual. Si el motor deja de ser puro, la capa cooperativa deja de poder existir.

## Ficheros generados: regenerar y confiar en el test

Varias cosas del repositorio son copias de otras. Cada una tiene su herramienta
y **un test que falla si se queda atrás** — no hay que acordarse de nada, pero
hay que hacer caso cuando el test lo dice.

| Fichero | Se regenera con | Lo vigila |
|---|---|---|
| `SET_DE_CARTAS.md` | `node sim/set.js` | CI |
| `BALANCE.md` | `npm run sim` | — |
| `ECONOMIAS.md` | `node sim/economias.js` | — |
| `supabase/migrations/0004_catalogo.sql` | `node tools/generar-catalogo.mjs` | `test/catalogo.test.js` |
| `supabase/functions/asalto/paquete.ts` | `node tools/empaquetar-asalto.mjs` | `test/paquete.test.js` |
| El commit anclado en `desde-url.ts` | `node tools/anclar-desde-url.mjs` | `test/anclaje.test.js` |

## Variantes de economía

`BALANCE.economia.modo` se lee del entorno y **el juego publicado corre siempre
en FIJA**. Las otras dos existen para decidir con datos:

```bash
DINOWAR_ECONOMIA=TIPADA node sim/run.js
node sim/economias.js          # compara las tres sobre las mismas semillas
```

Lo medido está en `ECONOMIAS.md`: tipar la renta no devuelve la bola de nieve
(64,8 % → 65,0 %), pero la economía por cartas rompe el juego (21,8 turnos, cero
victorias por trofeos).

## La Cuenca: Supabase

Diseño completo en [PLAN_TRIBU.md](PLAN_TRIBU.md). Lo operativo:

- Proyecto `wufgtujktbcnwrvngsiy` (**Dinno War**, us-east-2), org aparte de
  PuduMaps a propósito: el auth es por proyecto y no conviene mezclar los
  jugadores anónimos del juego con los clientes de PuduMaps.
- La clave publicable está en `src/data/config.js` y **no es un secreto**: va en
  el navegador por diseño y la seguridad la dan las políticas, no ocultarla.
- Sin servidor o sin red, la Cuenca cae a `red-local.js` con compañeros
  simulados **y lo dice en pantalla**. Nunca fingir que hay tribu.
- El cliente NO escribe estado de juego. Ninguna tabla tiene política de
  escritura; todo pasa por funciones `SECURITY DEFINER` que sacan quién eres de
  `auth.uid()`, nunca de un parámetro.
- El daño a los jefes lo calcula el servidor **re-jugando la partida**. El
  cliente manda semilla, mazo y sus jugadas; lo que diga del resultado no se lee.

### Trampas que costaron una mañana

**El editor del panel viene con una plantilla «Hello World».** Si el pegado no
la reemplaza entera, se despliega la plantilla y todo parece correcto: arranca,
contesta 200, devuelve `{"message":"Hello undefined!"}`. Pasó cuatro veces.
Comprobar con `ezbr_sha256` en la lista de funciones: **cambia cuando cambia el
código**. Si repite entre dos despliegues, no entró.

**Desplegar por MCP, no por el panel.** `mcp__Supabase__deploy_edge_function`
sube el fichero directamente. Es la vía buena.

**Los importes por URL tienen que ser estáticos**, con la URL literal repetida
en cada línea. Con un import dinámico de ruta calculada, la ruta se resuelve en tiempo
de ejecución, el empaquetado no ve la dependencia y la función muere con
`Module not found` **aunque la URL conteste 200**.

**Probar la función sin navegador**: se invoca desde la propia base de datos con
la extensión `http` (ver `supabase/functions/README.md`). Hacen falta las dos
cabeceras, `apikey` y `Authorization`. Quitar la extensión después.

**El orden de las jugadas importa.** En el navegador juegas tu turno entero y
luego el rival; alternar los bandos cambia el resultado en 2 de cada 40
partidas. El validador del servidor tiene que reproducir ese orden o cobra un
daño que el jugador no vio.

## El service worker

**«Red primero» hay que escribirlo, no sólo decirlo.** `fetch(request)` pasa por
la caché HTTP del navegador, y Pages sirve con `max-age`: durante minutos «la
red» devuelve lo viejo. Va con `cache: 'no-cache'` —que significa «pregunta si
cambió», no «no guardes»— y lo vigila `test/sw.test.js`.

**Subir `VERSION` en `sw.js` al cambiar cualquier fichero servido.** Sin eso las
cachés viejas no se limpian.

En local no se reproduce ninguno de los dos problemas: `python -m http.server`
no manda `Cache-Control`. Por eso sobrevivieron tanto.

## Publicar

`main` es lo que sirve GitHub Pages: lo que se mergea sale en producción sin más
pasos. CI corre los tests en cada push y necesita `fetch-depth: 0`, porque
`test/anclaje.test.js` lee un commit anterior.

## Lo que NO cierra todavía

Dicho para que nadie lo descubra tarde:

- **La propiedad del mazo.** El servidor comprueba que tu mazo es legal —50
  cartas, copias por rareza— pero no que sea tuyo: la colección vive en tu
  `localStorage`. Cerrarlo es moverla al servidor.
- **CAPTCHA en el alta anónima.** El límite es de 30 por hora y por IP. Antes de
  abrirlo a desconocidos hay que activar Turnstile, o la tabla de usuarios es un
  blanco fácil.
- **Tres cartas mal calibradas** sobre un objetivo de cero (`BALANCE.md`), y 39
  de las 66 cartas del set fuera del mazo de referencia, o sea sin calibración
  comprobada.
- **Los proyectos gratuitos de Supabase se pausan a los 7 días sin actividad.**

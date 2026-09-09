# CLAUDE.md — notas para desarrollo asistido

Guía para que cualquiera —persona o asistente— pueda tocar DinoWar sin romper lo
que ya está resuelto. No repite lo que cuenta el [README](README.md): esto es lo
que se aprende chocándose.

## Verificar un cambio

```bash
npm test              # 158 tests. Es la verificación canónica.
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
| `supabase/migrations/0006_catalogo_cartas.sql` | `node tools/generar-cartas.mjs` | `test/cuentas.test.js` |
| `BALANCE.md` de la variante | `node sim/cuerpos.js` | — |
| El commit anclado en `desde-url.ts` | `node tools/anclar-desde-url.mjs` | `test/anclaje.test.js` |

## Windows

Dos cosas que sólo fallan aquí, ya arregladas, por si reaparecen:

- **Finales de línea.** Hay un `.gitattributes` con `eol=lf`. Sin él,
  `core.autocrlf=true` entrega los ficheros con CRLF y **tres de los guardianes
  de arriba fallan siempre**: comparan un fichero del disco contra algo generado
  en memoria o sacado con `git show`, y esos dos caminos no pasan por la
  conversión de git. En CI no se veía porque Linux hace checkout en LF. Un
  guardián que falla siempre es un guardián apagado.
- **Lanzar procesos.** `npx` no existe como ejecutable —es `npx.cmd`— y desde
  Node 20 un `.cmd` necesita `shell: true` o da EINVAL. Y el idiom
  ``import.meta.url === `file://${process.argv[1]}` `` no se cumple nunca,
  porque argv llega con barras invertidas: las herramientas corrían, no escribían
  nada y no se quejaban. Va con `pathToFileURL`.

## Una carta son DOS cifras: Ataque y Vida

La Defensa existió y se quitó. Era una **resta plana e invisible** contra un
número de la OTRA carta, con dos reglas encima que tampoco se deducían de la
pantalla —el suelo de daño y el bonus de depredación—. Medida **en victorias**
era además la que menos aportaba: +1 de Ataque a todas tus criaturas gana el
70,8 % de las partidas, +1 de Vida el 63,1 % y +1 de Defensa el 59,6 %, sobre un
control de 46,8 %.

Con ella se fue el **suelo de daño**, que sólo existía para que una Defensa alta
no hiciera inmune a nadie. Hoy el daño es el Ataque y ya.

Los cuatro rasgos y el clima que daban Defensa dan Vida: viven en `vidaMaxima()`,
que por eso es dinámica — un Muro de placas sin congénere pierde su Vida extra en
el acto y, si estaba herido, puede caerse ahí mismo. No es nuevo, el clima del
Canal ya lo hacía; ahora pasa más veces.

**Lo que costó, dicho sin adornos:** el balance pasó de cumplir 5 de 6 objetivos
a cumplir 4. La bola de nieve subió de 64,8 % a 69,8 % —la Defensa era una
mecánica de remontada: un muro aguantaba al fuerte porque el suelo dejaba su
golpe en 1— y las cartas descalibradas pasaron de 3 a 4. Eso pide un recoste, que
ahora por fin se puede hacer: lo que lo bloqueaba era creer que la Defensa valía
4× el Ataque.

### El daño sobrante

```bash
node sim/cuerpos.js 400           # con y sin, mismas semillas
DINOWAR_SOBRANTE=0 node sim/run.js
```

Lo que sobra al matar sigue al hábitat rival: si pegas 5 a algo con 3 de Vida,
pasan 2. Antes era privilegio del rasgo Depredador dominante. Cierra el último
agujero de legibilidad —ningún número desaparece— y sale casi gratis: deja el
reparto entre las tres vías MÁS parejo (40/32/28 frente a 47/24/30) y sube la
bola de nieve medio punto.

**Cuidado con `sim/cobertura.mjs` para decidir cifras.** Ajusta contra el índice
de DESPLIEGUE, o sea con qué frecuencia la IA saca una carta de la mano. Como la
IA valora cada unidad multiplicando por los turnos que espera aguantar
(`IA.horizonte`), el ajuste redescubre su propia preferencia por lo que resiste
y «demuestra» cosas que no son. Para saber lo que vale un punto hay que contar
partidas ganadas.

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

### La colección es del servidor

`coleccion`, `mazos` y las dinomonedas viven en la base de datos. Lo que hay en
`localStorage` es una **caché** de lo que dijo el servidor, y sigue siendo la
verdad sólo cuando se juega sin él. La costura es `src/ui/perfil.js`, hermana de
`red.js`: se lee de la caché de forma síncrona —los repintados de `meta.js` lo
necesitan— y se escribe siempre contra el servidor.

Las tres cosas que dan cartas o monedas pasan por la Edge Function, que despacha
por `tipo`: `asalto`, `victoria` y `sobre`. Es UNA función y no tres a propósito:
cada una traería su empaquetado, su anclaje y su despliegue, que son los tres
sitios donde este proyecto ya se ha equivocado.

Y las tres cierran la misma puerta desde ángulos distintos. **No basta con
validar el mazo:** si las 50 dinomonedas de una victoria se acuñan diciendo «he
ganado», con ellas se compran sobres y las cartas que salen son legítimas. Por
eso la victoria contra la IA también se re-juega, y el sobre lo sortea el
servidor con el mismo `abrirSobre()` del navegador.

La comprobación de que un mazo es TUYO tiene una sola implementación,
`private.validar_mazo`, y se llama desde `guardar_mazo` y —vía
`public.validar_mazo_de`, que existe sólo porque el esquema `private` no se
publica— desde la Edge Function.

### Cuentas: son obligatorias

`src/ui/entrada.js` es la puerta y es lo primero que se pinta. Sin sesión de una
cuenta con correo no se enseña ni el menú. **No hay sesión anónima ni perfil
local**: `sesionValida()` ya no abre una sesión por su cuenta y `sincronizar()`
ya no se cae a local, porque un perfil local sería inventarse una colección que
el servidor no ha visto —el menú enseñaría cartas que no tienes y el primer mazo
que guardases sería rechazado—.

La factura, dicha aquí para que no sorprenda: **sin conexión no se juega**.
Antes el juego arrancaba siempre. Fue una decisión del autor, no un descuido.

El nombre de jugador es único y se cambia **una sola vez**. El que se elige al
crear la cuenta no gasta el cambio: lo pone `entrar()` en el insert de la fila,
que no pasa por `cambiar_apodo`. Es lo que va a salir en una tabla de ELO, y un
nombre que se cambia a voluntad no identifica a nadie.

El alta son DOS pasos —crear el usuario de auth y crear su fila de jugador— y si
el segundo falla el primero ya está hecho. Por eso un «User already registered»
en la pestaña de crear cuenta NO es el final: se entra con ese correo y se sigue.
Pasó de verdad y dejaba la cuenta inservible.

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

- **CAPTCHA en el alta anónima.** El límite es de 30 por hora y por IP. Antes de
  abrirlo a desconocidos hay que activar Turnstile, o la tabla de usuarios es un
  blanco fácil.
- **La confirmación por correo está desactivada.** Se puede crear una cuenta con
  un correo que no es tuyo. Para activarla hace falta un SMTP propio: el
  integrado de Supabase manda 2 correos a la hora y sólo a direcciones del
  equipo.
- **El ELO no lo mueve nadie.** La columna existe en `jugadores` y las partidas
  se registran, pero no hay PvP todavía.
- **Tres cartas mal calibradas** sobre un objetivo de cero (`BALANCE.md`), y 39
  de las 66 cartas del set fuera del mazo de referencia, o sea sin calibración
  comprobada.
El proyecto es **de pago** (plan Pro), así que no se pausa por inactividad.
Eso era cierto antes y ya no lo es.

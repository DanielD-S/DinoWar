# CLAUDE.md — notas para desarrollo asistido

Guía para que cualquiera —persona o asistente— pueda tocar DinoWar sin romper lo
que ya está resuelto. No repite lo que cuenta el [README](README.md): esto es lo
que se aprende chocándose.

## Verificar un cambio

```bash
npm test              # 181 tests. Es la verificación canónica.
npm run sim           # 2.000 partidas IA vs IA → BALANCE.md
node sim/set.js       # regenera SET_DE_CARTAS.md desde el código
node sim/carta.mjs X  # ¿está rota la carta X? 50 % da igual, 70 % rota
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
| `RECOSTE.md` y `RECOSTE.xlsx` | `node tools/tabla.mjs escribir`, `python tools/excel.py escribir` | `test/cuentas.test.js` |
| `tools/mecanicas.json` | `node tools/mecanicas.mjs` | — |
| `assets/fuentes/terralis.woff2` | `python tools/terralis.py` | — |
| `assets/sonidos/*.m4a` | `python tools/sonidos.py escribir` | — |
| `assets/video/*.mp4` | `python tools/videos.py escribir` | — |
| El commit anclado en `desde-url.ts` | `node tools/anclar-desde-url.mjs` | `test/anclaje.test.js` |
| `assets/piel/efectos/*.webp` | `python tools/efectos.py escribir` | `test/efectos.test.js` |
| `assets/piel/mazos/*.webp` y la ventana de `.mazo-ventana` | `python tools/mazos.py escribir` | — |
| `assets/piel/cuenca/*.webp` y los huecos de `.cu-vitrina` | `python tools/cuenca.py escribir` | — |

Y las migraciones **no las aplica nadie solo**: `supabase/migrations/` es el
registro de lo que la base de datos DEBERÍA tener, no de lo que tiene.

**El anclaje hay que rehacerlo cuando cambia el MOTOR, no sólo los validadores.**
La función re-juega tus partidas con el código del commit anclado; si el
navegador estrena reglas y el anclaje se queda atrás, el servidor reproduce otra
partida y la rechaza. Pasó al quitar la Defensa: cuatro de cada cuatro partidas
respondían «jugada ilegal», ninguna victoria pagaba, y `npm test` estaba en
verde porque `VIGILADOS` era una lista a mano de cinco ficheros y el motor no
estaba en ella. Ahora sale de lo que esbuild dice que entra en el paquete —16
ficheros— así que añadir un import extiende la vigilancia solo.

Y después de re-anclar hay que **volver a desplegar**: el anclaje en el
repositorio no mueve nada por sí solo.

**Y no se despliega anclado a un commit de RAMA.** jsDelivr sirve cualquier
commit del repositorio, también uno que sólo existe en una rama, así que anclar
a mitad de trabajo funciona y parece correcto. Lo que pasa después es que la
rama se mergea con squash y se borra: el commit se queda sin nada que lo
referencie, GitHub acaba recogiéndolo, la URL empieza a dar 404 y caen las tres
cosas A LA VEZ —victorias, asaltos y sobres— porque la función muere al
importar, antes de mirar el `tipo`. El orden es: mergear, volver a anclar sobre
main, y desplegar entonces. `node tools/anclar-desde-url.mjs` lo avisa por
pantalla cuando el commit no está en main.

## Los cinco simuladores, y qué NO ve cada uno

Es el error que más veces se ha repetido: cambiar una carta, correr `npm run sim`,
ver los seis números idénticos y creer que el cambio no hace nada.

| herramienta | qué juega | punto ciego |
|---|---|---|
| `npm run sim` | el mazo de REFERENCIA, 32 entradas | las 69 cartas que no están en él. La Llanura se rediseñó dos veces y `BALANCE.md` no se movió un decimal |
| `node sim/carta.mjs <id>` | el mazo de referencia CON esa carta contra el mismo SIN ella | una carta sola: no dice nada de sinergias entre dos nuevas |
| `node sim/cobertura.mjs` | mazos aleatorios de todo el set | su ajuste filtra a CRIATURAS: ningún clima ni evento aparece |
| `node sim/climas.js` | fuerza cada clima al campo | no dice si la carta es buena, sólo qué le hace al juego mientras está puesta |
| `node sim/entradas.js` | un mazo cargado de disparos al entrar | es la COTA, no el balance: el mazo está sesgado a propósito |

**`sim/carta.mjs` es el que responde a «¿esta carta está rota?»**, que es la única
pregunta que se hace al escribir una carta y la que ninguno de los otros cuatro
contestaba. Juega el mazo de referencia con la carta contra el mismo mazo sin
ella, mismas semillas y bandos alternados —el primer jugador gana el 46 %, así
que sin alternar media diferencia se le cuelga a la carta—. Se lee solo: 50 % da
igual, 55 % buena, 60 % fuerte, 70 % rota.

Un 50,0 % clavado quiere decir que la carta YA estaba en el mazo de referencia al
máximo de copias, así que comparó un mazo consigo mismo. No es un empate: es que
no has medido nada.

Y el aviso que se ganó a pulso: **el ajuste de `cobertura.mjs` mide DESPLIEGUES,
no victorias.** La IA valora cada unidad multiplicando por los turnos que espera
que aguante, así que redescubre su propia preferencia por lo que resiste. De ahí
salió el «la Defensa vale 4 veces el Ataque» que bloqueó el recoste durante días.
Para saber lo que vale un punto hay que contar partidas ganadas.

## Las habilidades son DATOS, no ramas

Hay dos sistemas de mecánica y la frontera no es un accidente.

Las **17 cartas de soporte** llevan la suya en `rasgo`, un valor del enum de
`cards.js`, con su constante en `BALANCE` y su caso en el motor. Son diecisiete
reglas y ninguna se parece a otra: un caso por carta es lo honesto.

Las **50 criaturas** llevan la suya en `mecanica`, un objeto de datos descrito en
[`src/data/mecanicas.js`](src/data/mecanicas.js). Son cincuenta habilidades pero
diez FORMAS: contadores, auras de clado, condicionales, inmunidades, espinas,
coste añadido, búsquedas y disparos al entrar. Escritas como cincuenta ramas de
`if` dentro de `ataqueEfectivo()` no habría quien las leyera, y `efectosDe()` —la
función que le explica al jugador por qué su carta no marca lo que trae impresa—
habría necesitado otras cincuenta.

Los campos se acumulan: una carta puede llevar `aura` y `entrada` a la vez, y
`entrada` es un saco de efectos porque Spinosaurus muele los dos mazos de una
sola llegada.

**Poner una carta nueva es escribir un objeto en `cards.js`.** Sólo se toca el
motor cuando hace falta una FORMA que no existe, y entonces hay que tocar cuatro
sitios: aplicarla (`state.js` o `entradas.js`), enseñarla (`efectosDe`), tasarla
(`ai.js` / `valorDeEntrada`) y nombrarla en la lista de `test/entradas.test.js`.

Y la trampa de este diseño, que ya tiene guardián: **un campo mal escrito produce
una carta que se juega, se paga y no hace nada.** `entrda: { roba: 1 }` no es un
error de sintaxis. Lo caza `test/entradas.test.js` comparando los campos de cada
carta contra el vocabulario, y `test/textos.test.js` comprueba además que todo
número de la mecánica aparezca en el texto de la carta.

**Toda entrada nueva necesita su peso en `BALANCE.valorEntrada`.** Sin él la IA la
ignora y la carta no se juega nunca — le pasó a la Llanura, que midió cero usos
en 300 partidas hasta que se le puso valor.

Los disparos al entrar se resuelven en la fase de revelación, que es simultánea y
con orden determinista por tipo y luego por `iid`: sin ese orden, dos máquinas
re-jugando la misma partida llegarían a resultados distintos, y el servidor las
valida re-jugándolas. Por lo mismo **ninguno pregunta nada**: el objetivo de
Tijera sale de una regla fija —el de más Ataque entre los que caben— y no de una
elección, que en una fase simultánea habría que resolver a ciegas.

La **guardia** —`guardia: { habitat: n }`, hoy sólo el Barosaurus— resta a CADA
golpe que llegue a tu hábitat, no al total del turno. Está aplicada en las tres
ramas del combate: la ranura vacía, el sobrevuelo y el sobrante de matar. Son las
tres formas que tiene un dinosaurio de llegar al hábitat, y cada uno usa una sola
por turno, así que restar en las tres es restar una vez por atacante.

Tres decisiones que conviene conocer antes de discutirlas:

- **Un contador se cuenta a sí mismo.** Un Troodon solo ya está «en juego», así
  que suma uno. Lo dice su texto, que por eso termina en «este incluido».
- **La inmunidad a eventos cubre sólo los del RIVAL.** Literalmente taparía
  también las adaptaciones que le pone encima su dueño, y una carta que rechaza
  las buenas no está protegida: tiene un defecto.
- **Las búsquedas se eligen AL JUGAR la carta, no al revelarla.** El despliegue es
  a ciegas; parar la revelación para preguntar le diría al rival que has buscado
  algo.

## Las diez cartas de Biomasa son las tierras, y se autolimitan

Siete comunes que hacen lo mismo con otra ilustración, dos épicas de +2 y una
legendaria de +3, todas con el mismo marco y bajándose gratis una por turno.
Tres cosas medidas antes de escribirlas, para no volver a medirlas:

- **No hace falta un tope compartido entre las diez.** Se temió que sin él un
  mazo con veinte cartas de Biomasa reventara la economía. Al revés: doce en
  vez de siete gana el 44,8 % contra el mazo de referencia, catorce el 39,8 %.
  Desplazan criaturas. Un tope de familia habría pedido una regla nueva en el
  navegador Y en `private.validar_mazo`, y no la pide nadie.
- **La épica y la legendaria valen medio punto.** En vez de dos Praderas, la
  Vega gana el 50,0 %; en vez de una, el Manantial el 51,3 %. La Biomasa no es
  el cuello de botella del juego —lo es la mano— y moler no muerde con la
  extinción en el 0,3 %. Son rarezas de escasez, no de fuerza.
- **Los números van EN LA CARTA**, en `biomasa: { da, muele }`, como la
  `duracion` de la Sequía, porque desde que son diez ya no son una constante.
  `test/textos.test.js` los compara con el texto y `test/entradas.test.js`
  comprueba que ninguna se quedó sin ellos. En `BALANCE.biomasa` queda sólo
  `porTurno`.

Y la Pradera **conserva su `copiasMax: 7`** aunque sus seis gemelas vayan a 3
por rareza: es lo que da la colección de salida y lo que los ocho jugadores ya
tienen en producción. Bajarla a 3 dejaría a todos con cuatro copias sobrantes
y un mazo guardado ilegal.

## El Duelo: dos personas, una partida que lleva el servidor

Es la misma máquina que valida las partidas en solitario, con una diferencia
que lo cambia todo: el servidor no RE-JUEGA una partida terminada, la LLEVA
mientras se juega. Está en `supabase/functions/_compartido/duelo.js`, puro y
con la hora por parámetro, y lo prueba `test/duelo.test.js` con dos IAs
mandando jugadas de una en una. Cuatro decisiones que conviene conocer antes
de discutirlas:

- **No hay tiempo real, y no es una carencia.** El despliegue es simultáneo y
  a ciegas, así que lo único que hay que sincronizar es «los dos han pulsado
  Listo». Cada cliente pregunta cada `DUELO.sondeoMs` con el mismo `fetch` de
  todo lo demás. Sin websockets, sin librería, sin nada que se caiga al
  cambiar de red en el móvil. Si el juego crece, se cambia la tubería y el
  resto queda igual.
- **El cliente es SIEMPRE el jugador 0.** El tablero, el guión y el animador
  lo llevan escrito, y en un duelo la mitad de las veces eres el 1. Antes que
  enseñar al cliente a mirar desde el otro lado, `desdeMiLado()` le da la
  vuelta a la vista en el servidor: jugadores, ranuras, cada `jugador`,
  `dueno`, `bando`, `ganador` de cada evento, y los dos lados del CHOQUE. El
  servidor sigue sabiendo quién es quién y pone el bando en cada jugada que
  recibe: lo que diga el cliente en `accion.jugador` no se lee.
- **La vista esconde el orden del mazo propio y el rng.** Con la IA daba igual
  que tu mazo viajara en orden de robo; con una persona enfrente es saber qué
  viene. Va ordenado por iid —se ve qué queda, que hace falta para las
  búsquedas— y sin rng. Por eso el cliente aplica en local todas sus jugadas
  menos dos: cambiar la mano y reciclar barajan o roban, y ésas se mandan y se
  espera la respuesta.
- **Un PASO por fase automática.** Cuando los dos están listos, el servidor
  resuelve revelación, combate, chequeo y robo, y guarda el estado tras cada
  una con `eventosDesde`. El cliente anima con «antes» y «después», igual que
  su bucle contra la IA; sin los pasos sólo podría pintar el resultado de
  golpe. Se guardan los últimos `DUELO.pasosGuardados`, no todos.

Y las trampas de concurrencia, que son dos: **la escritura va con versión**
—leer, aplicar, escribir si la versión sigue siendo la leída, si no releer—,
que entre dos peticiones HTTP no se puede bloquear nada; y **emparejar y
cerrar son SQL** (`duelo_buscar` con `for update skip locked`, `duelo_cerrar`
con `for update`), que dos que buscan a la vez no pueden acabar en tres duelos
ni el ELO moverse dos veces.

El reloj lo lleva el servidor: quince minutos por bando y tres por decisión,
en `src/data/duelo.js`. No hay proceso que vigile relojes: el primero que
pregunte después del plazo se encuentra el duelo cerrado. El de la pantalla
sólo enseña lo que el servidor manda en cada respuesta.

**Las ligas son el ELO con nombre**, en `src/data/ligas.js`: Triásico, Jurásico
y Cretácico con tres divisiones cada uno, y Extinción arriba. El número no se
enseña nunca; la barra de 0 a 100 dentro de la división, sí. El ELO lo calcula
la Edge Function con `eloTras()` —el mismo fichero que pinta la liga— sobre el
ELO de CADA UNO AL EMPEZAR el duelo, guardado en la fila, y no sobre el de
ahora: otro duelo cerrado entre medias no debe contaminar éste.

## Las Expediciones: el solitario como un camino de rivales

«Fácil» y «Normal» llevaban el MISMO mazo, el de referencia; sólo cambiaba que
«Fácil» jugaba al azar. El solitario se sentía plano porque lo era. Ahora cada
formación geológica es un mapa con rivales en fila, cada uno con su mazo, y
ganar a uno abre el siguiente. Hoy hay uno, la Morrison, con ocho rivales, y
un visitante de otra era que rota cada semana.

Cuatro decisiones que conviene conocer antes de discutirlas:

- **El mazo del rival NUNCA viaja en la petición.** El navegador manda el id del
  nodo y el servidor busca su mazo y su perfil en `src/data/expediciones.js`.
  Si viajara el mazo, cualquiera jugaría contra cincuenta y cinco cartas
  elegidas para perder. Un id que no existe es una partida inválida, no una
  contra el mazo de referencia: `test/expediciones.test.js` lo vigila.
- **El orden del camino sale de medirlo**, con `node sim/expediciones.mjs`, que
  juega el mazo de referencia con la heurística contra cada rival. Se escribió a
  ojo y salió al revés en el medio: el rebaño de saurópodos, pensado cuarto,
  era más duro que el clan de Ceratosaurus. Y **jugar con cabeza apenas
  endurece un mazo flojo**: el muro de placas pasó del 99 % al 95 % al cambiar
  de la IA al azar a la heurística. La dificultad la da el mazo.
- **La primera victoria paga una vez, y sólo si el nodo anterior está vencido.**
  Jugar un nodo cerrado se puede —el navegador no lo ofrece, pero nada impide
  pedirlo—; cobrarlo, no. Lo decide `aplicar_expedicion` en SQL con la clave
  `id` para el camino e `id@semana` para el visitante, así el camino se cobra
  para siempre y el visitante una vez por semana con la misma tabla. Rejugar
  un nodo vencido paga lo de una victoria normal.
- **Los visitantes tienen que costar parecido.** Rotan por semana, y uno que se
  gana el 73 % y otro el 37 % hacen que una semana sea la de no jugar. Se
  ajustaron midiendo hasta rondar el 50 %.

El arte llega aparte (`tools/expediciones.py`, prompts en `PROMPTS.md`) y puede
no estar: el mapa es un degradado y los medallones son círculos de CSS
mientras tanto. El juego sabe qué piezas hay por `assets/piel/expediciones/indice.json`,
que escribe la herramienta, y **no pidiendo cada fichero**: una pieza que no
existe es un 404 en la consola, y ya hubo quejas con los vídeos.

Tres cosas que costaron al llegar el arte, por si vuelven:

- **El brillo del nodo abierto llegó como un aro rosa OPACO**, no como un halo
  semitransparente: el generador mezcló el dorado con el magenta y `keyear` lo
  daba por pieza. `limpiar_halo` lo quita por parecido al magenta —rojo y azul
  altos con el verde bajo, `min(r, b) − g`—, que no toca el oro, la piedra, el
  lacre ni la laca. El brillo lo pone el CSS con `drop-shadow`.
- **Y antes de escalar hay que sangrar el color**, con `sangrar_color` de
  `placas.py`: lo transparente seguía siendo magenta y `Image.resize` lo metía
  en el canto. Es la misma trampa de las placas del menú.
- **La cartela no es 2:3, es 768×1282.** Todo va colocado encima en porcentajes
  medidos y en posición absoluta; y el bloque de texto necesita `width: auto`,
  que la regla general le da 100 % y eso pesa más que `left` y `right`: el lema
  y el botón se salían por la derecha.

El botón de volver del mapa no lleva `data-volver`: `meta.js` ata todos los
`[data-volver]` al menú, y el mapa vuelve a la pantalla de jugar.

## Las dos cartas de jefe viven fuera del set

`CARTAS_DE_JEFE` no está en `CARTAS`, y eso las ha dejado fuera de todas las
listas por las que ha pasado el proyecto: no salen en `RECOSTE.md` ni en el Excel
—así que el autor no pudo diseñarlas cuando diseñó las otras cincuenta—, no las
recorría `test/entradas.test.js`, y sus ilustraciones llevaban meses en la carpeta
de originales sin publicarse porque se llamaban `Saurophaganax.PNG` en vez de
`jefe_saurophaganax`. Se quedaron planas y sin texto todo el aplanado.

Son las **únicas dos recompensas del juego cooperativo**. Al tocar cualquier cosa
que recorra el set, comprobar si hay que sumarles `CARTAS_DE_JEFE`.

## El guión: qué se ve cuando pasa cada cosa

El motor emite **treinta y un tipos de evento**. Durante mucho tiempo se
animaban CUATRO —choque, avance, golpe al hábitat y muerte— porque el animador
era una sucesión de `if` contra esos cuatro. Todo lo demás cambiaba el tablero de
golpe y salía como un renglón de texto.

Se notaba justo donde más duele: las once habilidades al entrar, la Tijera que se
lleva un dinosaurio del campo, el trío que se completa, las cartas que descartan
de tu mano. **Cada carta que se diseñaba nacía invisible**, y arreglarlo pedía
volver a tocar el animador.

Ahora [`src/ui/guion.js`](src/ui/guion.js) es una tabla: cada evento declara
cuánto ocupa, a qué suena y qué toca en el DOM. Añadir una carta pide, como
mucho, una entrada ahí.

- `guion.js` dice **QUÉ** se ve; `animate.js` sabe **CÓMO** tocarlo y lleva el
  ritmo. El guión recibe un `api` en vez de importar el DOM, igual que
  `alEntrar()` recibe sus ayudas en el motor. Sin esa costura, el guión acabaría
  siendo otro animador.
- Los gestos disponibles son deliberadamente pocos —`marcar`, `rotulo`,
  `anuncio`, `flota`, `enMazo`, `enMano`, `enHabitat`—. Si una carta pide algo
  que no está, es que hace falta un gesto nuevo, y un gesto nuevo se piensa una
  vez y lo reutilizan todas.
- **Ninguno cambia el tamaño de una carta.** El tablero es una rejilla y una
  carta que crece de verdad empuja a las de al lado a media animación. Se pinta
  en `box-shadow`, `filter` y pseudoelementos.
- El COMBATE sigue en `animarCombate`: recorre ranura a ranura y necesita su
  propio ritmo. Meterlo en la tabla la habría convertido en un caso especial con
  forma de tabla.

`test/guion.test.js` obliga a DECIDIR: todo evento del motor o tiene compás o
está en `CALLADOS` con su motivo escrito. La primera vez que se corrió encontró
uno sin decidir. Y ningún compás puede pasar de 600 ms: con el campo lleno se
disparan diez habilidades, y a medio segundo cada una eso deja de ser ritmo y
pasa a ser una espera.

## Los marcos de carta: la geometría la decide el PNG

Ocho marcos en `assets/marcos/`: cinco de criatura —cuatro rarezas y el jefe,
misma geometría, distinto material— y uno por familia de soporte, sin rareza.
Los originales son PNG de 1024×1536 con los huecos en magenta `#FF00FF`, fuera
del repositorio; `python tools/marcos.py escribir` los keyea a WebP y **mide
los huecos**, y esos números son los que van en `carta.css`. No se estiman.

Una criatura lleva el GÉNERO en la banda de arriba y el nombre de la HABILIDAD
en la caja; el binomial entero se lee en el visor. Se llegó ahí midiendo: el
binomial en una línea son 28 letras en 58 px, y no cabe en ninguna banda de
ningún marco a 83 px de carta. Las de soporte no llevan banda porque su nombre
y su habilidad son el mismo, así que la caja lleva el nombre.

La misma carta se pinta en cinco tamaños —tablero, mano, colección, sobre y
visor— y todas pasan por `cartaHTML()` o `nodoCarta()`. No hay otra
composición: la colección y el sobre pintan el binomial entero en un pie
debajo de la carta, y el visor mete el texto de la habilidad en la caja, que a
268 px es el único sitio donde cabe.

Al pedir un marco nuevo al generador, dos cosas que costaron cuatro intentos:
pide los huecos en porcentaje del alto y aun así entrega la mitad —una banda
del 11 % salió del 5 %, luego del 7 %—, y cada edición mueve alguna otra pieza
medio punto. Se genera el común, se mide, y sólo cuando convence se hacen las
rarezas con ese PNG como referencia y el material como único cambio.
`test/marcos.test.js` vigila que cada clase que emite `claseMarco()` tenga
fichero y que ningún WebP sobre.

Las piezas del menú —la barra de «Empezar partida» y las cinco placas— y el
sobre y el dorso son del mismo generador y el mismo material, pero no llegaron
en magenta: `python tools/placas.py escribir` las keyea por inundación desde el
borde, tomando como fondo lo que se parece al color de las esquinas y está
conectado con el borde. Lo de dentro del marco de latón nunca se toca. Con
fondo oscuro la tolerancia va corta: con 28 la inundación se colaba por el
hueco entre los dos filetes y vaciaba el centro de la barra.

### Lo primero que se ve: la marca, y luego la carga

Dos pantallas antes del juego, en `src/ui/carga.js`, y cada una tapa un hueco
distinto.

**La marca de la casa** (`#marca`) es la única sección que NO nace en
`oculta`. Tiene que pintarse antes de que llegue el JavaScript, que es un
módulo y viene después; con todo oculto lo que había era un rectángulo negro
la primera fracción de segundo. Dura dos segundos y medio y se va con un
fundido; con `prefers-reduced-motion`, menos y sin fundido. **El reloj arranca
cuando la imagen está descargada**, no cuando la página empieza a pedirla: en
la primera visita el logo baja por la red y, contando desde el arranque, la
mitad del tiempo se iba en pantalla vacía. Con tope, para que una imagen que
no llega no deje la marca colgada.

**La carga** (`#carga`) va mientras el servidor contesta. Antes, con la sesión
guardada, el arranque no enseñaba nada: todas las pantallas nacen ocultas y el
menú aparecía cuando terminaban las dos llamadas. Tres cosas que decidir antes
de discutirlas:

- **La barra avanza por HITOS reales, no con un temporizador.** Son tres: las
  piezas del menú descargadas, la cuenta presentada, el perfil traído. Una
  barra que sube sola mientras nada pasa es la clase de mentira que el resto
  del juego evita.
- **Y tiene un MÍNIMO de permanencia** (`CARGA.minimo`, 3,6 s). Con el servidor
  rápido los tres hitos caían en un segundo y la carga era un parpadeo. La
  forma honesta de alargarla no es inventar hitos, es RETRASAR el dibujo: cada
  hito tiene su momento debido dentro del mínimo y el oro se desliza hasta él.
  Lo dibujado nunca va por delante de lo hecho; sólo por detrás. Si el servidor
  tarda de verdad, el mínimo no manda.
- **El trabajo arranca enseguida y la carga se enseña cuando la marca se va.**
  Si se esperase a la marca para empezar, serían dos esperas puestas en fila.
  El `trabajo.catch(() => {})` de `presentarse` no traga el error: evita el
  aviso de rechazo sin dueño mientras la marca sigue en pantalla; el `await` de
  después lo recoge y vuelve a la puerta antes de relanzarlo.
- **El oro no crece: se DESPLAZA.** Un `width` que crece deja un corte vertical
  en la punta; desplazando el dibujo entero, la punta redondeada es siempre lo
  que avanza. `--p` va de 0 a 1 y lo escribe `carga.js` por cada hito.

La barra son tres dibujos sobre el mismo lienzo de 2172×724 —el marco con la
ranura vacía, el canal suelto y el relleno de oro al 62 %— y `tools/placas.py`
los compone en DOS (`componer_barra`): el marco con la textura del canal dentro
de la ranura, y el oro a la escala de la ranura y **tejido** en espejo hasta
cubrirla entera, que estirado 1,7× se le notan las grietas. La geometría de la
ranura la mide y la imprime; los cuatro porcentajes de `.carga-barra` son
esos, como los huecos de los marcos de carta.

Y una trampa de la limpieza de motas: **quedarse con la mancha mayor mutila un
texto.** Cada letra es una mancha, y del logo salió la «D» sola. Lo que separa
el dibujo de la basura no es ser el mayor, es no ser diminuto (`MOTA`, 64 px).

El escenario de la carga es el Cretácico —un mosasaurio, «82–66 Ma»— y no la
Morrison. Fue elección del autor con los assets que entregó; si el juego sigue
sin salir del Jurásico, es un anacronismo que conviene saber que está ahí.

### El menú manda a una pantalla de jugar, y esa pantalla tiene las misiones

El botón grande decía «Empezar partida» y empezaba una contra la IA. Ahora dice
**«Ir a jugar»** y abre `#jugar`, con su propia portada y tres placas: **En
solitario**, **Duelo** y **Misiones**.

Por qué se hizo: las misiones diarias nacieron dentro del menú, debajo de las
dinomonedas, y lo dejaron amontonado. El menú ya iba justo a 360×640 y tres
renglones más lo pasaron por 58 px — la línea de la cuenta se salía de la
pantalla. Sacarlas a su propia pantalla devuelve el menú a lo que era y deja
sitio para lo que venga.

- **La placa del Duelo abre su panel**, como la de misiones, y las dos se
  excluyen: abrir una pliega la otra. Estuvo apagada con su «Pronto» hasta que
  el Duelo existió (ver «El Duelo», más abajo).
- **«En solitario» abre el mapa de la expedición**, no una partida. Los chips de
  «Fácil» y «Normal» se fueron con él: la dificultad la da el nodo del mapa
  (ver «Las Expediciones», más abajo).
- **El panel de misiones se abre y se cierra con su placa**, y nace cerrado cada
  visita: dejarlo abierto de la anterior hacía que la pantalla cambiara de alto
  sola entre una entrada y la siguiente.
- **El bloque va anclado abajo, no centrado.** Se probó centrarlo para repartir
  la banda oscura entre los pies del animal y la primera placa; abrió un
  socavón de 500 px debajo de «Volver». Esa banda es donde el velo se funde con
  el fondo, y las tres placas la llenan casi exactamente.
- **`montarTacto()` va en las DOS pantallas.** Estaba sólo en el menú y las tres
  placas nuevas nacieron mudas: sin toque, sin vibración y sin destello.

Las tres placas nuevas son **cuadradas** —las cinco del menú son verticales—
porque aquí son tres en la misma fila y les sobra ancho. Heredan del menú el
rótulo debajo de la piedra, el hundido y el destello: es la misma pieza con
otra proporción.

### Las piezas con alfa no se keyean

`tools/placas.py` tiene ahora tres caminos y la diferencia importa:

| grupo | qué llega | qué se le hace |
|---|---|---|
| `PIEZAS` | con fondo (damero, negro, marrón) | inundación desde el borde |
| `PIEZAS_CON_ALFA` | ya recortadas | quitarles las motas del canto |
| `FONDOS` | una foto a sangre | escalar y ya |

Pasarle una pieza con alfa al keyeado no da error: el primer píxel del borde ya
es transparente, la inundación no arranca y sale igual que entró.

Y una trampa que costó tres intentos: **`Image.resize` mezcla los canales de
color SIN mirar el alfa.** Las tres placas nuevas traen un filete ROJO pegado al
canto, invisible en el original porque su alfa es 0, y al escalarlas reaparecía
en píxeles que antes no existían — rojo puro asomando por el borde de una placa
de latón. Premultiplicar **no** lo arregla: al deshacerlo hay que dividir por el
alfa, y en un píxel de alfa 1 eso devuelve el rojo entero y amplificado (se
midió: 199 píxeles rojos donde había 20). Lo que sirve es **sangrar el color**
del canto hacia fuera antes de escalar, para que debajo de lo transparente esté
el color de al lado y no el rojo.

El menú **contesta al tacto** desde `src/ui/tacto.js` y el bloque «el menú
respira y contesta» de `style.css`: entrada escalonada cada vez que se enseña,
hundido seco al bajar el dedo y rebote al soltar, un destello que cruza el
latón, toque de sonido y vibración corta. Tres cosas que costaron:

- **La entrada va con `animation-fill-mode: backwards`, nunca `both`.** Las
  piezas ya usan `transform` para el `:active`; con `forwards` el `transform:
  none` del último fotograma se queda pegado y el botón deja de hundirse para
  siempre. Es la trampa de `transform` de siempre, por otra puerta.
- **El destello es un pseudoelemento enmascarado con el PNG de la pieza, y
  además con un rectángulo interior** (`mask-composite: intersect`). Sólo con
  el PNG la banda se veía flotar por encima del medallón: las piezas traen un
  halo casi transparente alrededor y la máscara por alfa lo deja pasar.
- **El sonido va en `click`, no en `pointerdown`.** Bajar el dedo no cuenta
  como gesto para el navegador; un AudioContext creado ahí nace suspendido y
  el toque suena tarde, cuando el siguiente gesto lo despierta.

Y un fallo que estaba antes: el `:active` de `.boton-grande` escribe el
shorthand `background`, que borraba la imagen de la barra al pulsarla. Ahora
`.boton-piedra:active` la repite.

## La música: cuatro pistas y dos capas

Los originales llegan en WAV a `src/sonidos/` —fuera del repositorio, como los
PNG— y `python tools/sonidos.py escribir` los deja en `assets/sonidos/` como
AAC en M4A. **No es Opus porque Safari en iPhone no lo decodifica por Web
Audio**, y la música se sirve por `decodeAudioData` y no por `<audio>`: el
elemento deja un hueco audible en cada vuelta del bucle y el buffer no. Hace
falta ffmpeg en el PATH (`scoop install ffmpeg`).

**Reemplazar una pista con el mismo nombre pide subir `VERSION` en `sw.js`.**
`assets/sonidos/` va de caché primero, como las ilustraciones, y ahí la regla
es que lo nuevo trae nombre nuevo. La segunda música del menú se regeneró,
se recargó y el navegador siguió tocando la primera: 28 s en vez de 118.

La herramienta decodifica lo que le llegue —la segunda música del menú vino
como M4A con extensión `.wav`— y no mira la extensión.

**Tres de las cuatro primeras pistas llegaron con corte en el bucle** aunque
se pidieron «seamless loop». La herramienta lo mide —el salto de la costura
contra el salto típico entre muestras: ×1 o ×2 limpio, ×20 o más corte— y lo
arregla fundiendo los tres últimos segundos sobre los tres primeros. Y antes
de coser **quita los fundidos de entrada y salida** que el generador mete
aunque se le prohíban: la segunda música del menú traía 4 s de subida y 10 de
bajada, y el bucle pasaba seis segundos casi en silencio en cada vuelta. Se
corta lo que queda por debajo del 60 % de la sonoridad típica en cada
extremo, y la herramienta imprime cuánto quitó y cuánto se hunde el volumen
en la costura: ×1 no se nota, ×0,5 es un respiro, ×0,1 es un agujero. La
pista servida queda más corta que el original; contar con ello.

En `audio.js` hay una pista por pantalla, la que pone `irA()` desde la tabla
`MUSICA_DE` de `main.js`. Las pantallas de colección, sobres, mazos y cuenta
llevan la del menú: cambiar de pista a cada placa sonaría a zapping. El final
de partida va en silencio, que ahí suena el remate. **El sobre tuvo música
propia y se quitó**: al autor no le gustó. Y la primera versión tenía un fallo
que conviene recordar si vuelve: la pista se quitaba al terminar la ceremonia,
y salir con «‹ Menú» a medias dejaba la promesa sin resolver y la música del
sobre puesta para siempre.

**La música del menú empieza cuando la marca EMPIEZA a irse**, no cuando ya
se fue: `mostrarMarca()` recibe un `alIrse` que se dispara al poner `se-va`,
y la pista sube mientras el logo se disuelve. Para que llegue a tiempo se
precarga durante la marca (`precargarMusica`): son 1,6 MB y un cuarto de
segundo de decodificar, y sin eso entraba cuando el logo casi había
desaparecido. Medido: 20 ms después del fundido con precarga, 270 sin ella.
La carga o la puerta piden después la misma pista y `musica()` no la
reinicia. Todo esto llega sin ningún gesto, y sin gesto el navegador puede
negarse: el contexto se crea igual y, si nace suspendido, la pista queda
puesta y el primer `click` o `keydown` —dos escuchas de un solo uso sobre
`document`— lo despierta con ella sonando. Chrome lo deja sonar sin gesto en los sitios donde
ya has oído audio otras veces, así que a quien juega a menudo le suena desde
la carga y a quien entra por primera vez, desde el primer toque. `pointerdown`
no vale como gesto, por lo mismo que el toque de las placas suena en `click`.
Y con la pestaña escondida el contexto se suspende: `visibilitychange` llama
a `enSegundoPlano()`.

**El botón de silencio está en las cuatro pantallas donde suena algo**: la
puerta, el menú, la de jugar y la partida, todos con `data-mute` y la misma
preferencia. Estaba sólo en la partida, y con la música arrancando en la
carga eso obligaba a empezar una partida para callarla.

Los efectos siguen sintetizados con osciladores. El catálogo de lo que falta y
los prompts están en [assets/PROMPTS_SONIDO.md](assets/PROMPTS_SONIDO.md).

## Las legendarias traen vídeo

Una legendaria puede llevar un vídeo corto del animal, `assets/video/<id>.mp4`,
que la apertura del sobre enseña a pantalla entera antes de voltear la carta.
El original va a `src/video/` —fuera del repositorio— y `python tools/videos.py
escribir` lo deja en H.264 a 960 de ancho, sin audio, con `faststart` y sin
la marca de agua de Kling, que va anclada a la esquina en píxeles y la borra
`delogo` antes de escalar: el de Kling llegó a 14 MB y se sirve en 1,2. Si dura más de diez segundos se corta
por el PRINCIPIO, que el último fotograma es sobre el que aparece la carta.

**Para verlo sin esperar al servidor: `?ensayo=mosasaurus`.** Al entrar en
Sobres corre una ceremonia de mentira con esa carta en segundo lugar: no
cobra, no guarda y no toca la colección. Pasa por el mismo `celebrar()` que un
sobre de verdad, que una copia para pruebas se queda atrás sin que nadie lo
note.

No hay lista de qué legendarias tienen vídeo: la ceremonia pide el fichero por
el `id` y, si da error, voltea la carta como cualquier otra. Pero sólo lo pide
para las legendarias CON CRIATURA (`c.dino`): las de soporte —climas, eventos,
recursos, Biomasa— no llevan vídeo a propósito, que no hay animal que enseñar,
y pedirlo igual dejaba un 404 en la consola por cada Mortandad o Manantial que
salía en un sobre. Las nueve legendarias con criatura lo tienen todas. Hubo un
vídeo de relleno para las que no tenían el suyo y se quitó: el autor prefiere
que una legendaria sin vídeo salga sin vídeo.

`tools/videos.py` pasa el nombre a minúsculas y avisa si no es el `id` de
ninguna carta: los dos primeros lotes llegaron con `Tyrannotitan.mp4` y
`maiasaurua.mp4`, y un vídeo mal nombrado no falla, sólo no sale nunca. Los precarga al
empezar la ceremonia —rasgar y pasar cartas dan tiempo de sobra—. **La carta
sale cuando el jugador CIERRA el vídeo**, con un toque o con «Ver la carta»:
al acabar se queda en el último fotograma esperando, y quien no quiera verlo
entero toca antes. Mientras está puesto, la pila no acepta arrastres.

**En apaisado el plano cubre la pantalla; en vertical se ve ENTERO como
banda** y detrás el mismo vídeo ampliado, desenfocado y oscuro rellena arriba
y abajo, como en los reproductores. Se probó cubrir también en vertical y se
perdía todo lo que el animal hacía por los lados —al mosasaurio se le iba la
cabeza del cuadro—, y la banda sobre negro dejaba dos tercios del móvil
vacíos. El fondo es una segunda copia del vídeo que sólo se crea en vertical:
son dos decodificaciones a la vez y en un móvil viejo se notarían. Entra en
tres tiempos —fondo, plano acercándose, nombre— tras esperar
`ENTRADA_VIDEO` a que la carta anterior termine de irse, que si no aparecía
de golpe sobre una carta a medio vuelo.

**Las cartas de la pila esperan boca abajo.** Iban con la cara a la vista y la
legendaria asomaba detrás de la primera carta: el vídeo llegaba después de
que ya se hubiera visto. El dorso es un `::after` sobre cada carta que se
retira al revelarla.

**La capa se enseña con un reflujo forzado, no con `requestAnimationFrame`**:
con la pestaña en segundo plano el fotograma no llega y la capa se quedaba
invisible con el vídeo corriendo debajo. Y los prompts del vídeo, con la
anatomía que separa a cada animal de su pariente moderno —sin nombre, un
mosasaurio se vuelve tiburón a mitad de plano—, están en
[assets/PROMPTS_VIDEO.md](assets/PROMPTS_VIDEO.md).

## El sobre se abre con dos gestos

[`src/ui/apertura.js`](src/ui/apertura.js) es la ceremonia: rasgar la bolsa
arrastrando el dedo por la franja de arriba y deslizar cada carta para
descubrir la siguiente. Sólo mueve DOM —las cinco cartas vienen sorteadas por
el servidor y pintadas por `cartaHTML()`— y devuelve una promesa que
`comprarSobre()` espera antes de pintar la rejilla de resumen. Un toque también
rasga y también pasa carta, porque el ratón no rasga bien; «ver las cinco» la
salta; y con `prefers-reduced-motion` no se enseña.

El sobre son dos capas con la misma imagen recortadas por el mismo zigzag, y
`--p` es cuánto se ha rasgado. La pila usa `--i` para el escalón y
`--dx`/`--dy`/`--giro` para seguir al dedo. Nada cambia de tamaño: todo es
`transform`, `clip-path` y `opacity`, por lo mismo que en el tablero.

**La escena de la pila mide 82/112, la proporción de la CARTA, no 2/3.** Cada
carta de la pila ocupa la escena entera y su dorso también; con la escena a
2/3 —la del PNG del sobre— la carta dejaba libre el 9 % de abajo y por ahí
asomaba el dorso de la siguiente como una banda de latón bajo la carta ya
descubierta. El sobre se pinta a `100% 100%` y se estira ese mismo 9 %, igual
que los marcos y el dorso en el resto del juego.

## Los efectos del tablero: hojas, mezclas y fantasmas

[`src/ui/efectos.js`](src/ui/efectos.js) es la caja de herramientas del peso:
el hit-stop, la mesa que tiembla, los flipbooks, las chispas, los vuelos y la
invocación de las legendarias. `animate.js` la usa desde `animarCombate` y
`animarRevelacion`; `render.js` sólo para hacer volar las cartas que llegan a
la mano. La hoja es `efectos.css`, aparte de `piel.css` porque la piel pinta y
esto se mueve.

Tres decisiones que conviene conocer antes de tocarlo:

- **Los efectos no se keyean.** Los de luz llegan sobre negro y se pintan con
  `mix-blend-mode: screen`; los que ensucian —grietas, polvo— sobre blanco y
  con `multiply`. Y por eso **cuelgan del campo directamente, no de una capa**:
  una capa con `z-index` es un contexto de apilamiento, la mezcla se haría
  contra su fondo transparente y cada chispa saldría con su cuadrado negro. Se
  comprobó en el banco: con `normal` en vez de `screen` el choque es un
  cuadrado negro con una explosión dentro.
- **Los flipbooks son hojas de 4×4** que el CSS recorre con `steps()` en dos
  ejes: columnas cuatro veces, filas una. Se pidió una y el generador entregó
  siete, todas alineadas: `tools/efectos.py` mide la deriva del centro de masa
  de cada celda y avisa por encima del 8 %. La chispa pasa y da igual: es una
  partícula y viaja mientras cambia de fotograma.
- **Una carta que viaja no se mueve: se clona.** El fantasma vuela por encima
  de todo con su propio `transform` y la de verdad espera invisible en su
  sitio. Así el vuelo no compone con `aterrizar`, `voltear` ni la inclinación
  de la mano, y no lo recorta el `overflow` de la mano. Las del rival llegan
  boca abajo desde su pila y se voltean al aterrizar; las robadas salen de tu
  mazo; una retirada vuelve desde su ranura, porque `render.js` apunta de dónde
  se fue antes de vaciar la ranura.

El hit-stop son 80 ms con `animation-play-state: paused` en toda la partida y
el destello como única excepción: la sacudida y el flipbook arrancan al soltar.
Y la invocación **retiene** la carta en su ranura —`.retenida`— mientras dura la
ceremonia, y `revelarRetenida()` la voltea al terminar rearmando `.entra`, que
corrió mientras estaba invisible.

**El clima pinta el tablero** con dos capas fijas dentro del campo —`.clima-capa
a` y `b`— y `render.js` escribe `data-clima` con el id de la carta puesta;
`efectos.css` decide qué va en cada capa por clima. Las texturas son mosaicos
que `tools/efectos.py` cierra en bucle: llegaron con costura aunque se
pidieron sin ella, y el cierre por desplazamiento y fundido vale para lo
estocástico —lluvia, niebla, agua— y no valdría para un dibujo. El agua sólo se
cierra en horizontal porque trae el horizonte arriba.

Para verlo sin jugar: `_banco_efectos.html` en la raíz —fuera del repositorio—
enseña el tablero con los botones de cada efecto. Con `prefers-reduced-motion`
no se crea nada de lo que se mueve; las hojas sí.

## El final: rótulo sobre el tablero y cara a cara

[`src/ui/fin.js`](src/ui/fin.js). Al acabar, un estandarte con VICTORIA o
DERROTA cae sobre el tablero congelado (`ROTULO`, 1,9 s, se salta con un toque)
y luego la pantalla de fin enseña el marcador: los dos bandos con nombre y
emblema de mazo, trofeos y hábitat en rombos, el sello sobre el mazo que ganó
y el del que perdió rasgado.

- **Nada espera al rótulo.** `alFinal()` en `main.js` sólo retrasa el cambio
  de pantalla; pintar, cobrar y anotar siguen en el acto, sobre la pantalla
  aún oculta. Mientras está puesto la app va en RESOLVING y la música se
  calla. `finVigente` impide que un final viejo se lleve una partida nueva.
- **El rival se apunta al EMPEZAR** (`rivalDePartida`): al terminar el
  asalto ya soltó a su jefe y el duelo ya es null. El mazo de un duelo es
  secreto, así que ese rival sale sin emblema.
- **El arte llega después del código** y el CSS tiene dos pieles. El
  interruptor es `ARTE_LISTO`, no una precarga que pruebe qué ficheros
  contestan —dejaría ocho 404 por partida—, y `test/fin.test.js` obliga a
  encenderlo cuando están las ocho piezas y a apagarlo si falta una.

## Los mazos: placas, rejilla y una portada que se calcula

[`src/ui/mazos.js`](src/ui/mazos.js) es la lista y el editor, fuera de
`meta.js` desde que tienen piel. Las trece piezas —placa, sello, siete
medallones de clado, tres de tipo y el fondo— llegan en magenta a
`src/piel/mazos/` y `python tools/mazos.py escribir` las keyea con la función
de los marcos y **mide la ventana de la portada** en porcentaje de la placa:
esos números son los de `.mazo-ventana` en `style.css`. La placa se pinta a
`100% 100%` sobre una caja con su misma proporción y no en nueve tajadas,
porque un `border-image` estiraría la ventana con la banda.

Tres decisiones que no se ven en el código a la primera:

- **La portada se calcula**: la criatura de más rareza del mazo, y a igual
  rareza la más cara. Elegirla a mano pide guardar un id más por mazo, y
  `guardar_mazo` sólo acepta el mapa de cartas —el servidor lo valida clave a
  clave—. El día que se quiera es una columna en `mazos`, no un truco en el
  jsonb.
- **El emblema es el clado dominante** contado sobre las criaturas; un mazo
  sin criaturas lleva el tipo de soporte que más repite. `autocompletar()`
  rellena por ese clado primero, luego el resto de criaturas y luego el
  soporte, de barato a caro.
- **Borrar pide confirmación en la propia fila** y no se puede borrar el
  último mazo: un jugador sin mazo no puede jugar. `borrarMazo()` existía en
  `perfil.js` desde las cuentas y no tenía botón.
- **La ficha abierta desde una LISTA se recorre sin cerrarla**: botones ‹ ›
  pegados arriba con «3 / 32», deslizamiento horizontal y flechas del teclado.
  Leer una carta era abrir, leer, cerrar y buscar la siguiente, y armando un
  mazo eso son sesenta y ocho viajes. La lista se lee del DOM al abrir —lo que
  se ve, con su pestaña y sus filtros— y no del catálogo: pasar tiene que
  llevar a la carta de al lado, no a una que el filtro esconde. No da la
  vuelta: la primera y la última son el principio y el final de lo que hay en
  pantalla. La ficha del TABLERO no lleva recorrido, que ahí una carta es una
  copia concreta con su Vida y sus adherencias, no una entrada de una lista.
- **En el editor la carta se LEE con una pulsación larga**, no con un toque: el
  toque corto ya está cogido —mete una copia— y en la carta a tamaño de rejilla
  sólo cabe el NOMBRE de la habilidad, «Tijera», no lo que hace. Es el mismo
  gesto y los mismos 400 ms del tablero (`input.js`), abre la misma ficha que
  la colección, y se cancela al desplazarse 8 px para no robarle el scroll a la
  rejilla. El click que llega al soltar se descarta POR RELOJ y no por bandera:
  al abrirse la ficha el dedo se levanta encima de la hoja, así que ese click
  puede no llegar nunca al editor y una bandera se quedaría puesta, comiéndose
  el siguiente toque de verdad. La «i» del nombre es la seña de que ahí se lee,
  y el camino del ratón, que no tiene gesto largo. Y el menú de imagen de
  Android —que sale a los 500 ms— caía encima de la ficha recién abierta: una
  carta es una pieza del juego, así que `main.js` frena el `contextmenu` sobre
  `.carta`. El `-webkit-touch-callout` del CSS no basta, que Chrome en Android
  no lo entiende; para guardar la ilustración está el visor.

En el editor la curva de coste es un filtro —cada barra un botón— y la
búsqueda repinta al escribir devolviendo el foco con el cursor al final, que
sin eso cada letra cerraba el teclado del móvil. Para verlo sin cuenta:
`_banco_mazos.html`, fuera del repositorio, siembra un perfil en la caché.

## La Cuenca: vitrina, yacimiento y bandeja

**En pantalla el grupo se llama TRIBU, y «cuenca» es el sitio.** El juego usaba
las dos a la vez —«no estás en ninguna TRIBU», «fundar la CUENCA», «almacén de
la TRIBU»— y por dentro mandaba tribu desde el principio: la tabla es `tribus`.
La cuenca es un lugar y la tribu es la gente, y todo lo que hace el jugador es
sobre la gente: fundarla, entrar, salir, echar, mandar, buscarla en una lista;
un sitio no se funda ni se abandona. Así que gana «tribu» en todo lo que se
lee, incluidos los `raise exception` del SQL, que salen por pantalla tal cual y
por eso son texto de interfaz. «Cuenca» se queda donde se habla del lugar:
«bajando a la cuenca», «en la cuenca ahora», «sin jefe en la cuenca».

Las LLAVES no se tocaron —`cuenca.js`, `CUENCA`, `estado_cuenca`,
`catalogo_cuenca`, `avisos_cuenca`, la pantalla `#cuenca`— por lo mismo que los
climas siguen teniendo el id `sabana` aunque la carta se llame «Monzón de
verano»: renombrar una llave es una migración de datos que no cambia nada de lo
que se ve. Y la migración que cambió los mensajes (`0018`) no reescribe las
nueve funciones a mano: coge la definición puesta con `pg_get_functiondef`, le
cambia la palabra y la vuelve a crear. Reescribir nueve cuerpos enteros para
cambiar una palabra es la forma segura de colar una errata en la que sí importa.

[`src/ui/cuenca.js`](src/ui/cuenca.js) pinta la capa cooperativa con piezas
que salen de `python tools/cuenca.py escribir` desde `src/piel/cuenca/`: el
jefe en una **vitrina** cuya ventana y cartela mide la herramienta —los números
de `.cu-vitrina-ventana` y `.cu-vitrina-cartela` son suyos—, el yacimiento en
**cuatro escenas** (una por cada dos niveles de los ocho), la **bandeja** de
fósiles que se destapa con `clip-path` según el depósito, y la Vida del jefe
con el canal y el relleno del hábitat, que ya existían.

Lo que cambia de flujo y no sólo de piel:

- **El asalto termina en un informe**, no en un renglón: `informeDeAsalto()`
  en `main.js` pinta la vitrina con la Vida que tenía el jefe al empezar y,
  cuando el servidor contesta, baja la barra hasta lo que queda. La
  transición es literalmente lo que le has quitado. `pintarFin()` lo vacía en
  las partidas normales.
- **El jefe pelea con el TRIPLE de hábitat** (`habitatDeAsalto()`, 210) y el
  marcador tiene que saberlo: el tope estaba fijo en `BALANCE.vidaHabitat`, así
  que el jefe se leía «210 / 70» y su barra salía al 300 % —llena y quieta
  hasta bajar de 70, o sea las dos terceras partes del asalto sin moverse—.
  `fijarTopesHabitat()` lo pone al empezar cada partida; el tope NO está en el
  estado del motor, igual que subirle el hábitat al jefe tampoco: es una
  decisión de la partida, no una regla nueva. El servidor usa el mismo
  `habitatDeAsalto()` al re-jugar (`validarAsalto.js`), así que los dos cuentan
  lo mismo.
- **«Otra partida» tras un asalto es otro ASALTO**, no una partida contra la
  IA. Caía en `nuevaPartida()` a secas y no se notaba hasta mirar el hábitat
  del rival —70 en vez de 210—: la misma pantalla, el mazo de referencia, y
  nada que se le restara al jefe. El duelo y la expedición ya tenían su caso;
  el asalto era el que faltaba. Si ya no se puede asaltar —almacén, tope del
  día, ventana cerrada— vuelve a la Cuenca, que lo dice con su motivo, y por
  eso `puedeAsaltar()` se comprueba dentro de `asaltoAlJefe()` y no sólo en el
  botón: ese botón ya no es el único camino.
- **Reclamar la carta de jefe la invoca** como a una legendaria: `invocar()`
  acepta ahora `raiz`, porque su raíz por defecto es la partida y la Cuenca
  es otra pantalla.
- **El código de la tribu se comparte** con `navigator.share` y cae al
  portapapeles; antes había que dictarlo.
- **Una tribu tiene capataz, y ahora se puede salir de ella.** Se llama
  capataz y no «jefe» porque un jefe aquí es el Saurophaganax. Manda quien la
  funda; puede echar a alguien o ceder el mando, y las dos cosas preguntan en
  la propia fila —no tienen deshacer—. Tres decisiones:
  - **Salir tenía que existir antes que la lista de tribus.** Sin ella, entrar
    en otra cuenca era pisar `tribu_id` y dejar la anterior huérfana sin
    decirlo; con una lista para explorar eso pasa de caso raro a camino normal.
    Por eso `crear_tribu` y `entrar_en_tribu` ahora RECHAZAN si ya tienes una.
  - **El relevo no es una decisión de nadie**: si el capataz se va, hereda
    quien lleva más tiempo. Una tribu sin capataz no podría aceptar ni echar a
    nadie. Y si se va el último, la tribu se BORRA con su almacén: una guarida
    vacía con fósiles dentro no es de nadie.
  - **Estando solo, el botón dice «Deshacer la cuenca»** y no «Salir». Es lo
    mismo —salir borra la tribu cuando se va el último— pero dicho con todas
    las letras. Va por su propia función, `deshacer_tribu`, y no por `salir`
    con otro rótulo: si alguien ha entrado por la lista entre que se pinta la
    pantalla y se pulsa, salir te sacaría a TI y le dejaría la cuenca a esa
    persona; ahí eso es un error con su motivo. No hay un «disolver» general:
    una tribu no es del capataz, es de quien está dentro, y el almacén lo
    llenaron entre todos.
  - **Hay lista de cuencas abiertas**, porque entrar era saberse seis letras que
    alguien te pasa por fuera del juego: quien llega solo no tiene a quién
    pedírselas, y una cuenca de una persona no tira un jefe de 6.000 de Vida.
    Se entra de dos formas y las dos siguen: el CÓDIGO es una invitación
    privada y entra aunque la cuenca esté cerrada —quien lo tiene es porque se
    lo dieron—, y la LISTA enseña las que tienen sitio, `libre` o `solicitud`.
    Sin tribu, la lista va ANTES del yacimiento: lo primero que se ve tiene que
    ser gente. La lista devuelve lo justo para decidir —nombre, emblema, cuánta
    gente, cómo se entra— y nada de dentro: ni almacén, ni jefes, ni quién
    está. Una lista pública no es una mirilla. Y el emblema son los DIEZ
    medallones de los mazos, que ya existen y ya están medidos: arte nuevo,
    cero.
  - **Y un capataz que no vuelve ya no congela la tribu.** El mando sólo
    cambiaba de manos por voluntad suya —cederlo, o irse—, y las dos piden que
    esté: quien funda una, la deja en «por solicitud» y desaparece, deja dentro
    a siete personas sin puerta, sin poder echar a nadie y sin arreglo salvo
    irse todas y perder el almacén. `visto_en` estaba en la tabla desde el
    primer día y lo pone al día `entrar()` en cada arranque, así que un capataz
    que juega NUNCA es relevable. Pasados SIETE días, `reclamar_mando()` se lo
    da a quien lo pida — a quien lo pida y no al más antiguo, que si la tribu se
    apagó el más antiguo suele ser otro ausente y el mando acabaría otra vez
    donde no hay nadie; quien lo pide es, por definición, quien está. Una tribu
    sin capataz —que no debería pasar— la coge cualquiera sin esperar: es la
    válvula. El plazo está en los dos sitios, `mando.js` y el SQL, y manda el
    del SQL: `visto_en` no lo escribe el navegador y la hora tampoco.
  - **Las reglas viven en `src/data/mando.js` y NO en `tribu.js`**, que es lo
    que parecía natural. `tribu.js` entra en el paquete de la Edge Function
    —lo importa el validador de asaltos—, así que tocarlo obliga a regenerar
    el paquete, re-anclar y volver a desplegar. `test/paquete.test.js` y
    `test/anclaje.test.js` lo cazaron al primer intento. Y aquí no hacía
    falta: quien comprueba el mando es SQL con `auth.uid()`, no la función.
- **La placa de la Cuenca lleva un punto con lo que te espera dentro.** La capa
  cooperativa no avisaba de nada: te aceptaban, te echaban, caía el jefe y
  tenías una carta esperando, y sólo lo veías si entrabas a mirar. `avisos_cuenca`
  cuenta SÓLO lo que pide una acción tuya —quién pide entrar si mandas tú, qué
  cartas no has reclamado—. «Hay un jefe abierto» o «te quedan asaltos» no son
  avisos, son pullas, y un punto que no se apaga nunca deja de significar nada.
  Es una llamada aparte y diminuta porque la pide el MENÚ, que no va a abrir la
  cuenca entera para pintar un punto; se refresca al arrancar y al volver de la
  Cuenca, que es cuando cambia.
- **El jefe vuelve cada ciclo, y una cacería es el par (evento, VUELTA).** El
  calendario daba la vuelta cada 14 días y la base de datos no: `jefes` tenía la
  clave (tribu, evento) y `abrir_jefe` hacía `on conflict do nothing`, así que en
  la segunda vuelta se encontraba la fila del primer ciclo con 0 de Vida y no
  hacía nada. Jugando eso no era «se agotó el contenido»: era que una tribu que
  mata a los dos jefes se queda sin capa cooperativa entera —los fósiles siguen
  saliendo, el almacén sigue llenándose y no hay a quién pegarle—. Ahora `jefes`,
  `aportes` y `asaltos` llevan `ciclo`, que es la vuelta, y lo calcula el
  servidor de `creada_en` con `private.ciclo_de()`: si llegara en la petición,
  cualquiera abriría un jefe nuevo cada minuto. Cuatro cosas que conviene saber:
  las filas viejas NO se borran —la carta de una cacería vieja se coge meses
  después—; la misma tribu puede tener la carta del Saurophaganax dos veces,
  porque son dos cacerías de cinco días entre ocho y no una repetida;
  `aplicar_asalto` conserva su firma a propósito, que la llama la Edge Function y
  cambiarla obliga a re-empaquetar, re-anclar y desplegar; y `estado_cuenca` no
  manda la historia entera —al año son 52 cacerías por tribu en CADA repintado—
  sino las de la vuelta de ahora más las que te dejaron una carta sin coger.
- **Las cartas pendientes siguen teniendo su bloque**, y ahora hace más falta:
  la del jefe de ahora tiene su botón en el pie, y las otras se filtran por
  evento Y vuelta. Comparando sólo el evento, la carta del Saurophaganax de hace
  catorce días se quedaba escondida detrás del Saurophaganax que está en pie.
  `reclamar_jefe` coge la cacería más antigua ganada y sin cobrar, así que el
  navegador no tiene que decirle cuál.
- **Un evento de clima lleva de fondo la textura de ese clima**, la misma
  que pone en el tablero.

Para verlo sin cuenta: `_banco_cuenca.html`, fuera del repositorio (los
`_banco_*` están en `.gitignore`), que cae a la cuenca local con compañeros
simulados. Para ver el MANDO hace falta una cuenca compartida, y ahí el banco
sustituye `red.js` entero con un **import map** —`{"/src/ui/red.js":
"/_banco_red.js"}`— en vez de meterle un interruptor de pruebas al juego.

## `transform` es una sola propiedad, y quien la escribe último gana

Es la trampa de toda la capa visual y ya ha mordido dos veces.

Las cartas del TABLERO corren `aterrizar`, `embestida` y `voltear`, todas sobre
`transform`. Por eso la inclinación con el puntero **no se aplica ahí**: se
pisarían. En la MANO ya estaba `alzada` con su `translateY`, así que las dos
cosas se componen en un solo `transform` con variables —`--alzar` para el gesto
de coger, `--tx`/`--ty` para la inclinación— y `alzada` escribe `--alzar`, no
`transform`.

Lo mismo con `box-shadow`: el aro de rareza lo ocupa y gana por especificidad
—`.carta.rareza-RARO` son dos clases—, así que la sombra que levanta la carta de
la mano va en `filter: drop-shadow`. Puestas las dos en `box-shadow`, la
profundidad desaparecía en todo lo que no fuera común.

Y al depurar esto, tres cosas que costaron un rato y no eran bugs:

- **`getComputedStyle().transform` a mitad de una transición devuelve el valor de
  partida.** Hay que apagar la transición y forzar un reflujo para leer el real.
- **Con CSS anidado, toda `CSSStyleRule` tiene `.cssRules`**, así que un
  recorrido que haga `if (r.cssRules) { recurse; continue; }` se salta todos los
  selectores y «demuestra» que la regla no existe.
- **Una declaración con `var()` devuelve cadena vacía en `rule.style.<prop>`**:
  es una pending-substitution value. No es que se haya perdido.

## Las cartas mienten si nadie las vigila

Cuatro veces en dos días el texto de una carta y lo que el motor hace se
separaron: la Sabana describía una constante borrada, el Canal callaba su efecto
principal, la Llanura prometía una pérdida y hacía un cambio, y las dos cartas de
jefe no tenían texto ninguno.

`test/textos.test.js` lo vigila: si un rasgo lleva número, el texto tiene que
citarlo, y toda carta con rasgo necesita nombre y texto. No prueba que el texto
sea CIERTO, pero sí que no se quedó atrás cuando el número cambió.

Y sigue sin poder probar lo que un test no puede probar. Dos que se han cazado a
mano después:

- **La Deriva árida decía «Ambos jugadores pierden 5 cartas del mazo»** y se lee
  como una vez. Es CADA TURNO, en la fase de robo, mientras siga en el campo: por
  eso ganaba el 100 % de las partidas en que se ponía y la extinción llegaba en
  6,4 turnos. El número era correcto y la frase mentía igual.
- **El Canal prometía que «los ribereños pelean a gusto»** cuando ya no queda
  ninguna carta con el rasgo Ribereño: se fue con el aplanado.

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

## Los climas son fenómenos, no paisajes

Las cinco cartas de clima se llamaban «Sabana de helechos», «Llanura de
inundación», «Canal fluvial trenzado», «Bosque de coníferas ribereño» y «Deriva
árida»: cuatro paisajes y una tendencia climática, en una ranura que se llama
clima y que dura unos turnos. Ahora son **Monzón de verano**, **Crecida
estacional**, **Bruma de valle**, **Estación de lluvias** y **Sequía prolongada**,
todos fenómenos documentados de la Morrison.

**Los `id` NO cambiaron** —siguen siendo `sabana`, `llanura`, `canal`, `bosque`,
`aridez`— y tampoco los `RASGO.CAMPO_*` ni las constantes de
`BALANCE.efectosCampo`. El id es la llave con la que la colección de cada cuenta
dice qué cartas tiene: renombrarlo obliga a reescribir `coleccion`,
`catalogo_inicial` y el jsonb de los mazos guardados de todos los jugadores, y no
cambia nada de lo que se ve. Si algún día se hace, es una migración de datos, no
un renombrado.

Los cinco nombres viejos quedan libres. Son buenos nombres de bioma y el autor
quiere reciclarlos como cartas de evento.

### La Sequía es el único clima que caduca

Con 5 cartas por turno y sin caducar, `node sim/climas.js` la medía como un
botón de ganar: 100 % de extinciones a 6,4 turnos, cero trofeos y cero
hábitat. Bajar la cifra sola no bastaba —a 2 por turno seguía siendo el 78 %—
porque lo que rompía era que durase para siempre. Decisión del autor: **dura 3
turnos y muele 1 carta a cada jugador por turno.**

La duración es un DATO de la carta, `duracion`, no una rama del motor: el
campo lleva `campoTurnos`, que se pone al revelar el clima y baja uno en cada
fase de robo. Puesta en el turno T, muerde en T+1, T+2 y T+3 y se va después
del tercero con un evento `CAMPO_FIN`. Cualquier clima con `duracion` caduca
igual; los cuatro sin ella siguen quedándose hasta que otro los sustituye. La
franja del campo enseña los turnos que le quedan, y `test/textos.test.js`
exige que el texto de la carta cite la duración, como cita cualquier cifra.

Y sigue sin poderse medir con `sim/carta.mjs`: está en el mazo de referencia
con su única copia y devuelve el 50,0 % de comparar un mazo consigo mismo.
Lo que dice algo es `sim/climas.js`.

## La Biomasa también es una carta

La **Pradera de helechos** es la única carta que no se juega para HACER algo,
sino para poder hacerlo: da 1 de Biomasa y te cuesta 1 carta de tu propio mazo.
Máximo 7 copias, una por turno, y el mazo pasó de 50 a **55 cartas** para
hacerle sitio.

**Por qué una carta y no subir la renta**, que era lo barato y lo primero que se
midió. Regalar Biomasa da los mismos números y dispara la bola de nieve: con
renta +3 sube al 71,4 %, por encima del techo, y con arranque de 5 al 70,9 %.
La carta no, porque ocupa sitio en tu mazo y en tu mano y te cuesta otra carta.
Es Biomasa que elegiste y pagaste, no que cayó del cielo, así que no infla a
quien va ganando.

Medido sobre 4.000 partidas y dos semillas, con 7 copias en un mazo de 55: los
trofeos bajan del 60 al 36 % de las victorias y el jugador inicial sube de 45,9
a 48,3 %. **Ojo con ese último número**: `BALANCE.md` corre 2.000 partidas y ahí
sale 47,5 %, o sea fallando el objetivo por medio punto. No es que una medición
mienta, es que el valor real está justo en la raya del 48 % y el resultado
cambia de signo con el tamaño de la muestra. Si alguien lo da por cumplido,
que mire cuántas partidas midió.

Lo que NO arregla: la extinción sigue en 0 % y el reparto de vías sigue fuera de
objetivo. Molerte a ti mismo te acerca a TI a perder, no al rival, así que esa
vía necesita cartas que muerdan el mazo de enfrente —como ya hace la Trampa de
depredadores— y no ésta.

Tres cosas del código que conviene saber antes de tocarlo:

- **El tope de copias sale de `limiteDe()`, no de la rareza.** Esta carta es
  común y admite 7, y es la primera del set con `copiasMax` propio. Había SEIS
  sitios leyendo `BALANCE.copiasPorRareza` a mano, uno de ellos el validador del
  servidor: con ese sin tocar, el navegador te deja guardar el mazo y el
  servidor lo rechaza, la partida se juega y no se cobra. Ahora todos pasan por
  la misma función.
- **La IA tiene una reserva de mazo** (`BALANCE.ia.mazoDeReserva`). Sin ella
  cambia su última carta por un punto de Biomasa y pierde por extinción, que es
  el peor rival posible: uno que se suicida. Con las partidas acabando a 12
  turnos y treinta y pico cartas en el mazo, ese freno no se toca nunca en juego
  normal; está para el caso raro.
- **Los mazos de los dos jefes también son de 55** y también llevan Biomasa,
  cinco cada uno. Se les sumaron en vez de recortarles copias: esas dos listas
  son temáticas y están escritas a mano, y quitarles cartas cambiaría qué mazo
  es cada uno.

Y la factura, dicha para que no sorprenda: al aplicar `0011_biomasa.sql`, **todo
jugador con un mazo guardado tiene que reeditarlo**, porque sumaba 50 y ahora un
mazo son 55. La migración le regala las 7 Praderas para que pueda, pero no le
completa el mazo: elegir qué lleva es suya. Con ocho jugadores y cinco mazos es
un rato; con ochocientos no se haría, y por eso el cambio se hizo con ocho.

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

**El CAPTCHA es el único script externo del juego**, y por qué no puede viajar
en el repositorio está en `src/ui/captcha.js`: lo que vale de un CAPTCHA es que
lo verifica un tercero. Es Turnstile, de Cloudflare, en modo gestionado —a
casi nadie le pregunta nada—. El widget se monta en cada repintado de la
puerta, porque la puerta se repinta entera con `innerHTML`, y el token se
reinicia después de CADA intento, porque es de un solo uso. La clave de sitio
va en `config.js` como la publicable de Supabase; la secreta sólo la conoce
el panel de Supabase.

**El orden de activación es cliente primero, panel después.** Con el CAPTCHA
activado en el panel, Supabase rechaza toda alta y toda entrada por contraseña
sin token; si se activa antes de publicar un cliente que lo mande, nadie puede
entrar. Y al revés no pasa nada: el cliente manda el token y Supabase, con el
panel apagado, lo ignora. Es la misma lección que el catálogo y la Edge
Function, un piso más arriba.

El nombre de jugador es único y se cambia **una sola vez**. El que se elige al
crear la cuenta no gasta el cambio: lo pone `entrar()` en el insert de la fila,
que no pasa por `cambiar_apodo`. Es lo que va a salir en una tabla de ELO, y un
nombre que se cambia a voluntad no identifica a nadie.

El alta son DOS pasos —crear el usuario de auth y crear su fila de jugador— y si
el segundo falla el primero ya está hecho. Por eso un «User already registered»
en la pestaña de crear cuenta NO es el final: se entra con ese correo y se sigue.
Pasó de verdad y dejaba la cuenta inservible.

### Misiones diarias

Tres al día, elegidas por el calendario. El diseño entero cabe en cuatro
frases y cada una cierra una puerta:

- **La misión es un DATO**, como las mecánicas de las criaturas: mide UN
  contador y pide una cantidad. Lo compuesto se resuelve en el parte —ahí está
  `relampago`, que es una victoria Y un número de turnos— porque una misión con
  dos condiciones es una que el jugador no sabe si está cumpliendo.
- **El PARTE lo saca el servidor re-jugando**, de los eventos que el motor ya
  emitía. El motor no sabe que las misiones existen y no debe saberlo. Un
  progreso que dijera el navegador sería una carta regalada, por el mismo
  camino de siempre: progreso → monedas → sobre → cartas legítimas.
- **Qué misiones tocan hoy se CALCULA, no se guarda.** `misionesDelDia(dia)` es
  determinista y la usan los dos lados. Lo que sí viene del servidor es qué día
  es: con la fecha local del navegador, alguien en Auckland vería las de mañana
  y le acreditarían las de hoy.
- **El catálogo NO está en SQL.** La meta y el premio viajan en la llamada a
  `aplicar_partida`. Una copia en la base de datos traería la trampa de aquí
  abajo —regenerar no es aplicar— y no hace falta: lo único que el SQL hace con
  una misión es sumarle progreso y pagarle el premio. Es seguro porque esa
  función está revocada a todo el mundo y sólo la alcanza la clave de servicio.

Dos cosas que cambiaron de sitio al añadirlas:

- **Las partidas PERDIDAS ahora también se mandan al servidor.** Antes una
  derrota valía cero y no se mandaba. Ahora puede avanzar «juega 3 partidas», y
  no mandarla sería quitarle al jugador un progreso que se ganó. El tope diario
  ya contaba las dos.
- **El menú se desplaza si no cabe.** Cabía justo a 360×640 y el bloque de
  misiones lo pasó por 58 px: la línea de la cuenta quedaba fuera de la pantalla
  sin manera de llegar a ella. Se desplaza sólo `.menu-caja`; la portada va
  detrás, en su capa, y se queda quieta.

**Al crear una función de lectura, revocar a PUBLIC antes de conceder.** Una
función creada por `postgres` nace con `execute` para PUBLIC, y anon es miembro:
`grant … to authenticated` no quita ese permiso, lo duplica. Pasó con
`mis_misiones` y no filtraba nada —sin `auth.uid()` la función lanza— pero el
resto de lecturas del jugador van revocadas y una excepción sin motivo es una
que un día alguien copia. Se comprueba con
`has_function_privilege('anon', 'public.<fn>()', 'execute')`.

Y el vocabulario tiene guardián, como las mecánicas: una misión que mida
`bajass` no es un error de sintaxis, es una que nunca avanza. Lo caza
`test/misiones.test.js`, que además vigila el techo del premio diario — un
catálogo que se infla no falla en ningún sitio, sólo se nota meses después en la
economía.

### Regenerar el catálogo no es aplicarlo

`node tools/generar-cartas.mjs` reescribe el SQL; **la base de datos no se entera
hasta que alguien lo aplica**. Es la misma trampa que el anclaje de la Edge
Function, un piso más abajo, y la primera vez pasó desapercibida: ocho cartas
cambiaron de rareza en el recoste, el fichero se regeneró en el mismo commit y el
servidor siguió con las viejas.

Lo que rompe es silencioso y sólo del lado del servidor: **el navegador te deja
guardar un mazo con 3 Diplodocus y el servidor lo rechaza**, porque el límite de
copias sale de la rareza y cada uno miraba la suya. La partida se juega y no se
cobra. Para comprobarlo no hace falta jugar:

```sql
select card_id, rareza, copias_max from public.catalogo_cartas order by card_id;
```

y comparar contra `BALANCE.copiasPorRareza[c.rareza]`.

**Y `0006_catalogo_cartas.sql` no se puede re-ejecutar tal cual venía.** Llevaba
un `truncate public.catalogo_cartas cascade`, y `coleccion` tiene una clave
foránea contra esa tabla: aplicarlo habría borrado las cartas de los ocho
jugadores y habría dejado los cinco mazos guardados apuntando al vacío. Se
escribió con la base recién creada, cuando vaciarla no costaba nada, y siguió ahí
cuando ya había gente dentro.

Ahora el generador emite `insert … on conflict do update` y borra sólo lo que ya
no está en el set, así que la migración es repetible y no destructiva.
`test/cuentas.test.js` falla si vuelve a aparecer un `truncate`. **Antes de correr
cualquier migración generada contra una base con jugadores, mirar qué la
referencia:**

```sql
select conrelid::regclass from pg_constraint
 where contype = 'f' and confrelid = 'public.<tabla>'::regclass;
```

`information_schema` para esto miente por omisión si la consulta se hace mal —a mí
me devolvió cero filas para una tabla que tenía dos referencias— así que
`pg_constraint`.

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

**Una columna de salida de `returns table` es una VARIABLE dentro del cuerpo.**
`aplicar_asalto` devuelve `(vida, cayo, almacen)` y hacía `select almacen from
public.tribus`: ambiguo entre la columna y la salida, y el asalto nunca se
registró —«No se pudo registrar el asalto: column reference "almacen" is
ambiguous»—. Falla EN EJECUCIÓN y no al crear la función, que el cuerpo de una
PL/pgSQL no se analiza hasta que se la llama, así que `apply_migration` dice
que todo bien. Se cualifica la columna (`t.almacen`, `j.vida`); renombrar la
salida no vale, que ese nombre es el que lee la Edge Function en la respuesta.
Las funciones de `0005_cuenca_operaciones.sql` ya iban con alias: la que venía
sin ellos era la de `0001`.

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

- **Sólo hay una expedición, la Morrison.** Los prompts de los mapas de Hell
  Creek, Tendaguru y Kem Kem están, los rivales no. Añadir una es un objeto en
  `EXPEDICIONES`, medirla con `sim/expediciones.mjs` y su mapa; pero el
  cliente sólo pinta la primera, y elegir entre varias pide una pantalla.
- **Las misiones diarias no saben de expediciones**: ganar a un rival cuenta
  como una victoria cualquiera. Una misión «vence a un rival nuevo» es un dato
  más en `misiones.js` y un campo en el parte.

- **Sólo hay dos jefes, y ahora se repiten.** Que el jefe vuelva cada ciclo
  arregla que la cuenca se quedara muerta, pero un calendario de 14 días con dos
  cacerías es el mismo mes otra vez. Un jefe nuevo es un objeto en `JEFES` con su
  mazo temático, su entrada en `CALENDARIO` y su carta — y `CARTAS_DE_JEFE`, que
  vive fuera del set y se queda fuera de todas las listas.
- **Al Duelo le faltan tres cosas de liga:** la protección al descenso (hoy
  el ELO baja en cuanto pierdes, sin las tres derrotas de margen), las
  temporadas con reinicio, y la tabla con nombre y puesto de la liga Extinción.
  Y las misiones diarias no avanzan con un duelo: el parte se saca re-jugando
  y en un duelo no hay nada que re-jugar. Pide anotar el parte turno a turno.
- **El CAPTCHA está activado** (Turnstile, desde el 13-09-2026). Si un día
  nadie puede entrar, lo primero es ese interruptor en Authentication → Attack
  Protection, y que el proveedor siga siendo Turnstile.
- **La confirmación por correo está desactivada.** Se puede crear una cuenta con
  un correo que no es tuyo. Para activarla hace falta un SMTP propio: el
  integrado de Supabase manda 2 correos a la hora y sólo a direcciones del
  equipo.
- **El balance cumple 3 de 6** (`BALANCE.md`, mazo de referencia del 13-09-2026):
  cero cartas descalibradas y las vías en 44/56, pero el jugador inicial se
  queda en 47,5 % —lleva ahí desde la v2, es del turno y no del mazo—, la bola
  de nieve en 72 % y la extinción en 0 %. Y 69 de las 101 cartas del set siguen
  fuera del mazo de referencia, o sea sin calibración comprobada.
- **La inmunidad al clima no muerde.** Torvosaurus y Nodosaurus dicen «no le
  afectan los efectos del clima», y hoy los dos únicos efectos del clima sobre una
  criatura son BUENOS: el Canal da +1 de Vida y el Bosque cura saurópodos. O sea
  que la inmunidad es un inconveniente pequeño disfrazado de ventaja. Se arregla
  por cualquiera de los dos lados —darle al clima algo que doler, o cambiarles la
  habilidad— pero es una decisión de diseño, no un arreglo.
El proyecto es **de pago** (plan Pro), así que no se pausa por inactividad.
Eso era cierto antes y ya no lo es.

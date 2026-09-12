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
| El commit anclado en `desde-url.ts` | `node tools/anclar-desde-url.mjs` | `test/anclaje.test.js` |

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
| `npm run sim` | el mazo de REFERENCIA, 27 entradas | las 39 cartas que no están en él. La Llanura se rediseñó dos veces y `BALANCE.md` no se movió un decimal |
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

Las **16 cartas de soporte** llevan la suya en `rasgo`, un valor del enum de
`cards.js`, con su constante en `BALANCE` y su caso en el motor. Son dieciséis
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

- **El Duelo se enseña apagado y dice «Pronto».** No hay PvP: la columna de ELO
  está en la base y las partidas se registran, pero nadie las enfrenta.
  Esconderlo habría sido más limpio y menos honesto; que hiciera algo, peor.
- **La dificultad del rival se fue con «En solitario».** Es el rival de ESA
  partida y en el menú estaba suelta, sin decir de qué.
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

- **El Duelo (PvP) no existe.** La placa está en la pantalla de jugar, apagada
  y con su «Pronto». El ELO sigue sin moverlo nadie.
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
- **La inmunidad al clima no muerde.** Torvosaurus y Nodosaurus dicen «no le
  afectan los efectos del clima», y hoy los dos únicos efectos del clima sobre una
  criatura son BUENOS: el Canal da +1 de Vida y el Bosque cura saurópodos. O sea
  que la inmunidad es un inconveniente pequeño disfrazado de ventaja. Se arregla
  por cualquiera de los dos lados —darle al clima algo que doler, o cambiarles la
  habilidad— pero es una decisión de diseño, no un arreglo.
- **La Deriva árida sigue ganando el 100 %** de las partidas en que se pone
  (`node sim/climas.js`): muele 5 cartas de los dos mazos y la extinción llega en
  6,4 turnos. Es el desajuste más grande del set y no lo toca este recoste.
El proyecto es **de pago** (plan Pro), así que no se pausa por inactividad.
Eso era cierto antes y ya no lo es.

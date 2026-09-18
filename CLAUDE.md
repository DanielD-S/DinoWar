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
| `LUGARES.md` | `node sim/lugares.mjs` | — |
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
| `assets/icono-*.png` (los cuatro de la app) | `python tools/icono.py escribir` | `test/manifest.test.js` |

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

## Los siete simuladores, y qué NO ve cada uno

Es el error que más veces se ha repetido: cambiar una carta, correr `npm run sim`,
ver los seis números idénticos y creer que el cambio no hace nada.

| herramienta | qué juega | punto ciego |
|---|---|---|
| `npm run sim` | el mazo de REFERENCIA, 31 entradas | las 108 cartas que no están en él. La Llanura se rediseñó dos veces y `BALANCE.md` no se movió un decimal |
| `node sim/carta.mjs <id>` | el mazo de referencia CON esa carta contra el mismo SIN ella | una carta sola: no dice nada de sinergias entre dos nuevas |
| `node sim/cobertura.mjs` | mazos aleatorios de todo el set | su ajuste filtra a CRIATURAS: ningún clima ni evento aparece |
| `node sim/climas.js` | fuerza cada clima al campo | no dice si la carta es buena, sólo qué le hace al juego mientras está puesta |
| `node sim/entradas.js` | un mazo cargado de disparos al entrar | es la COTA, no el balance: el mazo está sesgado a propósito |
| `node sim/arquetipos.mjs` | mazos ENTEROS construidos por idea, unos contra otros | no dice si una carta suelta está rota: para eso está `carta.mjs` |
| `node sim/lugares.mjs` | el tablero plano contra el de lugares con las mismas semillas, y cada lugar forzado | juega el mazo de referencia: el Río y el Acantilado salen como columnas vacías porque no lleva marinos ni casi pterosaurios |

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

Las **cartas de soporte** llevan la suya en `rasgo`, un valor del enum de
`cards.js`, con su constante en `BALANCE` y su caso en el motor. Son veintitantas
reglas y ninguna se parece a otra: un caso por carta es lo honesto.

Las **criaturas** llevan la suya en `mecanica`, un objeto de datos descrito en
[`src/data/mecanicas.js`](src/data/mecanicas.js). Son setenta y tantas
habilidades pero diez FORMAS: contadores, auras de clado, condicionales,
inmunidades, espinas, coste añadido, búsquedas y disparos al entrar. Escritas
como setenta ramas de `if` dentro de `ataqueEfectivo()` no habría quien las
leyera, y `efectosDe()` —la función que le explica al jugador por qué su carta no
marca lo que trae impresa— habría necesitado otras setenta.

Los números exactos NO se escriben aquí: se quedaron atrás dos veces —«17 de
soporte» cuando ya eran 35— y un recuento desfasado es peor que ninguno.
`test/entradas.test.js` los lleva y falla cuando cambian.

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

## La ronda del control: pelear por la MANO y no por el campo

Quince cartas del 16-09-2026 —diez criaturas y cinco eventos— para la mitad del
juego que no existía. El set sabía pelear por la mesa y no sabía tocar la mano
de enfrente: el rival robaba dos por turno, jugaba lo que quería, y la vía de
la extinción llevaba desde la v2 clavada en el 0 %. Lo pidió el autor con dos
ejemplos —«los dos barajan su mano y roban 5», «descartas del mazo y te subes
un dinosaurio»— y de ahí salieron cuatro formas nuevas y ni una rama por carta.

**Las tres ZONAS del contador.** `cuenta.que` aceptaba dos cosas que se miran en
el campo —`MISMA` y `CLADO`— y ahora acepta tres montones: `MANO`, `MANO_RIVAL`
y `DESCARTE`. Tres cosas que no se deducen del código y se decidieron midiendo:

- **Una zona NO mira `ambos`.** La mano del rival ya es la del rival, y un
  contador que sumara los dos descartes no querría decir nada. Un `ambos`
  escrito ahí sería un campo puesto y no leído, o sea el fallo mudo de siempre,
  así que `test/entradas.test.js` lo prohíbe.
- **Y piden freno, `cada` o `tope`.** Una mano son ocho cartas y un descarte
  pasa de veinte: +1 por carta a pelo no es una carta, es un botón de ganar. El
  test exige que toda zona declare uno de los dos.
- **`cada` divide y `tope` corta, en ese orden.** «+1 de Vida por cada 4 cartas
  de tu descarte, hasta +4» es `{ cada: 4, vida: 1, tope: 4 }`, y los tres
  números salen en el texto porque `test/textos.test.js` los persigue.

**`busca` puede ser un objeto.** Era una etiqueta —evento, clima, otra copia,
un clado— y ahora acepta `{ ataqueMin }` y `{ ataqueMax }`, que es lo que
pedían las dos caras del arquetipo: subirte el bicho que remata o el pequeño
que rellena la curva. Mira el Ataque **impreso**, que es lo único que hay en el
mazo: ahí no hay campo, ni auras, ni contadores. Y se sigue eligiendo AL JUGAR
la carta, como todas las búsquedas.

**Cuatro disparos nuevos al entrar**: `manoNueva`, `manosNuevas`,
`topeManoRival` y `rescata`. Dos trampas que costaron:

- **Una mano nueva pasa por el MAZO, no por el descarte.** Es lo que hace
  jugable a toda la ronda: lo que sueltas vuelve a estar disponible, así que
  cambiar una mano impagable no cuesta cartas. Si fuera al descarte, nadie lo
  haría dos veces. Y roba a mano, sin `robar()`, porque el mazo acaba de crecer
  con la mano entera: si aun así no llega, rebarajar el descarte sería regalar
  cartas.
- **`topeManoRival` va al REVÉS que todos los demás.** Su número es lo que le
  DEJA al rival, así que cuanto más bajo, más fuerte. Tasarlo por su cifra
  —`n × peso`, como los otros seis— hacía que un tope de 6, que no quita nada,
  valiera el triple que uno de 2. Se tasa por lo que se lleva por delante desde
  una mano típica, y por eso un tope de 0 es un número legítimo y no «sin
  efecto»: se lee con `!== undefined` y no con un `if` a secas.

**Y la lección que dejó Nigersaurus**: se escribió «los dos jugadores descartan
3 cartas de su mazo» y el guardián saltó con «vale 0 para la IA». Era cierto:
`mueleRival` pesa +0,4 y `muelePropio` −0,4, así que un molino simétrico se tasa
en cero exacto y la IA no lo jugaría jamás. Quedó en 4 al rival y 2 a ti, que
además es lo que la carta quería decir. Un efecto que se cancela consigo mismo
no es una carta equilibrada: es una carta invisible.

### Lo que costó medirlas, que fue la mitad del trabajo

Con `node sim/carta.mjs`, 300 partidas cada una. **Los cinco eventos**, entre el
49,0 % y el 53,0 %: calibrados y sin discusión. **Las diez criaturas** salieron
del 46,7 % al 68,7 %, y cuatro se recostearon en el sitio —Tarbosaurus de 8/7 a
7/6, Saurolophus de 3/9 a 2/7, Deinocheirus con tope 4 en vez de 5, Dakotaraptor
de 5/5 a 4/5— y Shuvuuia AL REVÉS, de 1/2 a 1/3, que se quedaba corta. Quedan
entre el 48,3 % y el 66,0 %.

Y aquí está lo que conviene no volver a aprender:

- **La escala de `sim/carta.mjs` no es comparable entre rarezas.** «60 % fuerte,
  65 % empieza a doler» está escrito para la pregunta «¿está rota?», y una
  épica metida en el mazo de referencia le quita el sitio a la carta MÁS
  REPETIDA, que es una común. Parte del porcentaje es ese cambio y no la carta.
  Medido a propósito para saberlo: **Suchomimus 69,3 %, Triceratops 66,3 %,
  Torvosaurus 62,3 %, Rhinorex 59,3 %, Carnotaurus 58,0 %** — cinco épicas que
  llevan meses en el set y que la escala llamaría «fuertes» o peor. Una carta
  nueva se compara con sus iguales, no con el 50 %.
- **Con esa banda delante, las cuatro recosteadas estaban dentro** y el recorte
  fue de más. Se dejó igualmente: pegan menos y siguen haciendo lo suyo, y una
  carta de control que además gana el cuerpo a cambio de nada es la clase de
  carta que se vuelve obligatoria.
- **Y lo que esto NO mide**, que es lo de siempre: el medidor las mete en el
  mazo de REFERENCIA, que no es un mazo de control. Lo que valen de verdad sólo
  se ve cuando alguien construya el mazo que las quiere, y ése no existe.

**Aplicado y desplegado el 16-09-2026.** Las quince están en `catalogo_cartas`
y la Edge Function quedó anclada a `4a524c8`, que vive en `main` porque la PR
#105 se mergeó con MERGE y no con squash. El despliegue se comprobó con la
receta de `supabase/functions/README.md`: invocada desde la propia base
contesta `401 {"error":"sesión inválida"}`, que es la prueba de que los once
importes por URL resolvieron y el código vivo es el nuestro. Del fichero
desplegado se comprobó antes, byte a byte, que era el anterior con el SHA
cambiado y nada más: once líneas, las once del anclaje.

## La ronda del rebote: del campo a la mano, y del descarte al mazo

Quince cartas más (16-09-2026) —seis criaturas, dos de ellas legendarias, y
nueve de soporte— para tres cosas que el juego no sabía hacer. La ronda del
control aprendió a morder la MANO; ésta aprende a deshacer el CAMPO y a
deshacer el descarte.

- **El REBOTE**, `entrada.devuelve` y cuatro rasgos de soporte: una carta que
  está en juego vuelve a la mano de su dueño. Es el primer gesto del juego que
  deshace un despliegue.
- **El ENTIERRO**, `entrada.entierra` y dos rasgos: del descarte al MAZO. Es lo
  ÚNICO que alarga un mazo en todo el juego, y por tanto la primera respuesta
  que la vía de la extinción ha tenido nunca. Hasta hoy molerte era un daño sin
  vuelta atrás y por eso nadie temía la vía; ahora tiene con qué pelearse.
- **El GOLPE AL HÁBITAT**, `entrada.golpeHabitat` y un rasgo: daño directo, sin
  pasar por el combate. Las cifras son 2 y 3 a propósito: es la vía más corta
  que hay a una de las tres victorias y no puede salir barata.

Seis decisiones que no se deducen del código:

- **Vuelve LIMPIO.** El rebote hace la misma limpieza que una muerte —heridas,
  marcas, `modAtaque`— menos las dos cosas que lo separan de morir: no va al
  descarte y no da trofeo. Se consideró devolverlo herido y no se sostiene: la
  instancia es la misma pero la carta ya no está en juego, y un Allosaurus que
  vuelve a la mano herido de 4 sería otra carta distinta de la que salió del
  sobre. Lo que sí se pierde son las adaptaciones pegadas encima, que caen al
  descarte como cuando muere quien las llevaba.
- **Ninguno pregunta**, como todo lo que se resuelve en la revelación. El tuyo
  que se recoge es **el más herido** —desempate por `iid`— porque es lo que
  haría el jugador y porque vuelve entero; el del rival es **el que más pega de
  los que caben bajo el listón**, que es la misma regla que Tijera. Quitarle el
  pequeño de adorno no sería una carta.
- **`devuelve` es el único disparo que lleva OBJETO** en vez de número:
  `{ propio, rival, ataqueMax }`. Son dos cantidades que valen distinto y un
  FILTRO, y `ataqueMax` no se tasa: un listón alto es una carta que alcanza a
  más, no una que hace su efecto más veces. Partirlo en tres claves planas
  habría metido ese filtro en la lista que se tasa multiplicando por su cifra,
  que es el mismo error que ya tuvo `topeManoRival`.
- **Devolver al rival vale casi el triple que recoger lo tuyo** (2,2 contra
  0,8): a él le deshaces el turno y la Biomasa, y lo tuyo sólo cambia de sitio
  —y encima te lo tienes que volver a pagar—.
- **El entierro va BARAJADO, no encima del mazo.** Poner cartas conocidas arriba
  arreglaría el robo de los próximos turnos, que es mucho más de lo que la carta
  dice, y en un duelo el rival no puede mirar el mazo para comprobarlo.
- **Y el rebote no encoge la carta.** El tablero es una rejilla: `.carta.rebota`
  se desvanece en su sitio con `opacity` y `filter`, como manda la regla de los
  gestos. El vuelo de vuelta a la mano lo hace el fantasma de `render.js`, que
  va por encima de todo y no compone con esto.

### Medidas, y esta vez sin recostear nada

`node sim/carta.mjs`, 300 partidas cada una. **Las seis criaturas** entre el
50,3 % y el 60,0 %; **los nueve de soporte**, entre el 45,3 % y el 55,7 %. No
se tocó ninguna cifra, y eso es un resultado y no una dejadez: con las bandas
de la tanda anterior delante, las quince caen dentro de la suya.

| banda medida | contra qué se compara |
|---|---|
| Legendarias: Tyrannosaurus 63,3 %, Mosasaurus 60,3 % | Carcharodontosaurus 60,0 %, Giraffatitan 59,3 % |
| Raras: Allosaurus 57,3 %, Iguanodon 56,3 %, Amargasaurus 52,0 % | Ouranosaurus 59,3 %, Rugops 50,3 % |
| Épicas: Suchomimus 69,3 %, Triceratops 66,3 %, Torvosaurus 62,3 % | Deltadromeus 56,3 %, Tupandactylus 52,7 % |
| **Molinos: Trampa 46,0 %**, Inundación 52,3 % | Ceniza 45,3 % |

Esa última fila es la que hay que leer dos veces. **La Ceniza mide 45,3 % y la
Trampa, que lleva meses en el set, mide 46,0 %.** La molienda se tasa por
debajo del 50 % en el mazo de referencia y no porque las cartas sean malas: es
que ese mazo gana por hábitat y por trofeos a los once turnos, con la extinción
en el 0 %, así que quitarle cartas de un mazo que nunca se acaba no hace nada.
Medir una carta de molienda ahí es medirla en el único sitio donde no sirve.

Lo mismo vale para el ENTIERRO, por el otro lado: Rugops mide 50,3 % y el
Osario 51,3 % porque alargar un mazo que sobra no cambia ninguna partida. Las
dos familias —moler y enterrar— sólo dicen su número de verdad cuando exista el
mazo que las lleva, y ése es el trabajo que sigue.

**Aplicado y desplegado el 16-09-2026.** Las quince están en
`catalogo_cartas` —136 filas, las 131 del set más las 5 de jefe— y la Edge
Function quedó anclada a `3c1d4a9`, que vive en `main` porque la PR #106 se
mergeó con MERGE y no con squash. Del fichero desplegado se comprobó ANTES,
por hash, que era el anterior con el SHA cambiado y nada más: once líneas, las
once del anclaje. Y después, con la receta de `supabase/functions/README.md`:
contesta `401 {"error":"sesión inválida"}`, que prueba que los once importes
por URL resolvieron y que el código vivo es el nuestro.

**Aplicado y desplegado el 16-09-2026.** Las 144 filas están en
`catalogo_cartas` —139 del set más las 5 de jefe— y la Edge Function quedó
anclada a `ccdd73f`, el commit de merge de la PR #110, que vive en `main`
porque se mergeó con MERGE y no con squash. Comprobado con la receta de
`supabase/functions/README.md`: contesta `401 {"error":"sesión inválida"}`, y
el `ezbr_sha256` pasó de `84d2d4d0…` a `71ef4557…`.

Antes de aplicar se hizo el ensayo que conviene repetir siempre, porque la 0006
BORRA lo que ya no está en el set y `coleccion` tiene una clave foránea contra
esa tabla: una consulta que lista qué se añadiría y qué se borraría. Salieron
las 8 altas y CERO bajas.

### jsDelivr puede envenenar la caché de UN fichero, y se ve como un fallo del commit

Lo que costó este despliegue, por si vuelve. El primer intento murió con
`Module not found` sobre `src/engine/ai.js`, y el segundo —tres minutos
después— con `403 Forbidden` sobre `src/engine/economia.js`. Parecía que el
commit anclado no existía.

No era eso. Probando los 23 ficheros del paquete uno a uno desde la propia base
de datos con la extensión `http` —la misma receta de la prueba de humo, que
sirve igual para esto—, **22 daban 200 y sólo `economia.js` daba 403**, cinco
veces seguidas. Y el mismo fichero, en el mismo commit, daba 200 por
`fastly.jsdelivr.net` y por `gcore.jsdelivr.net`, y también por
`cdn.jsdelivr.net` pidiéndolo por `@main`. O sea: **un nodo de `cdn.` con un 403
cacheado para esa única URL**, no un problema del commit ni del fichero.

Dos cosas que llevarse:

- **Un SHA nuevo son claves de caché nuevas**, así que la salida es re-anclar a
  otro commit de `main` en vez de esperar a que expire. Aquí se re-ancló del
  `4020cbc` al `ccdd73f`, que es el commit de merge y lleva el mismo motor.
- **Antes de desplegar, comprobar los 23 ficheros de `VIGILADOS` en el SHA
  anclado** con un `http_get` por fichero desde SQL. Tarda un segundo y
  distingue «jsDelivr todavía no lo ve» de «hay un 403 pegado a un fichero»,
  que desde el error del empaquetador se leen igual.

Y una advertencia sobre la herramienta: `node tools/anclar-desde-url.mjs` **no
acepta banderas**, y una inventada (`--comprobar`) no da error de uso: se la
pasa a `git` por dentro, `git` falla, y la herramienta reescribe `desde-url.ts`
dejando el SHA VACÍO —`DinoWar@`— y diciendo `MAL` en cada fichero. Se arregla
con `git checkout --`, pero conviene no llamarla con argumentos.

Y la trampa que enseñó esta tanda al desplegar: entre aplicar la migración y
desplegar la función hay una ventana en la que producción está A MEDIAS, y no
es simétrica. El cliente sale solo desde `main`, así que la gente ve las cartas
nuevas enseguida; con el catálogo aplicado puede además guardar un mazo con
ellas; y la partida que juegue con ese mazo la rechaza el servidor, que sigue
re-jugando con el set viejo. **Se juega y no se cobra**, que es el fallo
silencioso de siempre. Aplicar y desplegar son un solo paso, aunque sean dos
comandos.

Un aviso para quien siga: **el rebote de lo PROPIO es un motor de combos**. Una
carta que vuelve a la mano vuelve a entrar, y cada entrada vuelve a dispararse
—Ouranosaurus y la Migración existen para eso—. Hoy sale caro, porque volver a
bajarla cuesta la Biomasa otra vez y el turno entero; el día que haya una forma
barata de rebotar lo propio, eso deja de ser verdad y hay que medirlo de nuevo.

## Los arquetipos: la extinción existe, y se midió construyéndola

`node sim/arquetipos.mjs` (16-09-2026). Es el sexto simulador y responde lo que
ninguno de los otros cinco podía: **si una VÍA de victoria existe de verdad o
sólo está escrita en las cartas.** Juega mazos enteros construidos alrededor de
una idea, unos contra otros, y enseña por qué gana cada uno — que importa más
que cuánto.

Nació de un número que no cuadraba: la Ceniza volcánica mide 45,3 % con
`sim/carta.mjs` y la Trampa de depredadores, que lleva meses en el set, 46,0 %.
Las dos por debajo del 50 y ninguna es mala. Lo que pasa es que el mazo de
referencia gana por hábitat y trofeos a los once turnos con la extinción en el
0 %: **medir molienda ahí es medirla en el único sitio donde no sirve.**

Lo que salió, 300 partidas por cruce:

| mazo | contra | gana | por qué gana |
|---|---|---|---|
| MOLIENDA | Referencia | 74,7 % | trofeos 40 %, **EXTINCIÓN 25 %** |
| MOLIENDA | Entierro | 47,7 % | **extinción 22 %**, trofeos 21 % |
| MOLIENDA | Control | 60,3 % | trofeos 34 %, **extinción 26 %** |
| ENTIERRO | Molienda | 52,3 % | trofeos 26 %, hábitat 26 % |
| ENTIERRO | Referencia | 76,3 % | trofeos 50 %, hábitat 27 % |
| CONTROL | Referencia | 49,0 % | hábitat 40 % |

**La extinción pasó del 0 % al 22-26 % de las victorias** del mazo hecho para
ella. Llevaba en cero desde la v2 y no hizo falta tocar una constante de
balance: hacía falta que existieran las cartas. Y la segunda lectura vale lo
mismo: **el Entierro le gana a la Molienda por 52,3 %**, o sea que la respuesta
funciona y NO cierra la vía. Si ganara el 70 % habríamos tapado la puerta por
el otro lado, que es lo que pasa cuando el antídoto es más barato que el veneno.

Cuatro cosas que conviene no volver a aprender:

- **La Molienda no lleva Trampa ni Inundación**, que son las dos cartas que el
  set tenía para eso desde siempre. Muelen a los DOS, y en un mazo que va a
  durar quince turnos te matan a ti primero. Lo que lo sostiene son Ceniza,
  Barrera y Sedimento: 38 cartas de mazo rival y cero propias.
- **Y aun así es medio mazo de MURO.** «Un mazo que sólo muele no gana, y
  encima estorba» ya estaba medido en Hell Creek; aquí se confirma por el otro
  lado. Si no aguantas al turno doce no llegas a gastar la molienda, y las
  partidas de este cruce duran 15,7 turnos contra los 11 de todo lo demás.
- **Los tres mazos se escribieron con 13-14 de Biomasa** «porque un mazo lento
  las quiere», y `CLAUDE.md` ya tenía medido que catorce gana el 39,8 %.
  Corregidos a nueve, la Molienda subió del 70,7 % al 74,7 % — y su extinción
  BAJÓ del 32 % al 25 %, porque los huecos se llenaron de cuerpos y empezó a
  ganar por trofeos. Menos Biomasa la hace mejor mazo y peor molino.
- **El CONTROL es el arquetipo flojo**: 49 % contra la referencia, 39,7 % contra
  molienda, 39,0 % contra entierro. Las quince cartas de la ronda de la mano son
  piezas de apoyo, no un plan. Quien quiera arreglarlo tiene ahí el banco.

Y el hallazgo incómodo: **el mazo de REFERENCIA es débil.** Pierde el 74,7 % y
el 76,3 % contra dos mazos construidos en una tarde. Es el que juega la IA en
solitario y el que mide `BALANCE.md`, así que los seis objetivos del balance se
están midiendo sobre un mazo que cualquier construcción bate con holgura. No es
un bug: es que el mazo de referencia se escribió para medir CARTAS y se ha
quedado como si midiera el juego. **Se rehízo ese mismo día**, y lo que se
aprendió está en la sección que sigue.

### La vara del 16-09: el mazo de referencia, rehecho midiendo

Ocho candidatos, 600 partidas espejo y 200 por cruce contra los cuatro
arquetipos. Lo que se buscaba: un mazo que quede cerca del 50 % contra las
construcciones y que siga midiendo el espejo. Las dos cosas tiran en sentido
contrario y eso es lo primero que se aprendió:

| candidato | espejo | inicial | vías | vs Molienda | vs Entierro | vs Hábitat |
|---|---|---|---|---|---|---|
| el del 13-09 | 4/6 | 49 % | 42/58 | 29,5 % | 26,0 % | 24,5 % |
| agresivo (Suchomimus ×2, Allosaurus ×3, Deltadromeus ×2) | 1/6 | 43 % | **6/94** | 78,5 % | 76,0 % | 71,5 % |
| tribal de dos auras (marginocéfalos) | 3/6 | 44 % | 43/58 | 77,0 % | 89,0 % | 88,0 % |
| el del 13-09 con muros en vez de cuerpos flojos | 3/6 | 42 % | 54/46 | 26,5 % | 26,0 % | 23,0 % |
| **el elegido** | 3/6 | 43 % | 24/77 | **51,5 %** | **50,0 %** | **48,0 %** |

- **Un mazo que gana el 75 % a todo rompe el espejo por el otro lado**: el
  94 % de sus partidas consigo mismo acaban por hábitat, y Monolophosaurus
  sale descalibrado. Lo que hace vara no es ser fuerte, es quedar en la raya.
- **Los muros solos no hacen vara.** Cambiar los cinco cuerpos que no pesaban
  por Loricatosaurus, Mamenchisaurus y Stegoceras deja el cruce donde estaba.
  Lo que mueve el cruce son los cuerpos de ATAQUE medianos: el elegido es el
  del 13-09 con Suchomimus, Deltadromeus, Monolophosaurus, un Allosaurus, un
  Iguanodon y un Apatosaurus en el sitio de Ornitholestes ×2, Huaxiadraco,
  Riparovenator, Camarasaurus y un Dryosaurus.
- **El soporte no mueve nada** (±3 puntos con Neumaticidad y Ceniza en vez de
  Trampa, Gastrolitos y Bruma), así que se quedó el de antes. Importa porque
  `iniciales.js` saca de ahí el soporte de los tres mazos iniciales: con el
  mismo soporte, `catalogo_iniciales` no cambia. La 0006 cambia igual, pero
  sólo en `catalogo_inicial` —la tabla de la colección de salida de antes de
  la 0023, que ya no lee nadie desde que se borró `private.sembrar`—.
- **Contra el Control queda al 69 %**, y no es fallo de la vara: el Control
  es el arquetipo flojo y el del 13-09 ya le ganaba el 52 %.

Lo que cuesta, medido antes de aceptarlo:

- **El jugador inicial baja al 45,4 %** (2.000 partidas; 47,5 % antes). Se
  midió de dónde sale y NO es del motor: con la IA al azar, el mazo viejo y
  el nuevo dan el 47–48 %; con la heurística, 47,7 % y 43,0 %. Es la
  heurística la que como SEGUNDO jugador saca cuatro puntos más a este mazo.
  El desempate del chequeo y el orden de la revelación favorecen al primero,
  así que el sitio donde mirar es `ai.js` y cómo `sim/partida.js` alterna las
  dos IAs. Lo de «es del turno y no del mazo» era cierto a medias.
- **Los tres iniciales pasan del 45–55 % al 31–33 % contra la referencia.**
  No es que sean más flojos: la vara es más dura. Entre ellos siguen en el
  45–47 %, que es lo que se calibra.
- **Las curvas de expedición suben 10–20 puntos**, porque
  `sim/expediciones.mjs` juega el mazo de referencia como jugador. Los
  rivales no se retocaron: las cifras nuevas están en «Las Expediciones» y
  la escalera sigue en el mismo orden. Es la vara la que cambió, no el mapa.

**En producción desde el 16-09-2026** (PR #115, función v30 anclada a
`dfbc21f`; de la 0006 se aplicó sólo el bloque de `catalogo_inicial`, que es
lo único que cambia y una tabla que ya no lee nadie).

Y lo que `BALANCE.md` dice ahora: **3 de 6**, como antes, con otro perfil.
Cero descalibradas y duración en objetivo; el inicial en 45,4 %, la bola de
nieve en 71,2 % —rozando el 70— y las vías en 25/75/0. La extinción sigue en
cero en el espejo porque el mazo no muele: está medida en el arquetipo que la
lleva (22–26 %), no aquí.

### Las dos cartas de Ataque 0, medidas a 1 y a 2

Se propuso subirles el Ataque a las únicas dos criaturas que lo tienen en cero
—**Brachylophosaurus 0/10 c2**, que con el trío se pone en 6, y **Loricatosaurus
0/8 c3**, que cura 2 al hábitat al entrar—. Medido por los tres caminos, y la
respuesta es que **las cartas mejoran y el juego empeora**.

Con `sim/carta.mjs`, 300 partidas, las dos están hoy por debajo de la raya:

| Ataque | Brachylophosaurus | Loricatosaurus |
|---|---|---|
| **0 (hoy)** | 46,7 % | 46,0 % |
| 1 | 53,0 % | 49,3 % |
| 2 | 58,7 % | 55,3 % |

O sea que a 0 no son cartas calibradas, son cartas FLOJAS, y a 1 quedan en la
raya. Eso es cierto y no basta, porque los otros dos medidores dicen lo otro.

**Los seis objetivos no se mueven.** `npm run sim`, 2.000 partidas por variante:
3 de 6 en las tres. El jugador inicial incluso BAJA —47,5 % a 0, 46,3 % a 1,
46,8 % a 2—, la bola de nieve roza el objetivo a 1 (70,8 % contra 72,1 %) sin
llegar, y el reparto de vías se queda en 44/56/0 pase lo que pase.

**Y el torneo de arquetipos se polariza**, que es el motivo para no hacerlo:

| cruce | A0 | A1 | A2 |
|---|---|---|---|
| ENTIERRO vs Referencia | 74,0 % | 77,5 % | **85,5 %** |
| ENTIERRO vs Control | 61,0 % | 68,0 % | **77,0 %** |
| MOLIENDA vs Control | 62,5 % | 69,5 % | **74,5 %** |
| Control vs ENTIERRO | 39,0 % | 32,0 % | **23,0 %** |
| Referencia vs HÁBITAT | 24,5 % | 20,5 % | **16,5 %** |

El peor cruce del torneo pasa del 24,5 % al 14,5 %. La razón es de una línea:
**las dos cartas son MUROS y los muros están en tres de los cinco mazos.**
Subirles el Ataque se lo regala a los que ya ganaban y no a los dos que no los
llevan —Referencia y Control—, y el Control, que ya era el arquetipo flojo,
queda inviable.

Y de rebote la EXTINCIÓN baja (28 % → 25 % de las victorias de la Molienda
contra el Control): un muro que mata gana por trofeos antes de que el molino
llegue. Es exactamente lo que ya enseñó la Biomasa cuando se bajó de catorce a
nueve.

Si algún día se toca, **Loricatosaurus a 1 es casi gratis** —49,3 %, sigue
neutral— y Brachylophosaurus **no es un descuido**: su trío lo lleva de 0 a 6, y
con base 1 serían 7 de Ataque por 2 de coste.

### Cuántas cartas pide un set sano

La aritmética sale del propio juego. Un mazo son 55; con nueve de Biomasa
quedan 46 reales, y a 2,4 copias de media eso son **~19 cartas distintas**. Para
que construir sea una decisión y no una receta, el arquetipo necesita más
cartas de las que caben — al armar la Molienda hubo que dejar fuera la Trampa y
la Inundación, y eso es exactamente la señal de salud.

Medido sobre los cuatro mazos de aquí: comparten entre 3 y 8 cartas, y tres son
siempre Biomasa. O sea **~22 cartas EXCLUSIVAS por arquetipo** y un fondo común
pequeño. Con tres vías de victoria y dos mazos por vía —que es lo mínimo para
que haya metajuego dentro de una vía— salen **165-180 cartas**. Hoy hay 131.

Los agujeros, por lo que bloquean:

| hueco | hoy | falta |
|---|---|---|
| ~~Soporte de hábitat~~ | 13 → **56 copias** | hecho, y no bastó (ver abajo) |
| ~~Tireóforo tribal~~ | 24 → **32 copias** | hecho, de rebote |
| Ornitópodo tribal | 27 copias (pide 28) | 1 carta |
| Aperturas de coste 0 | 12 copias | 2-3 cartas |
| Daño dirigido al rival | 5 copias | 3-4 cartas |

El del hábitat era el que más pesaba: **es la única vía de victoria para la que
no se puede construir un mazo**. La molienda ya tiene el suyo, los trofeos lo
tienen de siempre, y el hábitat gana de rebote —cuando el muro no llega— pero
nadie puede ir a por él a propósito. Se atacó con las ocho cartas de la ronda
del hábitat, y el resultado está medido más abajo: el paquete cuadruplica el
daño directo y la vía **sigue sin abrirse**. No era falta de cartas, o no sólo:
70 de hábitat contra 10 trofeos no es una carrera pareja.

Pterosaurio (10 copias) y Marino (9) NO entran en esa cuenta a propósito: el set
los tiene como fauna que compartía paisaje, no como clados jugables, y forzarlos
a tribal pediría seis o siete cartas cada uno para algo que no ha pedido nadie.

## La ronda del hábitat: el paquete existe, la carrera no es pareja

Ocho cartas (16-09-2026) para el agujero que la tabla de aquí arriba señalaba
como el peor: **el hábitat era la única vía de victoria sin mazo posible**,
porque el set entero llevaba TRES copias de daño directo contra los 70 que hay
que bajar. Cinco cartas de ataque —Incendio estacional 5, Colapso del acuífero
2 por dinosaurio tuyo hasta 6, Patagotitan 4, Dreadnoughtus 3, Hatzegopteryx
2— y, porque el autor lo pidió en cuanto vio el paquete, sus **tres cartas de
freno**: Borealopelta con guardia 2, Zuul con guardia 1 y Sauropelta, que cura
4 al entrar.

Lo que movió en el set: daño directo al hábitat **de 13 copias a 56**,
curación de 18 a 30, guardia de 3 a 10. Y de rebote el Tireóforo pasa de 24
copias a 32, que era otro de los huecos de la tabla.

### Lo que NO consiguió, que es la parte que hay que leer

Se construyó el mazo de HÁBITAT y se midió con `node sim/arquetipos.mjs`, y el
resultado es el mismo por los dos caminos que se probaron:

| mazo | contra | gana | por qué gana |
|---|---|---|---|
| HÁBITAT | Referencia | 75,0 % | **trofeos 58 %**, hábitat 17 % |
| HÁBITAT | Control | 61,0 % | **trofeos 57 %**, hábitat 4 % |
| HÁBITAT | Molienda | 48,3 % | trofeos 26 %, hábitat 22 % |
| HÁBITAT | Entierro | 47,7 % | trofeos 29 %, hábitat 18 % |

El 17 % de victorias por hábitat contra la referencia es **la misma proporción
que la propia referencia** saca (22 %). O sea que el paquete hizo un buen mazo
y no abrió ninguna vía, que es exactamente el fallo contra el que avisa la
cabecera de `arquetipos.mjs`.

**Primer intento: quitarle los dientes.** Se rehízo el mazo con muros que no
matan —Brachylophosaurus 0/10, Loricatosaurus 0/8, Mamenchisaurus 1/11— para
que no pudiera ganar por trofeos aunque quisiera. Salió al revés: gana el
33,7 % en vez del 75 %, y sus victorias por hábitat BAJAN del 17 % al 11 %. Un
mazo que no mata tampoco baja el hábitat.

**Y ahí está el motivo, contado por el propio motor.** Instrumentando de dónde
sale cada punto de hábitat, por partida contra la referencia:

| mazo | de combate | directo | total | de 70 |
|---|---|---|---|---|
| REFERENCIA | 42,1 | 5,0 | 47,1 | |
| CONTROL | 49,9 | 8,1 | 58,0 | |
| **HÁBITAT** | 43,5 | **20,5** | **64,0** | |

El paquete funciona: **cuadruplica el daño directo**, de 5 a 20,5 por partida.
Lo que no puede es llevar el peso. Contra 70 de hábitat, 20 puntos son menos de
un tercio, y no hay margen para más: **el set entero suma 56 de daño directo**
—y eso metiendo las 17 copias en un mazo de 55, del que se ven unas 34 en trece
turnos—. Un mazo que fuera a por el hábitat con lo que hay se queda, en el
mejor de los casos, en la mitad del camino.

La prueba de que el problema no son las cartas la da el CONTROL: gana el 40 %
de sus partidas por hábitat con 8,1 de daño directo. **Las victorias por
hábitat son función de la VELOCIDAD, no del daño directo** — se gana por
hábitat cuando el rival no llega a poner cuerpos, y el mazo lento que le está
pegando a la cifra a propósito le da tiempo a ponerlos.

Conclusión, dicha para no volver a medirla: **con 70 de hábitat contra 10
trofeos la carrera no es pareja, y eso es una constante de balance, no una
carta.** Lo que el paquete sí hizo es que el hábitat pase de rebote a
REMATE — 64 de 70 por partida, contra los 47 de antes—. Para que sea un PLAN
hay dos caminos, y los dos son decisión del autor: bajar los 70, o meter otras
diez o quince copias de daño directo, que es media ronda más.

### El freno sí muerde, y sólo en su carril

Las tres cartas defensivas se midieron por separado, metiéndolas en la
referencia —ocho cartas dentro, ocho fuera, nada más cambia— y cruzándola
contra el mazo de HÁBITAT:

| la referencia… | el de hábitat gana | sus victorias por hábitat | hábitat que le baja |
|---|---|---|---|
| sin las tres | 75,0 % | 16 % | 64,0 de 70 |
| con las tres | 73,3 % | **6 %** | **55,2 de 70** |

Es lo que tiene que hacer un contador: **le quita nueve puntos de hábitat por
partida y le cierra la vía —del 16 % al 6 %— sin cambiar quién gana.** El mazo
de hábitat sigue ganando el 73 %, pero por trofeos. Un freno que además le
ganara la partida no sería un freno, sería la carta obligatoria.

Y el reparto de esos nueve puntos dice algo del diseño: los 20 de daño DIRECTO
no se mueven (20,5 → 20,0) y todo el descuento sale del combate (43,5 → 35,2).
Es correcto: **la guardia resta a cada golpe que llega por el campo y el golpe
directo no pasa por ahí.** El paquete de ataque perfora las guardias; lo que
las guardias hacen es que el hábitat no se caiga también por el otro lado.

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

**El Entrenamiento es la partida de emergencia del Duelo** (18-09-2026,
`src/data/entrenamiento.js`). Con nueve cuentas, buscar rival y no encontrar
a nadie es el caso normal: tres minutos de reloj y un «prueba más tarde».
Pasados `ENTRENAMIENTO.ofrecerMs` en la cola —treinta segundos— el panel
ofrece entrenar contra la IA, y lo vuelve a ofrecer después de rendirse.
Cuatro cosas que no se deducen del código:

- **Es una partida en solitario de las de siempre**, con un rival de
  `expediciones.js`: se graba, el servidor la re-juega por el tipo `victoria`
  y paga las monedas de una victoria normal. No toca el ELO —ni al ganar, ni
  al perder, ni al retirarse— porque el ELO sólo lo mueve `duelo_cerrar`.
  Nada nuevo viaja ni se empaqueta: el fichero no entra en la Edge Function y
  `test/entrenamiento.test.js` lo comprueba.
- **El rival se sortea entre los dos últimos nodos de cada mapa**, sin
  repetir el anterior: siempre «El último rey» sería monótono, y uno flojo no
  sería un sustituto del duelo. «Otra partida» tras un entrenamiento sortea
  otro (`siguienteEntrenamiento`), no vuelve al mapa: quien vino aquí quería
  un duelo y sigue sin haber nadie.
- **Pulsar el botón sale de la cola.** Seguir en ella mientras se entrena
  emparejaría a una persona con alguien a mitad de otra partida.
- **Paga lo mismo que cualquier victoria en solitario**, a propósito. Un
  extra «porque era un duelo» sería buscar, no encontrar y cobrar el extra
  contra la IA. Y como el rival es un nodo real, si el jugador tenía el
  anterior vencido y éste sin vencer, cobra su primera victoria como en el
  mapa: es la misma partida. Cuenta también como expedición jugada para las
  misiones, que lo es.

**Las ligas son el ELO con nombre**, en `src/data/ligas.js`: Triásico, Jurásico
y Cretácico con tres divisiones cada uno, y Extinción arriba. El número no se
enseña nunca; la barra de 0 a 100 dentro de la división, sí. El ELO lo calcula
la Edge Function con `eloTras()` —el mismo fichero que pinta la liga— sobre el
ELO de CADA UNO AL EMPEZAR el duelo, guardado en la fila, y no sobre el de
ahora: otro duelo cerrado entre medias no debe contaminar éste.

**La liga tiene escudo, temporadas y tabla** (16-09-2026, `0032_ligas.sql`),
y las tres reglas viven en `ligas.js` y las aplica la Edge Function al cerrar,
en este orden: reinicio de temporada sobre el ELO de partida, movimiento del
duelo, escudo. El SQL sólo guarda lo que ella decide (`escudo`, `temporada`).

- **El escudo son tres derrotas de margen en el umbral de LIGA**, no de
  división: mientras queden, perder en el umbral te deja en él y gasta una;
  subir de liga lo rellena (`conEscudo`). Bajar de Jurásico I a II es un mal
  día; bajar de Jurásico a Triásico es perder el emblema, y eso es lo que se
  protege. En la Extinción no hay escudo: de ahí se baja al Cretácico.
- **Las temporadas duran 28 días desde un lunes UTC y el reinicio es
  BLANDO**: el ELO vuelve a medio camino del inicial (`reinicioDe`). No hay
  proceso a una hora: lo aplica el cierre del PRIMER duelo de la temporada
  nueva, y `eloVigente(elo, temporada, hoy)` —que usan los dos lados— lo
  enseña antes. Una vez por salto, no una por temporada saltada. La función
  devuelve los ELO ya vigentes (`yo`, `rival`, `eloInicial`) para que la liga
  de antes y la de después del cierre sean la misma cuenta.
- **La tabla de la Extinción** es `tabla_extincion(p_desde)`: nombre, puesto
  y los puntos por encima del umbral, lo único de la liga que se enseña con
  número. El umbral lo manda el cliente porque vive en `ligas.js` y no hay
  copia en SQL —sólo decide qué filas se enseñan—. Devuelve el ELO crudo con
  su temporada y el cliente aplica el mismo reinicio que a sí mismo; como el
  reinicio conserva el orden, el puesto no cambia.
- **En un duelo avanzan ya TODAS las misiones**, también las de bajas, clados
  y clima: `duelo.js` lleva un parte por bando (`d.partes`) y lo anota en
  cada fase automática con el mismo `anotarEventos` del solitario —todo lo
  que una misión mide lo emiten esas fases—, y `partesDe(d)` lo cierra para
  la Edge Function. Un duelo abierto antes de que existieran los partes se
  encuentra sin ellos y cuenta desde donde está, que es mejor que romperlo.

## Las Expediciones: el solitario como un camino de rivales

«Fácil» y «Normal» llevaban el MISMO mazo, el de referencia; sólo cambiaba que
«Fácil» jugaba al azar. El solitario se sentía plano porque lo era. Ahora cada
formación geológica es un mapa con rivales en fila, cada uno con su mazo, y
ganar a uno abre el siguiente. Hoy hay CUATRO, encadenadas —la Morrison, Hell
Creek, Tendaguru y Kem Kem, ocho rivales cada una— y cinco visitantes de otras
eras que rotan por semana.

Tendaguru y Kem Kem llegaron el 16-09-2026, cuando las tres rondas de cartas
de ese día les dieron cuerpo propio (Giraffatitan, Rugops, Nigersaurus,
Deltadromeus, Ouranosaurus, los tireóforos nuevos). Con ellas se fueron los
visitantes de esas dos formaciones —un visitante de la misma formación que
una expedición es la expedición repetida— y entraron el río Judith y el
Nemegt. Curvas medidas con `node sim/expediciones.mjs` (lo que le gana EL
JUGADOR, con el mazo de referencia del 13-09): Tendaguru 100 → 91 → 88 → 72
→ 70 → 62 → 48 → 22; Kem Kem 92 → 89 → 77 → 66 → 67 → 44 → 42 → 28. Tres
mazos escritos «para ser duros» midieron
95–99 % y hubo que rehacerlos: el de eventos de molienda (la lección del
invierno del impacto, otra vez), el MURO de tireóforos con dos auras de Vida
—un muro de 0–2 de Ataque no muere, pero pierde por hábitat—, y la jauría de
terópodos pequeños. Lo que endurece contra la referencia es Ataque con
cuerpo más un aura, y los pterosaurios solos vuelan y no aguantan (96 %).
Los dos visitantes nuevos: el río Judith al 47 % y el Nemegt al 64 % tras
tres vueltas —77, 75, 71, 64: las cartas de Mongolia son cuerpos flojos y lo
único que lo bajó fue Dakotaraptor, la emboscada y la Sequía para el
Therizinosaurus—. Es el más suelto de los cinco, como lo era el del mar.

**Y esa misma noche cambió la vara** (ver «La vara del 16-09»): el mazo de
referencia que `sim/expediciones.mjs` juega como jugador es ahora el que
queda al 50 % contra los arquetipos, y las curvas medidas con él suben
10–20 puntos sin tocar un rival. Con 400 partidas por nodo: Morrison 100 →
100 → 97 → 91 → 86 → 82 → 68 → 55; Hell Creek 96 → 95 → 90 → 82 → 62 → 59
→ 41 → 36; Tendaguru 100 → 95 → 97 → 82 → 90 → 77 → 62 → 44; Kem Kem 96 →
95 → 92 → 86 → 88 → 60 → 64 → 47. Los visitantes, que se ajustaron para
rondar el 50 %, quedan entre el 70 y el 81 %. La escalera de cada mapa sigue
en el mismo orden y los nodos finales siguen siendo los duros; lo que se
movió es el listón contra el que se mide, y las cifras de los párrafos de
arriba son las de la vara vieja. Reajustar los rivales —o los visitantes,
que es donde más se nota— es trabajo aparte y pide decidir primero qué mazo
representa al jugador, porque el jugador no juega la referencia.

Cinco decisiones que conviene conocer antes de discutirlas:

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
  ajustaron midiendo hasta rondar el 50 %; los cinco caían entre el 48 y el
  58,5 % con la vara del 13-09, y entre el 70 y el 81 % con la del 16-09.
- **Las expediciones se encadenan con `requiere`, y no hizo falta regla nueva.**
  `requisitoDe()` devuelve, para el PRIMER nodo de un mapa encadenado, el
  ÚLTIMO del que lo abre. Es el requisito de siempre apuntando a otro sitio, así
  que el navegador lo pinta bloqueado y `aplicar_expedicion` no paga su primera
  victoria sin tocar ni una línea de SQL. Y el selector de mapa es una TIRA de
  fichas sobre el mapa, no una pantalla de atlas: una pantalla mete un toque más
  a cada visita para todo el mundo y con cuatro formaciones no lo paga.

Y dos cosas que Hell Creek volvió a enseñar midiendo, por si alguien las
discute otra vez:

- **Dos auras de clado apiladas es lo más fuerte del set.** Medusaceratops y
  Titanoceratops sobre marginocéfalos baratos ganaban el 85 % con un mazo que
  se escribió para ser el cuarto nodo. Los marginocéfalos son once cartas: la
  familia más honda, y por eso la que más se dispara.
- **Un mazo que sólo muele no gana, y encima estorba.** «El invierno del
  impacto» se escribió lleno de Trampa, Inundación y Deriva y PERDÍA el 82 %;
  a «Los blindados» se les probó la Sequía y la Trampa y empeoraron del 74 % al
  80 %. Con la extinción en el 0 %, las ranuras gastadas en moler son ranuras
  que no pegan.

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

## Los lugares: terreno por columna

El tablero eran cuatro ranuras enfrentadas y las cuatro iguales: la única
diferencia entre ponerte en la 1 o en la 3 era qué tenía el rival enfrente. Lo
único que cambiaba el campo era el clima, y lo cambiaba entero y para los dos.
Desde el 17-09-2026 **cada columna es un LUGAR distinto** —un río, un bosque,
una llanura—, sorteado al empezar con la misma semilla que baraja los mazos y a
la vista de los dos desde el turno 1. Idea del autor, con Marvel Snap delante:
allí las localizaciones se descubren una por turno; aquí van todas a la vista
desde el principio, porque el despliegue ya es a ciegas y esconder también el
mapa sería demasiada niebla.

Son DATOS, [`src/data/lugares.js`](src/data/lugares.js), con un vocabulario de
once FORMAS —`ataque`, `vida`, `cura`, `sinCuracion`, `espinas`, `sobrante`,
`guardia`, `golpeHabitat`, `inmovil`, `roba`, `muele`— que el motor aplica
donde toca: las cifras en `ataqueEfectivo` y `vidaMaxima`, la curación en
`curacionDe`, el sobrante y el golpe al hábitat en `faseCombate`, el robo en la
revelación y la molienda al final del turno. Poner un lugar nuevo es escribir un
objeto; una forma nueva son los cuatro sitios de siempre —aplicarla, enseñarla
en `efectosDe`, tasarla en `ai.js` (`valorDeLugar` y `BALANCE.valorLugar`), y
nombrarla en `FORMAS`— y `test/lugares.test.js` exige que toda forma la use
algún lugar y que todo lugar use sólo formas del vocabulario. Hoy son 17.

Seis decisiones que no se deducen del código:

- **El lugar es de la COLUMNA, no de la ranura.** Las dos ranuras enfrentadas
  lo comparten y vale igual para los dos bandos, como el clima. Por eso el
  duelo no tiene que darle la vuelta: `desdeMiLado` cambia los bandos y las
  columnas se quedan donde están, y `test/lugares.test.js` lo comprueba.
- **Se sortean DESPUÉS de los mazos y las manos**, con el mismo rng. Salen de
  la semilla, así que el servidor los re-juega igual sin que viajen en la
  petición; y al ir detrás, el reparto de cartas de una semilla es idéntico con
  lugares y sin ellos. Es lo que permite medir el tablero plano contra el de
  lugares con las mismas semillas y leer la diferencia como de los lugares.
- **Ninguno pregunta nada**, como todo lo que pasa en la revelación: el efecto
  está fijo y se aplica en la fase que toque.
- **Los escenarios de test son PLANOS.** `tablero()` en `test/helpers.js` borra
  los lugares: un test mide una carta, y un lugar sorteado por la semilla 42 le
  cambiaría las cifras sin que nadie lo pidiera. Cuatro tests de reglas
  fallaron por eso el primer día. Quien quiera un lugar lo pone a mano en
  `s.lugares[r]`, y el simulador lo fuerza por el sexto parámetro de
  `jugarPartida`.
- **La IA los tasa, o no existen.** Lo que suma Ataque o Vida entra solo en
  `statsDeCarta`, que ahora lleva la ranura; lo demás —robar, moler, curar,
  espinas, sobrante, guardia, golpe— pasa por `valorDeLugar` con su peso en
  `BALANCE.valorLugar`. Sin eso el Cauce seco sería una columna como otra y la
  IA se molería sola. Es la misma lección que `valorEntrada` y la Llanura.
- **La Ciénaga resta 1 además de inmovilizar**, porque `inmovil` hoy no muerde
  a nadie: no queda ninguna carta con el rasgo Migrador. Sin el −1 sería un
  lugar que no hace nada, que es lo que el test no deja escribir. La regla del
  movimiento queda puesta para el día que vuelva un migrador, y va ANTES que
  el rasgo en `validar`: es la columna la que no deja.

- **Cada lugar tiene un COLOR, y vive en `piel.css`, no en `lugares.js`.**
  El botón de la tira iba con un velo translúcido sobre el medallón del
  campo, que es ámbar y brillante en el centro: las dos columnas de en medio
  no se leían y las de los lados sí. Ahora el botón es opaco y teñido, y las
  dos ranuras de la columna llevan el mismo tinte —el rótulo de la vacía y un
  halo alrededor de las dos—, que es lo que une la carta puesta con su lugar.
  El tinte NO está en el dato porque `lugares.js` entra en el paquete de la
  Edge Function y un color allí costaría re-anclar y desplegar por algo que
  sólo pinta; `test/lugares.test.js` exige que todo lugar tenga el suyo y que
  no haya dos iguales. El nombre se queda en crema: la sal y el cielo son casi
  blancos y un rótulo de 8,5 px en ese color no se leería.

- **Todo lo que un lugar HACE lo cuenta un evento `LUGAR`** (18-09-2026), no
  sólo robar y moler: `cura`, `sinCuracion`, `espinas`, `sobrante`, `guardia`
  y `golpeHabitat`, con `efecto` y `n`. Antes la cura del Bosque o el ×2 de
  la Llanura pasaban en silencio y sólo se veían en los números, que es el
  mismo agujero que tuvieron las habilidades al entrar. El guión los enseña
  SOBRE EL BOTÓN del lugar (`api.lugar(r)`, gesto nuevo), que es lo que une
  la columna con su efecto. Lo que suma a las cifras —Ataque, Vida— sigue sin
  evento, como un aura. Dos detalles: las espinas del terreno las llevan los
  dos, así que se dicen una vez por columna y sin `jugador`; y el golpe al
  hábitat pasa por `golpeConLugar()` en `resolve.js`, que hace la misma cuenta
  que `danoAlHabitat` y además avisa, porque `danoAlHabitat` la usa la IA y no
  puede emitir nada. `test/lugares.test.js` prueba los seis y que en el
  tablero plano no sale ninguno. **En producción desde el 18-09-2026**: la
  PR #121 se mergeó con MERGE, la función quedó anclada a `cbdf802`, el
  commit de merge, y se desplegó por MCP como v32 (`ezbr_sha256` de
  `e01728d6…` a `6106f548…`); el despliegue resolvió los importes por URL.
  Sólo cambia qué eventos salen, no un resultado: una partida jugada con la
  v31 y cobrada por la v32 da el mismo ganador y el mismo daño.

- **La ranura vacía puede llevar la TEXTURA de su lugar** (18-09-2026), por
  dentro del marco de latón. Los originales van a `src/piel/lugares/<id>.png`
  —prompts en `assets/PROMPTS.md`, «Los lugares: la textura de la ranura»—
  y `python tools/lugares.py escribir` los recorta a la ventana de la ranura,
  los apaga un poco para que el rótulo se lea, los escala y escribe
  `assets/piel/lugares/indice.json`. El juego lee el ÍNDICE y sólo pide los
  ficheros que nombra, como las expediciones: una textura que falta no es un
  404, es la piedra de siempre. Los cuatro porcentajes de
  `.ranura[data-lugar-arte]` en piel.css son la ventana que mide la
  herramienta, no una estimación. `test/lugares.test.js` exige que todo
  lugar tenga su regla, que el índice sólo nombre lugares con fichero y que
  ningún WebP esté en disco fuera del índice. **Las diecisiete llegaron el
  18-09-2026**, en cuatro tandas (PRs #125 a #128), todas a 1145×1374 y sin
  nada centrado que el recorte a 0,72 partiera; la Nidada, la única con
  «algo», trae los huevos repartidos y aguanta el recorte.

Y lo que se apaga por entorno para medir, como las ranuras y el sobrante:
`DINOWAR_LUGARES=0 node sim/run.js`. En el navegador no hay `process` y
siempre juega con ellos; ponerlo en el servidor le haría re-jugar otro tablero.

### Medidos antes de darlos por buenos

`node sim/lugares.mjs`, y lo que salió está en `LUGARES.md`. Las dos preguntas:

**¿Qué le hacen al juego?** Casi nada, y eso es lo que tenía que salir. Plano
contra sorteo, 2.000 partidas por tanda y DOS semillas, porque a 600 partidas
la bola de nieve parecía bajar 3,5 puntos y no era verdad:

| semilla | tablero | turnos | inicial | bola | vías |
|---|---|---|---|---|---|
| 1 | plano | 11,1 | 45,6 % | 71,7 % | 26 / 74 / 0 |
| 1 | lugares | 10,6 | 46,0 % | 70,6 % | 28 / 72 / 0 |
| 5001 | plano | 11,0 | 46,7 % | 71,6 % | 27 / 73 / 0 |
| 5001 | lugares | 10,7 | 45,6 % | 72,3 % | 28 / 72 / 1 |

La duración baja cuatro décimas las dos veces; el inicial y la bola de nieve
se mueven un punto y en direcciones OPUESTAS según la semilla, o sea ruido. Los
seis números de `BALANCE.md` siguen hablando del mismo juego: **ningún lugar por
sí solo domina la partida** cuando cae en una columna de cuatro. Si alguien
mide una baja de la bola de nieve con los lugares, que mire cuántas partidas y
cuántas semillas: la de 600 era de 3,5 puntos y se fue con la muestra.

**¿Cuál no cambia nada y cuál decide solo?** Cada lugar forzado en las CUATRO
columnas (300 partidas) enseña lo que haría si fuera el tablero entero:

| lugar | en las cuatro | atracción a solas |
|---|---|---|
| **Ladera volcánica** (+2 a todos) | 8,6 turnos, **94 % hábitat** | **1,74** |
| Nidada (roba 1 al revelar) | 8,9 turnos, 83 % trofeos | 1,41 |
| Barranco (+1 al hábitat) | 9,2 turnos, 89 % hábitat | 1,52 |
| Cauce seco (muele 1 por turno) | **43 % extinción**, bola 57 % | **0,63** |
| Desfiladero (−1 al hábitat) | 12,8 turnos | **0,54** |
| Ciénaga (−1 a todos) | 12,6 turnos | 0,58 |
| Bosque, Cazadero | sin mover el juego | 1,36 |
| Río, Acantilado, Salinas | idénticos al plano | 1,00 |

- **La ladera es el más influyente**, con diferencia: +2 en las cuatro
  columnas convierte la partida en una carrera al hábitat de ocho turnos. En
  una columna es el sitio al que van todos (1,74). Se dejó en +2 porque el
  sorteo entero no mueve el balance; si algún día hay que tocar uno, es éste.
- **El Cauce seco es el único que abre la extinción** —del 0 % al 43 % con el
  tablero entero— y la IA lo evita (0,63), que es lo que debe: ocupar la
  columna cuesta mazo. Es también el único que baja la bola de nieve.
- **El Desfiladero es el más evitado** (0,54): un punto de guardia en una
  columna vale menos que cualquier otra columna. Puede que la IA lo tase de
  más; medido en victorias no se ha mirado.
- **Río y Acantilado salen en 1,00 porque el mazo de referencia no lleva
  marinos ni pterosaurios.** No es que no hagan nada: es que aquí no hay a
  quién. Lo mismo que la molienda en `sim/carta.mjs`, un piso más abajo.

Y lo que NO mide, por si alguien lo lee de más: todo esto es el mazo de
referencia contra sí mismo. Lo que un lugar vale para un mazo que lo busca —un
mazo de marinos con el Río, uno de molienda con el Cauce— sólo se verá cuando
exista ese mazo.

**En producción desde el 17-09-2026.** La PR #116 se mergeó con MERGE y no con
squash, la Edge Function quedó anclada a `de7ccf8`, el commit de merge, que vive
en `main`, y se desplegó por MCP como función v31: el `ezbr_sha256` pasó de
`01935043…` a `e01728d6…`, y el despliegue resolvió los 25 importes por URL
—el paquete lleva `lugares.js` desde esta tanda—, que es lo que falla primero
cuando jsDelivr no ve un fichero. La prueba de humo con la extensión `http`
no se pudo hacer desde aquí: el SQL de la sesión era de sólo lectura y no deja
crear la extensión. Queda por confirmar con una partida cobrada.

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

El motor emite **decenas de tipos de evento** —hoy treinta y seis, y el número
sube con cada tanda de cartas, así que no se escribe en ningún comentario: lo
cuenta `test/guion.test.js` leyendo el motor—. Durante mucho tiempo se
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

## La previsión del combate: lo que pasa si nadie cambia nada

[`src/ui/prevision.js`](src/ui/prevision.js) (18-09-2026). Antes de pulsar
Listo, cada carta tuya lleva al pie lo que le va a pasar —«mata», «muere»,
«ambos caen», «choca» o el «−N» que le entra al hábitat rival—, la carta rival
que te llega lleva el «−N» que te entra a ti, y junto a cada cifra de hábitat
sale cuánto bajará. Hasta hoy el jugador echaba esas cuentas de cabeza y el
tablero sólo tenía el borde `pasa` del carril abierto.

- **No inventa reglas: JUEGA el turno sobre una copia** con el mismo motor
  —los dos listos, revelación, combate— y lee los eventos. Es lo que hace
  que cuente tus despliegues pendientes, las entradas, las auras y los
  lugares sin repetir nada. Lo que simula es exactamente lo PÚBLICO: ninguno
  de los despliegues del rival, que en un duelo la vista no trae y contra la
  IA todavía no ha hecho. Por eso se llama «si nadie cambia nada».
- **La vista de un duelo no tiene rng** y la copia se pone uno fijo: lo que
  sortea la revelación no cambia el combate y la copia no toca nada. Si la
  revelación no se puede simular —una entrada tuya que muerde un mazo rival
  que la vista trae como cifra— cae a simular sólo el combate con lo puesto.
- **Calla cuando no toca**: fuera del despliegue, ya en Listo, en el turno
  sin combate y con el campo vacío devuelve null y `render.js` borra todo.
- La etiqueta va en `data-prevision` de la ranura y la pinta un `::after`
  con `.ocupada` en el selector, para pesar más que la raya de la ranura
  vacía de piel.css y que el «+» del destino al arrastrar.
- **Va sobre la ventana de la ilustración y con el sujeto puesto.** La
  primera versión iba al pie y tapaba el Ataque y la Vida, que es justo lo
  que se mira para entenderla; y decía «mata» y «−3», que el autor leyó como
  «la mía muere» y «pierdo tres». Ahora es «lo mata», «muere», «ambos caen»,
  «aguanta», «pega 3» y, en la carta rival, «te pega 4». Las cifras con signo
  se quedan junto a las barras de hábitat, donde el signo sí es tuyo.

## El marcador reacciona: mazo-reloj, mano encendida y contadores que laten

Tres cosas de interfaz (18-09-2026), todas sin motor y por tanto sin re-anclar:

- **La pila del mazo es un reloj.** El taco de debajo asoma según `--grosor`
  (4 a 0, lo escribe `pintarPila` con la cuenta sobre `BALANCE.tamanoMazo`):
  a 55 es un taco y con cuatro es una carta suelta. Al cruzar `MAZO_AVISO`
  —cuatro turnos de robo, que la extinción ya es una vía real— flota una vez
  «N turnos» y después el contador late en rojo hasta el final. Se avisa
  UNA vez por cruce, con `avisoMazo` por bando; al empezar otra partida la
  cuenta vuelve a 55 y el aviso se rearma solo.
- **La mano dice qué se puede jugar AHORA.** `jugable` sale de `legales()`
  filtrado a las acciones que juegan una carta —desplegar, evento, clima,
  recurso, Biomasa—, así que la mano no repite ninguna regla: cuenta la fase,
  la Biomasa, los huecos y los objetivos. Una carta pagable sin hueco se queda
  apagada sin atenuarse, que es otra cosa que «no llegas». La robada destella
  al aterrizar: el CSS arranca la animación cuando `volar` le quita
  `en-vuelo`, y `render.js` retira `nueva` pasado el vuelo más `NUEVA_MS`.
  Las retiradas del campo no destellan: ya sabías cuál era.
- **Trofeos y hábitat.** Cada MUERTE hace flotar «+1» sobre el contador del
  otro bando a la vez que cae la carta —en `animarCombate`, no en el
  repintado, que llega medio segundo después—, y hay gesto `enTrofeos` en el
  API del guión para lo que venga. A dos trofeos del final el contador se
  enciende (`cerca`). El hábitat destella la barra con el número al recibir
  golpe —un `::after` blanco sobre el relleno, no un `filter`, que piel.css
  usa el filtro del relleno rival para girarle el tono— y por debajo del
  cuarto late (`peligro`): el tuyo en rojo y el del rival en oro.

Todo lo que late va apagado con `prefers-reduced-motion`, en el mismo bloque
que el resto de gestos.

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

**El intro se QUITÓ** (16-09-2026). Fue un plano de quince segundos de un
Allosaurus que se enseñaba una sola vez, entre la carga y el menú, y al autor
no le convenció: se fueron `intro.mp4`, `precargarIntro()`, `mostrarIntro()` y
la marca `dinowar.intro.visto` de `localStorage`. Lo que sobrevive de aquello
es `videoDeCarta()`, que sigue devolviendo si llegó a verse y aceptando el
rótulo del botón, porque la Cuenca la usa para las cartas de jefe.

Quien vuelva a proponer una cinemática de arranque tiene el historial completo
en el git; lo que se aprendió midiendo —que el reloj de la marca arranca cuando
la imagen está descargada, que un vídeo se pide cuando las piezas del menú ya
están y que lo que no llega no se hace esperar— sigue valiendo, y está aquí
abajo.

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
la marca de agua de Kling, que borra `delogo` antes de escalar: el de Kling
llegó a 14 MB y se sirve en 1,2. Si dura más de diez segundos se corta por el
PRINCIPIO, que el último fotograma es sobre el que aparece la carta — salvo lo
que esté en `SIN_TOPE`, que no es una carta sino una pieza montada y cortarle
el principio la destroza.

**La marca de agua ESCALA con el cuadro**, aunque durante nueve vídeos
pareciera que no: los primeros lotes vinieron todos a ~1176 de ancho y unos
píxeles fijos valían. El intro llegó a 1916×1080 con la marca de 187×36 en vez
de 138×26, y el rectángulo fijo dejaba fuera 51 píxeles por la izquierda. Por
eso `MARCA` va en PROPORCIÓN del cuadro. Y medirla no es cosa de ojo: la marca
es lo ÚNICO del plano que no se mueve, así que sale de la varianza por píxel
entre una decena de fotogramas repartidos —quieto y claro es marca, quieto y
oscuro es fondo—.

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
salía en un sobre. Las legendarias con criatura lo tienen todas —las tres del
16-09-2026, Carcharodontosaurus, Giraffatitan y Patagotitan, llegaron ese mismo
día—; una que se añada sin él sale del sobre volteando la carta sin más, que es
lo que hace el juego cuando el fichero no está. La cuenta no se escribe aquí,
se mira con `ls assets/video`. Hubo un vídeo de relleno para las que no tenían el
suyo y se quitó: el autor prefiere que una legendaria sin vídeo salga sin
vídeo.

**Y el vídeo es de ANIMALES, no de paisajes.** Se probó a darle a cada
expedición dos cinemáticas —una al entrar en la formación y otra al cerrarla,
con el impacto del Cretácico de remate— y se quitó antes de escribir ninguna:
el generador entrega bien un plano corto de un bicho, y un plano de paisaje no.
El código llegó a existir y se deshizo entero (15-09-2026); si alguien vuelve a
proponerlo, lo que falla no es el sitio donde se enseña, es la pieza.

**El INTRO del arranque fue la prueba de que la regla era ésa y no «nada de
cinemáticas»:** un plano de quince segundos de un Allosaurus bajando por un
cauce, mismo encuadre que las legendarias con vídeo y sólo que más largo, y salió
bien al primer intento. Se quitó igualmente el 16-09-2026 porque al autor no le
gustó cómo quedaba en el arranque — la pieza estaba bien, el sitio no. Ver «Lo
primero que se ve», más arriba.

**Las dos cartas de jefe también tienen vídeo**, y se enseña al RECLAMARLAS en
la Cuenca, antes de la invocación: es la única vez que esa carta «sale», así
que es su momento. La capa del vídeo es la misma que la del sobre —`mostrarVideo()`
y `videoDeCarta()` en `apertura.js`, exportadas—; una carta sin vídeo resuelve
en el acto porque el 404 llega antes que cualquier `canplay`.
`python tools/videos.py escribir <ids>` convierte sólo los nombrados: sin
nombres re-codifica los nueve y cambia sus bytes sin cambiar nada que se vea.

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

- **Un cuadrado que gira sólo cubre siempre su CÍRCULO inscrito.** Los rayos
  de la invocación son una textura cuadrada rotando, y `rayos.webp` llega
  brillante hasta el canto —235 de 255 a cuatro quintos del radio—: en
  `screen` sobre el velo, ese corte duro se veía dar vueltas detrás de la
  legendaria, que era justo lo que no tenía que verse. Va recortada con una
  máscara redonda por dentro del círculo inscrito, y el lado sube para que el
  disco opaco llegue donde llegaba el cuadrado. Cualquier capa que gire pide
  lo mismo.
- **Un `max-width` no recorta el margen.** Las dos capas se centraban con
  `width: 150vmin` y `margin: -75vmin`, con un tope en píxeles encima: en
  cuanto el tope mordía, la caja encogía y el margen no, y la ceremonia entera
  salía descentrada arriba y a la izquierda. El lado va en una variable y el
  margen se calcula de ella.

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

## La presentación: quién contra quién

[`src/ui/presentacion.js`](src/ui/presentacion.js). Antes de cada partida la
pantalla se parte en diagonal —el rival arriba, tú abajo— con estandarte,
emblema de clado, la portada del mazo como retrato, nombre y liga; en la
costura, el VS, el modo y el objetivo. 2,6 s, 1,6 en un duelo, y un toque la
salta. En la primera partida no sale: manda el tutorial.

- **El reloj, la entrada y el bucle esperan a que se vaya.** `partidaVigente`
  impide que una presentación vieja arranque su partida sobre una nueva.
- **No dice quién empieza**, a propósito: el despliegue es simultáneo y
  `compensacionSegundoJugador` vale cero cartas. «Tú empiezas» sólo
  desempataría una igualdad absoluta, y enseñarlo sería mentir.
  `test/presentacion.test.js` falla si alguien lo añade.
- El rival de un duelo sale sin retrato ni emblema: su mazo es secreto.
- Mismo interruptor de arte que el final (`ARTE_LISTO`), con sus piezas en
  `assets/piel/vs/`. El VS reutiliza el medallón del final.

## Tres criaturas legendarias por mazo, y ni una más

Decisión del autor (16-09-2026). El tope por carta ya era 1, así que hasta ese
día quien tuviera la colección entera metía las **nueve** legendarias del set
más las cinco de jefe: catorce cuerpos enormes en 55 cartas, y quien las
tuviera jugaba otro juego. Ahora `BALANCE.legendariasDinoPorMazo` vale 3 y se
cuenta entre todas.

Cuatro cosas que conviene saber antes de tocarlo:

- **Es un tope de FAMILIA, no de rareza.** Cuenta lo que es criatura Y
  legendaria: las de jefe entran —ganarlas cooperando no las hace otra cosa— y
  las legendarias de soporte no, porque lo que se acumula es el cuerpo. Vive en
  `esLegendariaDino()` y `legendariasDinoEn()` de `coleccion.js`, con UNA
  implementación, que es lo mismo que se hizo con `limiteDe()`.
- **Lo comprueban los dos lados, y por los dos motivos de siempre.** El
  navegador (`validarMazo`, y el editor, que ya no deja pulsar el «+»), la Edge
  Function (`validarMazoLegal`) y el SQL (`private.validar_mazo`, 0031). Sin el
  servidor, un cliente hostil guarda el mazo por la puerta de atrás; sin el
  navegador, el jugador se come un «no se pudo guardar» sin motivo.
- **El número no se escribe en el SQL**: sale de
  `catalogo_economia.legendarias_dino_max`, que pone la 0006 regenerada desde
  `BALANCE`. Al aplicar: **primero la 0006, luego la 0031**, que la segunda lee
  esa columna. Y la 0006 la añade con `add column if not exists`, que la tabla
  ya existe en producción.
- **La factura, medida antes de cobrarla**: en producción sólo había UN mazo
  guardado por encima del tope, y es el mazo «PRUEBA» del propio autor con las
  nueve. Cualquier mazo así deja de poder guardarse y de cobrar partidas hasta
  que se reedite. Con ocho jugadores es un rato; el día que sean ochocientos,
  esta clase de cambio pide una migración que los recorte.
- **Aplicado y desplegado el 16-09-2026.** Las dos migraciones están en
  producción y la Edge Function está anclada a `68a5091`, que vive en `main`
  porque la PR #103 se mergeó con MERGE y no con squash. El despliegue se
  comprobó con la receta de `supabase/functions/README.md`: invocada desde la
  propia base con la clave publicable contesta `401 {"error":"sesión
  inválida"}`, que es la prueba de que los once importes por URL resolvieron y
  el código vivo es el nuestro.

Y hubo que tocar un mazo de la IA: **«El último rey» llevaba cuatro** —
Tyrannosaurus, Ankylosaurus, Edmontosaurus y Mosasaurus—, o sea un mazo que
ningún jugador podría construir, y un rival de expedición no juega con cartas
prohibidas. Se fue el único marino de una lista de Hell Creek y entró un
Alaskacephale, que las dos auras de marginocéfalo del mazo ya estaban puestas.
Medido con `node sim/expediciones.mjs`, 400 partidas: se le ganaba el 21,8 % y
se le gana el 24,5 %. Sigue siendo el nodo más duro del juego y la curva no se
movió de sitio.

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
- **La mejora del yacimiento se paga A PLAZOS** (18-09-2026, `0034`). El botón
  «Mejorar · 300» llevó apagado desde el primer día para todo el mundo, y no
  era el botón: la mejora se paga del DEPÓSITO y el depósito de nivel 1 se
  llena a 168, así que 300 no se juntan nunca; la escalera entera, 300·n²,
  está por encima del tope en todos los niveles y `test/yacimiento.test.js`
  lo deja escrito. Bajar el coste hasta que quepa habría hecho de cada nivel
  un día de producción. Lo que hay es «Invertir en la mejora · N», que pone
  lo que hay hasta lo que falta, en `yacimientos.invertido`, y sube el nivel
  al juntar el coste. No se puede sacar: es una obra, no una hucha. La firma
  de `mejorar_yacimiento()` no cambió y `tribu.js` tampoco, así que ni
  catálogo nuevo ni re-anclaje; `estado_cuenca` se reescribió con
  `pg_get_functiondef` para añadir la clave, como la 0018.
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

### El mazo inicial se elige

Una cuenta nueva elige uno de tres mazos —Cazadores, Gigantes, Manadas; uno
por clado— y esa es su colección de salida entera. Los datos están en
[`src/data/iniciales.js`](src/data/iniciales.js), la pantalla en
`src/ui/iniciales.js` y el servidor en `0023_mazo_inicial.sql`.

- **`entrar()` ya no siembra.** Siembra `elegir_mazo_inicial(p_mazo)`, que sólo
  recibe el id: las cartas salen de `catalogo_iniciales`, que genera
  `tools/generar-cartas.mjs` en la 0006. El cliente enseña la elección cuando
  `mi_perfil` dice `sembrado: false`, así que una cuenta que se cerró sin
  elegir la ve al volver.
- **Al aplicar: primero la 0006 regenerada, luego la 0023.** La 0023 lee una
  tabla que crea la 0006. Y el cliente trata un perfil sin `sembrado` como
  sembrado, así que el navegador puede publicarse antes que la migración.
- **Los tres llevan el soporte y la Biomasa del mazo de referencia** y sólo
  cambian las 28 criaturas: lo que se mide es el clado. Medidos con
  `node sim/iniciales.mjs 400`, todos los cruces entre iniciales quedan entre
  el 45 y el 55 %. Veintitrés muros de saurópodo ganaban el 69 %; los
  comentarios de cada lista dicen qué se cambió y cuánto movió. Contra la
  referencia del 16-09 ganan el 31–33 % (45–55 % contra la del 13-09): es la
  vara la que endureció, y lo que se calibra es el cruce entre ellos.
- Los otros dos no se regalan. Sus cartas siguen saliendo en los sobres, y la
  idea es que un día se puedan ganar con misiones.

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

### Logros: de una vez, y pagan con lo que no se compra

[`src/data/logros.js`](src/data/logros.js) es el catálogo: miden los mismos
contadores que las misiones (`VOCABULARIO`), acumulados para siempre en vez
de por día, y lo que dan no son monedas: un **título** (un cosmético
`exclusivo`, que se otorga y no se vende), **un mazo inicial más** a elegir
entre los que no se tienen (`mazos_extra`), o **sobres gratis**
(`sobres_gratis`, que `aplicar_sobre` gasta antes que las monedas). La
recompensa viaja en la llamada como la meta y el premio de una misión, y
`private.avanzar_logros` (0027) apunta y entrega. Cuatro cosas:

- **Los asaltos y los duelos ya avanzan misiones y logros**, sin parte: el
  servidor sabe que se asaltó, cuánto daño hizo y si fue el golpe final
  (`asaltos`, `danoJefe`, `jefesVencidos`), y quién ganó el duelo (`duelos`,
  `duelosGanados`, y también `partidas` y `victorias`). El asalto llama a
  `aplicar_avances` aparte de `aplicar_asalto`, que conserva su firma;
  `duelo_cerrar` recibe los avances de cada bando. Un duelo cuenta ahora como
  partida jugada para «juega 3 partidas».
- **«Vence al jefe con tu tribu» es «da el golpe final»**: lo que el servidor
  puede saber sin repartir méritos. Y la primera victoria contra un rival de
  expedición (`expedicionNuevos`) la dice `aplicar_expedicion`, que por eso
  va ANTES de `aplicar_partida` en `hacerVictoria`.
- **Las cuatro misiones diarias de jefe y de duelo pueden tocar un día en que
  no se cumplen** —sin jefe abierto, sin nadie conectado—. Se aceptó: es lo
  que las hace pedir algo. Pagan por debajo de la relámpago para que el peor
  día siga en el techo.
- **Los trofeos de jefe se ganan al RECLAMAR la carta, no con el golpe
  final** (0028): el retrato de cada jefe con su primera carta, y el dorso
  «Cazador de jefes» con las dos. Así es de quien le pegó a una cacería que
  la tribu terminó, y no sólo de quien la remató. `reclamar_jefe` es SQL y no
  pasa por la Edge Function, así que lleva una COPIA del catálogo de logros
  (`private.catalogo_logros()`) que `test/logros.test.js` compara con
  `logros.js`: si añades un logro, regenera esa copia en una migración nueva.
- **La 0028 contó lo jugado antes de que existieran los logros**, hasta el
  despliegue de la función que empezó a apuntarlos (2026-09-15 02:38 UTC):
  victorias, duelos, asaltos, daño, expediciones y cartas de jefe. El golpe
  final no se puede reconstruir y no se contó.
- **Los logros de «entera» miden un contador POR MAPA** (`expedicion:<id>`,
  0033, 16-09-2026), no `expedicionNuevos`: ése suma también las primeras
  victorias del visitante de la semana, y con él siete nodos y un visitante
  pagaban «la Morrison entera». El contador lo escribe la Edge Function con
  el mapa del rival que devolvió la re-jugada (el visitante no tiene mapa y no
  cuenta), y el vocabulario lo saca de `EXPEDICIONES`: un mapa nuevo trae su
  contador solo. La Morrison cambió de contador conservando el progreso de
  cada cuenta; Hell Creek, Tendaguru y Kem Kem pagan SOBRES y no un mazo,
  porque sólo hay dos iniciales que no elegiste y ya los dan la Morrison y los
  25 duelos. La 0033 recuenta lo ya recorrido de `expediciones_victorias` y lo
  pasa por `avanzar_logros`, que es quien entrega. **Aplicada y desplegada el
  16-09-2026**: función v30 anclada a `dfbc21f` (el commit de merge de la PR
  #115, en `main`), `ezbr_sha256` de `e6cc5de9…` a `01935043…`, y la receta
  de `supabase/functions/README.md` contesta `401 {"error":"sesión
  inválida"}`. El recuento no entregó nada: nadie había vencido aún a un
  rival de esos tres mapas.
- **`avanzar_logros` ya no da por cobrado un tipo de recompensa que no
  entiende.** La 0027 lo marcaba cobrado y no entregaba nada: por eso toda
  recompensa nueva pide antes su `when` en SQL y después desplegar.
- **`iniciales_tomados` recuerda qué mazos iniciales se tienen.** Las cuentas
  de antes de la 0023 no eligieron ninguno y tienen los tres disponibles; el
  crédito de `mazos_extra` se gasta en la misma pantalla de la cuenta nueva
  con «Ahora no» para dejarlo. Las cartas se SUMAN a la colección.

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

### El crafteo: lo que sobra se funde en esquirlas

Decisión del autor del 15-09-2026: **las copias sobrantes ya no dan
dinomonedas**. Las monedas salen de jugar y compran sobres; lo que sobra se
funde en **esquirlas**, y con esquirlas se CREA la carta que eliges, que es
el camino gratis y lento. [`src/data/crafteo.js`](src/data/crafteo.js) tiene
los números y `0029_crafteo.sql` las dos funciones. Cuatro cosas:

- **Una esquirla para todas las rarezas, y el coste va por rareza.** Se pidió
  «craftear de su misma rareza» y no puede funcionar: `abrirSobre` reparte
  sobre todo lo que te falta, así que las sobrantes de una rareza escasean
  hasta que la tienes ENTERA. Con una esquirla por rareza casi no habría nada
  que crear; con una sola, las comunes completas pagan las raras y épicas.
- **El sobre mira la colección en el 70 % de sus cartas, no en todas**
  (`ECONOMIA.sesgoFaltan`, 16-09-2026). Con el sesgo entero no salía una
  repetida mientras faltara algo de esa rareza, y eso tenía dos facturas que
  se midieron con 400 cuentas simuladas sobre las mismas semillas: la
  colección entera caía en 116 sobres, y el crafteo no pintaba nada —64
  esquirlas en 50 sobres, crear cartas la acortaba de 122 a 116—. El sorteo
  de Pokémon TCG Live (puro azar, lo repetido se funde) alarga la colección a
  181 sobres pero deja más de la mitad de las épicas y legendarias en
  repetidas. Al 70 %, cada carta decide por su cuenta si mira la colección
  —una moneda por sobre daría sobres enteros «buenos» y «malos»—: el 81 % de
  los hits sigue siendo nuevo, se juntan 578 esquirlas en 50 sobres, la
  legendaria que ELIGES es alcanzable hacia el sobre 71 y la colección dura
  126. Se descartó filtrar sólo las legendarias (las épicas repetidas
  alargaban el set a 148 con el 62 % de hits nuevos). Y sigue sin haber
  garantía de legendaria cada X sobres: un 5 % de las cuentas pasa 34 sobres
  seguidos sin una; un pity de 15 la deja en 14 sin mover nada más, y se
  midió pero no se pidió.
- **Los números empezaron siendo los de Hearthstone** (fundir 5 / 20 / 100 /
  400, crear 40 / 100 / 400 / 1600) y el autor los subió con el sesgo: fundir
  10 / 30 / 150 / 400 y crear 80 / 200 / 500 / 1600, la legendaria como
  estaba. Fundir una copia siempre da menos que crear otra de su rareza, y
  `crear_carta` sólo deja llegar al tope de copias: lo creado nunca vuelve a
  ser sobrante. `test/crafteo.test.js` vigila las dos cosas y que el SQL del
  catálogo lleve estos números; **cambiarlos es regenerar la 0006 Y
  aplicarla**, que el servidor cobra de `catalogo_crafteo` y no del código.
- **Vive fuera de `coleccion.js`** porque ese fichero va en la Edge Function.
  `ECONOMIA.fusion` y la columna `valor_fusion` se QUEDARON sin uso en el
  servidor; quitarlos pide re-empaquetar, re-anclar y desplegar, y se dejaron
  para no hacerlo por nada.
- **El botón de crear sólo sale si te llegan las esquirlas.** En cada hueco que
  le falta a quien empieza habría sido un muro de botones apagados.

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

**esbuild se come los comentarios, y aun así un comentario cuesta un
despliegue.** Se corrigió un recuento desfasado en la cabecera de
`mecanicas.js` —decía «16 cartas de soporte» cuando eran 49— y el paquete
regenerado salió IDÉNTICO salvo la línea de huella: el código que corre en el
servidor no cambia ni un byte. Pero `test/anclaje.test.js` compara los FUENTES,
no el bundle, así que salta igual y hay que re-anclar; y re-anclar sin desplegar
deja el anclaje apuntando a un commit que no es el desplegado, que es justo lo
que no se puede hacer. O sea: **un comentario dentro de un fichero del paquete
cuesta el ciclo entero**. Conviene saberlo antes de escribirlo, no después: lo
que no sea necesario ahí, mejor en `CLAUDE.md`, que no entra en el paquete.

Y se comprobó: **desplegado el 16-09-2026 anclado a `32bb495`**, con la receta
de abajo —401 «sesión inválida»—. El `ezbr_sha256` cambió, como siempre; lo que
NO cambió fue una sola línea del código que corre.

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

## La tienda: cosméticos con dinomonedas

La regla del autor manda sobre todo lo de esta sección: **«no es un pay to
win, sólo se comprarían cosas estéticas»**. Nada de la tienda cambia una
carta, un mazo ni lo rápido que se progresa.

- **El catálogo es un DATO**, [`src/data/cosmeticos.js`](src/data/cosmeticos.js),
  y el generador lo escribe en la 0006 (`catalogo_cosmeticos`). Cada tipo tiene
  un artículo gratuito, que es lo que el juego enseñaba antes de la tienda.
- **Cobra el servidor**, `comprar_cosmetico(p_id)` en la 0024: sólo recibe el
  id, lee el precio del catálogo y bloquea la fila del jugador. `equipar_cosmetico`
  sólo deja ponerse lo comprado o el gratuito. Orden al aplicar: la 0006
  regenerada y luego la 0024.
- **Lo equipado se aplica con variables CSS en la raíz** desde `pintarMenu()`,
  que se repinta al sincronizar: `--dorso`, `--tapete`, `--tapete-medallon`,
  `--estandarte-propio`, `--cinta-propia`. Cada regla conserva lo de siempre de
  reserva, y `test/tienda.test.js` lo comprueba.
- **Lo del rival viaja por una función de lectura**, `equipado_en_duelo(p_duelo)`
  (0025), que sólo contesta a quien está en ese duelo y sólo con lo equipado.
  No va en la Edge Function a propósito: tocarla es re-empaquetar, re-anclar y
  desplegar. El cliente la pide al empezar el duelo y pone `--dorso-rival`,
  `--estandarte-rival` y `--cinta-rival`; cualquier otra partida las quita.
  El tapete no viaja: cada uno ve el suyo.
- **Las cintas de la tienda apuntan a la izquierda.** La del rival va en un
  `::before` que se refleja con `--cinta-rival-giro`; la roja de siempre ya
  viene dibujada hacia su lado y no gira.
- **Arte con interruptor**, como el final y la presentación: hasta que llegan
  los dorsos se ven como el clásico tintado, y la sexta placa del menú lleva un
  dibujo de CSS sin `--placa` (el guardián de `marcado.test.js` exige fichero a
  toda placa declarada).
- **Los retratos son el único tipo que se pinta siempre.** Los otros tres
  tenían algo que conservar antes de la tienda; el retrato no, así que
  `--retrato-propio` va también con el gratuito y `--retrato-rival` sólo en
  un duelo (contra la IA la presentación sigue enseñando la portada del mazo).
  Hay DOS gratuitos: la paleontóloga es `porDefecto` y el buscador `gratis`.
  Por eso existe la 0026: `equipar_cosmetico` deja poner lo de precio 0 sin
  comprarlo y `comprar_cosmetico` lo rechaza. En el marcador final el retrato
  va EN LUGAR del emblema: con los dos, el nombre se cortaba a 375 px.
- **El dorso se MIRA en dos sitios de la partida**: la pila de mazo, que es
  una carta pequeña boca abajo (la tuya abajo, la del rival arriba con
  `--dorso-rival`), y el hueco de la mano mientras arrastras una carta. Antes
  sólo pasaba volando y el autor preguntó para qué servía comprar uno. La pila
  subió de 22 a 36 px de alto y las filas de ranuras lo pagan: a 360×640
  quedan en 128 px, la carta de 112 cabe.
- **La Biomasa NO lleva tope de familia**, y se volvió a decidir el 14-09-2026:
  el autor recordaba «5 por mazo», que son los cinco de cada mazo de jefe. Lo
  medido sigue mandando: con 12 en vez de 7 se gana menos.
- **El holográfico se QUITÓ** (16-09-2026, decisión del autor). Era una lámina
  de arcoíris en `color-dodge` sobre la ventana de la ilustración de las
  legendarias y las de jefe, en todas partes. Nunca se vendió, así que irse fue
  borrar su regla de `carta.css` y nadie se queda sin nada comprado.
  `test/tienda.test.js` vigila ahora que NO esté —ni el `@keyframes`, ni el
  `::before` sobre la ventana, ni el `isolation` que sólo ella pedía—, que
  media lámina reaparecida es peor que la lámina entera. El brillo dorado de
  las legendarias en la colección y en el sobre (`brillo-legendario`, en
  `style.css`) es OTRA cosa y se queda.
- **Los packs de sobres** son varios sobres seguidos al precio de uno por
  sobre, sin descuento: con descuento acelerarían el progreso (`PACKS` y
  `precioDePack` en `cosmeticos.js`, con su test; NO en `coleccion.js`, que va
  dentro de la Edge Function). NO son cosméticos ni están
  en el catálogo: la tienda sólo dice cuántos y `abrirPack()` en `meta.js`
  pide un sobre al servidor CADA vez, con la ceremonia de cada uno y una sola
  rejilla al final. Así la Edge Function no sabe de packs —no hay que
  re-empaquetar ni re-anclar— y si un sobre falla a medias, los anteriores
  están pagados y abiertos y se enseñan con el motivo. Si algún día hay
  dinero real, no se venden por dinero.

## Instalarlo como app

El juego es una PWA: `manifest.json`, iconos en `assets/` y `sw.js`. Se instala
desde Chrome y Edge en Android y PC, y en iPhone con «Añadir a pantalla de
inicio». El menú lleva un botón «Instalar app» (`src/ui/instalar.js`) que sólo
aparece cuando sirve: guarda el `beforeinstallprompt` y lo lanza al tocarlo;
en iPhone, que no tiene ese aviso, explica el gesto; instalado, no sale.

**Opera en PC no instala PWA.** Es Chromium, pero quitó esa parte, así que
nunca dispara el aviso y el botón no podía salir —en Android sí lo hace—.
Firefox tampoco lo tiene. Desde el 17-09-2026, en escritorio sin aviso el botón
sale igual y al pulsarlo dice «En Opera y Firefox no se puede instalar; ábrelo
en Chrome o Edge» (`notaDeEscritorio`). Mejor eso que un hueco. En un móvil
sin aviso sigue sin salir: ahí «ábrelo en Chrome» es más difícil de seguir.

- **El manifest es texto de cara al público**: es lo que enseña la ventana de
  instalación y lo que leería una tienda. Decía «sin cuenta, sin conexión»
  meses después de que las dos cosas dejaran de ser ciertas.
  `test/manifest.test.js` lo vigila.
- **Las capturas de `assets/capturas/` salen de los bancos** con Chrome sin
  ventana y el tamaño se declara en el manifest: Chrome descarta una captura
  que no mide lo que dice, y el test lee la cabecera del WebP para comprobarlo.
  Hay que rehacerlas cuando cambien esas pantallas.
- **`id: "./"`** fija la identidad de la app instalada. Si algún día se sirve
  desde un dominio propio, el origen cambia y es otra app para el sistema: los
  que la tengan instalada tendrán que volver a instalarla.

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

**Antes de sacar la rama de trabajo otra vez de `origin/main`, mirar si tiene
commits que main no tenga.** Ha mordido dos veces seguidas: se empieza el
cambio siguiente con `git checkout -B <rama> origin/main`, y lo que estaba en
la rama y todavía no se había mergeado —la nota de «ya está en producción», las
dos veces— desaparece sin decir nada. Los tiene siempre que haya una PR abierta
sin mergear:

```bash
git log --oneline origin/main..origin/<rama>   # vacío = re-ramificar es seguro
```

`main` es lo que sirve GitHub Pages: lo que se mergea sale en producción sin más
pasos. CI corre los tests en cada push y necesita `fetch-depth: 0`, porque
`test/anclaje.test.js` lee un commit anterior.

## Lo que NO cierra todavía

Dicho para que nadie lo descubra tarde:

- **Los cuatro mapas tienen rivales y no hay un quinto dibujado.** Una
  expedición nueva pide un mapa (`tools/expediciones.py`, prompts en
  `PROMPTS.md`) y ocho mazos medidos; el set da hoy para una de Mongolia (el
  Nemegt es visitante) o de la Patagonia (también visitante). Los cuatro
  tienen su logro de «entera» (0033); uno nuevo pide el suyo, con la copia de
  `private.catalogo_logros()` en una migración.

- **Hay cinco jefes y el calendario da la vuelta cada 35 días** (15-09-2026):
  Saurophaganax, Barosaurus, Supersaurus, Hesperosaurus y Harpactognathus, con
  un clima de dos días entre cacerías. Los catorce primeros días no se tocaron,
  y por eso las tribus de menos de 35 días siguen en su vuelta:
  `private.ciclo_de()` divide por `ciclo_dias`, así que **alargar el ciclo con
  una tribu de más días le baja la vuelta** y su jefe de la vuelta anterior
  aparecería otra vez muerto. Mirar `jefes` antes de volver a alargarlo.
  Añadir otro jefe son siete sitios: `JEFES` con su mazo temático (legal, lo
  vigila `tribu.test.js`), su evento en `CALENDARIO`, su carta en
  `CARTAS_DE_JEFE` (fuera del set y de todas las listas), el conteo de
  `entradas.test.js`, su logro de trofeo en `logros.js` y en `VOCABULARIO`, su
  retrato exclusivo, y una migración con la copia nueva de
  `private.catalogo_logros()`. Y re-empaquetar, re-anclar y desplegar, que
  `eventos.js` y `cards.js` van dentro de la Edge Function. Las cinco cartas de
  jefe miden entre el 57 y el 61 % con `sim/carta.mjs`.
- **Al Duelo le falta el emparejamiento por ELO**: `duelo_buscar` casa con
  quien más lleve esperando. Con nueve cuentas es lo sensato; la idea hablada
  es una ventana de ELO que se ensancha con la espera, en esa misma función
  SQL. Escudo, temporadas y tabla ya existen (16-09-2026); lo que no hay es
  historial de temporadas pasadas —el reinicio pisa el ELO y no apunta dónde
  se terminó— ni recompensa de fin de temporada.
- **El CAPTCHA está activado** (Turnstile, desde el 13-09-2026). Si un día
  nadie puede entrar, lo primero es ese interruptor en Authentication → Attack
  Protection, y que el proveedor siga siendo Turnstile.
- **La confirmación por correo está desactivada.** Se puede crear una cuenta con
  un correo que no es tuyo. Para activarla hace falta un SMTP propio: el
  integrado de Supabase manda 2 correos a la hora y sólo a direcciones del
  equipo.
- **El balance cumple 3 de 6** (`BALANCE.md`, mazo de referencia del
  16-09-2026 y lugares del 17-09): cero cartas descalibradas y la duración en
  objetivo; el jugador inicial en 46,3 %, la bola de nieve en 71,2 % y las
  vías en 29/71/0 (45,4 %, 71,2 % y 25/75/0 con el tablero plano). La referencia nueva queda al 48–52 % contra Molienda, Entierro y
  Hábitat (la del 13-09 perdía el 70–75 %), así que los seis números vuelven
  a hablar del juego y no de un mazo que cualquier construcción bate. Lo que
  no cambió: **108 de las 139** cartas siguen fuera de él, o sea sin
  calibración comprobada, y la extinción sigue en 0 % en el ESPEJO porque el
  mazo no muele —la vía existe y está medida en `sim/arquetipos.mjs`, 22–26 %
  de las victorias del mazo hecho para ella—. Las dos cosas son ciertas a la
  vez y conviene no confundirlas.
- **Las curvas de expedición están medidas con la vara nueva y los rivales
  no se retocaron.** Los mapas suben 10–20 puntos y los visitantes, que se
  ajustaron al 50 %, quedan al 70–81 %. Antes de reajustarlos hay que decidir
  qué mazo representa al jugador en `sim/expediciones.mjs`: la referencia es
  una vara, no lo que juega la gente.
- **El jugador inicial no es sólo del turno.** Con la IA al azar los dos
  mazos de referencia dan el 47–48 %; con la heurística, el nuevo baja al
  43–45 %. Hay algo en `ai.js` o en cómo `sim/partida.js` alterna las dos
  IAs que le da al segundo jugador cuatro puntos con cuerpos medianos, y no
  se ha buscado.
- **El paquete de HÁBITAT ya existe y la vía sigue cerrada.** Las ocho cartas
  de la ronda del hábitat llevaron el daño directo de 13 copias a 56 y
  cuadruplicaron lo que baja por partida —de 5 a 20,5—, y el mazo construido
  para ellas gana el 75 % a la referencia con el 58 % de sus victorias por
  TROFEOS y sólo el 17 % por hábitat, que es lo mismo que saca la propia
  referencia. Rehacerlo con muros que no matan lo empeora por los dos lados.
  El techo es aritmético: el set entero suma 56 de daño directo contra 70 de
  hábitat, y de un mazo de 55 se ven 34 cartas en trece turnos. **Los dos
  caminos —bajar los 70, o media ronda más de daño directo— son decisión del
  autor**, y los números para decidirlo están en «La ronda del hábitat».
  Lo que sí quedó cerrado es el carril defensivo: las tres cartas de freno
  le quitan nueve puntos por partida y le bajan las victorias por hábitat del
  16 % al 6 % sin cambiar quién gana.
- **La inmunidad al clima no muerde.** Torvosaurus y Nodosaurus dicen «no le
  afectan los efectos del clima», y hoy los dos únicos efectos del clima sobre una
  criatura son BUENOS: el Canal da +1 de Vida y el Bosque cura saurópodos. O sea
  que la inmunidad es un inconveniente pequeño disfrazado de ventaja. Se arregla
  por cualquiera de los dos lados —darle al clima algo que doler, o cambiarles la
  habilidad— pero es una decisión de diseño, no un arreglo.
El proyecto es **de pago** (plan Pro), así que no se pausa por inactividad.
Eso era cierto antes y ya no lo es.

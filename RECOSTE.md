# RECOSTE.md — la tabla editable del set

> La genera y la aplica `node tools/tabla.mjs`. **Edita «Rareza», «Coste
> nuevo», «A», «V», «Rasgo» y «Texto del rasgo»**: el id es la llave, y
> «Carta», «Familia» y «Coste actual» son de referencia y se ignoran.
>
> Cambiar la rareza mueve tres cosas a la vez: cuántas copias caben en un mazo,
> cada cuánto sale la carta en un sobre y lo que da al fundirla. Si el mazo de
> referencia deja de ser legal, `aplicar` lo dice y no escribe nada.
>
> - `node tools/tabla.mjs escribir` regenera esta tabla desde el código.
> - `node tools/tabla.mjs aplicar` mete lo editado en `src/data/cards.js`.
>
> Si prefieres editarla en una hoja de cálculo, `python tools/excel.py escribir`
> la saca a `RECOSTE.xlsx` y `python tools/excel.py leer` la trae de vuelta aquí.
>
> Después de aplicar hay que correr `npm test` y `npm run sim`: los números
> del balance salen de aquí.

## Qué es esta tabla

Es un espejo del set: lo que hay en `src/data/cards.js` ahora mismo. «Coste
nuevo» arranca igual que «Coste actual» y lo que escribas ahí es lo que se
aplica.

**«Texto del rasgo» es lo que la carta DICE, no lo que HACE.** Lo que hace sale
de una constante del código sobre la que el motor decide en sesenta sitios; el
texto sólo se pinta. Así que editarlo sirve para redactar mejor una regla que
ya existe, y si se le escribe una regla distinta la carta seguirá haciendo lo
de antes y el texto mentirá.

Para pedir una regla distinta está **«Mecánica nueva»**: se escribe ahí, en
lenguaje llano, qué debería hacer la carta. Esa columna no la aplica ninguna
herramienta —hay que escribirla en el motor y medirla—, pero `aplicar` la lee
y la lista al terminar para que no se quede olvidada.

La renta es de **2 de Biomasa por turno acumulativa**, con un
tope de 12 de ahorro. En una partida de trece turnos eso son unas
26 Biomasas para las once cartas que se llegan a desplegar, así que
**el coste medio de una carta debería rondar el 2**, no el 1.

Y la curva tiene que ser más que proporcional. Robas una carta por turno y ganas
2 de Biomasa, así que una carta de coste 4 te cuesta dos turnos de renta
**y** una de tus cinco ranuras, mientras que cuatro de coste 1 tapan cuatro
carriles. Para que valga la pena, el cuerpo (A+D+V) tiene que crecer más deprisa
que el coste; la escala medida que funciona es del orden de **4 / 9 / 15 / 22**
para costes de 1 a 4.

Esto no es teoría: con renta 1 el índice de calibración era casi una función del
coste —1,31 para el coste 0 y 0,10 para *Torvosaurus*, que costaba 4— y quince
cartas se salían de banda. Subir el robo en vez de la renta lo empeoraba, lo que
confirma que el problema era la proporción entre cartas y Biomasa, no que
faltaran recursos.

Cambiar la **rareza** mueve tres cosas a la vez: cuántas copias caben en un mazo
(3 común y rara, 2 épica, 1 legendaria), cada cuánto sale la carta en un sobre
—las probabilidades salen de la forma del set, así que mover una carta reajusta
la tabla entera— y lo que da al fundirla.

## Lo que hay que mirar después

Al aplicar, `aplicar` comprueba que el mazo de referencia siga siendo legal y
que no se quede ninguna rareza vacía; si algo falla no escribe nada. Después hay
que correr `npm test` y `npm run sim`: los seis objetivos del balance salen de
estos números, y el que hoy falla —cartas descalibradas— es justo el que esta
revisión viene a arreglar.

| id | Carta | Familia | Rareza | Coste actual | Coste nuevo | A | V | Rasgo | Texto del rasgo | Mecánica nueva |
|---|---|---|---|---|---|---|---|---|---|---|---|
| dryosaurus | Dryosaurus altus | Ornitópodo | Común | 0 | 0 | 1 | 2 | Bandada nerviosa | Gana +1 de Ataque por cada Dryosaurus en juego, sea de quien sea y este incluido. |  |
| ornitholestes | Ornitholestes hermanni | Terópodo | Común | 1 | 1 | 2 | 2 | Salto de entrada | Cuando entra en juego hiere en 2 al dinosaurio de enfrente. |  |
| ceratosaurus | Ceratosaurus nasicornis | Terópodo | Común | 2 | 2 | 4 | 2 | Ayuno del cazador | Cuando entra en juego descarta 2 cartas de tu mazo. |  |
| stegosaurus | Stegosaurus stenops | Tireóforo | Común | 2 | 2 | 1 | 5 | Muro de placas | Gana +1 de Ataque por cada Stegosaurus que tengas en juego, este incluido. |  |
| allosaurus | Allosaurus fragilis | Terópodo | Rara | 3 | 3 | 5 | 5 | Zarpazo por sorpresa | Cuando entra en juego descarta 1 carta al azar de la mano de tu rival. |  |
| camarasaurus | Camarasaurus grandis | Saurópodo | Rara | 3 | 3 | 1 | 8 | Rumia | Al final de tu turno recupera 1 de Vida. |  |
| diplodocus | Diplodocus carnegii | Saurópodo | Rara | 2 | 2 | 3 | 8 | Pisa y abona | Cuando entra en juego tu hábitat recupera 1 punto. |  |
| apatosaurus | Apatosaurus louisae | Saurópodo | Rara | 3 | 3 | 2 | 10 | Pisa y abona | Cuando entra en juego tu hábitat recupera 1 punto. |  |
| torvosaurus | Torvosaurus tanneri | Terópodo | Épica | 4 | 4 | 8 | 5 | Indiferente al cielo | No le afectan los efectos del clima. |  |
| nodosaurus | Nodosaurus textilis | Tireóforo | Épica | 3 | 3 | 3 | 8 | Indiferente al cielo | No le afectan los efectos del clima. |  |
| riparovenator | Riparovenator milnerae | Terópodo | Épica | 3 | 3 | 3 | 3 | Fuera del alcance | No le afectan las cartas de evento de tu rival. |  |
| lokiceratops | Lokiceratops rangiformis | Marginocéfalo | Épica | 3 | 3 | 4 | 7 | Fuera del alcance | No le afectan las cartas de evento de tu rival. |  |
| brachylophosaurus | Brachylophosaurus canadensis | Ornitópodo | Rara | 2 | 2 | 0 | 10 | Rebaño de tres | Si llegas a tener 3 Brachylophosaurus en juego, éste gana +6 de Ataque para siempre. |  |
| tyrannotitan | Tyrannotitan chubutensis | Terópodo | Legendaria | 4 | 4 | 10 | 7 | Tijera | Cuando entra en juego manda al descarte 1 dinosaurio rival de hasta 4 de Vida. |  |
| huaxiadraco | Huaxiadraco corollatus | Pterosaurio | Rara | 2 | 2 | 2 | 4 | Vuelo de reconocimiento | Cuando entra en juego robas 1 carta. |  |
| gregarismo | Gregarismo | Evento | Rara | 1 | 1 |  |  | Gregarismo | +1 de Ataque a todos tus dinosaurios de la misma especie que el objetivo. |  |
| gastrolitos | Gastrolitos | Evento | Épica | 1 | 1 |  |  | Gastrolitos | Cura +1 de vida a un dinosaurio al final del turno |  |
| crecimiento_acelerado | Crecimiento acelerado | Evento | Legendaria | 1 | 1 |  |  | Crecimiento acelerado | +2 Poder y +2 Vida permanentes a un dinosaurio que elijas. |  |
| neumaticidad | Neumaticidad ósea | Evento | Épica | 2 | 2 |  |  | Neumaticidad ósea | +2 de Ataque permanentes. Sólo sobre terópodos y saurópodos. |  |
| fractura | Fractura consolidada | Evento | Épica | 2 | 2 |  |  | Fractura consolidada | −2 Poder permanente a un dinosaurio rival. |  |
| competencia | Competencia trófica | Evento | Épica | 3 | 3 |  |  | Competencia trófica | −2 de Vida a dos dinosaurios rivales que elijas. |  |
| trampa | Trampa de depredadores | Evento | Rara | 1 | 1 |  |  | Trampa de depredadores | El rival pierde 5 cartas de su mazo. Tú pierdes 3: el fango no distingue. |  |
| mortandad | Mortandad estacional | Evento | Legendaria | 1 | 1 |  |  | Mortandad estacional | 3 de daño a TODOS los dinosaurios del campo, incluidos los tuyos. |  |
| rebrote | Rebrote tras incendio | Recurso | Rara | 0 | 0 |  |  | Rebrote tras incendio | +2 Biomasa ahora mismo. Todos tus dinosaurios reciben 1 herida. |  |
| carrona | Carroña abundante | Recurso | Legendaria | 0 | 0 |  |  | Carroña abundante | +3 Biomasa ahora mismo. El rival gana 1 Biomasa. |  |
| lago | Lago efímero | Recurso | Épica | 0 | 0 |  |  | Lago efímero | +2 Biomasa ahora mismo. Tu hábitat pierde 2 puntos. |  |
| llanura | Llanura de inundación | Clima | Épica | 1 | 1 |  |  | Llanura de inundación | Mientras esté en el campo, cada jugador puede cambiar una carta de su mano por otra del mazo, una vez por turno. |  |
| canal | Canal fluvial trenzado | Clima | Legendaria | 1 | 1 |  |  | Canal fluvial trenzado | Agua permanente: +1 de Vida a todos los dinosaurios del campo, y los ribereños pelean a gusto. |  |
| bosque | Bosque de coníferas ribereño | Clima | Legendaria | 1 | 1 |  |  | Bosque de coníferas ribereño | Los saurópodos curan 1 herida al final de cada turno. |  |
| aridez | Deriva árida | Clima | Legendaria | 1 | 1 |  |  | Deriva árida | Ambos jugadores pierden 5 cartas del mazo |  |
| sabana | Sabana de helechos | Clima | Común | 1 | 1 |  |  | Sabana de helechos | +1 de Biomasa cada turno para los dos jugadores, mientras siga en el campo. |  |
| plesiopleurodon | Plesiopleurodon wellesi | Reptil marino | Épica | 3 | 3 | 8 | 4 | Sigue a los grandes | Gana +2 de Ataque si tienes en juego algún dinosaurio con más de 6 de Vida. |  |
| ojoraptorsaurus | Ojoraptorsaurus boerei | Terópodo | Rara | 2 | 2 | 2 | 4 | Salto de entrada | Cuando entra en juego hiere en 2 al dinosaurio de enfrente. |  |
| dromaeosaurus | Dromaeosaurus albertensis | Terópodo | Común | 2 | 2 | 3 | 3 | Jauría | Gana +1 de Ataque por cada Dromaeosaurus en juego, sea de quien sea y este incluido. |  |
| athenar | Athenar bermani | Saurópodo | Común | 2 | 2 | 2 | 3 | Olfato de tormenta | Al jugarlo, puedes llevarte a la mano una carta de evento de tu mazo. |  |
| sanjuansaurus | Sanjuansaurus gordilloi | Terópodo | Rara | 2 | 2 | 3 | 3 | Olfato de tormenta | Al jugarlo, puedes llevarte a la mano una carta de clima de tu mazo. |  |
| suchomimus | Suchomimus tenerensis | Terópodo | Épica | 3 | 3 | 7 | 7 | Rastreo de orilla | Cuando entra en juego descarta 1 carta del mazo de tu rival. |  |
| eosinopteryx | Eosinopteryx brevipenna | Terópodo | Común | 0 | 0 | 1 | 1 | Percha compartida | Gana +1 de Vida por cada Eosinopteryx que tengas en juego, este incluido. |  |
| troodon | Troodon formosus | Terópodo | Común | 1 | 1 | 1 | 2 | Caza coordinada | Gana +1 de Ataque por cada Troodon que tengas en juego, este incluido. |  |
| carnotaurus | Carnotaurus sastrei | Terópodo | Épica | 3 | 3 | 7 | 3 | Territorio exclusivo | Para jugarlo tienes que descartar 2 cartas de tu mano. |  |
| spinosaurus | Spinosaurus aegyptiacus | Terópodo | Legendaria | 4 | 4 | 10 | 8 | Draga el río | Cuando entra en juego descarta 5 cartas del mazo de tu rival y 2 del tuyo. |  |
| mosasaurus | Mosasaurus hoffmannii | Reptil marino | Legendaria | 4 | 4 | 8 | 10 | Draga el río | Cuando entra en juego descarta 5 cartas del mazo de tu rival y 2 del tuyo. |  |
| halszkaraptor | Halszkaraptor escuilliei | Terópodo | Rara | 1 | 1 | 2 | 2 | Nadador de temporal | Gana +2 de Vida mientras haya un clima en el campo. |  |
| tongtianlong | Tongtianlong limosus | Terópodo | Común | 1 | 1 | 1 | 1 | Nadador de temporal | Gana +2 de Ataque mientras haya un clima en el campo. |  |
| scanisaurus | Scanisaurus nazarowi | Reptil marino | Rara | 4 | 4 | 3 | 3 | Banco de caza | Mientras esté en juego, tus reptiles marinos ganan +1 de Ataque. |  |
| monolophosaurus | Monolophosaurus jiangi | Terópodo | Rara | 4 | 4 | 3 | 3 | Cresta de mando | Mientras esté en juego, tus terópodos ganan +1 de Vida. |  |
| invictarx | Invictarx zephyri | Tireóforo | Rara | 3 | 3 | 1 | 1 | Formación cerrada | Mientras esté en juego, tus tireóforos ganan +1 de Vida. |  |
| medusaceratops | Medusaceratops lokii | Marginocéfalo | Épica | 3 | 3 | 2 | 10 | Muralla de golas | Mientras esté en juego, tus marginocéfalos ganan +1 de Ataque y +1 de Vida. |  |
| platyceratops | Platyceratops tatarinovi | Marginocéfalo | Común | 1 | 1 | 1 | 2 | Llamada de manada | Al jugarlo, puedes llevarte a la mano otro Platyceratops de tu mazo. |  |
| loricatosaurus | Loricatosaurus priscus | Tireóforo | Común | 3 | 3 | 0 | 8 | Terraplén | Cuando entra en juego tu hábitat recupera 2 puntos. |  |
| therizinosaurus | Therizinosaurus cheloniformis | Terópodo | Común | 3 | 3 | 1 | 6 | Garra de sequía | Gana +3 de Ataque mientras haya un clima en el campo. |  |
| alaskacephale | Alaskacephale gangloffi | Marginocéfalo | Rara | 2 | 2 | 2 | 4 | Testarazo | Cuando entra en juego hiere en 2 al dinosaurio de enfrente. |  |
| titanoceratops | Titanoceratops ouranos | Marginocéfalo | Épica | 3 | 3 | 5 | 7 | Cuerno mayor | Gana +1 de Ataque por cada marginocéfalo que tengas en juego, este incluido. |  |
| atlasaurus | Atlasaurus imelakei | Saurópodo | Épica | 3 | 3 | 2 | 10 | Sombra del cuello | Mientras esté en juego, tus saurópodos ganan +1 de Vida. |  |
| stegoceras | Stegoceras validum | Marginocéfalo | Común | 2 | 2 | 1 | 8 | Cabezazo de vuelta | Devuelve 2 de daño a quien lo hiera en combate. |  |
| maiasaura | Maiasaura peeblesorum | Ornitópodo | Legendaria | 3 | 3 | 3 | 10 | Buena madre | Al final de tu turno, todos tus dinosaurios recuperan 1 de Vida. |  |
| edmontosaurus | Edmontosaurus annectens | Ornitópodo | Legendaria | 4 | 4 | 2 | 10 | Migración en masa | Mientras esté en juego, tus ornitópodos ganan +1 de Ataque y +1 de Vida. |  |
| plateosauravus | Plateosauravus cullingworthi | Saurópodo | Común | 2 | 2 | 2 | 2 | Colonia de ribera | Gana +1 de Ataque y +1 de Vida por cada Plateosauravus que tengas en juego, este incluido. |  |
| gargoyleosaurus | Gargoyleosaurus parkpinorum | Tireóforo | Rara | 2 | 2 | 2 | 4 | Osteodermos | Devuelve 3 de daño a quien lo hiera en combate. |  |
| wendiceratops | Wendiceratops pinhornensis | Marginocéfalo | Épica | 3 | 3 | 5 | 8 | Embestida | Cuando entra en juego manda al descarte 1 dinosaurio rival de hasta 2 de Vida. |  |
| antarctosaurus | Antarctosaurus wichmannianus | Saurópodo | Legendaria | 4 | 4 | 2 | 12 | Refugio polar | Mientras esté en juego, a ninguno de tus dinosaurios le afectan los efectos del clima. |  |
| liaoceratops | Liaoceratops yanzigouensis | Marginocéfalo | Común | 1 | 1 | 1 | 3 | Grito de aviso | Al jugarlo, puedes llevarte a la mano un marginocéfalo de tu mazo. |  |
| rhinorex | Rhinorex condrupus | Ornitópodo | Épica | 3 | 3 | 3 | 8 | Última llanura | Gana +2 de Ataque mientras tu hábitat esté por debajo del de tu rival. |  |
| bienosaurus | Bienosaurus lufengensis | Tireóforo | Común | 1 | 1 | 1 | 3 | Cría acorazada | Gana +1 de Vida por cada tireóforo que tengas en juego, este incluido. |  |
| shuangmiaosaurus | Shuangmiaosaurus gilmorei | Ornitópodo | Común | 2 | 2 | 2 | 4 | Ramoneo de orilla | Cuando entra en juego tu hábitat recupera 1 punto. |  |
| chasmosaurus | Chasmosaurus belli | Marginocéfalo | Común | 2 | 2 | 2 | 4 | Vigía de la gola | Cuando entra en juego robas 1 carta. |  |

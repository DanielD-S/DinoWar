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
| dryosaurus | Dryosaurus altus | Ornitópodo | Común | 0 | 0 | 1 | 2 |  |  |  |
| ornitholestes | Ornitholestes hermanni | Terópodo | Común | 1 | 1 | 2 | 2 |  |  |  |
| ceratosaurus | Ceratosaurus nasicornis | Terópodo | Común | 1 | 1 | 3 | 3 |  |  |  |
| stegosaurus | Stegosaurus stenops | Tireóforo | Común | 2 | 2 | 1 | 9 |  |  |  |
| allosaurus | Allosaurus fragilis | Terópodo | Rara | 3 | 3 | 5 | 5 |  |  |  |
| camarasaurus | Camarasaurus grandis | Saurópodo | Rara | 3 | 3 | 2 | 7 |  |  |  |
| diplodocus | Diplodocus carnegii | Saurópodo | Épica | 2 | 2 | 3 | 13 |  |  |  |
| apatosaurus | Apatosaurus louisae | Saurópodo | Épica | 3 | 3 | 2 | 15 |  |  |  |
| torvosaurus | Torvosaurus tanneri | Terópodo | Legendaria | 4 | 4 | 7 | 6 |  |  |  |
| nodosaurus | Nodosaurus textilis | Tireóforo | Rara | 2 | 2 | 2 | 8 |  |  |  |
| riparovenator | Riparovenator milnerae | Terópodo | Épica | 2 | 2 | 4 | 5 |  |  |  |
| lokiceratops | Lokiceratops rangiformis | Marginocéfalo | Épica | 3 | 3 | 4 | 8 |  |  |  |
| brachylophosaurus | Brachylophosaurus canadensis | Ornitópodo | Rara | 2 | 2 | 2 | 7 |  |  |  |
| tyrannotitan | Tyrannotitan chubutensis | Terópodo | Legendaria | 4 | 4 | 10 | 6 |  |  |  |
| huaxiadraco | Huaxiadraco corollatus | Pterosaurio | Rara | 2 | 2 | 2 | 4 |  |  |  |
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
| plesiopleurodon | Plesiopleurodon wellesi | Reptil marino | Épica | 3 | 3 | 9 | 6 |  |  |  |
| ojoraptorsaurus | Ojoraptorsaurus boerei | Terópodo | Rara | 2 | 2 | 4 | 5 |  |  |  |
| dromaeosaurus | Dromaeosaurus albertensis | Terópodo | Común | 2 | 2 | 5 | 4 |  |  |  |
| athenar | Athenar bermani | Saurópodo | Común | 2 | 2 | 2 | 7 |  |  |  |
| sanjuansaurus | Sanjuansaurus gordilloi | Terópodo | Rara | 2 | 2 | 5 | 4 |  |  |  |
| suchomimus | Suchomimus tenerensis | Terópodo | Épica | 3 | 3 | 8 | 7 |  |  |  |
| eosinopteryx | Eosinopteryx brevipenna | Terópodo | Común | 1 | 1 | 2 | 2 |  |  |  |
| troodon | Troodon formosus | Terópodo | Común | 2 | 2 | 4 | 5 |  |  |  |
| carnotaurus | Carnotaurus sastrei | Terópodo | Épica | 3 | 3 | 9 | 6 |  |  |  |
| spinosaurus | Spinosaurus aegyptiacus | Terópodo | Legendaria | 4 | 4 | 11 | 11 |  |  |  |
| mosasaurus | Mosasaurus hoffmannii | Reptil marino | Legendaria | 4 | 4 | 12 | 10 |  |  |  |
| halszkaraptor | Halszkaraptor escuilliei | Terópodo | Común | 1 | 1 | 2 | 2 |  |  |  |
| tongtianlong | Tongtianlong limosus | Terópodo | Común | 1 | 1 | 1 | 3 |  |  |  |
| scanisaurus | Scanisaurus nazarowi | Reptil marino | Rara | 2 | 2 | 4 | 5 |  |  |  |
| monolophosaurus | Monolophosaurus jiangi | Terópodo | Rara | 2 | 2 | 5 | 4 |  |  |  |
| invictarx | Invictarx zephyri | Tireóforo | Rara | 2 | 2 | 2 | 7 |  |  |  |
| medusaceratops | Medusaceratops lokii | Marginocéfalo | Épica | 3 | 3 | 5 | 10 |  |  |  |
| platyceratops | Platyceratops tatarinovi | Marginocéfalo | Común | 1 | 1 | 1 | 3 |  |  |  |
| loricatosaurus | Loricatosaurus priscus | Tireóforo | Épica | 3 | 3 | 4 | 11 |  |  |  |
| therizinosaurus | Therizinosaurus cheloniformis | Terópodo | Épica | 3 | 3 | 6 | 9 |  |  |  |
| alaskacephale | Alaskacephale gangloffi | Marginocéfalo | Rara | 2 | 2 | 3 | 6 |  |  |  |
| titanoceratops | Titanoceratops ouranos | Marginocéfalo | Épica | 3 | 3 | 6 | 9 |  |  |  |
| atlasaurus | Atlasaurus imelakei | Saurópodo | Épica | 3 | 3 | 3 | 12 |  |  |  |
| stegoceras | Stegoceras validum | Marginocéfalo | Común | 2 | 2 | 3 | 6 |  |  |  |
| maiasaura | Maiasaura peeblesorum | Ornitópodo | Épica | 3 | 3 | 4 | 11 |  |  |  |
| edmontosaurus | Edmontosaurus annectens | Ornitópodo | Legendaria | 4 | 4 | 5 | 17 |  |  |  |
| plateosauravus | Plateosauravus cullingworthi | Saurópodo | Común | 2 | 2 | 2 | 7 |  |  |  |
| gargoyleosaurus | Gargoyleosaurus parkpinorum | Tireóforo | Rara | 2 | 2 | 2 | 7 |  |  |  |
| wendiceratops | Wendiceratops pinhornensis | Marginocéfalo | Épica | 3 | 3 | 5 | 10 |  |  |  |
| antarctosaurus | Antarctosaurus wichmannianus | Saurópodo | Legendaria | 4 | 4 | 4 | 18 |  |  |  |
| liaoceratops | Liaoceratops yanzigouensis | Marginocéfalo | Común | 1 | 1 | 1 | 3 |  |  |  |
| rhinorex | Rhinorex condrupus | Ornitópodo | Épica | 3 | 3 | 4 | 11 |  |  |  |
| bienosaurus | Bienosaurus lufengensis | Tireóforo | Común | 1 | 1 | 1 | 3 |  |  |  |
| shuangmiaosaurus | Shuangmiaosaurus gilmorei | Ornitópodo | Común | 2 | 2 | 3 | 6 |  |  |  |
| chasmosaurus | Chasmosaurus belli | Marginocéfalo | Común | 2 | 2 | 2 | 7 |  |  |  |

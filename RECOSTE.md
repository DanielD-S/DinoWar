# RECOSTE.md — la tabla editable del set

> La genera y la aplica `node tools/tabla.mjs`. **Edita «Rareza», «Coste
> nuevo», «A», «D», «V», «Rasgo» y «Texto del rasgo»**: el id es la llave, y
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

| id | Carta | Familia | Rareza | Coste actual | Coste nuevo | A | D | V | Rasgo | Texto del rasgo | Mecánica nueva |
|---|---|---|---|---|---|---|---|---|---|---|---|
| dryosaurus | Dryosaurus altus | Ornitópodo | Común | 0 | 0 | 1 | undefined | 2 | Gregario | +1 de Ataque por cada otro Dryosaurus propio en el campo. |  |
| ornitholestes | Ornitholestes hermanni | Terópodo | Común | 1 | 1 | 2 | undefined | 2 | Oportunista | +1 Vida permanente cada vez que muere un dinosaurio en el campo. |  |
| ceratosaurus | Ceratosaurus nasicornis | Terópodo | Común | 1 | 1 | 3 | undefined | 3 | Caza en grupo | +2 de Ataque si hay tres Ceratosaurus tuyos en el campo. |  |
| stegosaurus | Stegosaurus stenops | Tireóforo | Común | 2 | 2 | 1 | undefined | 9 | Muro de placas | +1 de Vida si tienes otro Stegosaurus en el campo. |  |
| allosaurus | Allosaurus fragilis | Terópodo | Rara | 3 | 3 | 5 | undefined | 5 | Depredador dominante | Si mata a su rival, el daño sobrante que pasa al hábitat enemigo se duplica. |  |
| camarasaurus | Camarasaurus grandis | Saurópodo | Rara | 3 | 3 | 2 | undefined | 7 | Migrador | Al jugarla, busca un evento en tu mazo y llévatelo a la mano. |  |
| diplodocus | Diplodocus carnegii | Saurópodo | Épica | 2 | 2 | 3 | undefined | 13 | Ramoneo bajo | Recupera +1 de vida al final de cada uno de tus turnos |  |
| apatosaurus | Apatosaurus louisae | Saurópodo | Épica | 3 | 3 | 2 | undefined | 15 | Manada | +1 de Vida si tienes otro saurópodo en el campo. |  |
| torvosaurus | Torvosaurus tanneri | Terópodo | Legendaria | 4 | 4 | 7 | undefined | 6 | Rastreador | Al jugarla, busca un clima en tu mazo y llévatelo a la mano. |  |
| nodosaurus | Nodosaurus textilis | Tireóforo | Rara | 2 | 2 | 2 | undefined | 8 | Llamada de manada | Al jugarla, busca un Gregarismo en tu mazo y llévatelo a la mano. |  |
| riparovenator | Riparovenator milnerae | Terópodo | Épica | 2 | 2 | 4 | undefined | 5 | Ribereño | +2 de ataque mientras el Canal fluvial esté en el campo. |  |
| lokiceratops | Lokiceratops rangiformis | Marginocéfalo | Épica | 3 | 3 | 4 | undefined | 8 | Gola ornamentada | +2 de Vida si tienes otro Lokiceratops en el campo. |  |
| brachylophosaurus | Brachylophosaurus canadensis | Ornitópodo | Rara | 2 | 2 | 2 | undefined | 7 | Gregario | +1 Poder por cada copia suya que tengas en el campo. |  |
| tyrannotitan | Tyrannotitan chubutensis | Terópodo | Legendaria | 4 | 4 | 10 | undefined | 6 | Desgarro | A quien hiere no se le cura ninguna herida ese turno. |  |
| huaxiadraco | Huaxiadraco corollatus | Pterosaurio | Rara | 2 | 2 | 2 | undefined | 4 | Vuelo | Sobrevuela la ranura: golpea siempre al hábitat rival, pero quien tenga enfrente le alcanza igual. |  |
| gregarismo | Gregarismo | Evento | Rara | 1 | 1 |  |  |  | Gregarismo | +1 de Ataque a todos tus dinosaurios de la misma especie que el objetivo. |  |
| gastrolitos | Gastrolitos | Evento | Épica | 1 | 1 |  |  |  | Gastrolitos | Cura +1 de vida a un dinosaurio al final del turno |  |
| crecimiento_acelerado | Crecimiento acelerado | Evento | Legendaria | 1 | 1 |  |  |  | Crecimiento acelerado | +2 Poder y +2 Vida permanentes a un dinosaurio que elijas. |  |
| neumaticidad | Neumaticidad ósea | Evento | Épica | 2 | 2 |  |  |  | Neumaticidad ósea | +2 de Ataque permanentes. Sólo sobre terópodos y saurópodos. |  |
| fractura | Fractura consolidada | Evento | Épica | 2 | 2 |  |  |  | Fractura consolidada | −2 Poder permanente a un dinosaurio rival. |  |
| competencia | Competencia trófica | Evento | Épica | 3 | 3 |  |  |  | Competencia trófica | −2 de Vida a dos dinosaurios rivales que elijas. |  |
| trampa | Trampa de depredadores | Evento | Rara | 1 | 1 |  |  |  | Trampa de depredadores | El rival pierde 5 cartas de su mazo. Tú pierdes 3: el fango no distingue. |  |
| mortandad | Mortandad estacional | Evento | Legendaria | 1 | 1 |  |  |  | Mortandad estacional | 3 de daño a TODOS los dinosaurios del campo, incluidos los tuyos. |  |
| rebrote | Rebrote tras incendio | Recurso | Rara | 0 | 0 |  |  |  | Rebrote tras incendio | +2 Biomasa ahora mismo. Todos tus dinosaurios reciben 1 herida. |  |
| carrona | Carroña abundante | Recurso | Legendaria | 0 | 0 |  |  |  | Carroña abundante | +3 Biomasa ahora mismo. El rival gana 1 Biomasa. |  |
| lago | Lago efímero | Recurso | Épica | 0 | 0 |  |  |  | Lago efímero | +2 Biomasa ahora mismo. Tu hábitat pierde 2 puntos. |  |
| llanura | Llanura de inundación | Clima | Épica | 1 | 1 |  |  |  | Llanura de inundación | Mientras esté en el campo, cada jugador puede devolver una carta de su mano al fondo de su mazo, una vez por turno. |  |
| canal | Canal fluvial trenzado | Clima | Legendaria | 1 | 1 |  |  |  | Canal fluvial trenzado | Agua permanente en el campo: los ribereños pelean a gusto. |  |
| bosque | Bosque de coníferas ribereño | Clima | Legendaria | 1 | 1 |  |  |  | Bosque de coníferas ribereño | Los saurópodos curan 1 herida al final de cada turno. |  |
| aridez | Deriva árida | Clima | Legendaria | 1 | 1 |  |  |  | Deriva árida | Ambos jugadores pierden 5 cartas del mazo |  |
| sabana | Sabana de helechos | Clima | Común | 1 | 1 |  |  |  | Sabana de helechos | +1 de Biomasa cada turno para los dos jugadores, mientras siga en el campo. |  |
| plesiopleurodon | Plesiopleurodon wellesi | Reptil marino | Épica | 3 | 3 | 9 | undefined | 6 | Sin rasgo | Todavía no hace nada especial. |  |
| ojoraptorsaurus | Ojoraptorsaurus boerei | Terópodo | Rara | 2 | 2 | 4 | undefined | 5 | Sin rasgo | Todavía no hace nada especial. |  |
| dromaeosaurus | Dromaeosaurus albertensis | Terópodo | Común | 2 | 2 | 5 | undefined | 4 | Emboscada | Al entrar en juego, hace 3 de daño al dinosaurio que tenga enfrente. |  |
| athenar | Athenar bermani | Saurópodo | Común | 2 | 2 | 2 | undefined | 7 | Sin rasgo | Todavía no hace nada especial. |  |
| sanjuansaurus | Sanjuansaurus gordilloi | Terópodo | Rara | 2 | 2 | 5 | undefined | 4 | Sin rasgo | Todavía no hace nada especial. |  |
| suchomimus | Suchomimus tenerensis | Terópodo | Épica | 3 | 3 | 8 | undefined | 7 | Sin rasgo | Todavía no hace nada especial. |  |
| eosinopteryx | Eosinopteryx brevipenna | Terópodo | Común | 1 | 1 | 2 | undefined | 2 | Sin rasgo | Todavía no hace nada especial. |  |
| troodon | Troodon formosus | Terópodo | Común | 2 | 2 | 4 | undefined | 5 | Alerta | Al entrar en juego, robas 1 carta. |  |
| carnotaurus | Carnotaurus sastrei | Terópodo | Épica | 3 | 3 | 9 | undefined | 6 | Sin rasgo | Todavía no hace nada especial. |  |
| spinosaurus | Spinosaurus aegyptiacus | Terópodo | Legendaria | 4 | 4 | 11 | undefined | 11 | Arrasa la ribera | Al entrar en juego, 3 de daño al hábitat rival. |  |
| mosasaurus | Mosasaurus hoffmannii | Reptil marino | Legendaria | 4 | 4 | 12 | undefined | 10 | Devora el registro | Al entrar en juego, el rival pierde 3 cartas de su mazo. |  |
| halszkaraptor | Halszkaraptor escuilliei | Terópodo | Común | 1 | 1 | 2 | undefined | 2 | Sin rasgo | Todavía no hace nada especial. |  |
| tongtianlong | Tongtianlong limosus | Terópodo | Común | 1 | 1 | 1 | undefined | 3 | Sin rasgo | Todavía no hace nada especial. |  |
| scanisaurus | Scanisaurus nazarowi | Reptil marino | Rara | 2 | 2 | 4 | undefined | 5 | Sin rasgo | Todavía no hace nada especial. |  |
| monolophosaurus | Monolophosaurus jiangi | Terópodo | Rara | 2 | 2 | 5 | undefined | 4 | Sin rasgo | Todavía no hace nada especial. |  |
| invictarx | Invictarx zephyri | Tireóforo | Rara | 2 | 2 | 2 | undefined | 7 | Sin rasgo | Todavía no hace nada especial. |  |
| medusaceratops | Medusaceratops lokii | Marginocéfalo | Épica | 3 | 3 | 5 | undefined | 10 | Sin rasgo | Todavía no hace nada especial. |  |
| platyceratops | Platyceratops tatarinovi | Marginocéfalo | Común | 1 | 1 | 1 | undefined | 3 | Sin rasgo | Todavía no hace nada especial. |  |
| loricatosaurus | Loricatosaurus priscus | Tireóforo | Épica | 3 | 3 | 4 | undefined | 11 | Sin rasgo | Todavía no hace nada especial. |  |
| therizinosaurus | Therizinosaurus cheloniformis | Terópodo | Épica | 3 | 3 | 6 | undefined | 9 | Sin rasgo | Todavía no hace nada especial. |  |
| alaskacephale | Alaskacephale gangloffi | Marginocéfalo | Rara | 2 | 2 | 3 | undefined | 6 | Sin rasgo | Todavía no hace nada especial. |  |
| titanoceratops | Titanoceratops ouranos | Marginocéfalo | Épica | 3 | 3 | 6 | undefined | 9 | Sin rasgo | Todavía no hace nada especial. |  |
| atlasaurus | Atlasaurus imelakei | Saurópodo | Épica | 3 | 3 | 3 | undefined | 12 | Ramoneo alto | Al entrar en juego, ganas 2 de Biomasa. |  |
| stegoceras | Stegoceras validum | Marginocéfalo | Común | 2 | 2 | 3 | undefined | 6 | Sin rasgo | Todavía no hace nada especial. |  |
| maiasaura | Maiasaura peeblesorum | Ornitópodo | Épica | 3 | 3 | 4 | undefined | 11 | Sin rasgo | Todavía no hace nada especial. |  |
| edmontosaurus | Edmontosaurus annectens | Ornitópodo | Legendaria | 4 | 4 | 5 | undefined | 17 | Sin rasgo | Todavía no hace nada especial. |  |
| plateosauravus | Plateosauravus cullingworthi | Saurópodo | Común | 2 | 2 | 2 | undefined | 7 | Sin rasgo | Todavía no hace nada especial. |  |
| gargoyleosaurus | Gargoyleosaurus parkpinorum | Tireóforo | Rara | 2 | 2 | 2 | undefined | 7 | Cierra la formación | Al entrar en juego, tus otros dinosaurios curan 2 heridas. |  |
| wendiceratops | Wendiceratops pinhornensis | Marginocéfalo | Épica | 3 | 3 | 5 | undefined | 10 | Sin rasgo | Todavía no hace nada especial. |  |
| antarctosaurus | Antarctosaurus wichmannianus | Saurópodo | Legendaria | 4 | 4 | 4 | undefined | 18 | Sin rasgo | Todavía no hace nada especial. |  |
| liaoceratops | Liaoceratops yanzigouensis | Marginocéfalo | Común | 1 | 1 | 1 | undefined | 3 | Sin rasgo | Todavía no hace nada especial. |  |
| rhinorex | Rhinorex condrupus | Ornitópodo | Épica | 3 | 3 | 4 | undefined | 11 | Sin rasgo | Todavía no hace nada especial. |  |
| bienosaurus | Bienosaurus lufengensis | Tireóforo | Común | 1 | 1 | 1 | undefined | 3 | Sin rasgo | Todavía no hace nada especial. |  |
| shuangmiaosaurus | Shuangmiaosaurus gilmorei | Ornitópodo | Común | 2 | 2 | 3 | undefined | 6 | Sin rasgo | Todavía no hace nada especial. |  |
| chasmosaurus | Chasmosaurus belli | Marginocéfalo | Común | 2 | 2 | 2 | undefined | 7 | Sin rasgo | Todavía no hace nada especial. |  |

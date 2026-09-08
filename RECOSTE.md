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

La renta es de **1 de Biomasa por turno acumulativa**, con un tope de
12 de ahorro. Eso da un presupuesto de unas doce Biomasas por
partida de once turnos, que es la escala que tienen que respetar los costes: hoy
van de 0 a 3 y el gasto medido es de 12,1 en 10,8 cartas por bando.

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
| dryosaurus | Dryosaurus altus | Ornitópodo | Común | 0 | 0 | 1 | 0 | 2 | Gregario | +1 Poder por cada otro Dryosaurus propio en el campo. |  |
| ornitholestes | Ornitholestes hermanni | Terópodo | Común | 1 | 1 | 2 | 0 | 2 | Oportunista | +1 Vida permanente cada vez que muere un dinosaurio en el campo. |  |
| ceratosaurus | Ceratosaurus nasicornis | Terópodo | Común | 1 | 1 | 4 | 1 | 3 | Ribereño | +2 Poder mientras el campo activo sea Canal fluvial trenzado. |  |
| stegosaurus | Stegosaurus stenops | Tireóforo | Épica | 2 | 2 | 3 | 3 | 6 | Tagomizador | Devuelve 2 de daño adicional a quien lo ataque, además del que ya devuelve su clado. |  |
| allosaurus | Allosaurus fragilis | Terópodo | Épica | 2 | 2 | 6 | 1 | 5 | Depredador dominante | Si mata a su rival, el daño sobrante pasa al hábitat enemigo. |  |
| camarasaurus | Camarasaurus grandis | Saurópodo | Épica | 2 | 2 | 3 | 2 | 7 | Migrador | Puede cambiar de ranura en vez de desplegar. |  |
| diplodocus | Diplodocus carnegii | Saurópodo | Legendaria | 2 | 2 | 3 | 2 | 10 | Ramoneo bajo | Cura 1 herida al final de cada turno. |  |
| apatosaurus | Apatosaurus louisae | Saurópodo | Legendaria | 3 | 3 | 4 | 3 | 12 | Masa colosal | +1 de Defensa adicional: es la mayor masa del set. |  |
| torvosaurus | Torvosaurus tanneri | Terópodo | Legendaria | 3 | 3 | 8 | 1 | 6 | Escaso | Sólo 1 copia en el mazo. No admite adaptaciones. |  |
| nodosaurus | Nodosaurus textilis | Tireóforo | Rara | 2 | 2 | 2 | 4 | 6 | Coraza dorsal | +2 de Defensa. La coraza protege; no es un arma, a diferencia de la cola del estegosaurio. |  |
| riparovenator | Riparovenator milnerae | Terópodo | Épica | 2 | 2 | 5 | 1 | 5 | Ribereño | +2 Poder mientras el Canal fluvial esté en el campo. |  |
| lokiceratops | Lokiceratops rangiformis | Marginocéfalo | Épica | 2 | 2 | 4 | 2 | 7 | Gola ornamentada | +2 de Defensa. |  |
| brachylophosaurus | Brachylophosaurus canadensis | Ornitópodo | Épica | 2 | 2 | 3 | 1 | 6 | Gregario | +1 Poder por cada copia suya que tengas en el campo. |  |
| tyrannotitan | Tyrannotitan chubutensis | Terópodo | Legendaria | 3 | 3 | 9 | 1 | 7 | Desgarro | A quien hiere no se le cura ninguna herida ese turno. |  |
| huaxiadraco | Huaxiadraco corollatus | Pterosaurio | Épica | 2 | 2 | 3 | 0 | 3 | Vuelo | Sobrevuela la ranura: golpea siempre al hábitat rival y no recibe daño de combate. |  |
| gregarismo | Gregarismo | Evento | Rara | 1 | 1 |  |  |  | Gregarismo | +2 Poder a todos tus dinosaurios de la misma especie que el objetivo. |  |
| gastrolitos | Gastrolitos | Evento | Épica | 1 | 1 |  |  |  | Gastrolitos | El objetivo cura 1 herida al final de cada turno. |  |
| crecimiento_acelerado | Crecimiento acelerado | Evento | Legendaria | 1 | 1 |  |  |  | Crecimiento acelerado | +2 Poder y +2 Vida permanentes. |  |
| neumaticidad | Neumaticidad ósea | Evento | Épica | 1 | 1 |  |  |  | Neumaticidad ósea | +2 Poder. Sólo sobre terópodos y saurópodos. |  |
| fractura | Fractura consolidada | Evento | Épica | 1 | 1 |  |  |  | Fractura consolidada | −2 Poder permanente a un dinosaurio rival. |  |
| competencia | Competencia trófica | Evento | Épica | 1 | 1 |  |  |  | Competencia trófica | −2 Poder a todos los dinosaurios rivales del clado que elijas. |  |
| trampa | Trampa de depredadores | Evento | Rara | 1 | 1 |  |  |  | Trampa de depredadores | El rival pierde 12 cartas de su mazo. Tú pierdes 3: el fango no distingue. |  |
| mortandad | Mortandad estacional | Evento | Legendaria | 1 | 1 |  |  |  | Mortandad estacional | 2 de daño a TODOS los dinosaurios del campo, incluidos los tuyos. |  |
| rebrote | Rebrote tras incendio | Recurso | Rara | 0 | 0 |  |  |  | Rebrote tras incendio | +3 Biomasa ahora mismo. Todos tus dinosaurios reciben 1 herida. |  |
| carrona | Carroña abundante | Recurso | Épica | 0 | 0 |  |  |  | Carroña abundante | +3 Biomasa ahora mismo. El rival gana 1 Biomasa. |  |
| lago | Lago efímero | Recurso | Épica | 0 | 0 |  |  |  | Lago efímero | +2 Biomasa ahora mismo. Tu hábitat pierde 1. |  |
| llanura | Llanura de inundación | Clima | Épica | 1 | 1 |  |  |  | Llanura de inundación | +1 Biomasa por turno a los dos bandos. |  |
| canal | Canal fluvial trenzado | Clima | Legendaria | 1 | 1 |  |  |  | Canal fluvial trenzado | Agua permanente en el campo: los ribereños pelean a gusto. |  |
| bosque | Bosque de coníferas ribereño | Clima | Legendaria | 1 | 1 |  |  |  | Bosque de coníferas ribereño | Los saurópodos curan 1 herida al final de cada turno. |  |
| aridez | Deriva árida | Clima | Épica | 1 | 1 |  |  |  | Deriva árida | Cada turno, los dos bandos pierden 5 cartas del mazo. |  |
| sabana | Sabana de helechos | Clima | Común | 1 | 1 |  |  |  | Sabana de helechos | Terreno abierto, sin cobertura: +1 al daño contra los biomas. |  |

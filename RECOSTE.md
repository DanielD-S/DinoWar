# RECOSTE.md — la tabla editable del set

> La genera y la aplica `node tools/tabla.mjs`. **Edita sólo las columnas
> «Coste nuevo», «A», «D», «V», «Rasgo» y «Texto del rasgo»**: el id es la
> llave y las demás columnas se ignoran al aplicar.
>
> - `node tools/tabla.mjs escribir` regenera esta tabla desde el código.
> - `node tools/tabla.mjs aplicar` mete lo editado en `src/data/cards.js`.
>
> Si prefieres editarla en una hoja de cálculo, `python tools/excel.py escribir`
> la saca a `RECOSTE.xlsx` y `python tools/excel.py leer` la trae de vuelta aquí.
>
> Después de aplicar hay que correr `npm test` y `npm run sim`: los números
> del balance salen de aquí.

## Por qué se recostea

Con la renta actual —la Biomasa vale el número de turno y no se acumula— cada
bando gasta **47 de Biomasa en 14,7 cartas** por partida, a un coste medio de
3,22. Si la renta pasa a **+1 acumulativo**, el presupuesto de la partida entera
baja a **11**: cuatro veces menos. Por eso la columna «Coste nuevo» arranca con
la escala 0–8 comprimida a **0–3**, que es la única que cabe en ese presupuesto.

La propuesta de partida es mecánica (0-1→0, 2-3→1, 4-6→2, 7-8→3). Lo que hay que
revisar a mano es lo que una regla no sabe: qué carta merece costar más que otra
del mismo tramo.

## Qué mide la propuesta mecánica

Aplicada tal cual, con la renta acumulativa de +1, sobre 800 partidas:

| Métrica | Hoy | Recoste 0–3 + renta +1 | Objetivo |
|---|---|---|---|
| Duración | 11,0 turnos | **9,6** | 10 – 14 |
| Victorias del inicial | 52,9 % | 49,0 % | 48 – 55 % |
| Bola de nieve | 61,5 % | 66,7 % | 55 – 70 % |
| Reparto trofeos/hábitat/extinción | 36/40/24 | **4 / 74 / 22** | cada una 15 – 60 % |
| Cartas descalibradas | 1 de 25 | **14 de 25** | 0 |
| Cartas jugadas por bando | 14,7 | 10,8 | — |

Tres objetivos fuera, y la causa es la misma en los tres: con un presupuesto de
doce Biomasas el campo se queda más vacío (1,86 unidades vivas por bando frente
a 2,24), así que **el hábitat cae antes de que dé tiempo a reunir ocho trofeos**
y el registro fósil casi desaparece como vía.

Eso no se arregla sólo con los costes: hay que mover también **trofeos para
ganar** y **vida del hábitat**, que son los dos números que fijan cuánto dura la
partida. Esa calibración va después de esta revisión, con el simulador, y es
trabajo mío: aquí sólo hacen falta los costes que tú consideres justos.

| id | Carta | Familia | Rareza | Coste actual | Coste nuevo | A | D | V | Rasgo | Texto del rasgo |
|---|---|---|---|---|---|---|---|---|---|---|
| dryosaurus | Dryosaurus altus | Ornitópodo | Común | 1 | 0 | 1 | 0 | 2 | Gregario | +1 Poder por cada otro Dryosaurus propio en el campo. |
| ornitholestes | Ornitholestes hermanni | Terópodo | Común | 2 | 1 | 2 | 0 | 2 | Oportunista | +1 Vida permanente cada vez que muere un dinosaurio en el campo. |
| ceratosaurus | Ceratosaurus nasicornis | Terópodo | Común | 3 | 1 | 4 | 1 | 3 | Ribereño | +2 Poder mientras el campo activo sea Canal fluvial trenzado. |
| stegosaurus | Stegosaurus stenops | Tireóforo | Épica | 4 | 2 | 3 | 3 | 6 | Tagomizador | Devuelve 2 de daño adicional a quien lo ataque, además del que ya devuelve su clado. |
| allosaurus | Allosaurus fragilis | Terópodo | Épica | 5 | 2 | 6 | 1 | 5 | Depredador dominante | Si mata a su rival, el daño sobrante pasa al hábitat enemigo. |
| camarasaurus | Camarasaurus grandis | Saurópodo | Épica | 5 | 2 | 3 | 2 | 7 | Migrador | Puede cambiar de ranura en vez de desplegar. Inmune a Sequía estacional. |
| diplodocus | Diplodocus carnegii | Saurópodo | Legendaria | 5 | 2 | 3 | 2 | 10 | Ramoneo bajo | Cura 1 herida al final de cada turno. |
| apatosaurus | Apatosaurus louisae | Saurópodo | Legendaria | 7 | 3 | 4 | 3 | 12 | Masa colosal | +1 de Defensa adicional: es la mayor masa del set. |
| torvosaurus | Torvosaurus tanneri | Terópodo | Legendaria | 7 | 3 | 8 | 1 | 6 | Escaso | Sólo 1 copia en el mazo. No admite adaptaciones. |
| nodosaurus | Nodosaurus textilis | Tireóforo | Rara | 4 | 2 | 2 | 4 | 6 | Coraza dorsal | +2 de Defensa. La coraza protege; no es un arma, a diferencia de la cola del estegosaurio. |
| riparovenator | Riparovenator milnerae | Terópodo | Épica | 5 | 2 | 5 | 1 | 5 | Ribereño | +2 Poder mientras el Canal fluvial esté en el campo. |
| lokiceratops | Lokiceratops rangiformis | Marginocéfalo | Épica | 5 | 2 | 4 | 2 | 7 | Gola ornamentada | +2 de Defensa. |
| brachylophosaurus | Brachylophosaurus canadensis | Ornitópodo | Épica | 4 | 2 | 3 | 1 | 6 | Gregario | +1 Poder por cada copia suya que tengas en el campo. |
| tyrannotitan | Tyrannotitan chubutensis | Terópodo | Legendaria | 8 | 3 | 9 | 1 | 7 | Desgarro | A quien hiere no se le cura ninguna herida ese turno. |
| huaxiadraco | Huaxiadraco corollatus | Pterosaurio | Épica | 4 | 2 | 3 | 0 | 3 | Vuelo | Sobrevuela la ranura: golpea siempre al hábitat rival y no recibe daño de combate. |
| gregarismo | Gregarismo | Evento | Rara | 2 | 1 |  |  |  | Gregarismo | +2 Poder a todos tus dinosaurios de la misma especie que el objetivo. |
| gastrolitos | Gastrolitos | Evento | Épica | 2 | 1 |  |  |  | Gastrolitos | El objetivo cura 1 herida al final de cada turno. |
| crecimiento_acelerado | Crecimiento acelerado | Evento | Legendaria | 3 | 1 |  |  |  | Crecimiento acelerado | +2 Poder y +2 Vida permanentes. |
| neumaticidad | Neumaticidad ósea | Evento | Épica | 2 | 1 |  |  |  | Neumaticidad ósea | +2 Poder. Sólo sobre terópodos y saurópodos. |
| fractura | Fractura consolidada | Evento | Épica | 2 | 1 |  |  |  | Fractura consolidada | −2 Poder permanente a un dinosaurio rival. |
| competencia | Competencia trófica | Evento | Épica | 2 | 1 |  |  |  | Competencia trófica | −2 Poder a todos los dinosaurios rivales del clado que elijas. |
| trampa | Trampa de depredadores | Evento | Rara | 3 | 1 |  |  |  | Trampa de depredadores | El rival pierde 12 cartas de su mazo. Tú pierdes 3: el fango no distingue. |
| mortandad | Mortandad estacional | Evento | Legendaria | 3 | 1 |  |  |  | Mortandad estacional | 2 de daño a TODOS los dinosaurios del campo, incluidos los tuyos. |
| rebrote | Rebrote tras incendio | Recurso | Rara | 0 | 0 |  |  |  | Rebrote tras incendio | +3 Biomasa ahora mismo. Todos tus dinosaurios reciben 1 herida. |
| carrona | Carroña abundante | Recurso | Épica | 0 | 0 |  |  |  | Carroña abundante | +3 Biomasa ahora mismo. El rival gana 1 Biomasa. |
| lago | Lago efímero | Recurso | Épica | 0 | 0 |  |  |  | Lago efímero | +2 Biomasa ahora mismo. Tu hábitat pierde 1. |
| llanura | Llanura de inundación | Clima | Épica | 2 | 1 |  |  |  | Llanura de inundación | +1 Biomasa por turno a los dos bandos. |
| canal | Canal fluvial trenzado | Clima | Legendaria | 2 | 1 |  |  |  | Canal fluvial trenzado | Agua permanente: la Sequía estacional no mata a nadie. |
| bosque | Bosque de coníferas ribereño | Clima | Legendaria | 2 | 1 |  |  |  | Bosque de coníferas ribereño | Los saurópodos curan 1 herida al final de cada turno. |
| aridez | Deriva árida | Clima | Épica | 2 | 1 |  |  |  | Deriva árida | Cada turno, los dos bandos pierden 5 cartas del mazo. |
| sabana | Sabana de helechos | Clima | Común | 2 | 1 |  |  |  | Sabana de helechos | Terreno abierto, sin cobertura: +1 al daño contra los biomas. |

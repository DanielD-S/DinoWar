# SET DE CARTAS — DinoWar v2

> Generado por `node sim/set.js` desde `src/data/cards.js` y `src/data/balance.js`.
> Todas las cifras son las que ejecuta el motor, calibradas sobre 2.000 partidas.
>
> **Copias**: cuántos ejemplares de esa carta hay en el mazo.
> **Sed**: heridas que recibe cuando sale *Sequía estacional*. **No es un
> segundo coste**: no se paga al jugarla, sólo cuando el clima lo cobra.

Mazo fijo de **50 cartas**: 19 dinosaurios, 13 eventos, 9 de recurso y 9 de clima.

**Qué revisar sobre todo:** los eventos de presión —Fractura consolidada,
Competencia trófica y Mortandad estacional— y las tres cartas de recurso.
Son lo único del set que no describe un animal sino una presión sobre él, y
es donde más fácil sería que se me hubiera colado algo sin respaldo.

---

## 0. Rarezas

La rareza gobierna cuántas copias caben en el mazo y —cuando existan los
sobres— con qué frecuencia sale. Sigue la abundancia fósil real: los taxones
corrientes de la Morrison son comunes y *Torvosaurus*, genuinamente raro en
el registro, es legendario.

| Rareza | Copias por carta | Cartas distintas | Copias en el mazo |
|---|---|---|---|
| Común | 3 | 5 | 15 |
| Rara | 3 | 3 | 9 |
| Épica | 2 | 11 | 22 |
| Legendaria | 1 | 4 | 4 |

---

## 1. Dinosaurios

| Taxón | Clado | Rareza | Copias | Coste | Ataque | Defensa | Vida | Sed |
|---|---|---|---|---|---|---|---|---|
| *Dryosaurus altus* | Ornitópodo | Común | 3 | 1 | 1 | 0 | 2 | 0 |
| *Ornitholestes hermanni* | Terópodo | Común | 3 | 2 | 2 | 0 | 2 | 0 |
| *Ceratosaurus nasicornis* | Terópodo | Común | 3 | 3 | 4 | 1 | 3 | 2 |
| *Stegosaurus stenops* | Tireóforo | Épica | 2 | 4 | 3 | 3 | 6 | 1 |
| *Allosaurus fragilis* | Terópodo | Épica | 2 | 5 | 6 | 1 | 5 | 1 |
| *Camarasaurus grandis* | Saurópodo | Épica | 2 | 5 | 3 | 2 | 7 | 2 |
| *Diplodocus carnegii* | Saurópodo | Épica | 2 | 5 | 3 | 2 | 10 | 3 |
| *Apatosaurus louisae* | Saurópodo | Legendaria | 1 | 7 | 4 | 3 | 12 | 3 |
| *Torvosaurus tanneri* | Terópodo | Legendaria | 1 | 7 | 8 | 1 | 6 | 2 |

*Camarasaurus* es inmune a la Sed: sus isótopos indican que migraba.

### *Dryosaurus altus* · Ornitópodo · Común · 3 copias

**1 de coste · 1 de Ataque · 2 de Vida** · Defensa propuesta: *0*

**Gregario** — +1 Poder por cada otro Dryosaurus propio en el campo.

`INFERIDO` · Ornitópodo pequeño y cursorial. El gregarismo se infiere de acumulaciones multiindividuo, no está demostrado.

*Por qué 0 de Defensa:* Cursorial y grácil: su defensa es correr, no aguantar.

### *Ornitholestes hermanni* · Terópodo · Común · 3 copias

**2 de coste · 2 de Ataque · 2 de Vida** · Defensa propuesta: *0*

**Oportunista** — +1 Vida permanente cada vez que muere un dinosaurio en el campo.

`INFERIDO` · Terópodo pequeño (~2 m). El comportamiento carroñero es una inferencia a partir de talla y analogía ecológica, no de evidencia directa.

*Por qué 0 de Defensa:* Terópodo de ~2 m, sin blindaje ni masa.

### *Ceratosaurus nasicornis* · Terópodo · Común · 3 copias

**3 de coste · 4 de Ataque · 3 de Vida** · Defensa propuesta: *1*

**Ribereño** — +2 Poder mientras el campo activo sea Canal fluvial trenzado.

`DEBATIDO` · Menos frecuente que Allosaurus. Se ha propuesto una dieta con mayor componente de presa acuática y un uso preferente de ambientes ribereños, a partir de morfología dental y contexto de hallazgos. Hipótesis discutida.

*Por qué 1 de Defensa:* Osificaciones dérmicas dorsales descritas en el holotipo.

### *Stegosaurus stenops* · Tireóforo · Épica · 2 copias

**4 de coste · 3 de Ataque · 6 de Vida** · Defensa propuesta: *3*

**Tagomizador** — Devuelve 2 de daño adicional a quien lo ataque, además del que ya devuelve su clado.

`ESTABLECIDO` · Una vértebra caudal de Allosaurus con una perforación compatible con una púa caudal de Stegosaurus es evidencia directa de uso defensivo del tagomizador.

*Por qué 3 de Defensa:* Placas dorsales y osteodermos en la garganta; el blindaje mejor documentado del set.

### *Allosaurus fragilis* · Terópodo · Épica · 2 copias

**5 de coste · 6 de Ataque · 5 de Vida** · Defensa propuesta: *1*

**Depredador dominante** — Si mata a su rival, el daño sobrante pasa al habitat enemigo.

`ESTABLECIDO` · Taxón de terópodo más abundante de la Morrison. Marcas de mordida atribuidas a Allosaurus aparecen en huesos de saurópodos y de Stegosaurus.

*Por qué 1 de Defensa:* Cráneo y esqueleto robustos, sin armadura dérmica.

### *Camarasaurus grandis* · Saurópodo · Épica · 2 copias

**5 de coste · 3 de Ataque · 7 de Vida** · Defensa propuesta: *2*

**Migrador** — Puede cambiar de ranura en vez de desplegar. Inmune a Sequía estacional.

`ESTABLECIDO` · Análisis isotópicos de esmalte dental sugieren desplazamientos estacionales hacia tierras altas durante la estación seca, a diferencia de otros saurópodos de la misma formación. El rasgo Migrador refleja ese resultado.

*Por qué 2 de Defensa:* Talla adulta de ~15 t como defensa antipredatoria.

### *Diplodocus carnegii* · Saurópodo · Épica · 2 copias

**5 de coste · 3 de Ataque · 10 de Vida** · Defensa propuesta: *2*

**Ramoneo bajo** — Cura 1 herida al final de cada turno.

`ESTABLECIDO` · El desgaste dental y la postura del cuello sustentan una partición de nicho por ramoneo bajo respecto de otros saurópodos coexistentes.

*Por qué 2 de Defensa:* Talla equivalente, cuerpo más grácil.

### *Apatosaurus louisae* · Saurópodo · Legendaria · 1 copia

**7 de coste · 4 de Ataque · 12 de Vida** · Defensa propuesta: *3*

**Masa colosal** — +1 de Defensa adicional: es la mayor masa del set.

`ESTABLECIDO` · La talla adulta de los diplodócidos es en sí misma la principal defensa antipredatoria. Nota: la validez de Brontosaurus como género separado sigue en discusión; el juego usa Apatosaurus.

*Por qué 3 de Defensa:* La mayor masa del set; la talla ES la defensa.

### *Torvosaurus tanneri* · Terópodo · Legendaria · 1 copia

**7 de coste · 8 de Ataque · 6 de Vida** · Defensa propuesta: *1*

**Escaso** — Sólo 1 copia en el mazo. No admite adaptaciones.

`ESTABLECIDO` · El terópodo de mayor tamaño de la formación, pero genuinamente raro en el registro. Su escasez en el mazo replica su escasez fósil.

*Por qué 1 de Defensa:* El mayor terópodo, pero sin blindaje.

---

## 2. Eventos

Un evento **mejora a un dinosaurio tuyo** o **le mete una presión a uno del
rival**. Cada carta dice sobre qué se suelta. Los de mejora son rasgos
biológicos reales, no mutaciones; los de presión son patologías y presiones
ecológicas documentadas, no hechizos: aquí no hay magia, y esa es la parte
del set con más riesgo de romper la restricción paleontológica.

### Gregarismo · Rara · coste 2 · 3 copias

Se juega **sobre un dinosaurio tuyo**. +2 Poder a todos tus dinosaurios de la misma especie que el objetivo.

`INFERIDO` · Acumulaciones monoespecíficas en la Morrison sugieren agregación en varios taxones. La interpretación de estos yacimientos es discutida (¿manada viva o concentración tafonómica?).

### Gastrolitos · Épica · coste 2 · 2 copias

Se juega **sobre un dinosaurio tuyo**. El objetivo cura 1 herida al final de cada turno.

`ESTABLECIDO` · Piedras de molleja asociadas a esqueletos de saurópodos jurásicos. Su función exacta en la digestión sigue en debate.

### Crecimiento acelerado · Legendaria · coste 3 · 1 copia

Se juega **sobre un dinosaurio tuyo**. +2 Poder y +2 Vida permanentes.

`ESTABLECIDO` · La osteohistología muestra tasas de crecimiento altas y sostenidas en saurópodos y en Allosaurus, alcanzando talla adulta en pocas décadas o menos.

### Neumaticidad ósea · Épica · coste 2 · 2 copias

Se juega **sobre un dinosaurio tuyo**. +2 Poder. Sólo sobre terópodos y saurópodos.

`ESTABLECIDO` · Los saurisquios de la Morrison presentan neumatización postcraneal: vértebras invadidas por divertículos de sacos aéreos. Aligera el esqueleto sin perder resistencia. No aparece en tireóforos ni en ornitópodos.

### Fractura consolidada · Épica · coste 2 · 2 copias

Se juega **sobre un dinosaurio del rival**. −2 Poder permanente a un dinosaurio rival.

`ESTABLECIDO` · El registro patológico de la Morrison es abundante: costillas fracturadas y consolidadas, infecciones óseas y lesiones por estrés, especialmente documentadas en ejemplares de Allosaurus. Un animal cojo caza peor, pero sigue vivo.

### Competencia trófica · Épica · coste 2 · 2 copias

Se juega **sobre un clado rival que eliges**. −2 Poder a todos los dinosaurios rivales del clado que elijas.

`INFERIDO` · La coexistencia de varios saurópodos y de varios terópodos grandes en la misma formación implica reparto de recursos. La partición de nicho está sustentada por el desgaste dental; su intensidad como presión competitiva es una inferencia.

### Mortandad estacional · Legendaria · coste 3 · 1 copia

Se juega **sobre el campo entero**. 2 de daño a TODOS los dinosaurios del campo, incluidos los tuyos.

`DEBATIDO` · Algunas acumulaciones óseas de la Morrison se han interpretado como mortandades masivas asociadas a sequía o a eventos de crecida. La causa concreta de cada yacimiento sigue discutiéndose.

### Gregarismo · Rara · coste 2 · 3 copias

+2 Poder a todos tus dinosaurios de la misma especie que el objetivo.

`INFERIDO` · Acumulaciones monoespecíficas en la Morrison sugieren agregación en varios taxones. La interpretación de estos yacimientos es discutida (¿manada viva o concentración tafonómica?).

### Gastrolitos · Épica · coste 2 · 2 copias

El objetivo cura 1 herida al final de cada turno.

`ESTABLECIDO` · Piedras de molleja asociadas a esqueletos de saurópodos jurásicos. Su función exacta en la digestión sigue en debate.

### Crecimiento acelerado · Legendaria · coste 3 · 1 copia

+2 Poder y +2 Vida permanentes.

`ESTABLECIDO` · La osteohistología muestra tasas de crecimiento altas y sostenidas en saurópodos y en Allosaurus, alcanzando talla adulta en pocas décadas o menos.

### Neumaticidad ósea · Épica · coste 2 · 2 copias

+2 Poder. Sólo sobre terópodos y saurópodos.

`ESTABLECIDO` · Los saurisquios de la Morrison presentan neumatización postcraneal: vértebras invadidas por divertículos de sacos aéreos. Aligera el esqueleto sin perder resistencia. No aparece en tireóforos ni en ornitópodos.

### Fractura consolidada · Épica · coste 2 · 2 copias

−2 Poder permanente a un dinosaurio rival.

`ESTABLECIDO` · El registro patológico de la Morrison es abundante: costillas fracturadas y consolidadas, infecciones óseas y lesiones por estrés, especialmente documentadas en ejemplares de Allosaurus. Un animal cojo caza peor, pero sigue vivo.

### Competencia trófica · Épica · coste 2 · 2 copias

−2 Poder a todos los dinosaurios rivales del clado que elijas.

`INFERIDO` · La coexistencia de varios saurópodos y de varios terópodos grandes en la misma formación implica reparto de recursos. La partición de nicho está sustentada por el desgaste dental; su intensidad como presión competitiva es una inferencia.

### Mortandad estacional · Legendaria · coste 3 · 1 copia

2 de daño a TODOS los dinosaurios del campo, incluidos los tuyos.

`DEBATIDO` · Algunas acumulaciones óseas de la Morrison se han interpretado como mortandades masivas asociadas a sequía o a eventos de crecida. La causa concreta de cada yacimiento sigue discutiéndose.

---

## 3. Cartas de recurso

Se juegan **boca arriba y surten efecto al instante**: dar Biomasa «este
turno» no serviría de nada si esperasen a la revelación. A cambio el rival los
ve venir, y eso es parte de su precio. Cuestan 0 y todos traen inconveniente.

### Rebrote tras incendio · Común · 3 copias

+3 Biomasa ahora mismo. Todos tus dinosaurios reciben 1 herida.

`INFERIDO` · Los sedimentos de la Morrison contienen fusaíta —carbón vegetal fósil—, prueba directa de incendios recurrentes. El rebrote nutritivo posterior se infiere por analogía con sabanas actuales, no está medido en el registro.

### Carroña abundante · Rara · 3 copias

+3 Biomasa ahora mismo. El rival gana 1 Biomasa.

`INFERIDO` · Marcas de mordida y dientes desprendidos de terópodo asociados a esqueletos de saurópodo indican consumo de carroña. Un cadáver grande alimenta a más de un carroñero, y no sólo al que llegó primero.

### Lago efímero · Rara · 3 copias

+2 Biomasa ahora mismo. Tu habitat pierde 1.

`INFERIDO` · La Morrison conserva depósitos de lagos alcalinos efímeros de gran extensión, como el llamado lago T’oo’dichi’. Concentran recursos mientras duran; al secarse dejan salinas que el paisaje tarda en recuperar.

---

## 4. Cartas de clima

Los cuatro paleoambientes de la Formación Morrison. **Una activa a la vez**;
cualquiera de los dos bandos puede reemplazarla, y su efecto alcanza a los dos.

### Llanura de inundación · Épica · coste 2

+1 Biomasa por turno a los dos bandos.

`ESTABLECIDO` · Las llanuras de inundación de la Morrison concentran la mayor productividad vegetal estacional de la formación.

### Canal fluvial trenzado · Épica · coste 2

Agua permanente: la Sequía estacional no mata a nadie.

`ESTABLECIDO` · Los sistemas fluviales trenzados de la formación mantienen agua durante la estación seca, con vegetación ribereña estrecha a ambos lados.

### Bosque de coníferas ribereño · Épica · coste 2

Los saurópodos curan 1 herida al final de cada turno.

`ESTABLECIDO` · Los bosques de coníferas ribereños ofrecen ramoneo alto sostenido, el estrato del que dependen los saurópodos de cuello elevado.

### Sabana de helechos · Común · coste 2

Terreno abierto, sin cobertura: +1 al daño contra los biomas.

`ESTABLECIDO` · Extensiones abiertas de helechos sobre suelos semiáridos, sin dosel que rompa la línea de visión ni frene un avance.

---

## 5. Clima estacional

Baraja neutral y compartida, aparte del mazo. Se voltea una carta por turno desde el turno 3. Nadie la controla.

### Sequía estacional

Cada dinosaurio debe pagar su Consumo hídrico en heridas. Camarasaurus es inmune; el Canal fluvial protege a todos.

`ESTABLECIDO` · Los paleosuelos, los depósitos evaporíticos y la estructura de los yacimientos de la Morrison indican un clima marcadamente estacional, semiárido, con precipitación concentrada.

### Crecida monzónica

Todos los dinosaurios curan 1 herida. Este turno los biomas no reciben daño.

`ESTABLECIDO` · La precipitación concentrada de la estación húmeda reverdece la llanura y desborda los canales; el agua rehace el paisaje y frena cualquier avance.

---

## 6. La red trófica actual

El clado no es piedra-papel-tijera: cada relación se apoya en la misma evidencia que cita su carta.

| Relación | Efecto |
|---|---|
| Terópodo ataca a Ornitópodo | +2 de daño |
| Atacar a un Tireóforo | devuelve 2 de daño |

**Resuelto así:** la Defensa por carta **sustituye** a la reducción del clado.
Si se acumulasen, *Apatosaurus* reduciría 5 de cada golpe —más que el Ataque
de casi todo el set— y sería intocable. El
Saurópodo deja de tener regla propia y su identidad pasa a ser su línea de
estadísticas —mucha Vida, mucha Defensa, poco Ataque—, que es más honesto: un
clado no necesita una regla especial si sus números ya lo dicen. Terópodo y
Tireóforo conservan las suyas.


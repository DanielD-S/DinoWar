# SET DE CARTAS — DinoWar v2

> Generado por `node sim/set.js` desde `src/data/cards.js` y `src/data/balance.js`.
> Todas las cifras son las que ejecuta el motor, calibradas sobre 2.000 partidas.
>
> **Copias**: ejemplares de esa carta en el mazo de referencia, que es el
> que lleva la IA y el que mide BALANCE.md. Tu mazo lo montas tú.
> **Sed**: heridas que recibe cuando sale *Sequía estacional*. **No es un
> segundo coste**: no se paga al jugarla, sólo cuando el clima lo cobra.

El set tiene **31 cartas distintas**. Un mazo son **50 cartas exactas**, así que no caben todas: el de referencia lleva 30 dinosaurios, 14 eventos, 3 de recurso y 3 de clima.

Fuera del mazo de referencia, y por tanto sin medir aquí: Carroña abundante, Lago efímero, Llanura de inundación, Bosque de coníferas ribereño. Se juegan igual, pero su calibración no está comprobada.

**Qué revisar sobre todo:** los eventos de presión y las cartas de recurso.
Son lo único del set que no describe un animal sino una presión sobre él, y
es donde más fácil sería que se me hubiera colado algo sin respaldo.

---

## 0. Rarezas

La rareza gobierna cuántas copias de una carta caben en un mazo y con qué
frecuencia sale de un sobre. Sigue la abundancia fósil real: los taxones
corrientes son comunes y *Torvosaurus*, genuinamente raro en el registro,
es legendario.

| Rareza | Copias máximas | Cartas distintas | En el mazo de referencia |
|---|---|---|---|
| Común | 3 | 5 | 12 |
| Rara | 3 | 8 | 21 |
| Épica | 2 | 10 | 11 |
| Legendaria | 1 | 8 | 6 |

---

## 1. Dinosaurios

| Taxón | Clado | Rareza | Copias | Coste | Ataque | Defensa | Vida | Sed |
|---|---|---|---|---|---|---|---|---|
| *Dryosaurus altus* | Ornitópodo | Común | 3 | 0 | 1 | 0 | 2 | undefined |
| *Ornitholestes hermanni* | Terópodo | Común | 3 | 1 | 1 | 1 | 1 | undefined |
| *Ceratosaurus nasicornis* | Terópodo | Común | 3 | 1 | 3 | 0 | 3 | undefined |
| *Stegosaurus stenops* | Tireóforo | Común | 2 | 2 | 1 | 4 | 5 | undefined |
| *Allosaurus fragilis* | Terópodo | Rara | 2 | 3 | 5 | 2 | 3 | undefined |
| *Camarasaurus grandis* | Saurópodo | Rara | 2 | 3 | 2 | 3 | 4 | undefined |
| *Diplodocus carnegii* | Saurópodo | Épica | 1 | 2 | 3 | 3 | 10 | undefined |
| *Apatosaurus louisae* | Saurópodo | Épica | 1 | 3 | 2 | 5 | 10 | undefined |
| *Torvosaurus tanneri* | Terópodo | Legendaria | 1 | 4 | 7 | 1 | 5 | undefined |
| *Nodosaurus textilis* | Tireóforo | Rara | 3 | 2 | 2 | 3 | 5 | undefined |
| *Riparovenator milnerae* | Terópodo | Épica | 2 | 2 | 4 | 1 | 4 | undefined |
| *Lokiceratops rangiformis* | Marginocéfalo | Épica | 1 | 3 | 4 | 1 | 7 | undefined |
| *Brachylophosaurus canadensis* | Ornitópodo | Rara | 3 | 2 | 2 | 1 | 6 | undefined |
| *Tyrannotitan chubutensis* | Terópodo | Legendaria | 1 | 4 | 10 | 1 | 5 | undefined |
| *Huaxiadraco corollatus* | Pterosaurio | Rara | 2 | 2 | 2 | 2 | 2 | undefined |

*Camarasaurus* es inmune a la Sed: sus isótopos indican que migraba.

### *Dryosaurus altus* · Ornitópodo · Común · 3 copias

**0 de coste · 1 de Ataque · 2 de Vida** · Defensa propuesta: *0*

**Gregario** — +1 de Ataque por cada otro Dryosaurus propio en el campo.

`INFERIDO` · Ornitópodo pequeño y cursorial. El gregarismo se infiere de acumulaciones multiindividuo, no está demostrado.

*Por qué 0 de Defensa:* Cursorial y grácil: su defensa es correr, no aguantar.

### *Ornitholestes hermanni* · Terópodo · Común · 3 copias

**1 de coste · 1 de Ataque · 1 de Vida** · Defensa propuesta: *1*

**Oportunista** — +1 Vida permanente cada vez que muere un dinosaurio en el campo.

`INFERIDO` · Terópodo pequeño (~2 m). El comportamiento carroñero es una inferencia a partir de talla y analogía ecológica, no de evidencia directa.

*Por qué 1 de Defensa:* Terópodo de ~2 m, sin blindaje ni masa.

### *Ceratosaurus nasicornis* · Terópodo · Común · 3 copias

**1 de coste · 3 de Ataque · 3 de Vida** · Defensa propuesta: *0*

**Caza en grupo** — +2 de Ataque si hay tres Ceratosaurus tuyos en el campo.

`DEBATIDO` · Menos frecuente que Allosaurus. Se ha propuesto una dieta con mayor componente de presa acuática y un uso preferente de ambientes ribereños, a partir de morfología dental y contexto de hallazgos. Hipótesis discutida.

*Por qué 0 de Defensa:* Osificaciones dérmicas dorsales descritas en el holotipo.

### *Stegosaurus stenops* · Tireóforo · Común · 2 copias

**2 de coste · 1 de Ataque · 5 de Vida** · Defensa propuesta: *4*

**Muro de placas** — +1 de Defensa si tienes otro Stegosaurus en el campo.

`ESTABLECIDO` · Una vértebra caudal de Allosaurus con una perforación compatible con una púa caudal de Stegosaurus es evidencia directa de uso defensivo del tagomizador.

*Por qué 4 de Defensa:* Placas dorsales y osteodermos en la garganta; el blindaje mejor documentado del set.

### *Allosaurus fragilis* · Terópodo · Rara · 2 copias

**3 de coste · 5 de Ataque · 3 de Vida** · Defensa propuesta: *2*

**Depredador dominante** — Si mata a su rival, el daño sobrante pasa al hábitat enemigo.

`ESTABLECIDO` · Taxón de terópodo más abundante de la Morrison. Marcas de mordida atribuidas a Allosaurus aparecen en huesos de saurópodos y de Stegosaurus.

*Por qué 2 de Defensa:* Cráneo y esqueleto robustos, sin armadura dérmica.

### *Camarasaurus grandis* · Saurópodo · Rara · 2 copias

**3 de coste · 2 de Ataque · 4 de Vida** · Defensa propuesta: *3*

**Migrador** — Al jugarla, busca un evento en tu mazo y llévatelo a la mano.

`ESTABLECIDO` · Análisis isotópicos de esmalte dental sugieren desplazamientos estacionales hacia tierras altas durante la estación seca, a diferencia de otros saurópodos de la misma formación. El rasgo Migrador refleja ese resultado.

*Por qué 3 de Defensa:* Talla adulta de ~15 t como defensa antipredatoria.

### *Diplodocus carnegii* · Saurópodo · Épica · 1 copia

**2 de coste · 3 de Ataque · 10 de Vida** · Defensa propuesta: *3*

**Ramoneo bajo** — Recupera +1 de vida al final de cada uno de tus turnos

`ESTABLECIDO` · El desgaste dental y la postura del cuello sustentan una partición de nicho por ramoneo bajo respecto de otros saurópodos coexistentes.

*Por qué 3 de Defensa:* Talla equivalente, cuerpo más grácil.

### *Apatosaurus louisae* · Saurópodo · Épica · 1 copia

**3 de coste · 2 de Ataque · 10 de Vida** · Defensa propuesta: *5*

**Manada** — +1 de Defensa si tienes otro saurópodo en el campo.

`ESTABLECIDO` · La talla adulta de los diplodócidos es en sí misma la principal defensa antipredatoria. Nota: la validez de Brontosaurus como género separado sigue en discusión; el juego usa Apatosaurus.

*Por qué 5 de Defensa:* La mayor masa del set; la talla ES la defensa.

### *Torvosaurus tanneri* · Terópodo · Legendaria · 1 copia

**4 de coste · 7 de Ataque · 5 de Vida** · Defensa propuesta: *1*

**Rastreador** — Al jugarla, busca un clima en tu mazo y llévatelo a la mano.

`ESTABLECIDO` · El terópodo de mayor tamaño de la formación, pero genuinamente raro en el registro. Su escasez en el mazo replica su escasez fósil.

*Por qué 1 de Defensa:* El mayor terópodo, pero sin blindaje.

### *Nodosaurus textilis* · Tireóforo · Rara · 3 copias

**2 de coste · 2 de Ataque · 5 de Vida** · Defensa propuesta: *3*

**Llamada de manada** — Al jugarla, busca un Gregarismo en tu mazo y llévatelo a la mano.

`ESTABLECIDO` · Formación Frontier, Wyoming, Cenomaniense (~100 Ma). Los osteodermos en bandas sobre el dorso están documentados directamente. El taxón en sí es material fragmentario y varios autores lo tratan como nomen dubium: la coraza es firme, la especie lo es menos.

*Por qué 3 de Defensa:* Osteodermos en bandas sobre todo el dorso: coraza en el sentido literal.

### *Riparovenator milnerae* · Terópodo · Épica · 2 copias

**2 de coste · 4 de Ataque · 4 de Vida** · Defensa propuesta: *1*

**Ribereño** — +2 de ataque mientras el Canal fluvial esté en el campo.

`INFERIDO` · Formación Wessex, isla de Wight, Barremiense (~125 Ma), descrito en 2021. Espinosáurido de hocico alargado y dientes cónicos, morfología asociada a capturar peces. En su pariente Baryonyx se conservaron escamas de pez en la cavidad abdominal; para este género es inferencia por morfología.

*Por qué 1 de Defensa:* Espinosáurido grácil, construido para pescar y no para encajar.

### *Lokiceratops rangiformis* · Marginocéfalo · Épica · 1 copia

**3 de coste · 4 de Ataque · 7 de Vida** · Defensa propuesta: *1*

**Gola ornamentada** — +2 de Defensa si tienes otro Lokiceratops en el campo.

`DEBATIDO` · Formación Judith River, Montana, Campaniense (~78 Ma), descrito en 2024. La gola lleva las mayores hojas óseas conocidas en un ceratópsido, asimétricas entre lados. Si servían para defensa, para exhibición o para reconocerse entre especies es justamente lo que se discute.

*Por qué 1 de Defensa:* La gola es hueso, pero está calada y orientada hacia arriba, no hacia el atacante.

### *Brachylophosaurus canadensis* · Ornitópodo · Rara · 3 copias

**2 de coste · 2 de Ataque · 6 de Vida** · Defensa propuesta: *1*

**Gregario** — +1 Poder por cada copia suya que tengas en el campo.

`ESTABLECIDO` · Formaciones Judith River y Oldman, Montana y Alberta, Campaniense (~78 Ma). Los lechos de huesos monoespecíficos de hadrosaurios son la mejor evidencia de vida en manada de todo el registro. De este taxón se conocen además ejemplares con tejido blando conservado.

*Por qué 1 de Defensa:* Hadrosaurio sin armadura: la manada es la defensa, no el cuerpo.

### *Tyrannotitan chubutensis* · Terópodo · Legendaria · 1 copia

**4 de coste · 10 de Ataque · 5 de Vida** · Defensa propuesta: *1*

**Desgarro** — A quien hiere no se le cura ninguna herida ese turno.

`INFERIDO` · Formación Cerro Barcino, Chubut, Argentina, Aptiense (~113 Ma). Carcarodontosáurido de unos 12 metros con dientes comprimidos y aserrados, de filo cortante en vez de aplastante. Que eso implique cortar carne y provocar hemorragias se infiere de la forma del diente, no de una herida fósil.

*Por qué 1 de Defensa:* Doce metros de depredador sin una sola placa dérmica.

### *Huaxiadraco corollatus* · Pterosaurio · Rara · 2 copias

**2 de coste · 2 de Ataque · 2 de Vida** · Defensa propuesta: *2*

**Vuelo** — Sobrevuela la ranura: golpea siempre al hábitat rival, pero quien tenga enfrente le alcanza igual.

`ESTABLECIDO` · Formación Jiufotang, Liaoning, China, Aptiense (~120 Ma). No es un dinosaurio: es un pterosaurio tapejárido, sin dientes y con cresta craneal. Los tapejáridos conservan picnofibras, filamentos tegumentarios reales — la razón por la que este juego no pone plumas a los dinosaurios es que ellos no las tienen, no una regla estética.

*Por qué 2 de Defensa:* Esqueleto neumatizado de pared finísima; lo que no puede encajar, lo esquiva volando.

---

## 2. Eventos

Un evento **mejora a un dinosaurio tuyo** o **le mete una presión a uno del
rival**. Cada carta dice sobre qué se suelta. Los de mejora son rasgos
biológicos reales, no mutaciones; los de presión son patologías y presiones
ecológicas documentadas, no hechizos: aquí no hay magia, y esa es la parte
del set con más riesgo de romper la restricción paleontológica.

### Gregarismo · Rara · coste 1 · 3 copias

Se juega **sobre un dinosaurio tuyo**. +1 de Ataque a todos tus dinosaurios de la misma especie que el objetivo.

`INFERIDO` · Acumulaciones monoespecíficas en la Morrison sugieren agregación en varios taxones. La interpretación de estos yacimientos es discutida (¿manada viva o concentración tafonómica?).

### Gastrolitos · Épica · coste 1 · 2 copias

Se juega **sobre un dinosaurio tuyo**. Cura +1 de vida a un dinosaurio al final del turno

`ESTABLECIDO` · Piedras de molleja asociadas a esqueletos de saurópodos jurásicos. Su función exacta en la digestión sigue en debate.

### Crecimiento acelerado · Legendaria · coste 1 · 1 copia

Se juega **sobre un dinosaurio tuyo**. +2 Poder y +2 Vida permanentes a un dinosaurio que elijas.

`ESTABLECIDO` · La osteohistología muestra tasas de crecimiento altas y sostenidas en saurópodos y en Allosaurus, alcanzando talla adulta en pocas décadas o menos.

### Neumaticidad ósea · Épica · coste 2 · 1 copia

Se juega **sobre un dinosaurio tuyo**. +2 de Ataque permanentes. Sólo sobre terópodos y saurópodos.

`ESTABLECIDO` · Los saurisquios de la Morrison presentan neumatización postcraneal: vértebras invadidas por divertículos de sacos aéreos. Aligera el esqueleto sin perder resistencia. No aparece en tireóforos ni en ornitópodos.

### Fractura consolidada · Épica · coste 2 · 2 copias

Se juega **sobre un dinosaurio del rival**. −2 Poder permanente a un dinosaurio rival.

`ESTABLECIDO` · El registro patológico de la Morrison es abundante: costillas fracturadas y consolidadas, infecciones óseas y lesiones por estrés, especialmente documentadas en ejemplares de Allosaurus. Un animal cojo caza peor, pero sigue vivo.

### Competencia trófica · Épica · coste 3 · 1 copia

Se juega **undefined**. −2 de Defensa a dos dinosaurios rivales que elijas.

`INFERIDO` · La coexistencia de varios saurópodos y de varios terópodos grandes en la misma formación implica reparto de recursos. La partición de nicho está sustentada por el desgaste dental; su intensidad como presión competitiva es una inferencia.

### Trampa de depredadores · Rara · coste 1 · 3 copias

Se juega **sobre la mesa entera, sin elegir objetivo**. El rival pierde 5 cartas de su mazo. Tú pierdes 3: el fango no distingue.

`DEBATIDO` · La cantera Cleveland-Lloyd, en la Morrison de Utah, acumula decenas de individuos de Allosaurus en una proporción de depredadores frente a presas que no se da en un ecosistema vivo. La trampa de depredadores es una de las explicaciones; también se ha propuesto sequía o agua envenenada. El yacimiento es un hecho, su mecanismo no.

### Mortandad estacional · Legendaria · coste 1 · 1 copia

Se juega **sobre la mesa entera, sin elegir objetivo**. 3 de daño a TODOS los dinosaurios del campo, incluidos los tuyos.

`DEBATIDO` · Algunas acumulaciones óseas de la Morrison se han interpretado como mortandades masivas asociadas a sequía o a eventos de crecida. La causa concreta de cada yacimiento sigue discutiéndose.

### Gregarismo · Rara · coste 1 · 3 copias

+1 de Ataque a todos tus dinosaurios de la misma especie que el objetivo.

`INFERIDO` · Acumulaciones monoespecíficas en la Morrison sugieren agregación en varios taxones. La interpretación de estos yacimientos es discutida (¿manada viva o concentración tafonómica?).

### Gastrolitos · Épica · coste 1 · 2 copias

Cura +1 de vida a un dinosaurio al final del turno

`ESTABLECIDO` · Piedras de molleja asociadas a esqueletos de saurópodos jurásicos. Su función exacta en la digestión sigue en debate.

### Crecimiento acelerado · Legendaria · coste 1 · 1 copia

+2 Poder y +2 Vida permanentes a un dinosaurio que elijas.

`ESTABLECIDO` · La osteohistología muestra tasas de crecimiento altas y sostenidas en saurópodos y en Allosaurus, alcanzando talla adulta en pocas décadas o menos.

### Neumaticidad ósea · Épica · coste 2 · 1 copia

+2 de Ataque permanentes. Sólo sobre terópodos y saurópodos.

`ESTABLECIDO` · Los saurisquios de la Morrison presentan neumatización postcraneal: vértebras invadidas por divertículos de sacos aéreos. Aligera el esqueleto sin perder resistencia. No aparece en tireóforos ni en ornitópodos.

### Fractura consolidada · Épica · coste 2 · 2 copias

−2 Poder permanente a un dinosaurio rival.

`ESTABLECIDO` · El registro patológico de la Morrison es abundante: costillas fracturadas y consolidadas, infecciones óseas y lesiones por estrés, especialmente documentadas en ejemplares de Allosaurus. Un animal cojo caza peor, pero sigue vivo.

### Competencia trófica · Épica · coste 3 · 1 copia

−2 de Defensa a dos dinosaurios rivales que elijas.

`INFERIDO` · La coexistencia de varios saurópodos y de varios terópodos grandes en la misma formación implica reparto de recursos. La partición de nicho está sustentada por el desgaste dental; su intensidad como presión competitiva es una inferencia.

### Trampa de depredadores · Rara · coste 1 · 3 copias

El rival pierde 5 cartas de su mazo. Tú pierdes 3: el fango no distingue.

`DEBATIDO` · La cantera Cleveland-Lloyd, en la Morrison de Utah, acumula decenas de individuos de Allosaurus en una proporción de depredadores frente a presas que no se da en un ecosistema vivo. La trampa de depredadores es una de las explicaciones; también se ha propuesto sequía o agua envenenada. El yacimiento es un hecho, su mecanismo no.

### Mortandad estacional · Legendaria · coste 1 · 1 copia

3 de daño a TODOS los dinosaurios del campo, incluidos los tuyos.

`DEBATIDO` · Algunas acumulaciones óseas de la Morrison se han interpretado como mortandades masivas asociadas a sequía o a eventos de crecida. La causa concreta de cada yacimiento sigue discutiéndose.

---

## 3. Cartas de recurso

Se juegan **boca arriba y surten efecto al instante**: dar Biomasa «este
turno» no serviría de nada si esperasen a la revelación. A cambio el rival los
ve venir, y eso es parte de su precio. Cuestan 0 y todos traen inconveniente.

### Rebrote tras incendio · Rara · 3 copias

+2 Biomasa ahora mismo. Todos tus dinosaurios reciben 1 herida.

`INFERIDO` · Los sedimentos de la Morrison contienen fusaíta —carbón vegetal fósil—, prueba directa de incendios recurrentes. El rebrote nutritivo posterior se infiere por analogía con sabanas actuales, no está medido en el registro.

### Carroña abundante · Legendaria · fuera del mazo de referencia

+3 Biomasa ahora mismo. El rival gana 1 Biomasa.

`INFERIDO` · Marcas de mordida y dientes desprendidos de terópodo asociados a esqueletos de saurópodo indican consumo de carroña. Un cadáver grande alimenta a más de un carroñero, y no sólo al que llegó primero.

### Lago efímero · Épica · fuera del mazo de referencia

+2 Biomasa ahora mismo. Tu hábitat pierde 2 puntos.

`INFERIDO` · La Morrison conserva depósitos de lagos alcalinos efímeros de gran extensión, como el llamado lago T’oo’dichi’. Concentran recursos mientras duran; al secarse dejan salinas que el paisaje tarda en recuperar.

---

## 4. Cartas de clima

Los cuatro paleoambientes de la Formación Morrison. **Una activa a la vez**;
cualquiera de los dos bandos puede reemplazarla, y su efecto alcanza a los dos.

### Llanura de inundación · Épica · coste 1

+1 Biomasa para ambos jugadores

`ESTABLECIDO` · Las llanuras de inundación de la Morrison concentran la mayor productividad vegetal estacional de la formación.

### Canal fluvial trenzado · Legendaria · coste 1

Agua permanente en el campo: los ribereños pelean a gusto.

`ESTABLECIDO` · Los sistemas fluviales trenzados de la formación mantienen agua durante la estación seca, con vegetación ribereña estrecha a ambos lados.

### Bosque de coníferas ribereño · Legendaria · coste 1

Los saurópodos curan 1 herida al final de cada turno.

`ESTABLECIDO` · Los bosques de coníferas ribereños ofrecen ramoneo alto sostenido, el estrato del que dependen los saurópodos de cuello elevado.

### Deriva árida · Legendaria · coste 1

Ambos jugadores pierden 5 cartas del mazo

`INFERIDO` · Los paleosuelos calcáreos, las evaporitas y los depósitos eólicos de la Morrison documentan un clima semiárido y muy estacional que se acentúa hacia el techo de la formación. Que esa deriva mermara las poblaciones es una inferencia razonable, no una medida.

### Sabana de helechos · Común · coste 1

Terreno abierto, sin cobertura: +1 al daño contra los biomas.

`ESTABLECIDO` · Extensiones abiertas de helechos sobre suelos semiáridos, sin dosel que rompa la línea de visión ni frene un avance.

---

## 5. La red trófica actual

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


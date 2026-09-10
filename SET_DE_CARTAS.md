# SET DE CARTAS — DinoWar v2

> Generado por `node sim/set.js` desde `src/data/cards.js` y `src/data/balance.js`.
> Todas las cifras son las que ejecuta el motor, calibradas sobre 2.000 partidas.
>
> **Copias**: ejemplares de esa carta en el mazo de referencia, que es el
> que lleva la IA y el que mide BALANCE.md. Tu mazo lo montas tú.
> **Sed**: heridas que recibe cuando sale *Sequía estacional*. **No es un
> segundo coste**: no se paga al jugarla, sólo cuando el clima lo cobra.

El set tiene **66 cartas distintas**. Un mazo son **50 cartas exactas**, así que no caben todas: el de referencia lleva 30 dinosaurios, 14 eventos, 3 de recurso y 3 de clima.

Fuera del mazo de referencia, y por tanto sin medir aquí: Carroña abundante, Lago efímero, Crecida estacional, Estación de lluvias, Plesiopleurodon wellesi, Ojoraptorsaurus boerei, Dromaeosaurus albertensis, Athenar bermani, Sanjuansaurus gordilloi, Suchomimus tenerensis, Eosinopteryx brevipenna, Troodon formosus, Carnotaurus sastrei, Spinosaurus aegyptiacus, Mosasaurus hoffmannii, Halszkaraptor escuilliei, Tongtianlong limosus, Scanisaurus nazarowi, Monolophosaurus jiangi, Invictarx zephyri, Medusaceratops lokii, Platyceratops tatarinovi, Loricatosaurus priscus, Therizinosaurus cheloniformis, Alaskacephale gangloffi, Titanoceratops ouranos, Atlasaurus imelakei, Stegoceras validum, Maiasaura peeblesorum, Edmontosaurus annectens, Plateosauravus cullingworthi, Gargoyleosaurus parkpinorum, Wendiceratops pinhornensis, Antarctosaurus wichmannianus, Liaoceratops yanzigouensis, Rhinorex condrupus, Bienosaurus lufengensis, Shuangmiaosaurus gilmorei, Chasmosaurus belli. Se juegan igual, pero su calibración no está comprobada.

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
| Común | 3 | 19 | 13 |
| Rara | 3 | 17 | 20 |
| Épica | 2 | 18 | 12 |
| Legendaria | 1 | 12 | 5 |

---

## 1. Dinosaurios

| Taxón | Clado | Rareza | Copias | Coste | Ataque | Vida | Sed |
|---|---|---|---|---|---|---|---|
| *Dryosaurus altus* | Ornitópodo | Común | 3 | 0 | 1 | 2 | undefined |
| *Ornitholestes hermanni* | Terópodo | Común | 3 | 1 | 2 | 2 | undefined |
| *Ceratosaurus nasicornis* | Terópodo | Común | 3 | 2 | 4 | 2 | undefined |
| *Stegosaurus stenops* | Tireóforo | Común | 3 | 2 | 1 | 5 | undefined |
| *Allosaurus fragilis* | Terópodo | Rara | 2 | 3 | 5 | 5 | undefined |
| *Camarasaurus grandis* | Saurópodo | Rara | 2 | 3 | 1 | 8 | undefined |
| *Diplodocus carnegii* | Saurópodo | Rara | 1 | 2 | 3 | 8 | undefined |
| *Apatosaurus louisae* | Saurópodo | Rara | 1 | 3 | 2 | 10 | undefined |
| *Torvosaurus tanneri* | Terópodo | Épica | 1 | 4 | 8 | 5 | undefined |
| *Nodosaurus textilis* | Tireóforo | Épica | 2 | 3 | 3 | 8 | undefined |
| *Riparovenator milnerae* | Terópodo | Épica | 2 | 3 | 3 | 3 | undefined |
| *Lokiceratops rangiformis* | Marginocéfalo | Épica | 1 | 3 | 4 | 7 | undefined |
| *Brachylophosaurus canadensis* | Ornitópodo | Rara | 3 | 2 | 0 | 10 | undefined |
| *Tyrannotitan chubutensis* | Terópodo | Legendaria | 1 | 4 | 10 | 7 | undefined |
| *Huaxiadraco corollatus* | Pterosaurio | Rara | 2 | 2 | 2 | 4 | undefined |
| *Plesiopleurodon wellesi* | Reptil marino | Épica | 0 | 3 | 8 | 4 | undefined |
| *Ojoraptorsaurus boerei* | Terópodo | Rara | 0 | 2 | 2 | 4 | undefined |
| *Dromaeosaurus albertensis* | Terópodo | Común | 0 | 2 | 3 | 3 | undefined |
| *Athenar bermani* | Saurópodo | Común | 0 | 2 | 2 | 3 | undefined |
| *Sanjuansaurus gordilloi* | Terópodo | Rara | 0 | 2 | 3 | 3 | undefined |
| *Suchomimus tenerensis* | Terópodo | Épica | 0 | 3 | 7 | 7 | undefined |
| *Eosinopteryx brevipenna* | Terópodo | Común | 0 | 0 | 1 | 1 | undefined |
| *Troodon formosus* | Terópodo | Común | 0 | 1 | 1 | 2 | undefined |
| *Carnotaurus sastrei* | Terópodo | Épica | 0 | 3 | 7 | 3 | undefined |
| *Spinosaurus aegyptiacus* | Terópodo | Legendaria | 0 | 4 | 10 | 8 | undefined |
| *Mosasaurus hoffmannii* | Reptil marino | Legendaria | 0 | 4 | 8 | 10 | undefined |
| *Halszkaraptor escuilliei* | Terópodo | Rara | 0 | 1 | 2 | 2 | undefined |
| *Tongtianlong limosus* | Terópodo | Común | 0 | 1 | 1 | 1 | undefined |
| *Scanisaurus nazarowi* | Reptil marino | Rara | 0 | 4 | 3 | 3 | undefined |
| *Monolophosaurus jiangi* | Terópodo | Rara | 0 | 4 | 3 | 3 | undefined |
| *Invictarx zephyri* | Tireóforo | Rara | 0 | 3 | 1 | 1 | undefined |
| *Medusaceratops lokii* | Marginocéfalo | Épica | 0 | 3 | 2 | 10 | undefined |
| *Platyceratops tatarinovi* | Marginocéfalo | Común | 0 | 1 | 1 | 2 | undefined |
| *Loricatosaurus priscus* | Tireóforo | Común | 0 | 3 | 0 | 8 | undefined |
| *Therizinosaurus cheloniformis* | Terópodo | Común | 0 | 3 | 1 | 6 | undefined |
| *Alaskacephale gangloffi* | Marginocéfalo | Rara | 0 | 2 | 2 | 4 | undefined |
| *Titanoceratops ouranos* | Marginocéfalo | Épica | 0 | 3 | 5 | 7 | undefined |
| *Atlasaurus imelakei* | Saurópodo | Épica | 0 | 3 | 2 | 10 | undefined |
| *Stegoceras validum* | Marginocéfalo | Común | 0 | 2 | 1 | 8 | undefined |
| *Maiasaura peeblesorum* | Ornitópodo | Legendaria | 0 | 3 | 3 | 10 | undefined |
| *Edmontosaurus annectens* | Ornitópodo | Legendaria | 0 | 4 | 2 | 10 | undefined |
| *Plateosauravus cullingworthi* | Saurópodo | Común | 0 | 2 | 2 | 2 | undefined |
| *Gargoyleosaurus parkpinorum* | Tireóforo | Rara | 0 | 2 | 2 | 4 | undefined |
| *Wendiceratops pinhornensis* | Marginocéfalo | Épica | 0 | 3 | 5 | 8 | undefined |
| *Antarctosaurus wichmannianus* | Saurópodo | Legendaria | 0 | 4 | 2 | 12 | undefined |
| *Liaoceratops yanzigouensis* | Marginocéfalo | Común | 0 | 1 | 1 | 3 | undefined |
| *Rhinorex condrupus* | Ornitópodo | Épica | 0 | 3 | 3 | 8 | undefined |
| *Bienosaurus lufengensis* | Tireóforo | Común | 0 | 1 | 1 | 3 | undefined |
| *Shuangmiaosaurus gilmorei* | Ornitópodo | Común | 0 | 2 | 2 | 4 | undefined |
| *Chasmosaurus belli* | Marginocéfalo | Común | 0 | 2 | 2 | 4 | undefined |

*Camarasaurus* es inmune a la Sed: sus isótopos indican que migraba.

### *Dryosaurus altus* · Ornitópodo · Común · 3 copias

**0 de coste · 1 de Ataque · 2 de Vida**

**Bandada nerviosa** — Gana +1 de Ataque por cada Dryosaurus en juego, sea de quien sea y este incluido.

`INFERIDO` · Ornitópodo pequeño y cursorial. El gregarismo se infiere de acumulaciones multiindividuo, no está demostrado.

*Sin blindaje:* Cursorial y grácil: su defensa es correr, no aguantar.

### *Ornitholestes hermanni* · Terópodo · Común · 3 copias

**1 de coste · 2 de Ataque · 2 de Vida**

**Salto de entrada** — Cuando entra en juego hiere en 2 al dinosaurio de enfrente.

`INFERIDO` · Terópodo pequeño (~2 m). El comportamiento carroñero es una inferencia a partir de talla y analogía ecológica, no de evidencia directa.

*Sin blindaje:* Terópodo de ~2 m, sin blindaje ni masa.

### *Ceratosaurus nasicornis* · Terópodo · Común · 3 copias

**2 de coste · 4 de Ataque · 2 de Vida**

**Ayuno del cazador** — Cuando entra en juego descarta 2 cartas de tu mazo.

`DEBATIDO` · Menos frecuente que Allosaurus. Se ha propuesto una dieta con mayor componente de presa acuática y un uso preferente de ambientes ribereños, a partir de morfología dental y contexto de hallazgos. Hipótesis discutida.

*De sus 2 de Vida, 1 son blindaje:* Osificaciones dérmicas dorsales descritas en el holotipo.

### *Stegosaurus stenops* · Tireóforo · Común · 3 copias

**2 de coste · 1 de Ataque · 5 de Vida**

**Muro de placas** — Gana +1 de Ataque por cada Stegosaurus que tengas en juego, este incluido.

`ESTABLECIDO` · Una vértebra caudal de Allosaurus con una perforación compatible con una púa caudal de Stegosaurus es evidencia directa de uso defensivo del tagomizador.

*De sus 5 de Vida, 3 son blindaje:* Placas dorsales y osteodermos en la garganta; el blindaje mejor documentado del set.

### *Allosaurus fragilis* · Terópodo · Rara · 2 copias

**3 de coste · 5 de Ataque · 5 de Vida**

**Zarpazo por sorpresa** — Cuando entra en juego descarta 1 carta al azar de la mano de tu rival.

`ESTABLECIDO` · Taxón de terópodo más abundante de la Morrison. Marcas de mordida atribuidas a Allosaurus aparecen en huesos de saurópodos y de Stegosaurus.

*De sus 5 de Vida, 1 son blindaje:* Cráneo y esqueleto robustos, sin armadura dérmica.

### *Camarasaurus grandis* · Saurópodo · Rara · 2 copias

**3 de coste · 1 de Ataque · 8 de Vida**

**Rumia** — Al final de tu turno recupera 1 de Vida.

`ESTABLECIDO` · Análisis isotópicos de esmalte dental sugieren desplazamientos estacionales hacia tierras altas durante la estación seca, a diferencia de otros saurópodos de la misma formación. El rasgo Migrador refleja ese resultado.

*De sus 8 de Vida, 2 son blindaje:* Talla adulta de ~15 t como defensa antipredatoria.

### *Diplodocus carnegii* · Saurópodo · Rara · 1 copia

**2 de coste · 3 de Ataque · 8 de Vida**

**Pisa y abona** — Cuando entra en juego tu hábitat recupera 1 punto.

`ESTABLECIDO` · El desgaste dental y la postura del cuello sustentan una partición de nicho por ramoneo bajo respecto de otros saurópodos coexistentes.

*De sus 8 de Vida, 2 son blindaje:* Talla equivalente, cuerpo más grácil.

### *Apatosaurus louisae* · Saurópodo · Rara · 1 copia

**3 de coste · 2 de Ataque · 10 de Vida**

**Pisa y abona** — Cuando entra en juego tu hábitat recupera 1 punto.

`ESTABLECIDO` · La talla adulta de los diplodócidos es en sí misma la principal defensa antipredatoria. Nota: la validez de Brontosaurus como género separado sigue en discusión; el juego usa Apatosaurus.

*De sus 10 de Vida, 3 son blindaje:* La mayor masa del set; la talla ES la defensa.

### *Torvosaurus tanneri* · Terópodo · Épica · 1 copia

**4 de coste · 8 de Ataque · 5 de Vida**

**Indiferente al cielo** — No le afectan los efectos del clima.

`ESTABLECIDO` · El terópodo de mayor tamaño de la formación, pero genuinamente raro en el registro. Su escasez en el mazo replica su escasez fósil.

*De sus 5 de Vida, 1 son blindaje:* El mayor terópodo, pero sin blindaje.

### *Nodosaurus textilis* · Tireóforo · Épica · 2 copias

**3 de coste · 3 de Ataque · 8 de Vida**

**Indiferente al cielo** — No le afectan los efectos del clima.

`ESTABLECIDO` · Formación Frontier, Wyoming, Cenomaniense (~100 Ma). Los osteodermos en bandas sobre el dorso están documentados directamente. El taxón en sí es material fragmentario y varios autores lo tratan como nomen dubium: la coraza es firme, la especie lo es menos.

*De sus 8 de Vida, 4 son blindaje:* Osteodermos en bandas sobre todo el dorso: coraza en el sentido literal.

### *Riparovenator milnerae* · Terópodo · Épica · 2 copias

**3 de coste · 3 de Ataque · 3 de Vida**

**Fuera del alcance** — No le afectan las cartas de evento de tu rival.

`INFERIDO` · Formación Wessex, isla de Wight, Barremiense (~125 Ma), descrito en 2021. Espinosáurido de hocico alargado y dientes cónicos, morfología asociada a capturar peces. En su pariente Baryonyx se conservaron escamas de pez en la cavidad abdominal; para este género es inferencia por morfología.

*De sus 3 de Vida, 1 son blindaje:* Espinosáurido grácil, construido para pescar y no para encajar.

### *Lokiceratops rangiformis* · Marginocéfalo · Épica · 1 copia

**3 de coste · 4 de Ataque · 7 de Vida**

**Fuera del alcance** — No le afectan las cartas de evento de tu rival.

`DEBATIDO` · Formación Judith River, Montana, Campaniense (~78 Ma), descrito en 2024. La gola lleva las mayores hojas óseas conocidas en un ceratópsido, asimétricas entre lados. Si servían para defensa, para exhibición o para reconocerse entre especies es justamente lo que se discute.

*De sus 7 de Vida, 2 son blindaje:* La gola es hueso, pero está calada y orientada hacia arriba, no hacia el atacante.

### *Brachylophosaurus canadensis* · Ornitópodo · Rara · 3 copias

**2 de coste · 0 de Ataque · 10 de Vida**

**Rebaño de tres** — Si llegas a tener 3 Brachylophosaurus en juego, éste gana +6 de Ataque para siempre.

`ESTABLECIDO` · Formaciones Judith River y Oldman, Montana y Alberta, Campaniense (~78 Ma). Los lechos de huesos monoespecíficos de hadrosaurios son la mejor evidencia de vida en manada de todo el registro. De este taxón se conocen además ejemplares con tejido blando conservado.

*De sus 10 de Vida, 1 son blindaje:* Hadrosaurio sin armadura: la manada es la defensa, no el cuerpo.

### *Tyrannotitan chubutensis* · Terópodo · Legendaria · 1 copia

**4 de coste · 10 de Ataque · 7 de Vida**

**Tijera** — Cuando entra en juego manda al descarte 1 dinosaurio rival de hasta 4 de Vida.

`INFERIDO` · Formación Cerro Barcino, Chubut, Argentina, Aptiense (~113 Ma). Carcarodontosáurido de unos 12 metros con dientes comprimidos y aserrados, de filo cortante en vez de aplastante. Que eso implique cortar carne y provocar hemorragias se infiere de la forma del diente, no de una herida fósil.

*De sus 7 de Vida, 1 son blindaje:* Doce metros de depredador sin una sola placa dérmica.

### *Huaxiadraco corollatus* · Pterosaurio · Rara · 2 copias

**2 de coste · 2 de Ataque · 4 de Vida**

**Vuelo de reconocimiento** — Cuando entra en juego robas 1 carta.

`ESTABLECIDO` · Formación Jiufotang, Liaoning, China, Aptiense (~120 Ma). No es un dinosaurio: es un pterosaurio tapejárido, sin dientes y con cresta craneal. Los tapejáridos conservan picnofibras, filamentos tegumentarios reales — la razón por la que este juego no pone plumas a los dinosaurios es que ellos no las tienen, no una regla estética.

*Sin blindaje:* Esqueleto neumatizado de pared finísima; lo que no puede encajar, lo esquiva volando.

### *Plesiopleurodon wellesi* · Reptil marino · Épica · fuera del mazo de referencia

**3 de coste · 8 de Ataque · 4 de Vida**

**Sigue a los grandes** — Gana +2 de Ataque si tienes en juego algún dinosaurio con más de 6 de Vida.

`INFERIDO` · Plesiosaurio pliosáurido del Cretácico Superior de Wyoming. No es un dinosaurio: es un reptil marino de cuello corto y cráneo enorme.

### *Ojoraptorsaurus boerei* · Terópodo · Rara · fuera del mazo de referencia

**2 de coste · 2 de Ataque · 4 de Vida**

**Salto de entrada** — Cuando entra en juego hiere en 2 al dinosaurio de enfrente.

`INFERIDO` · Oviraptorosaurio caenagnátido de la Formación Ojo Alamo, Nuevo México, Maastrichtiense. Se conoce por poco material pélvico.

### *Dromaeosaurus albertensis* · Terópodo · Común · fuera del mazo de referencia

**2 de coste · 3 de Ataque · 3 de Vida**

**Jauría** — Gana +1 de Ataque por cada Dromaeosaurus en juego, sea de quien sea y este incluido.

`INFERIDO` · Dromeosáurido de la Formación Dinosaur Park, Alberta, Campaniense. Es el género que da nombre a toda la familia.

### *Athenar bermani* · Saurópodo · Común · fuera del mazo de referencia

**2 de coste · 2 de Ataque · 3 de Vida**

**Olfato de tormenta** — Al jugarlo, puedes llevarte a la mano una carta de evento de tu mazo.

`ESTABLECIDO` · Formación Morrison, cantera Carnegie del Dinosaur National Monument, Utah, Titoniense inferior (~149–145 Ma). Descrito en 2025 sobre un neurocráneo y techo craneal (CM 26552) que llevaba décadas archivado como Diplodocus. Es un dicreosáurido: saurópodos de cuello corto y talla modesta para el grupo, no un terópodo.

### *Sanjuansaurus gordilloi* · Terópodo · Rara · fuera del mazo de referencia

**2 de coste · 3 de Ataque · 3 de Vida**

**Olfato de tormenta** — Al jugarlo, puedes llevarte a la mano una carta de clima de tu mazo.

`INFERIDO` · Herrerasáurido de la Formación Ischigualasto, Argentina, Carniense (~231 Ma). Los herrerasáuridos son saurisquios muy basales; su colocación entre los terópodos se discute.

### *Suchomimus tenerensis* · Terópodo · Épica · fuera del mazo de referencia

**3 de coste · 7 de Ataque · 7 de Vida**

**Rastreo de orilla** — Cuando entra en juego descarta 1 carta del mazo de tu rival.

`INFERIDO` · Espinosáurido de la Formación Elrhaz, Níger, Aptiense. Hocico largo y cónico, adaptado a la pesca.

### *Eosinopteryx brevipenna* · Terópodo · Común · fuera del mazo de referencia

**0 de coste · 1 de Ataque · 1 de Vida**

**Percha compartida** — Gana +1 de Vida por cada Eosinopteryx que tengas en juego, este incluido.

`INFERIDO` · Paraviano diminuto de la Formación Tiaojishan, China, Jurásico Superior. Conserva impresiones de plumas.

### *Troodon formosus* · Terópodo · Común · fuera del mazo de referencia

**1 de coste · 1 de Ataque · 2 de Vida**

**Caza coordinada** — Gana +1 de Ataque por cada Troodon que tengas en juego, este incluido.

`INFERIDO` · Terópodo maniraptor del Cretácico Superior de Norteamérica. El nombre se basa en dientes aislados y su validez está discutida.

### *Carnotaurus sastrei* · Terópodo · Épica · fuera del mazo de referencia

**3 de coste · 7 de Ataque · 3 de Vida**

**Territorio exclusivo** — Para jugarlo tienes que descartar 2 cartas de tu mano.

`INFERIDO` · Abelisáurido de la Formación La Colonia, Argentina, Maastrichtiense. Cuernos frontales y brazos reducidos al extremo.

### *Spinosaurus aegyptiacus* · Terópodo · Legendaria · fuera del mazo de referencia

**4 de coste · 10 de Ataque · 8 de Vida**

**Draga el río** — Cuando entra en juego descarta 5 cartas del mazo de tu rival y 2 del tuyo.

`INFERIDO` · Espinosáurido de los Kem Kem, Marruecos, Cenomaniense. Vela dorsal y un estilo de vida acuático que sigue debatiéndose.

### *Mosasaurus hoffmannii* · Reptil marino · Legendaria · fuera del mazo de referencia

**4 de coste · 8 de Ataque · 10 de Vida**

**Draga el río** — Cuando entra en juego descarta 5 cartas del mazo de tu rival y 2 del tuyo.

`INFERIDO` · Mosasaurio del Maastrichtiense. No es un dinosaurio: es un escamoso marino, pariente de varanos y serpientes.

### *Halszkaraptor escuilliei* · Terópodo · Rara · fuera del mazo de referencia

**1 de coste · 2 de Ataque · 2 de Vida**

**Nadador de temporal** — Gana +2 de Vida mientras haya un clima en el campo.

`INFERIDO` · Dromeosáurido halszkaraptorino de Mongolia, Campaniense. Cuello largo y hocico con muchos dientes pequeños; se ha propuesto un modo de vida semiacuático.

### *Tongtianlong limosus* · Terópodo · Común · fuera del mazo de referencia

**1 de coste · 1 de Ataque · 1 de Vida**

**Nadador de temporal** — Gana +2 de Ataque mientras haya un clima en el campo.

`INFERIDO` · Oviraptorosaurio de la Formación Nanxiong, China, Maastrichtiense. El holotipo se conservó en postura de haber quedado atrapado en el barro.

### *Scanisaurus nazarowi* · Reptil marino · Rara · fuera del mazo de referencia

**4 de coste · 3 de Ataque · 3 de Vida**

**Banco de caza** — Mientras esté en juego, tus reptiles marinos ganan +1 de Ataque.

`INFERIDO` · Plesiosaurio elasmosáurido del Cretácico Superior del Báltico. No es un dinosaurio, y su validez como género está discutida.

### *Monolophosaurus jiangi* · Terópodo · Rara · fuera del mazo de referencia

**4 de coste · 3 de Ataque · 3 de Vida**

**Cresta de mando** — Mientras esté en juego, tus terópodos ganan +1 de Vida.

`INFERIDO` · Terópodo tetanuro de la Formación Shishugou, China, Jurásico Medio. Una sola cresta ósea recorre el cráneo.

### *Invictarx zephyri* · Tireóforo · Rara · fuera del mazo de referencia

**3 de coste · 1 de Ataque · 1 de Vida**

**Formación cerrada** — Mientras esté en juego, tus tireóforos ganan +1 de Vida.

`INFERIDO` · Anquilosaurio nodosáurido de la Formación Menefee, Nuevo México, Campaniense.

### *Medusaceratops lokii* · Marginocéfalo · Épica · fuera del mazo de referencia

**3 de coste · 2 de Ataque · 10 de Vida**

**Muralla de golas** — Mientras esté en juego, tus marginocéfalos ganan +1 de Ataque y +1 de Vida.

`INFERIDO` · Ceratópsido casmosaurino de la Formación Judith River, Montana, Campaniense.

### *Platyceratops tatarinovi* · Marginocéfalo · Común · fuera del mazo de referencia

**1 de coste · 1 de Ataque · 2 de Vida**

**Llamada de manada** — Al jugarlo, puedes llevarte a la mano otro Platyceratops de tu mazo.

`INFERIDO` · Ceratopsio bagaceratópsido de Mongolia, Campaniense. Pequeño y sin cuernos.

### *Loricatosaurus priscus* · Tireóforo · Común · fuera del mazo de referencia

**3 de coste · 0 de Ataque · 8 de Vida**

**Terraplén** — Cuando entra en juego tu hábitat recupera 2 puntos.

`INFERIDO` · Estegosáurido del Calloviense de Inglaterra y Francia. Se separó del material antes atribuido a Lexovisaurus.

### *Therizinosaurus cheloniformis* · Terópodo · Común · fuera del mazo de referencia

**3 de coste · 1 de Ataque · 6 de Vida**

**Garra de sequía** — Gana +3 de Ataque mientras haya un clima en el campo.

`INFERIDO` · Terizinosaurio de la Formación Nemegt, Mongolia, Maastrichtiense. Terópodo herbívoro con las garras manuales más largas que se conocen.

### *Alaskacephale gangloffi* · Marginocéfalo · Rara · fuera del mazo de referencia

**2 de coste · 2 de Ataque · 4 de Vida**

**Testarazo** — Cuando entra en juego hiere en 2 al dinosaurio de enfrente.

`INFERIDO` · Paquicefalosaurio de la Formación Prince Creek, Alaska, Campaniense.

### *Titanoceratops ouranos* · Marginocéfalo · Épica · fuera del mazo de referencia

**3 de coste · 5 de Ataque · 7 de Vida**

**Cuerno mayor** — Gana +1 de Ataque por cada marginocéfalo que tengas en juego, este incluido.

`INFERIDO` · Ceratópsido casmosaurino de Nuevo México, Campaniense. Se propuso separándolo de material asignado a Pentaceratops, y no todos lo aceptan.

### *Atlasaurus imelakei* · Saurópodo · Épica · fuera del mazo de referencia

**3 de coste · 2 de Ataque · 10 de Vida**

**Sombra del cuello** — Mientras esté en juego, tus saurópodos ganan +1 de Vida.

`INFERIDO` · Saurópodo del Jurásico Medio de Marruecos. Extremidades desproporcionadamente largas para un saurópodo.

### *Stegoceras validum* · Marginocéfalo · Común · fuera del mazo de referencia

**2 de coste · 1 de Ataque · 8 de Vida**

**Cabezazo de vuelta** — Devuelve 2 de daño a quien lo hiera en combate.

`INFERIDO` · Paquicefalosaurio de la Formación Dinosaur Park, Alberta, Campaniense. Domo craneal grueso.

### *Maiasaura peeblesorum* · Ornitópodo · Legendaria · fuera del mazo de referencia

**3 de coste · 3 de Ataque · 10 de Vida**

**Buena madre** — Al final de tu turno, todos tus dinosaurios recuperan 1 de Vida.

`INFERIDO` · Hadrosáurido de la Formación Two Medicine, Montana, Campaniense. Sus nidadas documentan cuidado parental.

### *Edmontosaurus annectens* · Ornitópodo · Legendaria · fuera del mazo de referencia

**4 de coste · 2 de Ataque · 10 de Vida**

**Migración en masa** — Mientras esté en juego, tus ornitópodos ganan +1 de Ataque y +1 de Vida.

`INFERIDO` · Hadrosáurido del Maastrichtiense de Norteamérica. Uno de los dinosaurios con más ejemplares conocidos.

### *Plateosauravus cullingworthi* · Saurópodo · Común · fuera del mazo de referencia

**2 de coste · 2 de Ataque · 2 de Vida**

**Colonia de ribera** — Gana +1 de Ataque y +1 de Vida por cada Plateosauravus que tengas en juego, este incluido.

`INFERIDO` · Sauropodomorfo basal de la Formación Elliot, Sudáfrica, Triásico Superior. No es un saurópodo verdadero; se agrupa aquí por plan corporal. Su posición es incierta incluso dentro de los plateosaurios, y parte del material asignado se considera indeterminado.

### *Gargoyleosaurus parkpinorum* · Tireóforo · Rara · fuera del mazo de referencia

**2 de coste · 2 de Ataque · 4 de Vida**

**Osteodermos** — Devuelve 3 de daño a quien lo hiera en combate.

`INFERIDO` · Anquilosaurio de la Formación Morrison, Jurásico Superior. Uno de los anquilosaurios más antiguos que se conocen bien.

### *Wendiceratops pinhornensis* · Marginocéfalo · Épica · fuera del mazo de referencia

**3 de coste · 5 de Ataque · 8 de Vida**

**Embestida** — Cuando entra en juego manda al descarte 1 dinosaurio rival de hasta 2 de Vida.

`INFERIDO` · Ceratópsido centrosaurino de la Formación Oldman, Alberta, Campaniense.

### *Antarctosaurus wichmannianus* · Saurópodo · Legendaria · fuera del mazo de referencia

**4 de coste · 2 de Ataque · 12 de Vida**

**Refugio polar** — Mientras esté en juego, a ninguno de tus dinosaurios le afectan los efectos del clima.

`INFERIDO` · Titanosaurio del Cretácico Superior de Argentina. El material asignado al género es heterogéneo y su validez se discute.

### *Liaoceratops yanzigouensis* · Marginocéfalo · Común · fuera del mazo de referencia

**1 de coste · 1 de Ataque · 3 de Vida**

**Grito de aviso** — Al jugarlo, puedes llevarte a la mano un marginocéfalo de tu mazo.

`INFERIDO` · Neoceratopsio basal de la Formación Yixian, China, Barremiense. Pequeño y sin gola desarrollada.

### *Rhinorex condrupus* · Ornitópodo · Épica · fuera del mazo de referencia

**3 de coste · 3 de Ataque · 8 de Vida**

**Última llanura** — Gana +2 de Ataque mientras tu hábitat esté por debajo del de tu rival.

`INFERIDO` · Hadrosáurido saurolofino de la Formación Neslen, Utah, Campaniense. Destaca por el gran arco nasal.

### *Bienosaurus lufengensis* · Tireóforo · Común · fuera del mazo de referencia

**1 de coste · 1 de Ataque · 3 de Vida**

**Cría acorazada** — Gana +1 de Vida por cada tireóforo que tengas en juego, este incluido.

`INFERIDO` · Tireóforo basal de la Formación Lufeng, China, Jurásico Inferior. Se conoce por una mandíbula, y su validez está discutida.

### *Shuangmiaosaurus gilmorei* · Ornitópodo · Común · fuera del mazo de referencia

**2 de coste · 2 de Ataque · 4 de Vida**

**Ramoneo de orilla** — Cuando entra en juego tu hábitat recupera 1 punto.

`INFERIDO` · Hadrosauroideo basal de la Formación Sunjiawan, China, Cretácico Superior.

### *Chasmosaurus belli* · Marginocéfalo · Común · fuera del mazo de referencia

**2 de coste · 2 de Ataque · 4 de Vida**

**Vigía de la gola** — Cuando entra en juego robas 1 carta.

`INFERIDO` · Ceratópsido casmosaurino de la Formación Dinosaur Park, Alberta, Campaniense. Gola muy grande con dos aberturas amplias.

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

Se juega **undefined**. −2 de Vida a dos dinosaurios rivales que elijas.

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

−2 de Vida a dos dinosaurios rivales que elijas.

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

### Crecida estacional · Épica · coste 1

Mientras esté en el campo, cada jugador puede cambiar una carta de su mano por otra del mazo, una vez por turno.

`ESTABLECIDO` · La riada estacional desborda el cauce y revuelve el paisaje: lo que había en un sitio aparece en otro.

### Bruma de valle · Legendaria · coste 1

+1 de Vida a todos los dinosaurios del campo, mientras siga en el campo.

`ESTABLECIDO` · Niebla de radiación en los fondos de valle al amanecer. Baja el estrés térmico de todo lo que respira, y en un clima estacionalmente seco eso es aguante.

### Estación de lluvias · Legendaria · coste 1

Los saurópodos curan 1 herida al final de cada turno.

`ESTABLECIDO` · La estación húmeda rebrota el dosel de coníferas de ribera, al que sólo llegan los cuellos largos: es comida que los demás no alcanzan.

### Sequía prolongada · Legendaria · coste 1

Ambos jugadores pierden 5 cartas del mazo cada turno.

`INFERIDO` · Las secas del Kimmeridgiense dejaron paleosuelos con nódulos de caliche y acumulaciones de huesos en las charcas que se iban quedando sin agua.

### Monzón de verano · Común · coste 1

+1 de Biomasa cada turno para los dos jugadores, mientras siga en el campo.

`ESTABLECIDO` · La Morrison estaba bajo circulación monzónica: lluvias de verano concentradas que disparaban la productividad vegetal y dejaban el resto del año seco.

---

## 5. La red trófica actual

El clado no es piedra-papel-tijera: cada relación se apoya en la misma evidencia que cita su carta.

| Relación | Efecto |
|---|---|

**Resuelto así:** la Defensa por carta **sustituye** a la reducción del clado.
Si se acumulasen, *Apatosaurus* reduciría 5 de cada golpe —más que el Ataque
de casi todo el set— y sería intocable. El
Saurópodo deja de tener regla propia y su identidad pasa a ser su línea de
estadísticas —mucha Vida, mucha Defensa, poco Ataque—, que es más honesto: un
clado no necesita una regla especial si sus números ya lo dicen. Terópodo y
Tireóforo conservan las suyas.


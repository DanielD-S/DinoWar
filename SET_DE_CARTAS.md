# SET DE CARTAS — DinoWar v2

> Generado por `node sim/set.js` desde `src/data/cards.js` y `src/data/balance.js`.
> Todas las cifras son las que ejecuta el motor, calibradas sobre 2.000 partidas.
>
> **Copias**: ejemplares de esa carta en el mazo de referencia, que es el
> que lleva la IA y el que mide BALANCE.md. Tu mazo lo montas tú.
> **Sed**: heridas que recibe cuando sale *Sequía estacional*. **No es un
> segundo coste**: no se paga al jugarla, sólo cuando el clima lo cobra.

El set tiene **139 cartas distintas**. Un mazo son **55 cartas exactas**, así que no caben todas: el de referencia lleva 28 dinosaurios, 13 eventos, 4 de recurso y 1 de clima.

Fuera del mazo de referencia, y por tanto sin medir aquí: Torvosaurus tanneri, Nodosaurus textilis, Neumaticidad ósea, Competencia trófica, Mortandad estacional, Llanura de inundación, Bosque de coníferas ribereño, Deriva árida, Tormenta de polvo, Avenida de lodo, Enterramiento rápido, Cauce abandonado, Barrera de troncos, Ceniza volcánica, Sedimento en suspensión, Osario de la charca, Enjambre de carroñeros, Oleada de calor, Estampida, Migración estacional, Crecida del delta, Cantera abierta, Incendio estacional, Colapso del acuífero, Carroña abundante, Lago efímero, Manada de paso, Frutos de cícada, Crecida estacional, Bruma de valle, Estación de lluvias, Sequía prolongada, Plesiopleurodon wellesi, Ojoraptorsaurus boerei, Dromaeosaurus albertensis, Athenar bermani, Sanjuansaurus gordilloi, Suchomimus tenerensis, Eosinopteryx brevipenna, Troodon formosus, Carnotaurus sastrei, Spinosaurus aegyptiacus, Mosasaurus hoffmannii, Halszkaraptor escuilliei, Tongtianlong limosus, Scanisaurus nazarowi, Monolophosaurus jiangi, Invictarx zephyri, Medusaceratops lokii, Platyceratops tatarinovi, Loricatosaurus priscus, Therizinosaurus cheloniformis, Alaskacephale gangloffi, Titanoceratops ouranos, Atlasaurus imelakei, Stegoceras validum, Maiasaura peeblesorum, Edmontosaurus annectens, Plateosauravus cullingworthi, Gargoyleosaurus parkpinorum, Wendiceratops pinhornensis, Antarctosaurus wichmannianus, Liaoceratops yanzigouensis, Rhinorex condrupus, Bienosaurus lufengensis, Shuangmiaosaurus gilmorei, Chasmosaurus belli, Tyrannosaurus rex, Brachiosaurus altithorax, Argentinosaurus huinculensis, Mamenchisaurus hochuanensis, Ankylosaurus magniventris, Euoplocephalus tutus, Triceratops horridus, Parasaurolophus walkeri, Pteranodon longiceps, Quetzalcoatlus northropi, Elasmosaurus platyurus, Gallimimus bullatus, Thescelosaurus neglectus, Deinocheirus mirificus, Anzu wyliei, Nigersaurus taqueti, Shuvuuia deserti, Saurolophus angustirostris, Tarbosaurus bataar, Psittacosaurus mongoliensis, Dakotaraptor steini, Carcharodontosaurus saharicus, Giraffatitan brancai, Tupandactylus imperator, Rugops primus, Ouranosaurus nigeriensis, Deltadromeus agilis, Patagotitan mayorum, Dreadnoughtus schrani, Hatzegopteryx thambema, Borealopelta markmitchelli, Zuul crurivastator, Sauropelta edwardsorum, Arboleda de ginkgos, Juncal de equisetos, Bosque de galería, Helechal arborescente, Vega de aluvión, Humedal de tierras bajas, Manantial perenne. Se juegan igual, pero su calibración no está comprobada.

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
| Común | 3 | 39 | 28 |
| Rara | 3 | 42 | 20 |
| Épica | 2 | 39 | 5 |
| Legendaria | 1 | 19 | 2 |

---

## 1. Dinosaurios

| Taxón | Clado | Rareza | Copias | Coste | Ataque | Vida | Sed |
|---|---|---|---|---|---|---|---|
| *Dryosaurus altus* | Ornitópodo | Común | 3 | 0 | 1 | 2 | undefined |
| *Ornitholestes hermanni* | Terópodo | Común | 2 | 1 | 2 | 2 | undefined |
| *Ceratosaurus nasicornis* | Terópodo | Común | 2 | 2 | 4 | 2 | undefined |
| *Stegosaurus stenops* | Tireóforo | Común | 1 | 2 | 1 | 5 | undefined |
| *Allosaurus fragilis* | Terópodo | Rara | 2 | 3 | 5 | 5 | undefined |
| *Camarasaurus grandis* | Saurópodo | Rara | 1 | 3 | 1 | 8 | undefined |
| *Diplodocus carnegii* | Saurópodo | Rara | 1 | 2 | 3 | 8 | undefined |
| *Apatosaurus louisae* | Saurópodo | Rara | 1 | 3 | 2 | 10 | undefined |
| *Torvosaurus tanneri* | Terópodo | Épica | 0 | 4 | 8 | 5 | undefined |
| *Nodosaurus textilis* | Tireóforo | Épica | 0 | 3 | 3 | 8 | undefined |
| *Riparovenator milnerae* | Terópodo | Épica | 1 | 3 | 3 | 3 | undefined |
| *Lokiceratops rangiformis* | Marginocéfalo | Épica | 1 | 3 | 4 | 7 | undefined |
| *Brachylophosaurus canadensis* | Ornitópodo | Rara | 1 | 2 | 0 | 10 | undefined |
| *Tyrannotitan chubutensis* | Terópodo | Legendaria | 1 | 4 | 10 | 7 | undefined |
| *Huaxiadraco corollatus* | Pterosaurio | Rara | 1 | 2 | 2 | 4 | undefined |
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
| *Tyrannosaurus rex* | Terópodo | Legendaria | 0 | 4 | 11 | 9 | undefined |
| *Velociraptor mongoliensis* | Terópodo | Común | 2 | 0 | 3 | 2 | undefined |
| *Brachiosaurus altithorax* | Saurópodo | Legendaria | 0 | 4 | 3 | 13 | undefined |
| *Argentinosaurus huinculensis* | Saurópodo | Épica | 0 | 4 | 4 | 14 | undefined |
| *Mamenchisaurus hochuanensis* | Saurópodo | Rara | 0 | 4 | 1 | 11 | undefined |
| *Amargasaurus cazadorensis* | Saurópodo | Rara | 2 | 2 | 2 | 5 | undefined |
| *Ankylosaurus magniventris* | Tireóforo | Legendaria | 0 | 4 | 2 | 12 | undefined |
| *Kentrosaurus aethiopicus* | Tireóforo | Común | 2 | 1 | 1 | 3 | undefined |
| *Euoplocephalus tutus* | Tireóforo | Rara | 0 | 3 | 2 | 8 | undefined |
| *Triceratops horridus* | Marginocéfalo | Épica | 0 | 4 | 5 | 8 | undefined |
| *Pachycephalosaurus wyomingensis* | Marginocéfalo | Rara | 2 | 2 | 3 | 4 | undefined |
| *Iguanodon bernissartensis* | Ornitópodo | Rara | 2 | 2 | 3 | 5 | undefined |
| *Parasaurolophus walkeri* | Ornitópodo | Rara | 0 | 3 | 2 | 8 | undefined |
| *Pteranodon longiceps* | Pterosaurio | Común | 0 | 0 | 2 | 2 | undefined |
| *Quetzalcoatlus northropi* | Pterosaurio | Épica | 0 | 3 | 5 | 4 | undefined |
| *Elasmosaurus platyurus* | Reptil marino | Rara | 0 | 3 | 2 | 9 | undefined |
| *Gallimimus bullatus* | Terópodo | Rara | 0 | 2 | 2 | 3 | undefined |
| *Thescelosaurus neglectus* | Ornitópodo | Común | 0 | 1 | 1 | 4 | undefined |
| *Deinocheirus mirificus* | Terópodo | Épica | 0 | 4 | 3 | 8 | undefined |
| *Anzu wyliei* | Terópodo | Rara | 0 | 2 | 3 | 3 | undefined |
| *Nigersaurus taqueti* | Saurópodo | Épica | 0 | 3 | 2 | 9 | undefined |
| *Shuvuuia deserti* | Terópodo | Común | 0 | 1 | 1 | 3 | undefined |
| *Saurolophus angustirostris* | Ornitópodo | Épica | 0 | 3 | 2 | 7 | undefined |
| *Tarbosaurus bataar* | Terópodo | Épica | 0 | 4 | 7 | 6 | undefined |
| *Psittacosaurus mongoliensis* | Marginocéfalo | Común | 0 | 1 | 1 | 3 | undefined |
| *Dakotaraptor steini* | Terópodo | Épica | 0 | 3 | 4 | 5 | undefined |
| *Carcharodontosaurus saharicus* | Terópodo | Legendaria | 0 | 4 | 10 | 7 | undefined |
| *Giraffatitan brancai* | Saurópodo | Legendaria | 0 | 4 | 3 | 13 | undefined |
| *Tupandactylus imperator* | Pterosaurio | Épica | 0 | 3 | 3 | 4 | undefined |
| *Rugops primus* | Terópodo | Rara | 0 | 2 | 3 | 3 | undefined |
| *Ouranosaurus nigeriensis* | Ornitópodo | Rara | 0 | 2 | 2 | 6 | undefined |
| *Deltadromeus agilis* | Terópodo | Épica | 0 | 3 | 6 | 4 | undefined |
| *Patagotitan mayorum* | Saurópodo | Legendaria | 0 | 4 | 4 | 13 | undefined |
| *Dreadnoughtus schrani* | Saurópodo | Épica | 0 | 4 | 4 | 11 | undefined |
| *Hatzegopteryx thambema* | Pterosaurio | Rara | 0 | 3 | 5 | 3 | undefined |
| *Borealopelta markmitchelli* | Tireóforo | Épica | 0 | 3 | 1 | 9 | undefined |
| *Zuul crurivastator* | Tireóforo | Rara | 0 | 2 | 2 | 6 | undefined |
| *Sauropelta edwardsorum* | Tireóforo | Rara | 0 | 3 | 2 | 7 | undefined |

*Camarasaurus* es inmune a la Sed: sus isótopos indican que migraba.

### *Dryosaurus altus* · Ornitópodo · Común · 3 copias

**0 de coste · 1 de Ataque · 2 de Vida**

**Bandada nerviosa** — Gana +1 de Ataque por cada Dryosaurus en juego, sea de quien sea y este incluido.

`INFERIDO` · Ornitópodo pequeño y cursorial. El gregarismo se infiere de acumulaciones multiindividuo, no está demostrado.

*Sin blindaje:* Cursorial y grácil: su defensa es correr, no aguantar.

### *Ornitholestes hermanni* · Terópodo · Común · 2 copias

**1 de coste · 2 de Ataque · 2 de Vida**

**Salto de entrada** — Cuando entra en juego hiere en 2 al dinosaurio de enfrente.

`INFERIDO` · Terópodo pequeño (~2 m). El comportamiento carroñero es una inferencia a partir de talla y analogía ecológica, no de evidencia directa.

*Sin blindaje:* Terópodo de ~2 m, sin blindaje ni masa.

### *Ceratosaurus nasicornis* · Terópodo · Común · 2 copias

**2 de coste · 4 de Ataque · 2 de Vida**

**Ayuno del cazador** — Cuando entra en juego descarta 2 cartas de tu mazo.

`DEBATIDO` · Menos frecuente que Allosaurus. Se ha propuesto una dieta con mayor componente de presa acuática y un uso preferente de ambientes ribereños, a partir de morfología dental y contexto de hallazgos. Hipótesis discutida.

*De sus 2 de Vida, 1 son blindaje:* Osificaciones dérmicas dorsales descritas en el holotipo.

### *Stegosaurus stenops* · Tireóforo · Común · 1 copia

**2 de coste · 1 de Ataque · 5 de Vida**

**Muro de placas** — Gana +1 de Ataque por cada Stegosaurus que tengas en juego, este incluido.

`ESTABLECIDO` · Una vértebra caudal de Allosaurus con una perforación compatible con una púa caudal de Stegosaurus es evidencia directa de uso defensivo del tagomizador.

*De sus 5 de Vida, 3 son blindaje:* Placas dorsales y osteodermos en la garganta; el blindaje mejor documentado del set.

### *Allosaurus fragilis* · Terópodo · Rara · 2 copias

**3 de coste · 5 de Ataque · 5 de Vida**

**Zarpazo por sorpresa** — Cuando entra en juego descarta 1 carta al azar de la mano de tu rival.

`ESTABLECIDO` · Taxón de terópodo más abundante de la Morrison. Marcas de mordida atribuidas a Allosaurus aparecen en huesos de saurópodos y de Stegosaurus.

*De sus 5 de Vida, 1 son blindaje:* Cráneo y esqueleto robustos, sin armadura dérmica.

### *Camarasaurus grandis* · Saurópodo · Rara · 1 copia

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

### *Torvosaurus tanneri* · Terópodo · Épica · fuera del mazo de referencia

**4 de coste · 8 de Ataque · 5 de Vida**

**Indiferente al cielo** — No le afectan los efectos del clima.

`ESTABLECIDO` · El terópodo de mayor tamaño de la formación, pero genuinamente raro en el registro. Su escasez en el mazo replica su escasez fósil.

*De sus 5 de Vida, 1 son blindaje:* El mayor terópodo, pero sin blindaje.

### *Nodosaurus textilis* · Tireóforo · Épica · fuera del mazo de referencia

**3 de coste · 3 de Ataque · 8 de Vida**

**Indiferente al cielo** — No le afectan los efectos del clima.

`ESTABLECIDO` · Formación Frontier, Wyoming, Cenomaniense (~100 Ma). Los osteodermos en bandas sobre el dorso están documentados directamente. El taxón en sí es material fragmentario y varios autores lo tratan como nomen dubium: la coraza es firme, la especie lo es menos.

*De sus 8 de Vida, 4 son blindaje:* Osteodermos en bandas sobre todo el dorso: coraza en el sentido literal.

### *Riparovenator milnerae* · Terópodo · Épica · 1 copia

**3 de coste · 3 de Ataque · 3 de Vida**

**Fuera del alcance** — No le afectan las cartas de evento de tu rival.

`INFERIDO` · Formación Wessex, isla de Wight, Barremiense (~125 Ma), descrito en 2021. Espinosáurido de hocico alargado y dientes cónicos, morfología asociada a capturar peces. En su pariente Baryonyx se conservaron escamas de pez en la cavidad abdominal; para este género es inferencia por morfología.

*De sus 3 de Vida, 1 son blindaje:* Espinosáurido grácil, construido para pescar y no para encajar.

### *Lokiceratops rangiformis* · Marginocéfalo · Épica · 1 copia

**3 de coste · 4 de Ataque · 7 de Vida**

**Fuera del alcance** — No le afectan las cartas de evento de tu rival.

`DEBATIDO` · Formación Judith River, Montana, Campaniense (~78 Ma), descrito en 2024. La gola lleva las mayores hojas óseas conocidas en un ceratópsido, asimétricas entre lados. Si servían para defensa, para exhibición o para reconocerse entre especies es justamente lo que se discute.

*De sus 7 de Vida, 2 son blindaje:* La gola es hueso, pero está calada y orientada hacia arriba, no hacia el atacante.

### *Brachylophosaurus canadensis* · Ornitópodo · Rara · 1 copia

**2 de coste · 0 de Ataque · 10 de Vida**

**Rebaño de tres** — Si llegas a tener 3 Brachylophosaurus en juego, éste gana +6 de Ataque para siempre.

`ESTABLECIDO` · Formaciones Judith River y Oldman, Montana y Alberta, Campaniense (~78 Ma). Los lechos de huesos monoespecíficos de hadrosaurios son la mejor evidencia de vida en manada de todo el registro. De este taxón se conocen además ejemplares con tejido blando conservado.

*De sus 10 de Vida, 1 son blindaje:* Hadrosaurio sin armadura: la manada es la defensa, no el cuerpo.

### *Tyrannotitan chubutensis* · Terópodo · Legendaria · 1 copia

**4 de coste · 10 de Ataque · 7 de Vida**

**Tijera** — Cuando entra en juego manda al descarte 1 dinosaurio rival de hasta 4 de Vida.

`INFERIDO` · Formación Cerro Barcino, Chubut, Argentina, Aptiense (~113 Ma). Carcarodontosáurido de unos 12 metros con dientes comprimidos y aserrados, de filo cortante en vez de aplastante. Que eso implique cortar carne y provocar hemorragias se infiere de la forma del diente, no de una herida fósil.

*De sus 7 de Vida, 1 son blindaje:* Doce metros de depredador sin una sola placa dérmica.

### *Huaxiadraco corollatus* · Pterosaurio · Rara · 1 copia

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

### *Tyrannosaurus rex* · Terópodo · Legendaria · fuera del mazo de referencia

**4 de coste · 11 de Ataque · 9 de Vida**

**Rugido** — Cuando entra en juego tu rival descarta 2 cartas de su mano al azar.

`INFERIDO` · Tiranosáurido de la Formación Hell Creek, Maastrichtiense. El oído interno y la caja craneal sugieren sensibilidad a frecuencias bajas; el rugido es una licencia, los animales actuales de ese tamaño no rugen.

### *Velociraptor mongoliensis* · Terópodo · Común · 2 copias

**0 de coste · 3 de Ataque · 2 de Vida**

**Garra impaciente** — Para jugarlo tienes que descartar 1 carta de tu mano.

`ESTABLECIDO` · Dromeosáurido de la Formación Djadokhta, Mongolia, Campaniense. Del tamaño de un pavo y con plumas: los cúbitos llevan las inserciones de las rémiges.

### *Brachiosaurus altithorax* · Saurópodo · Legendaria · fuera del mazo de referencia

**4 de coste · 3 de Ataque · 13 de Vida**

**Sombra del gigante** — Mientras esté en juego, todos tus dinosaurios ganan +1 de Vida.

`ESTABLECIDO` · Saurópodo de la Morrison, raro en el registro. Patas delanteras más largas que las traseras y cuello alzado: comía donde ningún otro llegaba.

### *Argentinosaurus huinculensis* · Saurópodo · Épica · fuera del mazo de referencia

**4 de coste · 4 de Ataque · 14 de Vida**

**Peso muerto** — Para jugarlo tienes que descartar 2 cartas de tu mano.

`INFERIDO` · Titanosaurio de la Formación Huincul, Argentina, Cenomaniense. Se conoce por unas pocas vértebras y una tibia; la masa estimada, de 65 a 75 toneladas, es de las mayores de cualquier animal terrestre.

### *Mamenchisaurus hochuanensis* · Saurópodo · Rara · fuera del mazo de referencia

**4 de coste · 1 de Ataque · 11 de Vida**

**Cuello sin fin** — Al final de tu turno recupera 1 de Vida.

`ESTABLECIDO` · Saurópodo de la Formación Shaximiao, China, Jurásico Superior. Diecinueve vértebras cervicales: el cuello más largo en proporción al cuerpo de cualquier saurópodo conocido.

### *Amargasaurus cazadorensis* · Saurópodo · Rara · 2 copias

**2 de coste · 2 de Ataque · 5 de Vida**

**Rebaño de cuellos** — Gana +1 de Vida por cada saurópodo que tengas en juego, este incluido.

`DEBATIDO` · Dicreosáurido de la Formación La Amarga, Argentina, Barremiense. Las espinas neurales bífidas del cuello se han interpretado como vela, como defensa y como estructura de exhibición; no hay consenso.

### *Ankylosaurus magniventris* · Tireóforo · Legendaria · fuera del mazo de referencia

**4 de coste · 2 de Ataque · 12 de Vida**

**Maza de cola** — Devuelve 4 de daño a quien lo hiera en combate.

`ESTABLECIDO` · Anquilosáurido de Hell Creek, Maastrichtiense. La maza caudal está formada por osteodermos fusionados sobre vértebras rígidas; los modelos biomecánicos le dan fuerza para romper hueso.

### *Kentrosaurus aethiopicus* · Tireóforo · Común · 2 copias

**1 de coste · 1 de Ataque · 3 de Vida**

**Púas de hombro** — Devuelve 1 de daño a quien lo hiera en combate.

`ESTABLECIDO` · Estegosáurido de la Formación Tendaguru, Tanzania, Kimmeridgiense: contemporáneo de la Morrison al otro lado del mundo. Púas largas en la cola y una par en los hombros o la cadera.

### *Euoplocephalus tutus* · Tireóforo · Rara · fuera del mazo de referencia

**3 de coste · 2 de Ataque · 8 de Vida**

**Párpados de hueso** — No le afectan las cartas de evento de tu rival.

`ESTABLECIDO` · Anquilosáurido de la Formación Dinosaur Park, Alberta, Campaniense. Tenía párpados óseos: un osteodermo articulado que cerraba sobre el ojo.

### *Triceratops horridus* · Marginocéfalo · Épica · fuera del mazo de referencia

**4 de coste · 5 de Ataque · 8 de Vida**

**Tres cuernos** — Cuando entra en juego manda al descarte 1 dinosaurio rival de hasta 3 de Vida.

`ESTABLECIDO` · Ceratópsido de Hell Creek y Lance, Maastrichtiense. Las lesiones cicatrizadas en golas y cuernos de otros Triceratops indican combates entre ellos con los cuernos.

### *Pachycephalosaurus wyomingensis* · Marginocéfalo · Rara · 2 copias

**2 de coste · 3 de Ataque · 4 de Vida**

**Cabezazo** — Cuando entra en juego hiere en 3 al dinosaurio de enfrente.

`DEBATIDO` · Paquicefalosáurido de Hell Creek y Lance, Maastrichtiense. La cúpula de 25 cm de hueso macizo se ha interpretado como arma de topetazo; las lesiones en cúpulas de varios ejemplares lo apoyan, la estructura interna lo discute.

### *Iguanodon bernissartensis* · Ornitópodo · Rara · 2 copias

**2 de coste · 3 de Ataque · 5 de Vida**

**Manada de Bernissart** — Gana +1 de Ataque por cada Iguanodon en juego, sea de quien sea y este incluido.

`DEBATIDO` · Ornitópodo del Barremiense de Bélgica. Los más de treinta esqueletos de la mina de Bernissart se interpretaron como una manada muerta a la vez; hoy se cree que se acumularon en varios episodios.

### *Parasaurolophus walkeri* · Ornitópodo · Rara · fuera del mazo de referencia

**3 de coste · 2 de Ataque · 8 de Vida**

**Llamada resonante** — Cuando entra en juego robas 1 carta y tu hábitat recupera 1 punto.

`ESTABLECIDO` · Hadrosáurido de la Formación Dinosaur Park, Alberta, Campaniense. La cresta tubular es un resonador: los modelos acústicos le dan una nota grave, en torno a los 30 Hz.

### *Pteranodon longiceps* · Pterosaurio · Común · fuera del mazo de referencia

**0 de coste · 2 de Ataque · 2 de Vida**

**Planeo** — Cuando entra en juego pierdes 1 carta de tu mazo y robas 1.

`ESTABLECIDO` · Pterosaurio de la Niobrara, Kansas, Santoniense, con más de mil ejemplares conocidos. Envergadura de hasta seis metros y sin dientes: pescaba en un mar interior.

### *Quetzalcoatlus northropi* · Pterosaurio · Épica · fuera del mazo de referencia

**3 de coste · 5 de Ataque · 4 de Vida**

**Sombra en la llanura** — Cuando entra en juego tu rival pierde 3 cartas del mazo.

`INFERIDO` · Azdárquido de la Formación Javelina, Texas, Maastrichtiense. Envergadura de diez metros y patas largas: se le reconstruye cazando a pie por la llanura, como una cigüeña gigante.

### *Elasmosaurus platyurus* · Reptil marino · Rara · fuera del mazo de referencia

**3 de coste · 2 de Ataque · 9 de Vida**

**Cuello de vigía** — Resta 1 a cada golpe que llegue a tu hábitat.

`ESTABLECIDO` · Plesiosaurio de la Niobrara, Kansas, Campaniense. Setenta y dos vértebras cervicales, más que ningún otro animal conocido; el cuello era poco flexible y probablemente servía para acercarse a los bancos de peces desde abajo.

### *Gallimimus bullatus* · Terópodo · Rara · fuera del mazo de referencia

**2 de coste · 2 de Ataque · 3 de Vida**

**Estampida de la manada** — Cuando entra en juego, baraja tu mano dentro de tu mazo y roba 5 cartas.

`INFERIDO` · Ornitomimosaurio de la Formación Nemegt, Mongolia, Maastrichtiense, conocido por ejemplares casi completos. En el pico se han descrito surcos verticales que se han interpretado como láminas de filtración, lo que apuntaría a una dieta de pequeños organismos del agua; la interpretación no es unánime.

### *Thescelosaurus neglectus* · Ornitópodo · Común · fuera del mazo de referencia

**1 de coste · 1 de Ataque · 4 de Vida**

**Cavar y esperar** — Cuando entra en juego descarta 3 cartas de tu mazo y roba 2.

`DEBATIDO` · Ornitópodo pequeño de Hell Creek, uno de los últimos dinosaurios no avianos del registro. Se le ha atribuido hábito excavador por la robustez de las extremidades anteriores y por comparación con Oryctodromeus, que sí se encontró en su madriguera; en Thescelosaurus es una hipótesis discutida.

### *Deinocheirus mirificus* · Terópodo · Épica · fuera del mazo de referencia

**4 de coste · 3 de Ataque · 8 de Vida**

**Brazos de dos metros y medio** — Gana +1 de Ataque por cada carta que tengas en la mano, hasta +4.

`ESTABLECIDO` · Sus manos, de 2,4 m con las garras, se describieron en 1970 y durante cuarenta y cuatro años fueron casi lo único que se conocía del animal. Los ejemplares de 2014 lo completaron: un ornitomimosaurio de once metros con gastrolitos y restos de pez en la cavidad abdominal.

### *Anzu wyliei* · Terópodo · Rara · fuera del mazo de referencia

**2 de coste · 3 de Ataque · 3 de Vida**

**Saqueo del nido** — Cuando entra en juego, tu rival descarta cartas al azar hasta quedarse con 4 en la mano.

`DEBATIDO` · Cenagnátido de Hell Creek descrito en 2014 a partir de tres esqueletos parciales que, entre los tres, dan casi el animal completo. El saqueo de nidos ajenos es analogía con aves actuales de pico parecido, no evidencia: de su dieta sólo se sabe que era omnívora.

### *Nigersaurus taqueti* · Saurópodo · Épica · fuera del mazo de referencia

**3 de coste · 2 de Ataque · 9 de Vida**

**Siega a ras de suelo** — Cuando entra en juego, tu rival descarta 4 cartas de su mazo y tú 2.

`ESTABLECIDO` · Rebaquisáurido del Aptiense-Albiense de Níger. El hocico es más ancho que el resto del cráneo y lleva una batería de más de quinientos dientes que se reemplazaban cada pocas semanas; la orientación del oído interno indica que la cabeza iba habitualmente mirando al suelo.

### *Shuvuuia deserti* · Terópodo · Común · fuera del mazo de referencia

**1 de coste · 1 de Ataque · 3 de Vida**

**Oído de lechuza** — Al jugarla, llévate a la mano un dinosaurio de tu mazo de 2 o menos de Ataque.

`ESTABLECIDO` · Alvarezsáurido diminuto de la Formación Djadochta, Mongolia. La lagena de su oído interno y el anillo esclerótico son proporcionalmente comparables a los de la lechuza común, lo que apunta a caza nocturna: es de las pocas inferencias de comportamiento que descansan en anatomía medible.

### *Saurolophus angustirostris* · Ornitópodo · Épica · fuera del mazo de referencia

**3 de coste · 2 de Ataque · 7 de Vida**

**Reclamo de la cresta** — Al jugarla, llévate a la mano un dinosaurio de tu mazo de 8 o más de Ataque.

`DEBATIDO` · Hadrosaurio de Nemegt con una cresta ósea MACIZA, no hueca como la de Parasaurolophus: no pudo funcionar como tubo de resonancia. Se ha propuesto que sostuviera un saco nasal de piel inflable, y de ahí saldría la llamada; es una hipótesis sin evidencia directa.

### *Tarbosaurus bataar* · Terópodo · Épica · fuera del mazo de referencia

**4 de coste · 7 de Ataque · 6 de Vida**

**Carroñeo del tirano** — Cuando entra en juego recupera 2 cartas al azar de tu descarte.

`DEBATIDO` · Tiranosáurido de Nemegt, el gran depredador de la Mongolia del Maastrichtiense. Si los tiranosáuridos cazaban, carroñeaban o ambas cosas es uno de los debates más viejos y menos resueltos del oficio; lo probable, por analogía con todo carnívoro grande actual, es que hicieran las dos.

### *Psittacosaurus mongoliensis* · Marginocéfalo · Común · fuera del mazo de referencia

**1 de coste · 1 de Ataque · 3 de Vida**

**Molleja de gastrolitos** — Gana +1 de Vida por cada 4 cartas de tu descarte, hasta +4.

`ESTABLECIDO` · Ceratopsio basal del Cretácico Inferior de Asia, uno de los dinosaurios con más ejemplares conocidos. Varios conservan masas de gastrolitos en la región gástrica, y un ejemplar de Liaoning conserva además la piel y unas cerdas tubulares en la cola.

### *Dakotaraptor steini* · Terópodo · Épica · fuera del mazo de referencia

**3 de coste · 4 de Ataque · 5 de Vida**

**Acecho al rezagado** — Gana +1 de Ataque por cada carta de la mano de tu rival, hasta +3.

`DEBATIDO` · Dromeosáurido grande de Hell Creek descrito en 2015. Parte del material asignado al holotipo resultó después ser de una tortuga, así que qué huesos son suyos —y por tanto su tamaño— sigue discutido; la garra en hoz del segundo dedo sí es suya.

### *Carcharodontosaurus saharicus* · Terópodo · Legendaria · fuera del mazo de referencia

**4 de coste · 10 de Ataque · 7 de Vida**

**Dentellada que desgarra** — Cuando entra en juego golpea 3 al hábitat de tu rival.

`ESTABLECIDO` · Carcarodontosáurido del Cenomaniense del norte de África, de los terópodos más grandes conocidos. Sus dientes son hojas comprimidas y aserradas —de ahí el nombre, «lagarto con dientes de tiburón»—: una dentición para cortar carne, no para triturar hueso como la de los tiranosáuridos.

### *Giraffatitan brancai* · Saurópodo · Legendaria · fuera del mazo de referencia

**4 de coste · 3 de Ataque · 13 de Vida**

**El paso que despeja** — Cuando entra en juego devuelve a la mano 1 dinosaurio tuyo y 1 del rival de 4 o menos de Ataque.

`ESTABLECIDO` · Braquiosáurido de Tendaguru, Tanzania, Titoniense. El esqueleto montado en Berlín mide trece metros de alto y es el más alto del mundo. Se separó de Brachiosaurus en 1988: las proporciones del tronco y de las vértebras cervicales no son las mismas.

### *Tupandactylus imperator* · Pterosaurio · Épica · fuera del mazo de referencia

**3 de coste · 3 de Ataque · 4 de Vida**

**Picado sobre el nido** — Cuando entra en juego golpea 2 al hábitat de tu rival.

`INFERIDO` · Tapejárido del Aptiense de Brasil. La cresta craneal es una vela ósea con un reborde de tejido blando conservado, tan grande que casi con seguridad fue de exhibición: no hay forma de que semejante superficie saliera gratis en vuelo.

### *Rugops primus* · Terópodo · Rara · fuera del mazo de referencia

**2 de coste · 3 de Ataque · 3 de Vida**

**Hocico de carroñero** — Cuando entra en juego devuelve 2 cartas al azar de tu descarte a tu mazo.

`DEBATIDO` · Abelisáurido del Cenomaniense de Níger, conocido casi sólo por un cráneo. Es grácil, con una mandíbula poco resistente y hileras de forámenes en el hocico; de ahí se ha propuesto que carroñeara más que cazara, pero un solo cráneo da para poco.

### *Ouranosaurus nigeriensis* · Ornitópodo · Rara · fuera del mazo de referencia

**2 de coste · 2 de Ataque · 6 de Vida**

**Repliegue de la vela** — Cuando entra en juego devuelve a la mano 1 dinosaurio tuyo y tu rival pierde 2 cartas de su mazo.

`DEBATIDO` · Iguanodontio del Aptiense de Níger con las espinas neurales alargadas. Si sostenían una vela de piel o una joroba de grasa lleva discutiéndose desde su descripción en 1976, y las dos hipótesis siguen vivas.

### *Deltadromeus agilis* · Terópodo · Épica · fuera del mazo de referencia

**3 de coste · 6 de Ataque · 4 de Vida**

**Carrera que dispersa** — Cuando entra en juego devuelve a la mano 1 dinosaurio del rival de 4 o menos de Ataque.

`DEBATIDO` · Terópodo del Cenomaniense de Marruecos, descrito en 1996 sobre un esqueleto sin cráneo. Las extremidades traseras son largas y gráciles, de donde sale su nombre y la idea de que corría; a qué familia pertenece y si el material es de un solo animal se sigue discutiendo.

### *Patagotitan mayorum* · Saurópodo · Legendaria · fuera del mazo de referencia

**4 de coste · 4 de Ataque · 13 de Vida**

**El peso que hunde la llanura** — Cuando entra en juego golpea 4 al hábitat de tu rival.

`ESTABLECIDO` · Titanosaurio del Albiense de Chubut, Argentina, descrito en 2017 sobre seis ejemplares de un mismo yacimiento. Es de los dinosaurios mejor conocidos entre los más grandes: la mayoría de los gigantes se describen con un hueso suelto y éste tiene esqueleto.

### *Dreadnoughtus schrani* · Saurópodo · Épica · fuera del mazo de referencia

**4 de coste · 4 de Ataque · 11 de Vida**

**Paso que abre el cauce** — Cuando entra en juego golpea 3 al hábitat de tu rival.

`ESTABLECIDO` · Titanosaurio del Campaniense de Santa Cruz, Argentina. El holotipo conserva alrededor del 70 % del esqueleto sin contar el cráneo, una proporción rarísima en un saurópodo gigante, y las suturas indican que aún no había terminado de crecer.

### *Hatzegopteryx thambema* · Pterosaurio · Rara · fuera del mazo de referencia

**3 de coste · 5 de Ataque · 3 de Vida**

**Cazador de la isla** — Cuando entra en juego golpea 2 al hábitat de tu rival.

`INFERIDO` · Azdárquido del Maastrichtiense de la isla de Hateg, Rumanía, con diez metros de envergadura. El cuello es corto y robusto —al revés que en sus parientes— y de ahí se infiere que cazaba presas grandes: en aquella isla enana no había terópodos que le hicieran competencia.

### *Borealopelta markmitchelli* · Tireóforo · Épica · fuera del mazo de referencia

**3 de coste · 1 de Ataque · 9 de Vida**

**Coraza de la marea** — Resta 2 a cada golpe que llegue a tu hábitat.

`ESTABLECIDO` · Nodosáurido del Albiense de Alberta, conservado boca arriba en sedimento marino con la piel, los osteodermos en su sitio y el contenido estomacal dentro. Es probablemente el dinosaurio mejor conservado que se ha encontrado; hasta se le ha medido el patrón de contrasombreado.

### *Zuul crurivastator* · Tireóforo · Rara · fuera del mazo de referencia

**2 de coste · 2 de Ataque · 6 de Vida**

**Destrozador de espinillas** — Resta 1 a cada golpe que llegue a tu hábitat.

`ESTABLECIDO` · Anquilosáurido del Campaniense de Montana, con cráneo y cola completos. El epíteto —«destrozador de espinillas»— viene del mazo caudal, y varios de sus osteodermos muestran lesiones curadas compatibles con combate entre individuos de la misma especie.

### *Sauropelta edwardsorum* · Tireóforo · Rara · fuera del mazo de referencia

**3 de coste · 2 de Ataque · 7 de Vida**

**Repliegue tras las púas** — Cuando entra en juego tu hábitat recupera 4.

`ESTABLECIDO` · Nodosáurido del Aptiense-Albiense de Wyoming y Montana. Lleva una hilera de púas cónicas que crecen de tamaño hacia el cuello, las más largas de casi medio metro: una defensa que no requiere moverse del sitio.

---

## 2. Eventos

Un evento **mejora a un dinosaurio tuyo** o **le mete una presión a uno del
rival**. Cada carta dice sobre qué se suelta. Los de mejora son rasgos
biológicos reales, no mutaciones; los de presión son patologías y presiones
ecológicas documentadas, no hechizos: aquí no hay magia, y esa es la parte
del set con más riesgo de romper la restricción paleontológica.

### Gregarismo · Rara · coste 1 · 2 copias

Se juega **sobre un dinosaurio tuyo**. +1 de Ataque a todos tus dinosaurios de la misma especie que el objetivo.

`INFERIDO` · Acumulaciones monoespecíficas en la Morrison sugieren agregación en varios taxones. La interpretación de estos yacimientos es discutida (¿manada viva o concentración tafonómica?).

### Gastrolitos · Épica · coste 1 · 1 copia

Se juega **sobre un dinosaurio tuyo**. Cura +1 de vida a un dinosaurio al final del turno

`ESTABLECIDO` · Piedras de molleja asociadas a esqueletos de saurópodos jurásicos. Su función exacta en la digestión sigue en debate.

### Crecimiento acelerado · Legendaria · coste 1 · 1 copia

Se juega **sobre un dinosaurio tuyo**. +2 Poder y +2 Vida permanentes a un dinosaurio que elijas.

`ESTABLECIDO` · La osteohistología muestra tasas de crecimiento altas y sostenidas en saurópodos y en Allosaurus, alcanzando talla adulta en pocas décadas o menos.

### Neumaticidad ósea · Épica · coste 2 · fuera del mazo de referencia

Se juega **sobre un dinosaurio tuyo**. +2 de Ataque permanentes. Sólo sobre terópodos y saurópodos.

`ESTABLECIDO` · Los saurisquios de la Morrison presentan neumatización postcraneal: vértebras invadidas por divertículos de sacos aéreos. Aligera el esqueleto sin perder resistencia. No aparece en tireóforos ni en ornitópodos.

### Fractura consolidada · Épica · coste 2 · 2 copias

Se juega **sobre un dinosaurio del rival**. −2 Poder permanente a un dinosaurio rival.

`ESTABLECIDO` · El registro patológico de la Morrison es abundante: costillas fracturadas y consolidadas, infecciones óseas y lesiones por estrés, especialmente documentadas en ejemplares de Allosaurus. Un animal cojo caza peor, pero sigue vivo.

### Competencia trófica · Épica · coste 3 · fuera del mazo de referencia

Se juega **undefined**. −2 de Vida a dos dinosaurios rivales que elijas.

`INFERIDO` · La coexistencia de varios saurópodos y de varios terópodos grandes en la misma formación implica reparto de recursos. La partición de nicho está sustentada por el desgaste dental; su intensidad como presión competitiva es una inferencia.

### Trampa de depredadores · Rara · coste 1 · 2 copias

Se juega **sobre la mesa entera, sin elegir objetivo**. El rival pierde 5 cartas de su mazo. Tú pierdes 3: el fango no distingue.

`DEBATIDO` · La cantera Cleveland-Lloyd, en la Morrison de Utah, acumula decenas de individuos de Allosaurus en una proporción de depredadores frente a presas que no se da en un ecosistema vivo. La trampa de depredadores es una de las explicaciones; también se ha propuesto sequía o agua envenenada. El yacimiento es un hecho, su mecanismo no.

### Mortandad estacional · Legendaria · coste 1 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. 3 de daño a TODOS los dinosaurios del campo, incluidos los tuyos.

`DEBATIDO` · Algunas acumulaciones óseas de la Morrison se han interpretado como mortandades masivas asociadas a sequía o a eventos de crecida. La causa concreta de cada yacimiento sigue discutiéndose.

### Sabana de helechos · Común · coste 0 · 2 copias

Se juega **sobre la mesa entera, sin elegir objetivo**. Robas 2 cartas. Luego descartas 1 carta de tu mano al azar.

`INFERIDO` · Las llanuras abiertas de la Morrison estaban dominadas por helechos y no por hierba, que no existía. Una pradera de helecho es pasto abundante y de poca calidad: se come mucho y aprovecha poco.

### Llanura de inundación · Rara · coste 2 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Ambos jugadores pierden 3 cartas del mazo. Tú robas 1.

`ESTABLECIDO` · Las llanuras de inundación de la Morrison se construyeron crecida a crecida: limo de desbordamiento sobre paleosuelos. Una crecida arrasa a los dos lados del río, pero deja el suelo nuevo a quien vuelve primero.

### Canal fluvial trenzado · Rara · coste 1 · 1 copia

Se juega **sobre la mesa entera, sin elegir objetivo**. Todos tus dinosaurios recuperan 2 de Vida.

`ESTABLECIDO` · Los ríos de la Morrison eran trenzados: canales someros y cambiantes entre barras de arena, con agua todo el año en los tramos principales. Donde hay agua permanente hay descanso, bebida y sombra.

### Bosque de coníferas ribereño · Épica · coste 2 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Tu rival descarta 2 cartas de su mano al azar.

`INFERIDO` · Los bosques de galería pegados a los ríos son el único sitio de la Morrison donde la vegetación cierra la vista. Una manada que se mete en ellos deja de ver venir y pierde el rastro de lo que perseguía: se infiere de la etología de los grandes herbívoros actuales.

### Deriva árida · Épica · coste 2 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Ambos jugadores descartan la mano entera y roban otras tantas cartas.

`ESTABLECIDO` · El clima de la Morrison se fue secando a lo largo del Kimmeridgiense y el Titoniense: paleosuelos con caliche, dunas al norte de la cuenca. Cuando el paisaje cambia, lo que cada uno tenía planeado deja de valer y hay que volver a empezar.

### Nido con huevos · Común · coste 1 · 2 copias

Se juega **sobre la mesa entera, sin elegir objetivo**. Robas 2 cartas.

`ESTABLECIDO` · La Morrison conserva nidos y huevos de saurópodo y de terópodo pequeño, y cáscaras dispersas en muchos yacimientos. Un nido es la promesa de lo que viene después.

### Tormenta de polvo · Rara · coste 2 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Los dos jugadores barajan su mano dentro de su mazo y roban 5 cartas.

`ESTABLECIDO` · Los paleosuelos de la Morrison alternan horizontes de caliche con niveles de arena eólica, y al norte de la cuenca hay campos de dunas: episodios secos con transporte de polvo, repetidos durante millones de años.

### Avenida de lodo · Épica · coste 2 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Tu rival descarta cartas al azar hasta quedarse con 3 en la mano.

`ESTABLECIDO` · Los flujos de derrubios dejan depósitos masivos, sin clasificar y con bloques flotando en la matriz. Varias de las grandes acumulaciones de huesos del Jurásico se han interpretado como cadáveres arrastrados y amontonados por una de estas avenidas.

### Enterramiento rápido · Rara · coste 2 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Recupera 2 cartas al azar de tu descarte y llévatelas a la mano.

`ESTABLECIDO` · Todo yacimiento de conservación excepcional tiene lo mismo detrás: el cadáver quedó cubierto antes de que los carroñeros y las bacterias hicieran su trabajo. Lo que se recupera del registro fósil es, casi siempre, lo que se enterró deprisa.

### Cauce abandonado · Común · coste 1 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Descarta 2 cartas al azar de tu mano y roba 3.

`ESTABLECIDO` · Cuando un meandro se corta por el cuello, el brazo que queda se llena de finos y se convierte en una charca alargada. Los cauces abandonados de la Morrison son de los pocos sitios donde se conservan restos de plantas y de peces.

### Barrera de troncos · Común · coste 1 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Tu rival pierde 4 cartas de su mazo, y 4 más si tiene más cartas en la mano que tú.

`INFERIDO` · Los atascos de troncos son estructuras corrientes en ríos con orillas arboladas: represan el cauce, lo desvían y concentran lo que baja con la corriente. En el Jurásico se infieren de las acumulaciones de leña fósil orientadas en los rellenos de canal.

### Ceniza volcánica · Rara · coste 2 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Tu rival pierde 6 cartas de su mazo.

`ESTABLECIDO` · Los niveles de ceniza volcánica son los mejores relojes del registro: se depositan en días, cubren cuencas enteras y se pueden datar por radiometría. Varias de las edades de la Morrison salen de ellos.

### Sedimento en suspensión · Épica · coste 2 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Tu rival pierde 4 cartas de su mazo y descarta 2 al azar de su mano.

`ESTABLECIDO` · El agua cargada de finos no deja ver ni cazar: la turbidez es una de las presiones ecológicas mejor documentadas en ambientes fluviales, actuales y fósiles, y se lee en la granulometría del relleno de canal.

### Osario de la charca · Rara · coste 2 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Devuelve 2 cartas al azar de tu descarte a tu mazo.

`ESTABLECIDO` · Las charcas que se secan concentran cadáveres: la cantera Cleveland-Lloyd es el ejemplo de manual, con decenas de individuos amontonados en una proporción que no se da en un ecosistema vivo. Lo que se acumuló vuelve al registro.

### Enjambre de carroñeros · Común · coste 1 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Devuelve 1 carta al azar de tu descarte a tu mazo y robas 1.

`INFERIDO` · Los huesos de la Morrison llevan marcas de mordida de terópodo y galerías de insectos dermestoideos: dos oleadas de carroñeo, una de vertebrados y otra de artrópodos, sobre el mismo cadáver.

### Oleada de calor · Común · coste 1 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Golpea 2 al hábitat de tu rival.

`INFERIDO` · Los modelos climáticos del Jurásico Superior dan al interior de Laurasia veranos muy por encima de los actuales, con una estación seca larga. Los paleosuelos con caliche de la Morrison son coherentes con eso.

### Estampida · Épica · coste 2 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Devuelve a la mano todos los dinosaurios de 2 o menos de Ataque, de los dos bandos.

`ESTABLECIDO` · El yacimiento de Lark Quarry, en Queensland, conserva más de tres mil huellas de animales pequeños que salen todas en la misma dirección. Si huían de un depredador o de una crecida se discute; que salieron corriendo a la vez, no.

### Migración estacional · Rara · coste 2 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Devuelve a tu mano 1 dinosaurio tuyo y robas 1.

`ESTABLECIDO` · Los isótopos de oxígeno del esmalte de Camarasaurus registran desplazamientos estacionales hacia tierras altas durante la estación seca. Es de las pocas migraciones de dinosaurio que no se infieren, se miden.

### Crecida del delta · Rara · coste 2 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Devuelve a la mano 1 dinosaurio del rival de 6 o menos de Ataque.

`ESTABLECIDO` · Un delta avanza y retrocede con el caudal, y con él la línea de costa. Lo que estaba en tierra firme queda bajo el agua en una temporada: los rellenos de canal cortan y desplazan los depósitos anteriores.

### Incendio estacional · Rara · coste 2 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Golpea 5 al hábitat de tu rival.

`ESTABLECIDO` · El fusinita —carbón vegetal fósil— aparece en toda la Morrison y es la firma de un incendio: madera quemada a alta temperatura y enterrada después. Con una estación seca larga y tormenta eléctrica al final, el fuego era parte del ciclo, no una catástrofe.

### Colapso del acuífero · Épica · coste 3 · fuera del mazo de referencia

Se juega **sobre la mesa entera, sin elegir objetivo**. Golpea 2 al hábitat de tu rival por cada dinosaurio tuyo en juego, hasta 6.

`INFERIDO` · Los saurópodos de la Morrison bebían de charcas alimentadas por el nivel freático, y una manada grande las agota antes de que se repongan. El pisoteo que compacta el suelo alrededor de un punto de agua está documentado en herbívoros grandes actuales; para el Jurásico se infiere de los niveles de huellas.

### Gregarismo · Rara · coste 1 · 2 copias

+1 de Ataque a todos tus dinosaurios de la misma especie que el objetivo.

`INFERIDO` · Acumulaciones monoespecíficas en la Morrison sugieren agregación en varios taxones. La interpretación de estos yacimientos es discutida (¿manada viva o concentración tafonómica?).

### Gastrolitos · Épica · coste 1 · 1 copia

Cura +1 de vida a un dinosaurio al final del turno

`ESTABLECIDO` · Piedras de molleja asociadas a esqueletos de saurópodos jurásicos. Su función exacta en la digestión sigue en debate.

### Crecimiento acelerado · Legendaria · coste 1 · 1 copia

+2 Poder y +2 Vida permanentes a un dinosaurio que elijas.

`ESTABLECIDO` · La osteohistología muestra tasas de crecimiento altas y sostenidas en saurópodos y en Allosaurus, alcanzando talla adulta en pocas décadas o menos.

### Neumaticidad ósea · Épica · coste 2 · fuera del mazo de referencia

+2 de Ataque permanentes. Sólo sobre terópodos y saurópodos.

`ESTABLECIDO` · Los saurisquios de la Morrison presentan neumatización postcraneal: vértebras invadidas por divertículos de sacos aéreos. Aligera el esqueleto sin perder resistencia. No aparece en tireóforos ni en ornitópodos.

### Fractura consolidada · Épica · coste 2 · 2 copias

−2 Poder permanente a un dinosaurio rival.

`ESTABLECIDO` · El registro patológico de la Morrison es abundante: costillas fracturadas y consolidadas, infecciones óseas y lesiones por estrés, especialmente documentadas en ejemplares de Allosaurus. Un animal cojo caza peor, pero sigue vivo.

### Competencia trófica · Épica · coste 3 · fuera del mazo de referencia

−2 de Vida a dos dinosaurios rivales que elijas.

`INFERIDO` · La coexistencia de varios saurópodos y de varios terópodos grandes en la misma formación implica reparto de recursos. La partición de nicho está sustentada por el desgaste dental; su intensidad como presión competitiva es una inferencia.

### Trampa de depredadores · Rara · coste 1 · 2 copias

El rival pierde 5 cartas de su mazo. Tú pierdes 3: el fango no distingue.

`DEBATIDO` · La cantera Cleveland-Lloyd, en la Morrison de Utah, acumula decenas de individuos de Allosaurus en una proporción de depredadores frente a presas que no se da en un ecosistema vivo. La trampa de depredadores es una de las explicaciones; también se ha propuesto sequía o agua envenenada. El yacimiento es un hecho, su mecanismo no.

### Mortandad estacional · Legendaria · coste 1 · fuera del mazo de referencia

3 de daño a TODOS los dinosaurios del campo, incluidos los tuyos.

`DEBATIDO` · Algunas acumulaciones óseas de la Morrison se han interpretado como mortandades masivas asociadas a sequía o a eventos de crecida. La causa concreta de cada yacimiento sigue discutiéndose.

### Sabana de helechos · Común · coste 0 · 2 copias

Robas 2 cartas. Luego descartas 1 carta de tu mano al azar.

`INFERIDO` · Las llanuras abiertas de la Morrison estaban dominadas por helechos y no por hierba, que no existía. Una pradera de helecho es pasto abundante y de poca calidad: se come mucho y aprovecha poco.

### Llanura de inundación · Rara · coste 2 · fuera del mazo de referencia

Ambos jugadores pierden 3 cartas del mazo. Tú robas 1.

`ESTABLECIDO` · Las llanuras de inundación de la Morrison se construyeron crecida a crecida: limo de desbordamiento sobre paleosuelos. Una crecida arrasa a los dos lados del río, pero deja el suelo nuevo a quien vuelve primero.

### Canal fluvial trenzado · Rara · coste 1 · 1 copia

Todos tus dinosaurios recuperan 2 de Vida.

`ESTABLECIDO` · Los ríos de la Morrison eran trenzados: canales someros y cambiantes entre barras de arena, con agua todo el año en los tramos principales. Donde hay agua permanente hay descanso, bebida y sombra.

### Bosque de coníferas ribereño · Épica · coste 2 · fuera del mazo de referencia

Tu rival descarta 2 cartas de su mano al azar.

`INFERIDO` · Los bosques de galería pegados a los ríos son el único sitio de la Morrison donde la vegetación cierra la vista. Una manada que se mete en ellos deja de ver venir y pierde el rastro de lo que perseguía: se infiere de la etología de los grandes herbívoros actuales.

### Deriva árida · Épica · coste 2 · fuera del mazo de referencia

Ambos jugadores descartan la mano entera y roban otras tantas cartas.

`ESTABLECIDO` · El clima de la Morrison se fue secando a lo largo del Kimmeridgiense y el Titoniense: paleosuelos con caliche, dunas al norte de la cuenca. Cuando el paisaje cambia, lo que cada uno tenía planeado deja de valer y hay que volver a empezar.

### Nido con huevos · Común · coste 1 · 2 copias

Robas 2 cartas.

`ESTABLECIDO` · La Morrison conserva nidos y huevos de saurópodo y de terópodo pequeño, y cáscaras dispersas en muchos yacimientos. Un nido es la promesa de lo que viene después.

### Tormenta de polvo · Rara · coste 2 · fuera del mazo de referencia

Los dos jugadores barajan su mano dentro de su mazo y roban 5 cartas.

`ESTABLECIDO` · Los paleosuelos de la Morrison alternan horizontes de caliche con niveles de arena eólica, y al norte de la cuenca hay campos de dunas: episodios secos con transporte de polvo, repetidos durante millones de años.

### Avenida de lodo · Épica · coste 2 · fuera del mazo de referencia

Tu rival descarta cartas al azar hasta quedarse con 3 en la mano.

`ESTABLECIDO` · Los flujos de derrubios dejan depósitos masivos, sin clasificar y con bloques flotando en la matriz. Varias de las grandes acumulaciones de huesos del Jurásico se han interpretado como cadáveres arrastrados y amontonados por una de estas avenidas.

### Enterramiento rápido · Rara · coste 2 · fuera del mazo de referencia

Recupera 2 cartas al azar de tu descarte y llévatelas a la mano.

`ESTABLECIDO` · Todo yacimiento de conservación excepcional tiene lo mismo detrás: el cadáver quedó cubierto antes de que los carroñeros y las bacterias hicieran su trabajo. Lo que se recupera del registro fósil es, casi siempre, lo que se enterró deprisa.

### Cauce abandonado · Común · coste 1 · fuera del mazo de referencia

Descarta 2 cartas al azar de tu mano y roba 3.

`ESTABLECIDO` · Cuando un meandro se corta por el cuello, el brazo que queda se llena de finos y se convierte en una charca alargada. Los cauces abandonados de la Morrison son de los pocos sitios donde se conservan restos de plantas y de peces.

### Barrera de troncos · Común · coste 1 · fuera del mazo de referencia

Tu rival pierde 4 cartas de su mazo, y 4 más si tiene más cartas en la mano que tú.

`INFERIDO` · Los atascos de troncos son estructuras corrientes en ríos con orillas arboladas: represan el cauce, lo desvían y concentran lo que baja con la corriente. En el Jurásico se infieren de las acumulaciones de leña fósil orientadas en los rellenos de canal.

### Ceniza volcánica · Rara · coste 2 · fuera del mazo de referencia

Tu rival pierde 6 cartas de su mazo.

`ESTABLECIDO` · Los niveles de ceniza volcánica son los mejores relojes del registro: se depositan en días, cubren cuencas enteras y se pueden datar por radiometría. Varias de las edades de la Morrison salen de ellos.

### Sedimento en suspensión · Épica · coste 2 · fuera del mazo de referencia

Tu rival pierde 4 cartas de su mazo y descarta 2 al azar de su mano.

`ESTABLECIDO` · El agua cargada de finos no deja ver ni cazar: la turbidez es una de las presiones ecológicas mejor documentadas en ambientes fluviales, actuales y fósiles, y se lee en la granulometría del relleno de canal.

### Osario de la charca · Rara · coste 2 · fuera del mazo de referencia

Devuelve 2 cartas al azar de tu descarte a tu mazo.

`ESTABLECIDO` · Las charcas que se secan concentran cadáveres: la cantera Cleveland-Lloyd es el ejemplo de manual, con decenas de individuos amontonados en una proporción que no se da en un ecosistema vivo. Lo que se acumuló vuelve al registro.

### Enjambre de carroñeros · Común · coste 1 · fuera del mazo de referencia

Devuelve 1 carta al azar de tu descarte a tu mazo y robas 1.

`INFERIDO` · Los huesos de la Morrison llevan marcas de mordida de terópodo y galerías de insectos dermestoideos: dos oleadas de carroñeo, una de vertebrados y otra de artrópodos, sobre el mismo cadáver.

### Oleada de calor · Común · coste 1 · fuera del mazo de referencia

Golpea 2 al hábitat de tu rival.

`INFERIDO` · Los modelos climáticos del Jurásico Superior dan al interior de Laurasia veranos muy por encima de los actuales, con una estación seca larga. Los paleosuelos con caliche de la Morrison son coherentes con eso.

### Estampida · Épica · coste 2 · fuera del mazo de referencia

Devuelve a la mano todos los dinosaurios de 2 o menos de Ataque, de los dos bandos.

`ESTABLECIDO` · El yacimiento de Lark Quarry, en Queensland, conserva más de tres mil huellas de animales pequeños que salen todas en la misma dirección. Si huían de un depredador o de una crecida se discute; que salieron corriendo a la vez, no.

### Migración estacional · Rara · coste 2 · fuera del mazo de referencia

Devuelve a tu mano 1 dinosaurio tuyo y robas 1.

`ESTABLECIDO` · Los isótopos de oxígeno del esmalte de Camarasaurus registran desplazamientos estacionales hacia tierras altas durante la estación seca. Es de las pocas migraciones de dinosaurio que no se infieren, se miden.

### Crecida del delta · Rara · coste 2 · fuera del mazo de referencia

Devuelve a la mano 1 dinosaurio del rival de 6 o menos de Ataque.

`ESTABLECIDO` · Un delta avanza y retrocede con el caudal, y con él la línea de costa. Lo que estaba en tierra firme queda bajo el agua en una temporada: los rellenos de canal cortan y desplazan los depósitos anteriores.

### Incendio estacional · Rara · coste 2 · fuera del mazo de referencia

Golpea 5 al hábitat de tu rival.

`ESTABLECIDO` · El fusinita —carbón vegetal fósil— aparece en toda la Morrison y es la firma de un incendio: madera quemada a alta temperatura y enterrada después. Con una estación seca larga y tormenta eléctrica al final, el fuego era parte del ciclo, no una catástrofe.

### Colapso del acuífero · Épica · coste 3 · fuera del mazo de referencia

Golpea 2 al hábitat de tu rival por cada dinosaurio tuyo en juego, hasta 6.

`INFERIDO` · Los saurópodos de la Morrison bebían de charcas alimentadas por el nivel freático, y una manada grande las agota antes de que se repongan. El pisoteo que compacta el suelo alrededor de un punto de agua está documentado en herbívoros grandes actuales; para el Jurásico se infiere de los niveles de huellas.

---

## 3. Cartas de recurso

Se juegan **boca arriba y surten efecto al instante**: dar Biomasa «este
turno» no serviría de nada si esperasen a la revelación. A cambio el rival los
ve venir, y eso es parte de su precio. Cuestan 0 y todos traen inconveniente.

### Cantera abierta · Épica · fuera del mazo de referencia

+3 Biomasa ahora mismo. Pierdes 4 cartas de tu mazo.

`ESTABLECIDO` · Abrir una cantera es destruir el yacimiento para llegar a lo que tiene dentro: cada bloque que sale es contexto que se pierde. Es el intercambio que hace toda excavación, y el que hace esta carta.

### Rebrote tras incendio · Rara · 2 copias

+2 Biomasa ahora mismo. Todos tus dinosaurios reciben 1 herida.

`INFERIDO` · Los sedimentos de la Morrison contienen fusaíta —carbón vegetal fósil—, prueba directa de incendios recurrentes. El rebrote nutritivo posterior se infiere por analogía con sabanas actuales, no está medido en el registro.

### Carroña abundante · Legendaria · fuera del mazo de referencia

+3 Biomasa ahora mismo. El rival gana 1 Biomasa.

`INFERIDO` · Marcas de mordida y dientes desprendidos de terópodo asociados a esqueletos de saurópodo indican consumo de carroña. Un cadáver grande alimenta a más de un carroñero, y no sólo al que llegó primero.

### Lago efímero · Épica · fuera del mazo de referencia

+2 Biomasa ahora mismo. Tu hábitat pierde 2 puntos.

`INFERIDO` · La Morrison conserva depósitos de lagos alcalinos efímeros de gran extensión, como el llamado lago T’oo’dichi’. Concentran recursos mientras duran; al secarse dejan salinas que el paisaje tarda en recuperar.

### Nube de insectos · Común · 2 copias

+1 Biomasa ahora mismo. Robas 1 carta.

`INFERIDO` · Los humedales de la Morrison sostenían nubes de insectos: hay coprolitos y ámbar con restos, y los pequeños terópodos y pterosaurios vivían de ellos. Comida fácil, y donde hay insectos hay más cosas que encontrar.

### Manada de paso · Rara · fuera del mazo de referencia

+2 Biomasa ahora mismo. Pierdes 3 cartas de tu mazo.

`INFERIDO` · Los rastros de la Morrison muestran grupos de saurópodos moviéndose juntos en la misma dirección. Una manada que cruza tu territorio deja mucho detrás, y se lleva por delante lo que había.

### Frutos de cícada · Rara · fuera del mazo de referencia

+3 Biomasa ahora mismo. Tu rival roba 1 carta.

`INFERIDO` · Las cícadas y bennettitales producen semillas carnosas y aromáticas que atraen a quien las dispersa. Una cosecha así no se guarda: la huele todo el mundo.

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

Durante 3 turnos, ambos jugadores pierden 1 carta del mazo al robar.

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


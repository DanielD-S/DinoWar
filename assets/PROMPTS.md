# Plantillas de prompt para las ilustraciones

Cómo pedirle a un generador de imágenes una carta de DinoWar sin rediseñar el
estilo cada vez. Complementa a [LEEME.md](LEEME.md), que dice los tamaños; esto
dice qué escribir.

La idea es una sola: **el prompt son dos bloques fijos y un hueco**. El bloque de
ESTILO y el de PROHIBICIONES se copian literales, carácter por carácter, en cada
carta. Lo único que cambia es el SUJETO. La consistencia entre las ilustraciones
del set no sale de describir bien el estilo cada vez: sale de no reescribirlo
nunca. El número exacto no se escribe aquí —se quedó atrás una vez, decía 68—:
lo dice `ls assets/dinos`.

## Lo que NO hay que pedir

La carta que se ve en pantalla —el marco, el círculo del coste, la etiqueta de
rareza, el bloque de Ataque y Vida, el recuadro de la habilidad— es **CSS**, no
imagen. Lo único que se genera es la ilustración apaisada del centro.

Así que una captura de pantalla del juego **no sirve como referencia**: el
generador dibujaría un marco falso, unos números falsos y un texto ilegible
dentro de la propia imagen, y habría que recortarlo. Lo que sí sirve de
referencia son los JPEG de `assets/dinos/`, que son la ilustración pelada.

## El bloque de ESTILO (copiar literal)

> Paleoarte fotorrealista, render 3D cinematográfico, calidad de documental de
> historia natural. Formación Morrison, Jurásico Superior. Luz cálida de última
> hora de la tarde, contraluz suave, neblina y polvo fino en suspensión. Paleta
> apagada y terrosa: verdes oliva, ocres, arena, cielo naranja pálido. Cámara
> baja, casi al nivel del suelo, teleobjetivo, profundidad de campo corta con el
> fondo desenfocado. Vegetación de época: araucarias, coníferas, helechos
> arborescentes, cícadas, ginkgos. Composición apaisada 3:2.

## El bloque de PROHIBICIONES (copiar literal)

> Sin texto, sin letras, sin números, sin logotipos, sin marco, sin borde, sin
> marca de agua, sin firma. Sin personas. Sin plantas con flor, sin hierba, sin
> mamíferos grandes. El sujeto entero dentro del encuadre, centrado, sin tocar
> ningún borde, con aire por arriba y por abajo. Tercio inferior tranquilo, sin
> detalle importante.

Las tres reglas de encuadre no son estética, son mecánica:

- **`object-fit: cover` en cinco ventanas distintas**, de proporción 1,34 a 1,78.
  Lo que toque un borde se pierde en alguna de ellas.
- **El tercio inferior lleva un velo oscuro** (`.c-arte::after`) para que se lea
  el nombre encima. Lo que se ponga ahí se ve al 25 %.
- **Nada de texto** porque el nombre, el coste y las cifras ya los pinta el
  juego. Un nombre generado sale duplicado y mal escrito.

## Formato de salida

Ningún generador da 3:2 nativo. Pide **1792×1024** (lo más apaisado que hay) y
recorta a 3:2 antes de dejar el fichero en `src/dinos/`: `tools/imagenes.py`
reduce el lado mayor a 1200 px pero **no recorta**, así que la proporción es la
que traiga el original. Por eso el bloque pide aire arriba y abajo: el recorte
se come un 14 % de alto.

## El hueco: las 16 cartas de soporte

Las 52 criaturas ya tienen ilustración. Las que faltan son exactamente las 16 de
soporte, y son las que más agradecen una plantilla porque **no son animales**:
son fenómenos y momentos. Un modificador por tipo, antes del sujeto:

| tipo | modificador de encuadre |
|---|---|
| CLIMA | plano general amplio, el cielo ocupa la mitad de arriba, sin protagonista animal — el fenómeno es el sujeto |
| EVENTO | plano corto o medio, un momento concreto, una sola cosa pasando |
| RECURSO | la abundancia misma en primer plano, animales secundarios o al fondo |
| BIOMASA | la vegetación es el sujeto y ocupa el primer plano, densa, comestible, con brotes nuevos; sin protagonista animal, como mucho herbívoros pequeños o lejanos en silueta, alimentándose |

Los climas son **fenómenos, no paisajes** —se renombraron a propósito— así que
el arte tiene que enseñar el tiempo atmosférico, no el bioma. Y los cinco
nombres viejos de bioma están reservados para futuras cartas de evento: no
gastar su imaginería aquí.

### Climas

- **`sabana` — Monzón de verano.** Cortina de lluvia de tarde barriendo una
  llanura de helechos, nubarrones de tormenta con luz colándose por debajo, el
  suelo empapado devolviendo el brillo del cielo, manada lejana en silueta.
- **`llanura` — Crecida estacional.** Un río desbordado sobre la llanura, agua
  parda cargada de troncos y ramas arrastrados, vegetación medio sumergida,
  cielo gris de después de la tormenta.
- **`canal` — Bruma de valle.** Niebla de radiación al amanecer llenando el
  fondo de un valle, capas de bruma entre coníferas, sol bajo atravesándola,
  cuellos de saurópodo apenas insinuados dentro de la niebla.
- **`bosque` — Estación de lluvias.** Dosel de coníferas de ribera empapado y
  rebrotado, verde intenso y saturado, gotas cayendo, luz difusa entre lluvia
  fina, sotobosque de helechos exuberante.
- **`aridez` — Sequía prolongada.** Una charca reducida a barro agrietado,
  huesos blanqueados medio enterrados en costra de caliche, calima temblando
  sobre el suelo, coníferas secas al fondo, cielo blanco de calor.

### Eventos

- **`gregarismo` — Gregarismo.** Manada de ornitópodos de una sola especie
  moviéndose junta en la misma dirección, adultos y juveniles mezclados, polvo a
  la altura de las patas, vista lateral.
- **`gastrolitos` — Gastrolitos.** Primer plano de un puñado de piedras
  redondeadas y pulidas sobre arena húmeda, brillantes, con la sombra
  desenfocada de un cuello de saurópodo al fondo.
- **`crecimiento_acelerado` — Crecimiento acelerado.** Un saurópodo juvenil
  junto a un adulto de su misma especie que lo triplica en tamaño, comparación
  de escala evidente, luz de tarde.
- **`neumaticidad` — Neumaticidad ósea.** Una vértebra de saurópodo aislada
  sobre arena oscura, partida de modo que se vean sus cavidades internas, luz
  rasante que marca los huecos.
- **`fractura` — Fractura consolidada.** Un terópodo grande cojeando, apoyando
  mal una pata delantera, cabeza baja, polvo. (Alternativa de detalle: una
  costilla fósil con el callo abultado de una fractura soldada, primer plano.)
- **`competencia` — Competencia trófica.** Dos terópodos de especies distintas
  enfrentados sobre el mismo cadáver, posturas de amenaza, ninguno cediendo.
- **`trampa` — Trampa de depredadores.** Barrizal negro y pegajoso con varios
  terópodos atrapados hasta el vientre, rastros de huellas que entran y no
  salen, cielo plomizo.
- **`mortandad` — Mortandad estacional.** Llanura sembrada de cadáveres de
  varias especies alrededor de una charca seca, pterosaurios carroñeros a lo
  lejos, luz apagada y sin contraste.

### Recursos

- **`rebrote` — Rebrote tras incendio.** Suelo quemado y negro con troncos
  carbonizados de los que brotan helechos verdes nuevos, contraste fuerte entre
  el verde y el negro, hilos de humo residual.
- **`carrona` — Carroña abundante.** Cadáver abierto de saurópodo en la llanura
  con varios terópodos pequeños y pterosaurios alimentándose a la vez, calor,
  aire denso.
- **`lago` — Lago efímero.** Lago somero y ancho de agua alcalina lechosa
  reflejando el cielo, orilla con costra de sal blanca, saurópodos bebiendo en
  silueta al fondo.

### Biomasa

Diez cartas con el mismo marco y tres efectos: siete comunes de +1, dos
épicas de +2 y una legendaria de +3. Lo que las distingue es SÓLO la
ilustración, así que cada una necesita una planta dominante distinta y una
sola idea. El gradiente es de productividad: vegetación abierta y seca en las
comunes, suelo fértil con agua en las épicas, y en la legendaria el sitio más
raro de una cuenca semiárida. En las comunes no hay agua a la vista salvo en
el Juncal y la Galería, que la tienen de sitio; en las tres de rareza el agua
es lo que las hace parecer más ricas.

- **`biomasa` — Pradera de helechos.** Llanura abierta cubierta de helechos
  bajos hasta el horizonte, sin un solo árbol cerca, viento peinando las
  frondas, dos Dryosaurus lejanos pastando en silueta.
- **`araucarias` — Bosque de araucarias.** Troncos altos y rectos de
  araucaria en columnata, copas en candelabro muy arriba, suelo alfombrado de
  agujas y conos caídos, luz en haces entre los troncos.
- **`ginkgos` — Arboleda de ginkgos.** Ginkgos de hoja en abanico en tono
  dorado de final de estación, hojas cayendo despacio y cubriendo el suelo, un
  ornitópodo pequeño en silueta al fondo.
- **`cicadas` — Matorral de cícadas.** Cícadas y bennettitales macizas con
  troncos en barril y coronas de hojas rígidas, arbustivo, seco, con un
  Stegosaurus mordisqueando muy al fondo y desenfocado.
- **`equisetos` — Juncal de equisetos.** Colas de caballo altas y segmentadas
  en agua somera de orilla, verde vivo, tallos rectos como cañas, reflejos
  rotos por el viento, sin árboles en primer término.
- **`galeria` — Bosque de galería.** Franja de coníferas y helechos
  arborescentes pegada a un río trenzado de aguas claras, verde saturado
  contra la llanura seca de detrás, cuellos de saurópodo entre las copas.
- **`helechal` — Helechal arborescente.** Sotobosque umbrío de helechos
  arborescentes con frondas que se despliegan en cayado, humedad, luz verde
  filtrada, el más cerrado y húmedo de los siete.
- **`vega` — Vega de aluvión (épica).** Llanura recién retirada la crecida,
  limo oscuro y brillante, brotes tiernos de helecho saliendo del barro en
  filas, charcos que devuelven el cielo, manada de ornitópodos llegando al
  fondo.
- **`humedal` — Humedal de tierras bajas (épica).** Marisma de agua lenta
  entre cícadas y equisetos, todo verde y espeso, alfombras de algas y musgo,
  un saurópodo hundido hasta las rodillas alimentándose de lejos.
- **`manantial` — Manantial perenne (legendaria).** Un manantial brotando de
  una pared de roca roja en mitad de una llanura seca y pálida, y a su
  alrededor un oasis de araucarias, helechos y cícadas de verde imposible; el
  contraste entre lo seco y lo vivo es el sujeto, saurópodos en fila al fondo
  acudiendo a beber.

Las diez llegaron en 1536×1024 el 13-09-2026 y las rarezas se repartieron
mirándolas: el Manantial es la única con roca, cascada y oasis, y las dos
épicas son las dos con el suelo bajo el agua.

## La ronda de las cien cartas

Veinticinco huecos más, con los mismos dos bloques fijos. Los eventos y los
recursos van con su modificador de tipo; las criaturas con el plumaje escrito
en cada hueco, que el generador lo inventa distinto cada vez si no se le dice.
Nueve de estas cartas descartan, y el arte tiene que enseñar la PÉRDIDA —lo
que se va, lo que se pierde de vista— para que la mecánica se lea en el dibujo.

### Eventos

- **`sabana_helechos` — Sabana de helechos.** Pradera de helechos abierta y
  seca con una manada de ornitópodos pastando dispersa, uno de ellos alejándose
  solo hacia el borde del cuadro mientras el resto sigue comiendo, luz rasante.
- **`inundacion` — Llanura de inundación.** Una llanura entera bajo una lámina
  de agua parda que baja, troncos y helechos arrancados flotando, cielo
  limpio de después de la tormenta, un saurópodo vadeando de vuelta con el agua
  por las rodillas.
- **`canal_trenzado` — Canal fluvial trenzado.** Río ancho y somero partido en
  varios brazos entre barras de arena clara, agua transparente, tres
  saurópodos parados dentro del agua bebiendo y descansando, mediodía suave.
- **`bosque_ribereno` — Bosque de coníferas ribereño.** Interior cerrado de un
  bosque de galería, troncos de conífera muy juntos y helechos altos que tapan
  la vista, un ornitópodo solo mirando alrededor, desorientado, sin ver más
  allá de los árboles.
- **`deriva_arida` — Deriva árida.** Un frente de dunas rojizas avanzando
  sobre una pradera de helechos que se seca, la línea entre lo verde y lo
  árido cruzando el cuadro en diagonal, viento con arena en suspensión,
  siluetas de animales marchándose hacia el lado verde.
- **`nido` — Nido con huevos.** Primer plano de un nido de saurópodo excavado
  en arena, ocho o diez huevos redondos y grandes, uno rajado con el hocico de
  una cría asomando, la sombra del adulto desenfocada cruzando por encima.

### Recursos

- **`insectos` — Nube de insectos.** Una nube densa de insectos sobre una
  charca al atardecer, contraluz que la hace brillar, pterosaurios pequeños y
  un terópodo diminuto saltando a por ellos, comida a manos llenas.
- **`manada_paso` — Manada de paso.** Manada de saurópodos cruzando el cuadro
  de lado a lado, levantando polvo, y detrás de ellos el suelo pelado: helechos
  pisoteados, ramas bajas comidas, el paisaje que dejan más pobre que el que
  encontraron.
- **`frutos` — Frutos de cícada.** Primer plano de un cono de cícada abierto
  con semillas carnosas naranjas y rojas caídas alrededor, y acercándose desde
  varios lados, desenfocados, ornitópodos pequeños que han olido lo mismo.

### Criaturas

- **`tyrannosaurus` — Tyrannosaurus rex.** Escamoso, sin plumas. De frente y
  muy cerca, con las fauces abiertas en un rugido que levanta polvo, dos
  ornitópodos huyendo desenfocados a los lados.
- **`velociraptor` — Velociraptor mongoliensis.** Con plumaje entero y alas
  emplumadas en los brazos, del tamaño de un pavo. Saltando desde un montículo
  de arena con las garras en alto, fondo de dunas con cielo naranja.
- **`brachiosaurus` — Brachiosaurus altithorax.** Escamoso. Visto desde abajo
  con el cuello alzado hasta las copas de las araucarias, comiendo arriba del
  todo, dinosaurios pequeños a su sombra en la parte baja.
- **`argentinosaurus` — Argentinosaurus huinculensis.** Escamoso. Un titán de
  espaldas cruzando una llanura seca a paso lento, cada pisada levantando una
  nube de polvo, un terópodo a escala de perro al lado para dar la medida.
- **`mamenchisaurus` — Mamenchisaurus hochuanensis.** Escamoso. De perfil, con
  el cuello larguísimo en horizontal alcanzando un helecho arborescente al otro
  lado de un arroyo, sin mover el cuerpo.
- **`amargasaurus` — Amargasaurus cazadorensis.** Escamoso, con la doble fila
  de espinas altas en el cuello. Tres juntos en fila pastando, los cuellos
  espinados paralelos, contraluz que recorta las espinas.
- **`ankylosaurus` — Ankylosaurus magniventris.** Escamoso y acorazado.
  Girando sobre sí mismo con la maza de la cola en pleno golpe, polvo y
  piedras saliendo despedidas, un terópodo grande retrocediendo.
- **`kentrosaurus` — Kentrosaurus aethiopicus.** Escamoso, con placas pequeñas
  y púas largas en cola y hombros. Encarado a la cámara con los flancos
  erizados, plantado entre cícadas, sin retroceder.
- **`euoplocephalus` — Euoplocephalus tutus.** Escamoso y acorazado, con los
  párpados de hueso visibles. Primer plano corto de la cabeza con un ojo medio
  cerrado por el párpado óseo, tormenta de arena detrás.
- **`triceratops` — Triceratops horridus.** Escamoso. Cargando de frente con
  los tres cuernos bajos, tierra levantada, un terópodo apartándose en el
  último momento.
- **`pachycephalosaurus` — Pachycephalosaurus wyomingensis.** Escamoso. Dos
  chocando de cabeza en el instante del golpe, polvo en el punto de impacto,
  vista lateral a ras de suelo.
- **`iguanodon` — Iguanodon bernissartensis.** Escamoso. Manada numerosa
  avanzando junta por una llanura húmeda, los de delante a cuatro patas, los de
  atrás erguidos, todos en la misma dirección.
- **`parasaurolophus` — Parasaurolophus walkeri.** Escamoso. De perfil con la
  cabeza alzada y la cresta tubular contra el cielo, llamando, y al fondo la
  manada volviendo la cabeza hacia él.
- **`pteranodon` — Pteranodon longiceps.** Sin plumas, con picnofibras finas.
  Planeando muy bajo sobre el agua con las alas abiertas de punta a punta,
  rozando la superficie, sin batir.
- **`quetzalcoatlus` — Quetzalcoatlus northropi.** Sin plumas, con
  picnofibras. A pie en la llanura, alto como una jirafa, con las alas plegadas
  y el pico bajado hacia un dinosaurio pequeño que huye; su sombra cubre el
  suelo entero.
- **`elasmosaurus` — Elasmosaurus platyurus.** Escamoso, marino. Sacando el
  cuello larguísimo del agua para vigilar por encima de las olas, el cuerpo
  sumergido apenas insinuado, orilla con saurópodos al fondo.

## Las tres rondas del 16-09-2026: treinta y ocho huecos

Control de mano, rebote y hábitat. Es el bloque de huecos más grande que ha
tenido el proyecto y trae dos cosas nuevas que el resto del fichero no cubría.

**Lo primero: estas cartas NO son de la Morrison.** El bloque de ESTILO abre
con «Formación Morrison, Jurásico Superior» y aquí hay Mongolia, Hell Creek,
el Sahara, la Patagonia, Tendaguru y una isla del Cretácico europeo. En estas
treinta y ocho **se sustituye esa frase por el escenario que dice cada hueco**
y se copia literal todo lo demás —luz de última hora, paleta terrosa, cámara
baja, teleobjetivo, 3:2—, que es de donde sale la consistencia. La vegetación
de época también cambia con el sitio: donde diga Cretácico, las araucarias y
las cícadas dejan sitio a las primeras angiospermas de porte arbustivo, pero
**la prohibición de flores sigue en pie** —se ven como matorral y hoja ancha,
nunca floridas—.

**Y lo segundo: aquí la mecánica se ve o no se ve.** La ronda de las cien
cartas ya enseñó que las que descartan tienen que dibujar la PÉRDIDA. Estas
tres rondas son tres verbos y cada uno tiene su gesto:

| familia | qué hace la carta | qué tiene que verse |
|---|---|---|
| MOLIENDA | le quita cartas del mazo al rival | algo que **se entierra o se enturbia**: lo que desaparece bajo ceniza, lodo o agua turbia |
| REBOTE | devuelve a la mano algo que está en juego | algo que **SE VA del cuadro**: de espaldas, alejándose, saliendo por un lado |
| GOLPE AL HÁBITAT | daño directo, sin pasar por el combate | **la tierra herida**, no un animal herido: el suelo, el agua, el fuego |

Un rebote dibujado como una pelea es un rebote que nadie entiende: lo que
separa a esta ronda de las anteriores es que nadie muere, se van.

### La ronda del control — eventos

- **`tormenta_polvo` — Tormenta de polvo.** Frente de polvo ocre de cientos de
  metros tragándose la llanura, y a los dos lados del cuadro sendas manadas
  distintas desapareciendo dentro de él a la vez, la del fondo ya sólo silueta;
  el centro casi sin visibilidad. Los DOS bandos pierden lo que tenían, y por
  eso la simetría es el sujeto.
- **`avenida_lodo` — Avenida de lodo.** Una lengua de lodo pardo bajando por
  una ladera empapada y llevándose por delante troncos y helechos arrancados,
  que salen del cuadro por el lado bajo; el borde de la colada levantado y
  vivo, cielo de tormenta recién pasada.
- **`enterramiento` — Enterramiento rápido.** Un talud de arenisca recién
  cortado por el agua con un esqueleto articulado asomando a media altura,
  todavía medio dentro de la roca, la postura intacta. Es lo único de la ronda
  que devuelve algo, así que el hueso tiene que verse SALIR del sedimento y no
  hundirse en él.
- **`cauce_abandonado` — Cauce abandonado.** Un meandro seco y agrietado en
  primer plano, con su curva entera legible, y justo detrás el cauce nuevo
  llevando agua clara: el viejo se pierde y el nuevo llega, los dos en el mismo
  encuadre.
- **`barrera_troncos` — Barrera de troncos.** Un atasco de troncos arrastrados
  encajado en el estrechamiento de un río, el agua represada detrás y subiendo
  turbia, apenas un hilo colándose por debajo. Escenario de la Morrison.

### La ronda del control — criaturas

Mongolia (Nemegt) y Hell Creek, los dos del Cretácico Superior: llanuras de
inundación y dunas, angiospermas arbustivas sin flor, y la misma luz de última
hora de la tarde de siempre.

- **`gallimimus` — Gallimimus bullatus.** Plumaje de contorno entero, sin alas
  grandes, cuello largo y pico desdentado. Nemegt. Una manada entera en
  desbandada cruzando el cuadro en diagonal, todos a la misma velocidad y
  ninguno mirando atrás, polvo a la altura del vientre.
- **`thescelosaurus` — Thescelosaurus neglectus.** Escamoso, sin plumas,
  compacto. Hell Creek. Metido hasta los hombros en una madriguera excavada en
  un talud de arena, sólo la cabeza y las manos fuera, mirando hacia la llanura
  desde la sombra del hueco.
- **`deinocheirus` — Deinocheirus mirificus.** Plumaje de contorno, joroba
  dorsal alta y hocico ancho de pato. Nemegt. De pie en agua somera con los dos
  brazos enormes extendidos hacia delante, las garras rozando la superficie,
  el cuerpo entero reflejado.
- **`anzu` — Anzu wyliei.** Plumaje entero con alas emplumadas en los brazos y
  cresta ósea alta en la cabeza. Hell Creek. Encima de un nido ajeno de arena,
  con un huevo en la boca y el cuerpo ya girado para irse, la puesta revuelta
  debajo.
- **`nigersaurus` — Nigersaurus taqueti.** Escamoso, cuello corto para un
  saurópodo y hocico recto y anchísimo en boca de aspiradora. Sahara, Cretácico
  Inferior, llanura de helechos baja y río estacional. Segando a ras de suelo
  con el hocico paralelo a la tierra, dejando detrás una franja pelada y recta
  como una guadaña.
- **`shuvuuia` — Shuvuuia deserti.** Plumón entero, del tamaño de un pollo,
  brazos muy cortos con un solo dedo grueso, ojos enormes. Dunas del Nemegt al
  último crepúsculo, con luz todavía en el cielo. Quieto sobre la arena con la
  cabeza girada y ladeada escuchando algo bajo tierra, una oreja hacia el suelo.
- **`saurolophus` — Saurolophus angustirostris.** Escamoso, con la espina
  puntiaguda de la cresta apuntando hacia atrás y arriba. Nemegt. De perfil con
  la cabeza alzada y la cresta recortada contra el cielo, llamando con la boca
  abierta, y al fondo dos que ya han levantado la cabeza en respuesta.
- **`tarbosaurus` — Tarbosaurus bataar.** Escamoso, sin plumas, cráneo macizo y
  brazos diminutos. Nemegt. Sobre un cadáver de saurópodo ya abierto y seco,
  con la cabeza dentro de la caja torácica, sin prisa y sin nadie disputándolo.
- **`psittacosaurus` — Psittacosaurus mongoliensis.** Escamoso, con el pico de
  loro y un penacho de cerdas largas y rígidas en lo alto de la cola. Nemegt.
  Agachado en la orilla de un arroyo tragando piedrecitas redondas de la grava,
  la cola con las cerdas erguida detrás.
- **`dakotaraptor` — Dakotaraptor steini.** Plumaje entero con alas emplumadas
  largas en los brazos, del tamaño de un caballo, garra en hoz. Hell Creek. A
  media distancia detrás del último de una manada de ornitópodos que se aleja,
  agazapado y quieto entre helechos altos, sin haber cargado todavía.

### La ronda del rebote — eventos

- **`ceniza` — Ceniza volcánica.** Caída densa de ceniza gris sepultando una
  llanura, todo perdiendo el color a la vez, helechos doblados bajo el peso y
  medio enterrados, huellas que se borran solas; al fondo, la columna de la
  erupción. Cielo lechoso sin sol.
- **`sedimento` — Sedimento en suspensión.** Bajo el agua, muy cerca de la
  orilla: una nube de limo pardo llenándolo todo desde el fondo, y dentro de
  ella la silueta de unas patas que ya casi no se distinguen. Luz verde y
  turbia atravesada por partículas.
- **`osario` — Osario de la charca.** El fondo seco y agrietado de una charca
  cubierto de huesos de muchos animales amontonados y entrelazados, blanqueados
  por el sol, algunos todavía articulados. Vista casi cenital y baja a la vez,
  sin animal vivo en el cuadro.
- **`carroneros` — Enjambre de carroñeros.** Una decena de terópodos pequeños y
  pterosaurios sobre un mismo cadáver, todos a la vez y casi encima unos de
  otros, alas abiertas, movimiento por todas partes.
- **`oleada` — Oleada de calor.** Una llanura al mediodía con la calima
  temblando y deformando el horizonte, suelo agrietándose en polígonos, un
  charco a punto de irse; cielo blanco de calor. Sin protagonista animal: el
  sujeto es lo que le pasa a la tierra.
- **`estampida` — Estampida.** Desbandada general: una docena de dinosaurios
  pequeños de varias especies huyendo en todas direcciones a la vez, varios ya
  saliendo del encuadre por los lados y por el borde de abajo, polvo cerrado
  detrás. Nadie pelea y nadie cae — todos se van.
- **`migracion` — Migración estacional.** Una columna larga de saurópodos vista
  de espaldas alejándose hacia el fondo en fila india, el más cercano ya de
  medio cuerpo, el último apenas un punto; polvo bajo en toda la fila.
- **`crecida_delta` — Crecida del delta.** Un delta con el agua parda subiendo
  y tapando las barras de arena, y un ornitópodo grande retirándose hacia
  tierra alta con el agua por el vientre, de espaldas a la cámara y saliendo
  por un lado del cuadro.

### La ronda del rebote — recurso

- **`cantera` — Cantera abierta.** Un talud cortado por el agua que ha dejado a
  la vista una pared entera de roca en estratos limpios, con bloques
  desprendidos y grava fresca amontonada al pie en primer plano —la abundancia
  es esa pared abierta—, y arriba la llanura que se ha quedado sin borde.
  Modificador de RECURSO: la abundancia en primer plano, animales al fondo.

### La ronda del rebote — criaturas

Sahara (Kem Kem y Elrhaz) y Tendaguru. Llanuras costeras y manglares del
Cretácico para los africanos; para Giraffatitan, bosque abierto de coníferas y
cícadas del Jurásico de Tanzania, que sí admite el bloque de ESTILO tal cual
salvo el nombre del sitio.

- **`carcharodontosaurus` — Carcharodontosaurus saharicus.** Escamoso, sin
  plumas, cráneo larguísimo y estrecho con dientes de sierra a la vista. Kem
  Kem, llanura costera con palmeras de época y arenisca roja. De frente y muy
  cerca, arrancando de un mordisco lateral, con el impulso del cuello marcado y
  el suelo saltando bajo las patas.
- **`giraffatitan` — Giraffatitan brancai.** Escamoso, cuello vertical
  altísimo, cresta nasal alta. Tendaguru, Jurásico de Tanzania. Avanzando de
  frente y ligeramente en diagonal entre una arboleda, y a su paso dos
  dinosaurios pequeños apartándose de la trayectoria hacia los dos lados del
  cuadro; el gigante no los mira.
- **`tupandactylus` — Tupandactylus imperator.** Sin plumas, con picnofibras, y
  la cresta craneal enorme en forma de vela que le dobla el alto de la cabeza.
  Laguna del Cretácico brasileño. En picado cerrado sobre un nido de la orilla,
  alas medio plegadas, la cresta de canto contra el cielo.
- **`rugops` — Rugops primus.** Escamoso, hocico corto con la superficie del
  cráneo surcada y picada de agujeros, brazos inútiles. Kem Kem. Solo, con el
  hocico metido en un costillar ya limpio y volviendo la cabeza hacia la cámara
  sin soltarlo.
- **`ouranosaurus` — Ouranosaurus nigeriensis.** Escamoso, con la vela dorsal
  alta sostenida por espinas largas y el hocico ancho. Elrhaz, Níger, llanura
  con ríos. Dándose la vuelta para volver por donde vino, la vela de perfil
  entera contra la luz, ya con el cuerpo girado y las huellas de ida a sus pies.
- **`deltadromeus` — Deltadromeus agilis.** Escamoso, muy grácil y de patas
  largas, ligero para su tamaño. Kem Kem. Cruzando el cuadro a toda velocidad
  por delante de un grupo de dinosaurios pequeños que se abre a los dos lados
  para dejarle sitio, polvo en línea recta detrás de él.

### La ronda del hábitat — eventos

Los dos son daño directo a la tierra: nada de animales heridos.

- **`incendio` — Incendio estacional.** Un frente de fuego bajo avanzando por
  una llanura de helechos secos, la línea de llama nítida cruzando el cuadro de
  lado a lado, humo denso y pardo arriba, y detrás del frente el suelo ya negro
  y humeante. Morrison, al final de la estación seca.
- **`acuifero` — Colapso del acuífero.** Un socavón recién abierto donde estaba
  la charca: el suelo hundido en un cráter de bordes limpios y verticales, el
  fondo agrietado y sin una gota, y alrededor las huellas de los que venían a
  beber muriendo en el borde. Morrison, cielo pálido.

### La ronda del hábitat — criaturas

Los tres saurópodos van con el peso como sujeto, y los tres tireóforos con la
coraza. La Patagonia del Cretácico para los dos titanes; el resto, cada uno con
su sitio.

- **`patagotitan` — Patagotitan mayorum.** Escamoso, uno de los mayores que han
  existido. Patagonia, Cretácico, bosque abierto de coníferas y llanura de
  inundación. Visto de lado y desde muy abajo cruzando barro blando, y en
  primer plano la huella que acaba de dejar, honda como una charca y ya
  llenándose de agua.
- **`dreadnoughtus` — Dreadnoughtus schrani.** Escamoso, cuello y cola largos,
  cuerpo enorme. Patagonia, Cretácico, orilla de río. Entrando en el cauce y
  partiendo la corriente en dos, el agua abriéndose contra las patas con
  espuma, la orilla de detrás ya pisoteada y abierta.
- **`hatzegopteryx` — Hatzegopteryx thambema.** Sin plumas, con picnofibras;
  cuello CORTO y grueso —no el de Quetzalcoatlus— y cabeza descomunal. Isla de
  Haţeg, Cretácico: vegetación baja y fauna enana. A pie sobre un claro,
  dominando el cuadro entero de alto, con las alas plegadas y la cabeza baja
  sobre un dinosaurio enano que no le llega al corvejón.
- **`borealopelta` — Borealopelta markmitchelli.** Escamoso y acorazado, con
  osteodermos en filas y dos espinas largas saliéndole de los hombros hacia
  delante. Alberta, Cretácico, cerca de la costa. De frente, plantado y bajo,
  con las dos espinas de hombro apuntando a la cámara y el cuerpo entero pegado
  al suelo; un terópodo desenfocado que no termina de acercarse.
- **`zuul` — Zuul crurivastator.** Escamoso y acorazado, con cuernos cortos
  detrás de los ojos, el hocico ancho y la maza ósea al final de la cola.
  Montana, Cretácico. En el instante en que la maza llega a la altura de las
  patas de un terópodo, a ras de suelo, el impacto todavía sin resolverse.
- **`sauropelta` — Sauropelta edwardsorum.** Escamoso y acorazado, nodosaurio
  sin maza, con una hilera de púas largas y cónicas saliendo del cuello hacia
  los lados. Wyoming, Cretácico Inferior. Replegado sobre sí mismo con el
  cuello hundido entre los hombros y las púas formando una corona alrededor,
  visto desde delante y un poco arriba, inexpugnable y quieto.

### Lo que falta y en qué orden

Las treinta y ocho están sin generar. Si hay que priorizar, el orden es el que
más se ve: **las tres legendarias primero** —Carcharodontosaurus, Giraffatitan y
Patagotitan, que además son las tres únicas legendarias con criatura que
tampoco tienen vídeo—, luego las épicas, y el soporte al final, que es lo que
menos rato pasa en pantalla.

## Rehacer una criatura

El bloque de estilo vale igual; el hueco es el binomio más una acción. Dos
cosas que sólo aplican a los animales:

- **La restricción de `cards.js` ya no describe al set.** La cabecera dice
  Morrison, sin plumas y sin anacronismos, y el set tiene Halszkaraptor,
  Mosasaurus y Lokiceratops. Así que el plumaje **se decide carta por carta**,
  no por una regla global: hay que escribirlo en el hueco («escamoso, sin
  plumas» o «plumaje de contorno») o el generador lo inventa distinto cada vez.
  Las 16 de soporte no tienen este problema porque no hay protagonista animal.
- **Una acción, no una pose.** Las que ya están funcionan porque el animal está
  haciendo algo —cargando, mirando, alimentándose— y hay un segundo plano vivo.

## Consistencia entre generadores

- **ChatGPT (GPT Image)** acepta imágenes de referencia: adjuntar dos o tres
  JPEG de `assets/dinos/` y pedir «misma paleta, misma luz, mismo tratamiento»
  da mucha más continuidad que cualquier descripción.
- **DALL·E 3** no acepta referencia. Ahí la única continuidad es repetir el
  bloque de estilo literal, sin reformular ni una palabra.
- Generar **una carta por conversación**. En un hilo largo el modelo arrastra el
  encuadre de la anterior y las últimas salen todas iguales entre sí y distintas
  de las primeras.

## Después de generar

1. Dejar el fichero en `src/dinos/<id>.<lo que sea>`, con **el id exacto de la
   carta** (`sabana`, `gregarismo`, `jefe_saurophaganax`...). Un nombre que no
   se reconoce se salta en silencio: las dos cartas de jefe estuvieron meses sin
   ilustración por llamarse `Saurophaganax.PNG`.
2. `python tools/imagenes.py`
3. Subir `VERSION` en `sw.js`, o las cachés viejas siguen sirviendo lo anterior.
4. Si el animal queda descentrado, no rehacer el recorte: ponerle un foco en
   `assets/dinos/indice.json`.

## El marco de la carta, que no es una ilustración

Un marco generado como imagen completa **no sirve**, y el motivo no es la
calidad: es que trae la maquetación dentro. Si el PNG dibuja la banda del
nombre, la caja de habilidad y las barras de las cifras, esas cajas quedan
congeladas en píxeles y la carta ya no puede estirarlas — y como la proporción
del PNG nunca coincide al milímetro con 82:112, se deforma entero.

Un marco tiene que traer **sólo el borde**, con el centro vacío. Así se sirve
como `border-image` en nueve tajadas: las cuatro esquinas se pintan a tamaño
fijo y nunca se estiran, los cuatro lados se reparten lo que sobra, y el centro
transparente deja ver la ilustración. El mismo fichero vale para la carta de la
ranura y para la de la ficha.

> Marco de carta de juego de cartas coleccionables, vertical, proporción 82:112.
> SOLO EL BORDE: el centro completamente vacío y transparente, sin ninguna caja,
> banda ni panel dentro. Banda de roca oscura de grosor uniforme en los cuatro
> lados, con vetas minerales y filigrana dorada fina recorriéndola. En cada una
> de las cuatro esquinas un fósil grabado en bajorrelieve —amonites, vértebras,
> una huella tridáctila—, contenido dentro del cuadrado de la esquina y sin
> invadir los lados. Los tramos rectos entre esquina y esquina, uniformes y
> repetibles, sin ningún motivo que se reconozca como único. Paleta: negro, gris
> piedra, oro viejo. Iluminación lateral que marque el relieve. Fondo
> transparente. Sin texto, sin números, sin iconos, sin marca de agua.

Tres cosas que decide este prompt y conviene entender:

- **Las esquinas llevan el adorno y los lados no.** Al estirarse, un motivo
  reconocible en mitad de un lado se deforma y se nota; la roca uniforme no.
- **El centro vacío no es un descuido.** Es lo que permite que el arte vaya a
  sangre por debajo y que el texto siga siendo CSS.
- **Exportar a 512 px de ancho**, PNG con alfa. El original de 2 MB no cabe: se
  descarga en cada partida y el service worker lo cachea.

Y el aviso que ya mordió dos veces en la capa visual: `box-shadow` lo ocupa el
aro de rareza y `transform` las animaciones del tablero. Un marco que pida
resplandor propio choca ahí.

### Un marco por rareza

La rareza **no puede vivir en la cantidad de adorno**. A 82 px nadie cuenta
filigrana: lo que sobrevive a ese tamaño es el TONO DEL METAL. Piedra desnuda,
bronce, acero pálido y oro se distinguen de un vistazo aunque el dibujo sea
ilegible; «tres volutas frente a cinco» no se distingue nunca.

Lo que tiene que ser **idéntico** en los cuatro, o las cartas dan un salto al
pasar de una a otra en la colección:

- el grosor de la banda y la geometría entera,
- dónde empieza y acaba cada tramo recto,
- el tamaño y la posición del adorno de cada esquina.

Lo único que cambia es el material. Al bloque del marco de arriba se le sustituye
la frase de la paleta por una de estas cuatro:

| rareza | material |
|---|---|
| Común | Roca gris desnuda, sin ningún metal. Los filetes que recorren la banda son de piedra pulida algo más clara, tipo pizarra. Los fósiles de las esquinas apenas insinuados, del mismo tono gris que el resto. |
| Rara | Roca oscura con filetes de bronce mate y vetas finas de cobre oxidado en las grietas. Los fósiles de las esquinas, en bronce. |
| Épica | Roca de tono azulado frío con filetes de acero pálido y vetas de plata en las grietas. Los fósiles de las esquinas, en plata. |
| Legendaria | Roca casi negra con filetes de oro viejo y vetas de oro fundido recorriendo las grietas, brillantes. Los fósiles de las esquinas en oro y en alto relieve. |

**Y antes de generar cuatro, considera generar uno.** Cuatro PNG de 512 px son
unos 480 KB que se descargan y se cachean; uno solo, autorizado en gris neutro y
teñido con un filtro CSS por rareza, son 120 KB y una sola cosa que mantener. Se
ve en el banco de marcos: los cuatro escalones de ahí son el MISMO fichero con
cuatro filtros. El precio es que el tinte no distingue entre el oro de un filete
y el gris de la roca, así que el contraste entre metal y piedra se aplana un
poco. Con cuatro ficheros se controla exacto y pesa cuatro veces más.

## La fila de abajo cambia en las de soporte

No hacen falta dos plantillas para criaturas y para soporte. Hace falta **un
módulo distinto en la fila de abajo**, porque las 16 de soporte no tienen Ataque
ni Vida: son 0/0. Dejarles las dos esquinas de cifras las deja vacías en 16 de
las 68 cartas, y una esquina vacía no se lee como «este tipo no tiene cifras»,
se lee como que algo se rompió.

Esa fila lleva en su lugar el tipo y **sobre qué cae la carta** —el `objetivo`:
PROPIO, RIVAL, CLADO, RIVALES o NINGUNO—, que es el dato que el jugador necesita
antes de soltarla y que hoy no está en la cara de la carta por ninguna parte.

Para teñirla no hay que elegir colores: **`TONO` en `src/ui/art.js` ya le asigna
uno a cada carta de soporte** —el Canal `#3f7d8c`, el Bosque `#4e7a4a`, la Sequía
`#c2a04e`— y lleva ahí desde que se dibujaron las siluetas.

Que una carta de clima se distinga de un vistazo no es adorno: en su día una
Mortandad se podía soltar sobre la franja del clima y parecía que la estabas
poniendo de clima.

## El reverso: son dos piezas, no una

Antes de generar nada: **el reverso ya existe y es CSS**. Vive en `--escamas`
—dos degradados radiales que dibujan un motivo de escamas— más un `◆` metido en
un círculo. Lo pintan hoy el sobre sin abrir (`.sobre-paquete`, 116×162) y el
dorso del volteo (`.sobre-dorso`, del tamaño de la carta). El bloque
`.carta-dorso` de `style.css` se quedó sin usar al reescribir el render: su
comentario todavía promete que lo comparten «la ranura oculta, la pila de mazo y
el sobre», y de esos tres hoy sólo queda el sobre.

Y lo que decide el encargo: **el motivo cambia de escala según dónde esté** —16 px
de baldosa en la carta, 22 px en el sobre—. Una imagen de reverso entero,
estirada, pierde eso: en el sobre grande se vería el mismo dibujo hinchado en vez
de más escamas. Así que hacen falta **dos ficheros**, no uno:

1. **El mosaico**, repetible y sin costura, que sustituye a `--escamas`.
2. **El emblema**, centrado y con fondo transparente, que sustituye al `◆`.

La idea que los une, y que es de este juego y no de otro: **el anverso es el
animal vivo; el reverso es la roca de la que salió.** Un juego donde cada taxón
está descrito formalmente y cada carta lleva su nivel de evidencia se merece un
dorso que sea sedimento, no un dragón heráldico.

### 1 · El mosaico

> Textura cuadrada **sin costuras**, que se repita en mosaico sin junta visible
> por ningún borde. Motivo: impresiones fósiles de piel escamosa de dinosaurio
> sobre roca oscura, del tipo que deja un molde en arenisca — escamas poligonales
> irregulares, algunas nítidas y otras medio borradas por el sedimento. Relieve
> muy bajo, como grabado. Paleta casi monocroma: negro y gris carbón, con el
> filo de algunas escamas apenas insinuado en oro viejo muy apagado.
> **Iluminación completamente plana y uniforme**: ninguna sombra direccional,
> ningún viñeteado, ningún punto más claro que otro. Contraste bajo. Ningún
> elemento único ni centro de atención: el motivo tiene que ser igual de
> interesante en cualquier trozo. Sin texto, sin logotipo, sin marco.

La iluminación plana no es un capricho: **una sola luz direccional destruye el
mosaico**, porque al repetirse aparece una rejilla de claros y oscuros que se ve
antes que el dibujo. Es el error que arruina nueve de cada diez texturas
generadas.

Exportar a **512×512 en JPEG**: no necesita transparencia y así pesa 40 KB en vez
de 200.

### 2 · El emblema

> Emblema circular único, centrado, sobre fondo **transparente**. Una huella
> tridáctila de terópodo impresa en relieve dentro de un anillo de piedra, con el
> anillo grabado con bandas concéntricas finas que sugieran estratos. Oro viejo
> sobre piedra oscura, mismo metal y mismo acabado que el marco de las cartas.
> Formas macizas y trazo grueso; ningún detalle fino. Iluminación lateral suave
> que marque el relieve. Sin texto, sin letras, sin marca de agua. Nada fuera del
> círculo.

**El trazo grueso es la única regla que importa aquí.** El emblema se pinta a
26 px en la carta: cualquier filigrana se convierte en una mancha. Para
comprobarlo, encoge la imagen al tamaño de una uña — si no reconoces la huella,
no sirve por bien que se vea en grande.

Exportar a **256×256 en PNG con alfa**.

### Sobre la simetría

Un reverso de cartas físicas debe ser simétrico a 180°, o el dorso delata la
orientación y las cartas quedan marcadas. **En DinoWar no aplica**: el reverso no
se gira nunca en pantalla. Pero si algún día se imprime, la huella hay que
duplicarla en espejo o cambiarla por un motivo que gire sobre sí mismo.

## Los efectos del tablero: lo que se dibuja y lo que se mueve

Para que el combate pese y el clima toque el tablero hacen falta **quince
imágenes**, y ninguna es una ilustración: son texturas y destellos que el
juego mueve por CSS. Antes de pedir la primera, tres decisiones que cambian
cómo se piden todas.

**Pokémon TCG Live lo hace con lo mismo, sólo que en Unity.** Sus impactos son
*flipbooks* —una rejilla de fotogramas prerrenderizados que se pasan a 24 por
segundo— más *partículas*: una textura diminuta de chispa o humo que el motor
copia cien veces y mueve. No hay vídeo ni modelos 3D en los golpes. Aquí el
flipbook se pasa con `animation-timing-function: steps()` sobre
`background-position`, y las partículas son nodos con `transform`. Es la misma
técnica sin el motor.

**Nada de fondo transparente.** Los generadores entregan el alfa mal —halo
gris, bordes sucios— y con las placas ya costó una herramienta de inundación.
Los efectos no lo necesitan, porque el tablero se pinta con dos mezclas:

| lo que es | se pide sobre | se pinta con |
|---|---|---|
| luz: destellos, chispas, lluvia, bruma, agua, aura | **negro puro** | `mix-blend-mode: screen` — el negro desaparece solo |
| sombra: grietas, polvo, calima | **blanco puro** | `mix-blend-mode: multiply` — el blanco desaparece solo |

Así se salta el keyeado entero. El precio es que una chispa pintada con
`screen` nunca es más oscura que lo que hay debajo, y eso es exactamente lo que
tiene que hacer una chispa.

**Un flipbook es una apuesta; un fotograma es seguro.** Los generadores no
saben hacer secuencias coherentes: la rejilla llega con fotogramas de distinto
tamaño, en distinto orden o con dos explosiones distintas. Se pide UNO —el
choque grande— y se acepta que cueste varios intentos. Todo lo demás es un
fotograma único que el CSS escala, gira y apaga, que es lo que hacen las
partículas de verdad.

### El bloque de ESTILO de los efectos (copiar literal)

> Efecto visual de videojuego (VFX) para un juego de cartas de dinosaurios,
> estilo pintado semirrealista, sin viñeta cómic ni trazo de dibujo animado.
> Paleta del juego: ámbar `#d9a441`, oro viejo, naranja de brasa, blanco
> cálido; nada de azul eléctrico, magenta ni verde neón. Iluminación propia
> del efecto, sin ninguna luz externa ni sombra proyectada. Sin fondo, sin
> paisaje, sin objeto, sin personaje: sólo el efecto, centrado. Sin texto, sin
> letras, sin marca de agua, sin marco.

Donde abajo pone `[ESTILO]`, va ese bloque entero.

### 1 · El choque, el único flipbook

Suena cuando dos criaturas se pegan y cuando un golpe llega al hábitat. Es el
que más se ve y el único que merece la apuesta.

> [ESTILO] Hoja de sprites de una explosión de impacto vista de frente, en una
> **rejilla exacta de 4 columnas por 4 filas, 16 fotogramas del mismo tamaño**,
> sin separación entre celdas y sin bordes dibujados, leída de izquierda a
> derecha y de arriba abajo. Fotograma 1: un punto de luz blanca. Fotogramas
> 2 a 5: un destello radial que crece, con un anillo de choque fino
> expandiéndose. Fotogramas 6 a 11: el anillo sigue abriéndose mientras el
> centro se apaga a ámbar y a naranja y salen chispas radiales. Fotogramas 12 a
> 16: sólo quedan brasas y un humo tenue que se disipa hasta casi nada. Cada
> fotograma centrado en su celda, el efecto **nunca toca el borde de la celda**.
> Fondo negro puro uniforme en toda la hoja, también entre fotogramas.

Comprobar antes de aceptarlo: recortar las 16 celdas en un editor y verlas
seguidas. Si el centro salta de sitio entre dos fotogramas, la hoja no vale y
no se arregla a mano. Exportar **2048×2048 en PNG**; se sirve a 1024, o sea
celdas de 256, y a densidad 2x un choque ocupa 128 px de pantalla.

### 2 · Fotogramas únicos de impacto (fondo negro)

Cinco imágenes cuadradas de 1024×1024, cada una centrada, sin tocar el borde.
Se sirven a 512 salvo las dos partículas.

- **`garra`** — el golpe de un terópodo. «[ESTILO] Tres tajos de garra en
  diagonal, paralelos y de longitud desigual, con el filo blanco incandescente
  y el borde ámbar desvaneciéndose a naranja, salpicadura fina de chispas en
  el extremo de cada tajo.»
- **`pisoton`** — el golpe de un saurópodo y el aterrizaje de una carta.
  «[ESTILO] Onda de choque circular vista desde arriba, un anillo ámbar
  luminoso con el interior oscuro y polvo iluminado saliendo hacia fuera en
  todas direcciones, más denso en el anillo y disperso en el borde.»
- **`chispa`** — la partícula. «[ESTILO] Una sola chispa incandescente, un
  punto blanco con cola corta de brasa ámbar, ligeramente alargada en
  vertical, aislada.» Se sirve a **64×64**: se copian veinte por golpe.
- **`brasa`** — la partícula lenta. «[ESTILO] Una sola brasa flotante, un
  punto naranja suave con halo difuso, sin cola, ligeramente irregular.»
  A **64×64**.
- **`destello`** — el flash de un fotograma. «[ESTILO] Destello de lente de
  cuatro puntas, blanco cálido en el centro y ámbar en las puntas, con un halo
  circular tenue, simétrico.» Es lo que tapa el corte en el *hit-stop*: la
  pantalla se congela 80 ms y esto se pone encima para que la congelación se
  lea como golpe y no como tirón.

### 3 · Lo que ensucia (fondo blanco)

Dos imágenes que van con `multiply`, por eso se piden sobre blanco. La tercera
de esta familia es la `calima` de la Sequía, más abajo.

- **`grietas`** — el hábitat encajando un golpe. «[ESTILO, pero sobre fondo
  blanco puro] Grietas de roca partida vistas de frente, saliendo de un punto
  de impacto descentrado, en negro y gris carbón, finas en las puntas y
  anchas en el centro, sin relleno, sólo las líneas de fractura.» Apaisada,
  **1792×1024**, servida a 1024: se pone sobre la barra de hábitat y se apaga.
- **`polvo`** — la muerte y el aterrizaje pesado. «[ESTILO, pero sobre fondo
  blanco puro] Una nube de polvo terroso, ocre y gris, redondeada y suave, más
  densa en el centro y deshecha en los bordes, vista de lado.» Cuadrada,
  1024, servida a 256: es una partícula grande.

### 4 · El momento de invocación (fondo negro)

Dos imágenes grandes para cuando entra una legendaria: la pantalla se oscurece,
la carta crece al centro y detrás pasan estas dos.

- **`rayos`** — «[ESTILO] Rayos de luz radiales saliendo de un centro, de
  distinta longitud y grosor, blanco cálido cerca del centro y ámbar
  transparente en las puntas, ocupando todo el cuadrado, sin objeto en el
  centro: el centro es un hueco oscuro donde irá otra cosa.» **2048×2048**,
  servida a 1024. Gira despacio detrás de la carta.
- **`aura`** — «[ESTILO] Anillo de luz dorada visto de frente, grueso y
  difuso, con un segundo anillo más fino y más tenue por fuera, el interior
  completamente negro.» 1024 servida a 512. Se expande y se apaga al terminar
  la invocación.

### 5 · El clima sobre el tablero

Cinco climas, cinco capas. Cuatro se **mueven**, y para moverse sin fin tienen
que ser mosaico sin costuras, con la misma regla que el reverso: **iluminación
plana, ningún centro de atención, ningún elemento único**. Se piden cuadradas
de 1024 y se sirven a 512. La quinta es fija y es apaisada.

Lo que ya hace CSS sin imagen y no hay que pedir: oscurecer el tablero para el
Monzón, teñir de verde para la Estación de lluvias, calentar el tono para la
Sequía. Las imágenes sólo ponen lo que un filtro no sabe hacer.

- **`sabana` — Monzón de verano: `lluvia`.** Fondo negro. «[ESTILO] Textura
  sin costuras de lluvia intensa, trazos finos blancos y gris claro
  inclinados unos 15 grados, de longitud y brillo variados, densidad media,
  sin gotas redondas ni salpicaduras.» Se desplaza hacia abajo en bucle.
- **`bosque` — Estación de lluvias: `llovizna`.** Fondo negro. «[ESTILO]
  Textura sin costuras de llovizna fina, trazos muy cortos y casi verticales,
  gris claro tenue, densidad alta y uniforme, más suave que una lluvia.» Se
  desplaza hacia abajo más despacio que la lluvia, y el tablero va teñido de
  verde.
- **`canal` — Bruma de valle: `bruma`.** Fondo negro. «[ESTILO] Textura sin
  costuras de niebla, volutas blandas de blanco cálido y gris muy claro sobre
  negro, contraste bajo, sin forma reconocible, sin zona más densa que otra.»
  Se desplaza en horizontal muy despacio, con dos copias a distinta velocidad
  para que no se vea el bucle.
- **`llanura` — Crecida estacional: `agua`.** Fondo negro. «[ESTILO] Textura
  sin costuras de reflejos sobre agua turbia en movimiento, destellos
  alargados en horizontal, ámbar y blanco cálido sobre negro, como sol
  reflejado en un río, sin orilla ni objeto.» Va sólo en el tercio de abajo
  del tablero, desplazándose en horizontal, con el borde de arriba fundido
  por CSS.
- **`aridez` — Sequía prolongada: `calima`.** Fondo blanco, `multiply`, fija.
  «[ESTILO, pero sobre fondo blanco puro] Velo de calor y polvo apaisado: los
  cuatro bordes con polvo ocre y tierra agrietada muy tenue, el centro
  completamente blanco y limpio, transición gradual y sin forma marcada.»
  **1792×1024**, servida a 1024. Es una viñeta: se queda quieta y respira con
  la opacidad, y el temblor de calor lo hace CSS con un filtro.

### Lo que llegó, y en qué cambia el encargo

La primera tanda —septiembre de 2026— trajo NUEVE de las quince, y los seis
«fotogramas únicos» llegaron también como hojas de 4×4. Mejor: una hoja se
pasa igual que un fotograma y cada golpe tiene su propia secuencia. Así que
**pedir hojas de 4×4 para todo lo que sea un golpe o un destello**, y dejar
como fotograma único sólo lo que se queda quieto: las grietas, el polvo, los
rayos y la calima. `tools/efectos.py` las mide y avisa si alguna celda se sale
de su centro.

La segunda tanda trajo las cinco del clima, con el **id de su carta** de
nombre —`sabana.png`, `bosque.png`…— y la herramienta las reconoce así. Las
tres que se mueven en bucle llegaron **con costura** aunque se pidieron sin
ella: el borde derecho no casaba con el izquierdo por 9 y 12 veces el salto
entre columnas vecinas. La herramienta las cierra sola —desplaza la imagen
media vuelta y funde— y lo mide antes y después, así que no hace falta
insistirle al generador: con lluvia, niebla y agua el cierre no se nota.

### Después de generar

1. Dejar los originales en **`src/piel/efectos/`** con el nombre exacto de la
   lista: `choque`, `garra`, `pisoton`, `chispa`, `brasa`, `destello`,
   `grietas`, `polvo`, `rayos`, `aura`, `lluvia`, `llovizna`, `bruma`, `agua`,
   `calima`. Es la misma regla que las ilustraciones: un nombre que no se
   reconoce se salta en silencio.
2. `python tools/efectos.py escribir`. No keyea nada: aprieta el fondo al
   negro o al blanco exactos, mide las hojas y escala.
3. Subir `VERSION` en `sw.js`, como siempre.

**Lo que este encargo NO cubre** y no hay que pedir: retratos de rivales, el
sprite de una criatura atacando, o una ilustración por golpe. El impacto es el
mismo para las 52 criaturas y lo que cambia es el color y el tamaño, por CSS.
Un juego con 52 impactos distintos tendría 52 cosas que mantener y ninguna se
vería más de un segundo.

## Las piezas de la pantalla de mazos

Hoy la lista de mazos y el editor son las dos únicas pantallas del juego sin
piel: paneles oscuros con filas de texto, mientras el menú de al lado es
piedra y latón. Lo que sigue son las piezas para que dejen de serlo, y el
encargo es corto: **una placa, un sello, siete emblemas, tres iconos y un
fondo**. Todo lo demás —la rejilla de cartas del editor, la curva de coste,
los filtros— se pinta con lo que ya hay: las cartas con su marco salen de
`cartaHTML()` y el latón de los botones, de las placas que ya existen.

### El bloque de MATERIAL (copiar literal)

Es el mismo de las placas del menú. Adjuntar `placa_coleccion.png` o
`boton_ancho.png` como referencia y pedir «mismo material, misma luz».

> Pieza de interfaz de videojuego, vista de frente, sin perspectiva. Roca
> oscura pulida con vetas minerales y filete de latón viejo con el canto
> biselado, iluminación lateral suave que marque el relieve, sin brillos
> especulares fuertes. Paleta: negro, gris piedra, latón `#d9a441` y oro
> viejo. Sin texto, sin letras, sin números, sin marca de agua. Fondo
> **magenta puro `#FF00FF`** fuera de la pieza, sin sombra proyectada.

Magenta y no transparente, como los marcos: `tools/marcos.py` ya sabe
keyearlo y las placas del menú costaron una herramienta de inundación por
llegar sin él.

### 1 · La placa de mazo

Cada mazo de la lista es una placa apaisada con una ventana a la izquierda
donde el juego pinta la carta de portada —la legendaria del mazo, o la que
el jugador elija— y una banda a la derecha donde escribe el nombre. Va como
`border-image` en nueve tajadas, igual que el marco de carta, así que **la
ventana y la banda tienen que ser huecos vacíos** y no dibujos.

> [MATERIAL] Placa horizontal de proporción 4:1. A la izquierda, un hueco
> rectangular vertical de proporción 82:112 que ocupa todo el alto menos el
> filete, con el borde de latón alrededor, **relleno de magenta puro**. A la
> derecha, el resto de la placa como una banda lisa de roca oscura, sin
> ningún adorno en el centro, para grabar un nombre encima. Un pequeño
> remache de latón en cada una de las cuatro esquinas. Bordes rectos, sin
> curvas.

Exportar a **1024 px de ancho**, PNG. Se sirve a 768: mide 342 px en la
lista, a densidad 2x.

### 2 · El sello «en uso»

El mazo que llevas a la partida se marca con un sello en la esquina de su
placa, no con un botón. Es lo único de la lista que tiene que verse desde
lejos.

> [MATERIAL] Sello circular de lacre color ámbar oscuro con la impronta de
> una huella tridáctila de terópodo en el centro, el borde del lacre
> irregular como lacre de verdad, ligeramente en relieve. Sin texto. Nada
> fuera del círculo.

Exportar a **256×256**. Se pinta a 28 px.

### 3 · Los siete emblemas de clado

Sirven para tres cosas: filtrar la colección en el editor, decir de un
vistazo de qué es cada mazo —el clado dominante se calcula y se pone en la
placa— y, más adelante, rotular las plantillas. Son siete y tienen que
leerse a 20 px, así que **silueta maciza, un solo trazo, nada de detalle**.
Se piden los siete en una conversación con la misma frase y sólo cambia el
animal.

> [MATERIAL] Emblema circular, un medallón de latón viejo con el borde
> biselado, y en el centro la silueta maciza y estilizada, en relieve, de
> {ANIMAL}, vista de perfil, reconocible a tamaño de icono, sin detalle
> interior. Formas gruesas. Nada fuera del círculo.

| fichero | {ANIMAL} |
|---|---|
| `clado_teropodo` | un terópodo bípedo cazador, cabeza grande, cola recta |
| `clado_sauropodo` | un saurópodo de cuello y cola largos, cuatro patas |
| `clado_tireoforo` | un estegosaurio con placas en el lomo |
| `clado_ornitopodo` | un ornitópodo bípedo de cabeza pequeña, inclinado hacia delante |
| `clado_marginocefalo` | un ceratópsido con gola y cuernos, de perfil |
| `clado_pterosaurio` | un pterosaurio con las alas extendidas, de perfil |
| `clado_marino` | un mosasaurio nadando, cuerpo alargado y aletas |

Exportar a **256×256** cada uno. Comprobar cada emblema encogido a 20 px:
si no se distingue el tireóforo del saurópodo, no sirve.

### 4 · Los tres iconos de tipo

Los mismos medallones para las tres familias de soporte, que en el editor
se filtran junto a los clados.

| fichero | {ANIMAL} se sustituye por |
|---|---|
| `tipo_clima` | una nube con tres trazos de lluvia debajo |
| `tipo_evento` | un rayo vertical quebrado |
| `tipo_recurso` | un helecho de tres frondes |

Exportar a **256×256**.

### 5 · El fondo de la pantalla

Como `fondo_jugar.webp`: una escena a sangre detrás de todo, oscurecida por
CSS. Para los mazos, el sitio donde se guardan las cosas.

> [ESTILO de las ilustraciones, el bloque de PROMPTS.md] El interior de una
> cabaña de expedición paleontológica de finales del siglo XIX, vista de
> frente: una mesa de madera con cajones de fósiles etiquetados, cuadernos
> de campo abiertos, un candil de aceite encendido, huesos de dinosaurio
> ordenados en bandejas. Penumbra cálida, un solo foco de luz, tonos
> marrones y ámbar. Composición vertical 9:16. Sin personas, sin texto.

Exportar a lo más vertical que dé el generador y recortar a 9:16. Se sirve
a **1080 px de ancho** por `tools/placas.py`, en `FONDOS`, como los otros
dos.

### Lo que llegó

Las trece, la misma noche, todas en magenta limpio y con el nombre pedido
salvo la placa, que vino como `placa_de_mazo.png` y la herramienta la conoce
así. Los diez medallones pasan la prueba de los 20 px: encogidos a ese tamaño
se distinguen todos entre sí. Se sirven a 192 px y pesan 14 KB cada uno.

### Lo que NO se pide

- Ni la curva de coste ni el medidor de 50/50: son CSS y ya están.
- Ni las cartas del editor: salen de `cartaHTML()` con su marco.
- Ni botones: los del pie usan `boton_ancho.webp` y las chapas del menú.

## Las piezas de la Cuenca

La Cuenca es la pantalla con más juego dentro —un jefe con miles de Vida, un
yacimiento que produce solo, una tribu con almacén— y la que menos lo enseña:
seis recuadros de texto en columna. El marco del diseño es un **equipo de
excavación** trabajando una cuenca sedimentaria, y eso es lo que las piezas
tienen que contar. Son **nueve**: un fondo, un marco para el jefe, cuatro
estados del yacimiento, la bandeja de fósiles, el medallón de excavador y el
sello del jefe caído. El icono del fósil es el décimo y es pequeño.

Lo que NO se pide: la barra de Vida del jefe reutiliza el canal y el relleno
del hábitat, que ya existen; los medallones de clado de los mazos valen para
decir de qué es cada compañero; las cartas de jefe se pintan con su marco.

### El bloque de MATERIAL (copiar literal)

El mismo de las placas del menú y de los mazos. Adjuntar `placa_de_mazo.png`
como referencia y pedir «mismo material, misma luz».

> Pieza de interfaz de videojuego, vista de frente, sin perspectiva. Roca
> oscura pulida con vetas minerales y filete de latón viejo con el canto
> biselado, iluminación lateral suave que marque el relieve, sin brillos
> especulares fuertes. Paleta: negro, gris piedra, latón `#d9a441` y oro
> viejo. Sin texto, sin letras, sin números, sin marca de agua. Fondo
> **magenta puro `#FF00FF`** fuera de la pieza, sin sombra proyectada.

### 1 · El fondo: el yacimiento a cielo abierto

> Paleoarte fotorrealista, render 3D cinematográfico, calidad de documental
> de historia natural. Una excavación paleontológica a cielo abierto vista
> desde arriba y de frente, a última hora de la tarde: una ladera de roca
> sedimentaria en capas ocres y rojizas con un lecho de huesos de dinosaurio
> medio expuestos, cuadrícula de cuerdas y estacas, andamio de madera, dos
> tiendas de lona y cajas de embalaje, herramientas apoyadas. Luz cálida y
> rasante, sombras largas, polvo en el aire. Sin personas, sin texto, sin
> marca de agua. Composición vertical 9:16, con el tercio central tranquilo
> para leer texto encima.

Exportar a lo más vertical que dé el generador; se sirve a **1080 de ancho**
como `fondo_mazos`.

### 2 · El marco del jefe

La ilustración del jefe ya existe —es la de su carta— y va dentro de un
marco de museo, apaisado, con una cartela debajo donde el juego escribe el
nombre. Como la placa de mazo: **la ventana y la cartela son huecos vacíos**
que el CSS rellena, y la herramienta mide dónde caen.

> [MATERIAL] Marco de vitrina de museo de historia natural, horizontal, de
> proporción 3:2 en la ventana. Un hueco rectangular apaisado de 3:2 que
> ocupa casi todo el marco, **relleno de magenta puro**, con un filete de
> latón alrededor y remaches en las esquinas. Debajo del hueco, pegada al
> marco, una cartela rectangular estrecha de latón mate, lisa, **también
> rellena de magenta**, para grabar un nombre. Los bordes del marco en roca
> oscura con vetas.

Exportar a **1024 px de ancho**. Se sirve a 768.

### 3 · El yacimiento en cuatro estados

El yacimiento sube del nivel 1 al 8 y hoy es una cifra. Que se VEA crecer es
lo que Tribal Wars hace bien y lo único que se le coge: cuatro imágenes,
una por cada dos niveles, del mismo sitio cada vez más excavado. Se piden
las cuatro en una conversación, con la misma frase, y sólo cambia el estado.
La primera manda: las otras tres son ediciones de ella.

> Paleoarte fotorrealista, render 3D cinematográfico, calidad de documental
> de historia natural. Vista frontal ligeramente elevada de un mismo
> afloramiento de roca sedimentaria ocre, encuadre fijo, luz cálida de tarde,
> cielo naranja pálido. Composición apaisada 2:1. Sin personas, sin texto,
> sin marca de agua. {ESTADO}

| fichero | {ESTADO} |
|---|---|
| `yacimiento_1` | Estado inicial: la roca intacta, una sola pala y un pico apoyados, una cuerda de cuadrícula clavada, ningún hueso a la vista. |
| `yacimiento_2` | Primera zanja abierta en la roca con dos huesos grandes asomando, cuadrícula de cuerdas completa, una tienda pequeña al fondo. |
| `yacimiento_3` | Zanja ancha y profunda con un esqueleto parcial expuesto y protegido con yeso, andamio de madera, dos tiendas y cajas de embalaje. |
| `yacimiento_4` | Excavación grande en terrazas con varios esqueletos expuestos, andamios, un cobertizo de madera, cajas apiladas y un pequeño raíl con vagoneta. |

Exportar a **1536×768** o lo más cercano; se sirven a 768 de ancho y se
pintan a 342 en el bloque del yacimiento.

### 4 · La bandeja de fósiles

El depósito que se llena. Se pide LLENA y el CSS la va destapando de
izquierda a derecha con `clip-path` según el porcentaje: una sola imagen.

> [MATERIAL] Bandeja de madera rectangular apaisada de proporción 4:1, vista
> de frente y un poco desde arriba, llena hasta el borde de fósiles pequeños
> ordenados: vértebras, dientes, fragmentos de hueso y un amonites,
> etiquetados con etiquetas blancas en blanco. Bordes de la bandeja con
> cantoneras de latón. Nada fuera de la bandeja.

Exportar a **1024 px de ancho**. Se sirve a 768.

### 5 · El medallón de excavador

Para los compañeros de tribu en la tabla de daño: un medallón como los de
clado, con el mismo borde, y el símbolo del oficio.

> [MATERIAL] Emblema circular, un medallón de latón viejo con el borde
> biselado, y en el centro la silueta maciza, en relieve, de un pico y un
> pincel de paleontólogo cruzados en aspa, reconocible a tamaño de icono,
> sin detalle interior. Formas gruesas. Nada fuera del círculo.

Exportar a **256×256**. Se pinta a 22 px.

### 6 · El sello del jefe caído

Cuando el jefe cae, su marco lleva un sello encima, como el lacre de «en
uso» pero de otro material: cayó, es historia, va al museo.

> [MATERIAL] Sello circular de cera roja oscura con la impronta de un cráneo
> de terópodo de perfil en el centro, el borde de la cera irregular como cera
> de verdad, ligeramente en relieve, con una grieta atravesándolo. Sin texto.
> Nada fuera del círculo.

Exportar a **256×256**. Se pinta a 40 px, girado.

### 7 · El icono del fósil

El recurso de la Cuenca no tiene icono: «1240 fósiles» es texto. Va en la
barra de arriba junto a la cifra, como el trofeo y la biomasa en el HUD.

> [MATERIAL] Icono pequeño y macizo de un amonites fósil visto de frente, en
> latón viejo con el espiral marcado en relieve, formas gruesas, legible a
> 12 px. Nada alrededor.

Exportar a **256×256**. Se sirve a 96, como los del HUD.

### Lo que llegó

Las diez, en una tarde. El marco del jefe trajo la ventana y la cartela en
magenta como se pidió y la herramienta las midió: ventana al 7,9 % del
borde con el 84,5 % del ancho, cartela al 25,8 % con el 48,4 %. La bandeja
llegó llena y se destapa por CSS. Los yacimientos, los cuatro con el mismo
encuadre, que era lo difícil.

### Después de generar

Dejar los originales en **`src/piel/cuenca/`** con esos nombres. La
herramienta es `tools/cuenca.py`, hermana de `tools/mazos.py`: keyea el
magenta, escala, y mide la ventana y la cartela del marco del jefe.

## Los emblemas de las ligas

Cuatro medallones redondos para el panel del Duelo, uno por liga: Triásico,
Jurásico, Cretácico y Extinción. Se pintan a 44 px en el panel y a 96 en el
final de partida, así que la silueta tiene que leerse pequeña: un animal de
perfil, macizo, sin detalle fino.

**Lo que las distingue es el METAL, no el dibujo.** A 44 px la silueta apenas
se lee; el color sí. La piedra es la misma en las cuatro y el metal sube de
valor con la liga: cobre con pátina verde, latón, oro con un filete de laca
roja, y oro agrietado con luz saliendo de las grietas. La primera versión de
estos prompts los tenía todos en latón y sólo cambiaba el animal.

Mismo material que las placas del menú, el bloque de MATERIAL literal y
**magenta puro** fuera del medallón. Van a `src/piel/ligas/` —nunca a
`assets/`, que es lo servido— como `triasico.png` o `liga_triasico.png`, y
`python tools/ligas.py escribir` los keyea con la función de los marcos, los
recorta, los centra en un cuadrado y los sirve a 256 px.

- **`liga_triasico`.** [MATERIAL] Medallón redondo de roca oscura con filete
  de cobre viejo con pátina verdosa en los huecos, y en relieve del mismo
  cobre la silueta de perfil de un Plateosaurus a dos patas, cuello largo y
  cabeza pequeña, mirando a la izquierda. Un solo anillo. Fondo magenta puro.
- **`liga_jurasico`.** [MATERIAL] Medallón redondo de roca oscura con filete
  de latón viejo, y en relieve de latón la silueta de perfil de un Allosaurus
  en marcha, cola en alto, fauces entreabiertas, mirando a la izquierda. Dos
  anillos concéntricos. Fondo magenta puro.
- **`liga_cretacico`.** [MATERIAL] Medallón redondo de roca oscura con filete
  de oro bruñido y un filete fino de laca roja oscura por dentro del anillo, y
  en relieve de oro la silueta de perfil de un Tyrannosaurus con la cabeza
  baja y las fauces abiertas, mirando a la izquierda. Tres anillos
  concéntricos y una corona de púas cortas en el borde. Fondo magenta puro.
- **`liga_extincion`.** [MATERIAL] Medallón redondo de roca oscura agrietada,
  con luz dorada saliendo de las grietas desde el centro, y en el centro un
  asteroide en relieve de oro con estela hacia arriba a la derecha. El filete
  de oro del borde roto en dos puntos, como si el impacto lo hubiera partido.
  Fondo magenta puro.

Los tres animales son cartas del set y el generador puede recibir su
ilustración como referencia de anatomía, pero el medallón es una SILUETA en
relieve, no la ilustración recortada: a 44 px una ilustración es una mancha.

### Lo que llegó

Los cuatro el 13-09-2026, sobre magenta, con los metales de la segunda
versión. Tres a 1254×1254 y Jurásico a 1536×1024, apaisado con el medallón en
el centro: la herramienta lo cuadra recortando, no estirando. Llegaron a
`assets/piel/ligas/`, la carpeta servida, y se movieron a `src/piel/ligas/`:
un PNG de 2,5 MB en `assets/` se habría publicado tal cual.

## Las Expediciones: mapas, medallones de nodo y cartela

El solitario pasa a ser un mapa por formación geológica, con rivales en fila
que se abren al ganar. Hacen falta tres familias de piezas:

1. **Los mapas**, uno por formación. Fondo vertical sobre el que el juego
   dibuja el sendero y los nodos.
2. **Los medallones de nodo**, cuatro estados: bloqueado, abierto, vencido y
   rival de la semana. Llevan un hueco magenta donde el juego pinta el retrato
   del rival, que sale de la ilustración de su carta.
3. **La cartela del rival**, la ficha que se abre al tocar un nodo.

Todo va a `src/piel/expediciones/` con los nombres de cada bloque, nunca a
`assets/`. La herramienta los keyea, escala y sirve.

---

### 1 · Los mapas

Un solo prompt base y un hueco por formación. **Lo que NO hay que pedir: el
sendero, los nodos, los nombres ni ningún icono.** Eso lo dibuja el juego
encima, y un camino dibujado en la imagen nunca coincide con los nodos.

Formato: **vertical, 1024×1792**, el más alto que dan los generadores. El
juego lo desplaza de arriba abajo.

#### Bloque base (copiar literal)

> Mapa ilustrado de una región prehistórica visto desde arriba en perspectiva
> cenital ligeramente inclinada, estilo de mapa de expedición pintado a mano
> sobre pergamino oscuro envejecido, con acuarela terrosa y tinta sepia.
> Paleta apagada: verdes oliva, ocres, arena, sepia y toques de azul pizarra en
> el agua. Bordes del pergamino oscurecidos y quemados, viñeta suave. Relieve
> sugerido con sombreado de tinta. Composición vertical 9:16, el paisaje
> recorre la imagen de arriba abajo como un viaje. Sin texto, sin letras, sin
> números, sin rosa de los vientos, sin leyenda, sin marco decorativo, sin
> caminos ni senderos marcados, sin iconos, sin personas, sin animales. Zonas
> amplias y tranquilas repartidas en zigzag por toda la altura, donde se
> puedan poner marcadores encima sin tapar detalle importante.

#### Los cuatro huecos

- **`mapa_morrison.png` — Formación Morrison, Jurásico Superior.** Arriba,
  tierras altas con coníferas y araucarias; en el centro, un río trenzado ancho
  con barras de arena que baja serpenteando; a los lados, llanuras de
  inundación con helechos y lagos someros alcalinos de orillas blancas; abajo,
  badlands de estratos rojos, morados y grises con una cantera de huesos
  insinuada.
- **`mapa_hell_creek.png` — Hell Creek, Cretácico final.** Arriba, bosque
  húmedo subtropical denso con palmeras y magnolios; en el centro, un delta
  con canales y marismas; abajo, costa de un mar interior somero; en la
  esquina inferior, un cielo que empieza a enrojecer como presagio del impacto.
  *(Aquí sí hay plantas con flor: el Cretácico final ya las tenía.)*
- **`mapa_tendaguru.png` — Tendaguru, Jurásico Superior de África.** Arriba,
  meseta seca con coníferas dispersas; en el centro, lagunas costeras y
  llanuras de marea; abajo, la costa de un mar cálido con arrecifes de coral
  lejanos, arena clara.
- **`mapa_kem_kem.png` — Kem Kem, Cretácico medio del norte de África.**
  Arriba, desierto de dunas; en el centro, un sistema fluvial enorme con brazos
  anchos y manglares; abajo, estuario lodoso que se abre al mar. Agua marrón,
  mucha vida de río sugerida por la vegetación de las orillas.

---

### 2 · Los medallones de nodo

Mismo material que las placas del menú, con el bloque de MATERIAL literal y
**magenta puro** fuera de la pieza **y dentro del hueco del retrato**. El juego
pinta la ilustración de la carta del rival recortada en ese hueco.

Formato: **1024×1024**, el medallón ocupando el 85 % y centrado. Se sirven a
192 px y se ven a unos 76.

#### El bloque de MATERIAL (copiar literal)

> Pieza de interfaz de videojuego, vista de frente, sin perspectiva. Roca
> oscura pulida con vetas minerales y filete de latón viejo con el canto
> biselado, iluminación lateral suave que marque el relieve, sin brillos
> especulares fuertes. Paleta: negro, gris piedra, latón #d9a441 y oro viejo.
> Sin texto, sin letras, sin números, sin marca de agua. Fondo magenta puro
> #FF00FF fuera de la pieza, sin sombra proyectada.

#### Los cuatro estados

- **`nodo_bloqueado.png`.** [MATERIAL] Medallón redondo de roca oscura con
  filete de hierro oxidado apagado, sin brillo. El centro es un círculo hueco
  **relleno de magenta puro** que ocupa el 70 % del diámetro. Encima del hueco,
  cruzándolo, dos cadenas de hierro en aspa con un candado pequeño en el
  cruce. Aspecto frío y cerrado.
- **`nodo_abierto.png`.** [MATERIAL] Medallón redondo de roca oscura con doble
  filete de latón pulido y un halo dorado suave que lo rodea como si
  brillara. El centro es un círculo hueco **relleno de magenta puro** que ocupa
  el 70 % del diámetro, sin nada encima. Cuatro remaches de latón en los
  puntos cardinales.
- **`nodo_vencido.png`.** [MATERIAL] Medallón redondo de roca oscura con
  filete de oro viejo. El centro es un círculo hueco **relleno de magenta
  puro** que ocupa el 70 % del diámetro. Abajo a la derecha, sobre el borde,
  un sello de lacre rojo oscuro con una huella de dinosaurio de tres dedos
  grabada, montando entre el filete y el hueco sin taparlo más de un cuarto.
- **`nodo_semana.png`.** [MATERIAL] Medallón redondo de roca oscura con
  filete de oro con laca roja, más grande y ornamentado que los otros, y una
  corona de doce púas cortas de latón en el borde. El centro es un círculo
  hueco **relleno de magenta puro** que ocupa el 70 % del diámetro. Arriba,
  sobre el filete, un pequeño reloj de arena de latón.

---

### 3 · La cartela del rival

La ficha que se abre al tocar un nodo: retrato arriba, nombre, frase y el
botón de jugar. El juego escribe todo el texto; la cartela es el marco.

Formato: **1024×1536**, vertical. Se sirve a 768.

- **`cartela_rival.png`.** [MATERIAL] Cartela vertical de proporción 2:3 de
  roca oscura con filete de latón viejo y esquinas reforzadas con cantoneras
  de latón. En el tercio superior, una ventana redonda grande **rellena de
  magenta puro** con un anillo de latón alrededor, para el retrato. Debajo, una
  banda horizontal lisa de latón oscuro para el nombre, **sin grabado**. El
  resto de la cartela, liso y oscuro, para texto. Sin ningún adorno en las
  zonas lisas.

---

### Después de generar

- Todo a `src/piel/expediciones/` con esos nombres.
- `python tools/expediciones.py escribir` los deja en `assets/piel/expediciones/`.
- Los mapas no se keyean: son un fondo a sangre y sólo se escalan.
- Mientras no lleguen, el juego pinta el mapa con un degradado oscuro y los
  nodos con CSS, así que se puede jugar desde el primer día.

### Lo que llegó

Las nueve piezas el 14-09-2026, a `assets/piel/expediciones/` —la carpeta
servida— y se movieron a `src/piel/expediciones/`. Los mapas a 941×1672, los
nodos a 1254×1254 y la cartela a 1024×1536, que recortada queda a 768×1282 y
no a 2:3. El nodo abierto trajo el halo dorado convertido en un aro rosa opaco,
que la herramienta quita y el CSS sustituye; si se regenera, pedirlo **sin
halo ni brillo alrededor**.

## El final de la partida

Al acabar una partida, el juego cambiaba de pantalla en el acto y enseñaba
tres cajas de texto. Ahora un **estandarte** con VICTORIA o DERROTA cae sobre
el tablero congelado, y la pantalla de fin es un **cara a cara**: una cinta
por bando con su nombre y el emblema de su mazo, un medallón con el VS en
medio, las cifras en rombos de latón, un sello sobre el mazo que ganó y el
del que perdió rasgado.

Son **siete piezas y un fondo**. El juego escribe todo el texto —VICTORIA,
DERROTA, VS, los nombres y los números—, así que ninguna pieza lleva letras.

### El bloque de MATERIAL (copiar literal)

El de los mazos. Adjuntar `boton_ancho.png` o `placa_de_mazo.png` como
referencia y pedir «mismo material, misma luz».

> Pieza de interfaz de videojuego, vista de frente, sin perspectiva. Roca
> oscura pulida con vetas minerales y filete de latón viejo con el canto
> biselado, iluminación lateral suave que marque el relieve, sin brillos
> especulares fuertes. Paleta: negro, gris piedra, latón `#d9a441` y oro
> viejo. Sin texto, sin letras, sin números, sin marca de agua. Fondo
> **magenta puro `#FF00FF`** fuera de la pieza, sin sombra proyectada.

### 1 · El estandarte

Lo que cae sobre el tablero. El juego escribe VICTORIA o DERROTA en el
centro de la tela con la letra del juego, así que **la tela tiene que ser
lisa** en su franja central. Sirve para las dos cosas: lo que cambia entre
ganar y perder es el sello de encima.

Formato: **1536×512**, apaisado 3:1. Se sirve a 1040.

- **`estandarte.png`.** [MATERIAL] Estandarte horizontal de proporción 3:1.
  Arriba, de lado a lado, una barra de latón viejo con un remate en forma de
  punta de lanza en cada extremo. Colgando de la barra, una tela ancha de
  cuero curtido marrón oscuro, gastada, con el borde cosido con hilo de latón
  y pequeñas tachuelas de latón a lo largo del canto superior. El borde de
  abajo de la tela cortado en una V poco profunda. Dos borlas de cordón de
  latón colgando a los lados. **La franja central de la tela, lisa, sin
  ningún dibujo, emblema ni costura**, para escribir una palabra encima. Nada
  en el centro de la barra: ahí se pone otra pieza.

### 2 · Los dos sellos

El que corona el estandarte y, en la pantalla de fin, se posa sobre el mazo
que ganó. Es el equivalente de la corona. Se genera primero el de victoria y
**el de derrota a partir de él**, con esa imagen adjunta y la rotura como
único cambio.

Formato: **1024×1024** los dos. Se sirven a 384.

- **`sello_victoria.png`.** [MATERIAL] Emblema de trofeo, vista frontal: una
  corona abierta de cinco dientes de dinosaurio terópodo fosilizados, curvos
  y aserrados, engastados en un aro de oro viejo con el canto biselado. En el
  centro del aro, un cabujón grande de ámbar rojo anaranjado pulido, con un
  brillo interior cálido. Simétrico, compacto, reconocible a tamaño de icono.
  Nada fuera de la pieza.
- **`sello_derrota.png`.** El mismo emblema de la imagen adjunta, **idéntico
  en forma, tamaño y posición**, pero partido por una grieta diagonal que lo
  cruza entero, con un diente roto y caído, el oro ennegrecido y sin brillo y
  el ámbar opaco y apagado, sin luz interior. Mismo fondo magenta.

### 3 · El rombo de las cifras

Cada cifra del marcador —trofeos y hábitat de cada bando— va dentro de uno.
El juego escribe el número encima, y resalta con luz el del bando que va por
delante.

Formato: **512×512**. Se sirve a 128 y se ve a 40 px.

- **`rombo.png`.** [MATERIAL] Placa en forma de rombo, un cuadrado girado 45
  grados, con un filete grueso de latón viejo biselado. El interior, roca
  oscura casi negra, **completamente liso y plano**, para escribir un número
  de dos cifras. Formas gruesas, que se lean a 40 px. Nada fuera del rombo.

### 4 · El medallón del VS

Entre las dos cintas. El juego escribe «VS» en el centro.

Formato: **512×512**. Se sirve a 160 y se ve a 44 px.

- **`medallon_vs.png`.** [MATERIAL] Medallón circular pequeño de latón viejo
  con el borde biselado, y detrás de él, asomando en diagonal por arriba y
  por abajo, dos garras fósiles de terópodo cruzadas en aspa. El centro del
  medallón, un disco de roca oscura **liso, sin ningún grabado**. Nada fuera
  de la pieza.

### 5 · Las dos cintas de bando

Una por jugador, con su nombre y el emblema de su mazo encima. La tuya va a
la izquierda y apunta hacia fuera; la del rival, a la derecha. Se piden en la
misma conversación: **misma forma, espejada, y sólo cambia el color del
cuero**.

Formato: **1536×384**, apaisado 4:1. Se sirven a 480.

- **`cinta_propia.png`.** [MATERIAL] Banderola horizontal de proporción 4:1
  de cuero teñido color ocre dorado oscuro, con el borde de arriba y el de
  abajo ribeteados de latón. El extremo **izquierdo** acaba en punta de cola
  de golondrina; el extremo derecho, cortado recto. La superficie lisa, sin
  dibujos, para escribir un nombre.
- **`cinta_rival.png`.** La misma banderola de la imagen adjunta, **espejada**:
  la cola de golondrina en el extremo **derecho** y el corte recto a la
  izquierda. El cuero teñido de **rojo óxido oscuro**, color sangre seca.
  Todo lo demás, idéntico.

### 6 · El fondo de la pantalla de fin

Detrás del marcador, oscurecido por CSS: sólo tiene que dar ambiente y dejar
leer el centro.

> [ESTILO de las ilustraciones, el bloque de PROMPTS.md] Una pared de roca
> sedimentaria oscura en un yacimiento, de noche, con un cráneo enorme de
> Allosaurus fosilizado incrustado en la roca, visto de frente y centrado,
> medio excavado, las cuencas de los ojos en sombra. Luz tenue y cálida de
> candil desde abajo, polvo en el aire, tonos negros, marrones y ámbar.
> Composición vertical 9:16, el centro de la imagen poco contrastado. Sin
> personas, sin herramientas en primer plano, sin texto.

Exportar a lo más vertical que dé el generador y recortar a 9:16.

---

### Después de generar

- Todo a `src/piel/fin/` con esos nombres, en PNG.
- `python tools/fin.py escribir` los deja en `assets/piel/fin/` e imprime la
  proporción de cada pieza recortada.
- Cuando estén las ocho, `npm test` pide poner `ARTE_LISTO = true` en
  `src/ui/fin.js`: es lo que cambia el CSS de las formas dibujadas a los WebP.
  Y subir `VERSION` en `sw.js`.
- Mientras no lleguen, el final se pinta entero con CSS —el estandarte con un
  degradado, el sello con el icono de trofeo, los rombos con un borde—, así
  que se juega desde el primer día.

### Lo que llegó

Las ocho el 14-09-2026, en magenta limpio y sin letras. Las apaisadas vinieron a
2172×724 y las cuadradas a 1254×1254; recortadas, el estandarte queda a 3,43:1 y
las cintas a 3,6:1. El estandarte trae la barra más alta de lo pedido —ocupa el
quinto de arriba—, así que la palabra lleva relleno encima para caer en la tela.
El cráneo del fondo salió de perfil y no de frente, y sirve igual: queda
detrás del marcador con el velo del CSS.

### Lo que NO se pide

- El mazo rasgado: es `dorso.webp` cortado en zigzag por CSS, como el sobre.
- Los emblemas de las cintas: son los siete de clado que ya existen.
- Ninguna palabra ni número: los escribe el juego.

## La presentación de la partida

Antes de cada partida la pantalla se parte en diagonal: el rival arriba y tú
abajo, cada uno con su estandarte colgando, el emblema del clado de su mazo
encima, la criatura que lo encabeza de fondo y su nombre. Casi todo ya existe:
los emblemas de clado, las ilustraciones y el medallón del VS del final.
Faltan **dos piezas**: los estandartes.

### El bloque de MATERIAL (copiar literal)

El de cuero, el mismo que se usó para el estandarte y las cintas del final.
Adjuntar `cinta_propia.png` como referencia de color y de latón.

> Pieza de interfaz de videojuego, vista de frente, sin perspectiva. Cuero
> curtido oscuro y latón viejo con el canto biselado, iluminación lateral
> suave que marque el relieve, sin brillos especulares fuertes. Paleta:
> negro, marrón oscuro, latón `#d9a441` y oro viejo. Sin texto, sin letras,
> sin números, sin marca de agua. Fondo **magenta puro `#FF00FF`** fuera de
> la pieza, sin sombra proyectada.

### 1 · Los dos estandartes verticales

Uno por bando. El juego pone encima, a un tercio del alto, el medallón del
clado del mazo, así que **esa zona va lisa**. Se genera el propio y el rival
**a partir de él**, con la imagen adjunta y el color como único cambio.

Formato: **1024×1536**, vertical. Se sirven a 360.

- **`estandarte_propio.png`.** [MATERIAL] Estandarte vertical colgante, alto
  y estrecho, de proporción 1:2,5, centrado en el lienzo. Arriba, una barra
  horizontal corta de latón viejo con un remate en forma de punta de lanza en
  cada extremo, un poco más ancha que la tela. Colgando de ella, una tela de
  cuero teñido color ocre dorado oscuro, con el borde ribeteado de latón en
  los dos lados y abajo, y el extremo de abajo cortado en cola de golondrina.
  **Toda la tela lisa, sin ningún emblema, dibujo ni costura en el centro.**
  Nada fuera del estandarte.
- **`estandarte_rival.png`.** El mismo estandarte de la imagen adjunta,
  **idéntico en forma, tamaño y posición**, con el cuero teñido de **rojo
  óxido oscuro**, color sangre seca. Todo lo demás, igual. Mismo fondo magenta.

### Después de generar

- Los dos a `src/piel/vs/` con esos nombres.
- `python tools/presentacion.py escribir` los deja en `assets/piel/vs/` e
  imprime el `aspect-ratio` que tiene que llevar `.pres-estandarte`.
- `npm test` pide entonces poner `ARTE_LISTO = true` en
  `src/ui/presentacion.js`. Mientras no lleguen, los estandartes se pintan
  con CSS.

### Lo que llegó

Los dos el 14-09-2026, a 793×1983 y en magenta limpio. Recortados quedan a
787×1919 (1:2,44). La barra de arriba es más ancha que la tela, que ocupa el
56 % central del ancho: por eso el emblema del clado va más estrecho que en la
piel de CSS.

### Lo que NO se pide

- El VS: reutiliza `medallon_vs` del final.
- Los emblemas de clado ni los retratos: ya existen.
- Ningún texto: los nombres, el modo y el objetivo los escribe el juego.

## La tienda

La tienda vende cosméticos con dinomonedas y nada que dé ventaja. La primera
tanda son **dos dorsos de carta** y **la sexta placa del menú**. Hasta que
lleguen, los dorsos se ven como el clásico tintado y la placa se dibuja con CSS.

### 1 · La placa de la tienda

La sexta del menú, junto a Colección, Sobres, Mazos, La Tribu y Cuenta. Tiene
que parecer de la misma familia: **adjuntar `placa_sobres.png` y
`placa_mazos.png`** (en `assets/piel/tablero_componentes/`) y pedir «misma forma,
mismo material, misma luz; sólo cambia el emblema».

Formato: **1122×1402**, vertical, como las otras cinco. Se sirve a 256.

- **`placa_tienda.png`.** Placa vertical de piedra oscura pulida con filete de
  latón viejo biselado, idéntica en forma, proporción y marco a las placas
  adjuntas. En el centro, en relieve de latón y oro viejo, una bolsa de cuero
  de mercader atada con cordón, con tres monedas de latón con forma de rombo
  asomando por la boca. Silueta maciza, reconocible a 60 píxeles. Sin texto,
  sin letras, sin marca de agua. Fondo **magenta puro `#FF00FF`** fuera de la
  placa, sin sombra proyectada.

### 2 · Los dos dorsos

El reverso de la carta: se ve al abrir sobres, en las cartas que robas y en tu
mazo del marcador final. **Adjuntar el dorso de ahora**, cuyo original es
`assets/piel/tablero_componentes/dorso_carta.png` (se sirve como
`assets/piel/dorso.webp`), como referencia de forma: mismo formato de carta y
mismo tipo de marco, distinto material y distinto emblema.

Formato: **1024×1400**, vertical, **a sangre**: el reverso ocupa la imagen
entera, sin magenta y sin fondo alrededor. Se sirven a 512.

- **`dorso_ambar.png`.** Reverso de carta coleccionable de fantasía, vista
  frontal y plana, sin perspectiva, ocupando la imagen entera. Un marco de latón
  viejo biselado alrededor, con remaches en las esquinas. El interior, una
  plancha de ámbar translúcido pulido color miel y naranja con luz cálida
  atravesándolo, y dentro del ámbar, en el centro, un insecto fósil pequeño
  —una libélula con las alas abiertas— atrapado, nítido. Simétrico. Sin texto,
  sin letras, sin marca de agua.
- **`dorso_obsidiana.png`.** El mismo reverso de la imagen adjunta, idéntico en
  forma, marco y proporción, con el interior de **obsidiana negra pulida como un
  espejo** con reflejos fríos grisáceos, y en el centro una garra de terópodo
  grabada en la piedra con un filete fino de plata. Sin texto, sin letras, sin
  marca de agua.

### Después de generar

- Los tres a `src/piel/tienda/` con esos nombres, en PNG.
- `python tools/tienda.py escribir` deja la placa en `assets/piel/placa_tienda.webp`
  y los dorsos en `assets/piel/tienda/`.
- `npm test` pide entonces poner `ARTE_LISTO = true` en `src/ui/tienda.js`. Y hay
  que declarar `--placa` en `.placa-tienda` de `style.css`, quitando su dibujo de
  CSS, y subir `VERSION` en `sw.js`.

## Los tapetes y las colecciones

Un tapete cambia el fondo del tablero durante la partida. Hoy ese fondo son dos
capas: **`piedra.webp`**, una losa de 512×512 que se repite en mosaico (roca
agrietada casi negra, luminancia media 35 sobre 255), y **`simbolo_huella.webp`**,
el medallón de latón con la huella tridáctila en el centro. Encima van un velo
oscuro, las ranuras, las cartas y las capas del clima.

Cada tapete son **dos piezas**: una **textura** que se repite y un **medallón**
central. Nada de escenas a sangre: debajo de las cartas estorban y se recortan
distinto en cada pantalla.

**La condición que manda:** la textura tiene que ser **muy oscura y de poco
contraste**. Es un fondo; si tiene mucho dibujo, las cartas y las ranuras dejan
de leerse. La herramienta la oscurecerá a la luminancia de la piedra de ahora,
pero cuanto más oscura llegue, mejor sale.

**Colecciones:** Ámbar y Obsidiana hacen juego con los dorsos del mismo nombre y
se pueden vender sueltos o como conjunto. El resto de tapetes van sueltos por
ahora; cada yacimiento podría tener luego su dorso y completar su colección.

### El bloque de ESTILO de la textura (copiar literal)

> Textura de fondo para el tablero de un juego de cartas, vista cenital
> perfectamente plana, sin perspectiva y sin sombras direccionales, iluminación
> uniforme y tenue. Mosaico sin costuras: el borde izquierdo continúa en el
> derecho y el superior en el inferior. Muy oscura y de poco contraste, casi
> negra, con el detalle sutil, para que encima se lean cartas. Sin objetos
> grandes y sin nada que destaque en un punto concreto. Sin texto, sin marca de
> agua. Cuadrada, 1024×1024.

Adjuntar la textura de ahora como referencia de oscuridad. Su original no está
en el proyecto: sólo existe la servida, `assets/piel/piedra.webp`. Hay una copia
en PNG en `src/piel/tienda/referencias/piedra.png` (fuera del repositorio, como
los demás originales); si falta, se saca del WebP.

### El bloque del MEDALLÓN (copiar literal)

Adjuntar el medallón de ahora, `assets/piel/tablero_componentes/simbolo_huella.png`
(copiado también en `src/piel/tienda/referencias/`), y pedir sólo el cambio del
centro:

> El mismo medallón de la imagen adjunta, idéntico en forma, tamaño y posición:
> el mismo aro doble de latón viejo, las ocho puntas y las gemas encendidas.
> Sólo cambia el disco central, que ahora muestra {CENTRO}, en relieve y con la
> misma luz. Fondo **magenta puro `#FF00FF`** fuera del medallón, sin sombra
> proyectada. Sin texto, sin letras, sin marca de agua. Cuadrado, 1024×1024.

### Los ocho tapetes

| fichero | textura: [ESTILO] + | medallón: {CENTRO} |
|---|---|---|
| `tapete_ambar` / `medallon_ambar` | Resina de ámbar muy oscura, casi marrón negro, translúcida, con burbujas diminutas y alguna partícula de insecto apenas visible. | una plancha de ámbar color miel pulido con una libélula fósil atrapada dentro, con las alas abiertas; las gemas del aro en ámbar |
| `tapete_obsidiana` / `medallon_obsidiana` | Obsidiana negra con reflejos gris azulado muy tenues y fracturas concoideas suaves. | obsidiana negra pulida con una garra de terópodo grabada con un filete fino de plata; las gemas del aro en blanco frío |
| `tapete_morrison` / `medallon_morrison` | Arenisca parda muy oscura con ondulaciones de corriente de río fosilizadas, suaves y paralelas. | la huella fosilizada de una pata de saurópodo, redonda y con cinco dedos cortos, hundida en arenisca |
| `tapete_hell_creek` / `medallon_hell_creek` | Lutita gris muy oscura, casi negra, con láminas finas horizontales de estratos y algún fragmento diminuto de hueso fósil. | un cráneo de Tyrannosaurus rex de perfil, en relieve sobre piedra |
| `tapete_kem_kem` / `medallon_kem_kem` | Arenisca rojiza muy oscura, color óxido apagado casi negro, de grano grueso. | un diente cónico de Spinosaurus con estrías longitudinales |
| `tapete_solnhofen` / `medallon_solnhofen` | Caliza de grano finísimo, gris pardo muy oscuro, lisa, con dendritas de manganeso finas como helechos. | la impresión fosilizada de un Archaeopteryx con las alas extendidas en caliza |
| `tapete_excavacion` / `medallon_excavacion` | Tierra compactada marrón muy oscura vista desde arriba, con una cuadrícula de excavación de cuerdas finas tensadas: 4×4 cuadrados alineados con los bordes para que la cuadrícula continúe al repetir, y una estaca pequeña en cada cruce. | un pincel y una piqueta de paleontólogo cruzados sobre un hueso fósil |
| `tapete_volcan` / `medallon_volcan` | Basalto negro con grietas finas de un rojo brasa muy apagado. | un huevo fósil de dinosaurio agrietado; las gemas del aro en rojo brasa |

### Qué comprobar al generar

- **La textura encogida a 170 px y repetida 3×3**, que es como se ve en el
  tablero: si se nota la costura o un motivo repetido, se regenera o se deja a
  la herramienta, que cierra costuras como hizo con la lluvia y la niebla.
- **Oscuridad:** puesta al lado de `referencias/piedra.png`, no debería verse más clara.
- **El medallón**, comparado con `referencias/simbolo_huella.png`: mismo aro, mismas puntas y
  mismo tamaño. Si el generador cambia el aro, se nota en cuanto se cambia de
  tapete.

### Después de generar

- Todo a `src/piel/tienda/` con esos nombres, en PNG.
- `python tools/tienda.py escribir` los procesa: la textura se hace cuadrada y
  se oscurece a la luminancia de la piedra si llega más clara, y el medallón,
  el estandarte y la cinta se keyean. Cada artículo nuevo va además en
  `src/data/cosmeticos.js`, y `node tools/generar-cartas.mjs` lo lleva al SQL.

### Lo que llegó

El 14-09-2026, cuatro tapetes completos (ámbar, obsidiana, Morrison y volcán,
cada uno con su medallón) y cuatro estandartes (ámbar, obsidiana, fósil y
volcán). Sólo ámbar y obsidiana trajeron cinta: los estandartes de fósil y
volcán usan la cinta de siempre en el marcador hasta que llegue la suya. Dos
nombres llegaron cambiados y se renombraron en `src/piel/tienda/`:
`estandare_fosil.png` y `etiqueta_*.png` (las cintas). Los tapetes llegaron ya
más oscuros que la piedra (16 a 33 de luminancia) y no hubo que oscurecerlos.
El estandarte de volcán llegó más ancho (0,449 contra 0,410) y se estrecha un
9 % al pintarse.

Después, ese mismo día: los cuatro tapetes que faltaban (Hell Creek, Kem Kem,
Solnhofen y excavación) **sin medallón**, que de momento llevan la huella de
siempre; cuatro dorsos por yacimiento (Morrison, Hell Creek, Kem Kem y volcán);
las cintas de fósil y volcán, y una de helecho **sin estandarte** que la lleve,
que se queda fuera hasta que llegue `estandarte_helecho`. Llegaron también
cinco retratos con su aro (`marco_retrato`) y la lámina `holografico`. Los
marcos de carta alternativos se descartaron: no se veían bien.

Y al final del día llegaron los cuatro medallones que faltaban (el de
excavación como `medallon_excavasion.png`, renombrado), el `estandarte_helecho`
que estrena la cinta de helecho, y cuatro retratos más: el científico, la
científica, el cazador de fósiles y el T. rex. Con eso los ocho tapetes están
completos.

## Las recompensas exclusivas

No se venden: los da un logro (src/data/logros.js). Mismos formatos y mismas
referencias que sus hermanos de la tienda.

- **`retrato_saurophaganax.png`** y **`retrato_barosaurus.png`** — 1254×1254 a
  sangre, con `retrato_trex.png` de referencia de estilo: el jefe en plano de
  cabeza y hombros mirando al espectador, al ocaso, con la cabeza entera y
  aire alrededor porque se recorta en círculo. Se ganan con la primera carta de
  cada jefe.
- **`dorso_cazador.png`** — 1024×1400 a sangre, con el dorso de siempre de
  referencia de forma: cuero negro con marcas de garra y un colmillo de
  terópodo engastado en oro colgando de una tira. Se gana con las dos cartas
  de jefe.
- **`estandarte_campeon.png`** y **`cinta_campeon.png`** — el estandarte y la
  banderola de siempre en azul noche con ribete de oro trenzado, fondo magenta.
  Se ganan con 50 duelos.

Llegaron las cinco el 15-09-2026. El estandarte vino a 0,454 de proporción y
se estrecha un 10 % al pintarse.

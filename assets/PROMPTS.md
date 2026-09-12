# Plantillas de prompt para las ilustraciones

Cómo pedirle a un generador de imágenes una carta de DinoWar sin rediseñar el
estilo cada vez. Complementa a [LEEME.md](LEEME.md), que dice los tamaños; esto
dice qué escribir.

La idea es una sola: **el prompt son dos bloques fijos y un hueco**. El bloque de
ESTILO y el de PROHIBICIONES se copian literales, carácter por carácter, en cada
carta. Lo único que cambia es el SUJETO. La consistencia entre 68 ilustraciones
no sale de describir bien el estilo cada vez: sale de no reescribirlo nunca.

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

Faltan las cinco del clima: `lluvia`, `llovizna`, `bruma`, `agua` y `calima`.

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

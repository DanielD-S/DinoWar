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

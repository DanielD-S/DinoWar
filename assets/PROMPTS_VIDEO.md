# Plantillas de prompt para los vídeos de las legendarias

Cómo pedirle a un generador de vídeo el plano corto que se enseña en la
apertura del sobre antes de voltear una legendaria. Hermano de
[PROMPTS.md](PROMPTS.md) y de [PROMPTS_SONIDO.md](PROMPTS_SONIDO.md): un bloque
de estilo que se copia literal y un hueco con el animal.

Es **imagen a vídeo con fotograma inicial y final**. El primer fotograma es la
ilustración de la carta, sacada de `assets/dinos/`; el último, el mismo animal
llenando el encuadre hacia la cámara, generado con el generador de imágenes
usando la ilustración como referencia. El generador inventa lo de en medio.

## Lo que tiene que cumplir el vídeo para encajar en el juego

- **Termina con el animal llenando el cuadro.** La carta se pinta sobre el
  último fotograma. Un final con el animal a lo lejos deja la carta sobre un
  paisaje vacío.
- **Plano continuo, sin cortes ni cambios de ángulo.** Multi-shot apagado.
- **Sin audio.** El juego pone su música; la herramienta quita la pista igual.
- **Apaisado 3:2 o 16:9**, como la ilustración. Nunca vertical: las referencias
  son apaisadas y las deforma.
- **5 a 10 s.** Más de diez, la herramienta corta por el principio.
- **La marca de agua la quita la herramienta.** Todos salen con «KlingAI 3.0»
  abajo a la derecha; `tools/videos.py` la borra con el filtro `delogo`,
  rellenando el rectángulo con lo de alrededor. Está medida sobre estos
  nueve: si el generador la mueve o la agranda, hay que volver a medirla
  (`MARCA` en la herramienta).

## Dónde va

Original a `src/video/<id>.mp4` con el `id` de la carta (`mosasaurus`,
`spinosaurus`, `antarctosaurus`…). `python tools/videos.py escribir` lo sirve
en `assets/video/`. La apertura del sobre lo busca por el id y no hay lista:
una legendaria sin vídeo sale sin vídeo. La herramienta pasa el nombre a
minúsculas y avisa si no coincide con ninguna carta, que `Tyrannotitan.mp4`,
`maiasaurua.mp4` y `tyranosaurus.mp4` —una «n»— no fallan, sólo no salen nunca.

## Bloque de ESTILO (copiar literal, al final del sujeto)

> Camera holds steady at a low angle, slight push-in, shallow depth of field.
> Warm muted palette, fine particles drifting in the light. Photorealistic
> natural history documentary, cinematic 3D render, single continuous shot.

## Prompt negativo (si el generador tiene campo)

> text, watermark, logo, subtitles, people, boat, cuts, camera shake,
> morphing, deformed anatomy, extra limbs, extra fins, blurry

Añadir a cada animal lo que lo separa de su pariente moderno: es donde el
generador se equivoca. Sin nombre y sin anatomía, «giant marine reptile» se
vuelve tiburón a mitad de plano.

## Sujetos

**Mosasaurus hoffmannii** (`mosasaurus`), hecho con Kling 3.0, 5 s, Native
Audio y Multi-Shot apagados, «Bind elements» con el animal del primer
fotograma:

> A Mosasaurus hoffmannii, a giant marine lizard with a long crocodile-like
> head, conical teeth, four paddle-shaped flippers and a shark-like tail
> fluke, glides slowly through deep blue open water. It turns toward the
> camera, accelerates with two powerful strokes of its tail, and opens its
> jaws wide right in front of the lens in the final second, teeth and pale
> throat filling the frame. Sunlight rippling through the water, small fish
> scattering.

Negativo añadido: `shark, dorsal fin, gills, whale`.

**Tyrannosaurus rex** (`tyrannosaurus`), Kling 3.0, 10 s, mismos ajustes,
primer fotograma la ilustración con el animal cargando:

> A Tyrannosaurus rex, a massive bipedal predator with a deep, broad,
> box-shaped skull, thick neck, tiny two-fingered arms held close to the
> chest, heavy muscular legs and a long tail held level for balance, charges
> straight at the camera across a dusty floodplain at sunset, jaws wide open,
> kicking up clouds of dust with each stride. Two duck-billed hadrosaurs with
> backswept head crests flee in the background, out of focus. In the final
> second the head lunges forward and fills the entire frame, teeth and pale
> gums right in front of the lens.

Negativo añadido: `three-fingered hands, long arms, feathers, sail, animal
shrinking or walking away`. Lo que más falla con el T. rex son los brazos.

**Brachiosaurus altithorax** (`brachiosaurus`), Kling 3.0, 10 s. Un saurópodo
no carga contra la cámara: lo que llena el cuadro es la cabeza bajando a mirar
la lente.

> A Brachiosaurus altithorax, a colossal sauropod with front legs longer than
> its hind legs, a steeply sloping back, a very long neck held high and
> upright like a giraffe, a small boxy head with a raised bony crest over the
> nostrils, and a tail shorter than its neck, stands among tall conifers at
> sunset browsing the treetops. It pulls a mouthful of foliage from the
> canopy, then slowly swings its neck down and forward toward the camera in
> one continuous arc, until in the final second the head fills the entire
> frame, one eye and the textured skin of the snout right in front of the
> lens, a few needles still hanging from its jaws. Small crested hadrosaurs
> graze at its feet, out of focus.

Negativo añadido: `extra necks, horizontal neck, whip tail, rearing on hind
legs, running, animal walking away`. Con cuello horizontal y cola de látigo
sale un Diplodocus; levantarse sobre dos patas es cosa de las películas.

**Ankylosaurus magniventris** (`ankylosaurus`), Kling 3.0, 10 s. La
ilustración ya trae el mazazo al depredador; el vídeo lo termina y trae la
cabeza acorazada a la lente.

> An Ankylosaurus magniventris, a massive low-slung armored dinosaur, wide
> and flat like a living tank, its back covered in rows of bony plates and
> short blunt spikes, a broad triangular head with four small horns at the
> back corners and a beak, short sturdy legs, and a stiff tail ending in a
> heavy round club of fused bone, swings its tail club sideways with
> tremendous force at a large predatory theropod behind it, sending dirt and
> rocks flying and knocking the attacker back into the dust. Then it turns
> and lumbers straight toward the camera, and in the final second its horned,
> armored head fills the entire frame, one eye and the pebbled scales of the
> snout right in front of the lens.

Negativo añadido: `extra tails, tall spikes, long neck, standing on hind
legs, jumping, running fast, animal walking away`. Con pinchos largos y sin
maza sale un Nodosaurus, y la maza es UNA masa redonda de hueso, no púas.

Para las demás legendarias con criatura, la anatomía que hay que nombrar:

| carta | lo que lo separa de lo parecido |
|---|---|
| *Spinosaurus* | vela alta en el lomo, hocico largo de cocodrilo, brazos con garras, cola alta y plana; no es un T. rex con vela |
| *Tyrannotitan* | cabeza alargada y baja, brazos cortos con tres dedos, sin vela; no tiene la cabeza cuadrada del T. rex |
| *Antarctosaurus* | cuello y cola larguísimos, camina siempre a cuatro patas, no se levanta sobre dos, cabeza diminuta |
| *Maiasaura* | pico de pato ancho, sin cresta grande, camina a dos o a cuatro patas; suele ir con crías y nidos |
| *Edmontosaurus* | pico de pato, sin cresta, más robusto que Maiasaura, en manada |

Las legendarias de soporte —los tres climas, Crecimiento acelerado, Mortandad
estacional, Carroña abundante— no llevan vídeo: no hay animal que enseñar.

# Las cinemáticas de expedición

Dos por formación —una al ENTRAR la primera vez y otra al TERMINARLA— y ninguna
más. No una por nodo: un nodo se rejuega y un vídeo que se ve ocho veces se
salta desde la segunda. Salen por la MISMA capa que los vídeos de las
legendarias (`mostrarVideo()` en `apertura.js`), así que todo lo de arriba vale;
lo que cambia es el encuadre y por qué.

## Lo que cambia respecto a un vídeo de carta

- **No termina con un animal llenando el cuadro.** En un sobre, el último
  fotograma es el lienzo sobre el que se pinta la carta. Aquí no se pinta nada
  encima: el vídeo se queda quieto en su último fotograma esperando el toque, así
  que **el último fotograma es la postal** — lo que el jugador se queda mirando.
  Tiene que aguantar la vista tres o cuatro segundos.
- **El sujeto es el PAISAJE, no un animal.** Los animales dan escala y no son el
  tema. Por eso el bloque de estilo es otro: la cámara va más alta, más lejos y
  más lenta, y no hay `push-in` agresivo ni profundidad de campo corta.
- **Apaisado 16:9 y de 6 a 10 s.** En vertical el juego lo enseña como banda con
  el fondo desenfocado, igual que los de carta.
- **Sin texto en el plano.** El nombre de la formación lo pone el juego debajo.

## Dónde van y cómo se sirven

Original a `src/video/exp_<formacion>.mp4` o `src/video/exp_<formacion>_fin.mp4`
—fuera del repositorio, como todo lo demás—. Son cuatro nombres y sólo cuatro:

| fichero | cuándo sale |
|---|---|
| `exp_morrison.mp4` | al abrir la Morrison por primera vez |
| `exp_morrison_fin.mp4` | al vencer a Big Al y cerrar los ocho nodos |
| `exp_hell_creek.mp4` | al abrir Hell Creek por primera vez |
| `exp_hell_creek_fin.mp4` | al vencer al último rey |

Y luego, **nombrándolos**, que sin nombres re-codifica los nueve de las
legendarias y les cambia los bytes sin cambiar nada que se vea:

```
python tools/videos.py escribir exp_morrison exp_morrison_fin exp_hell_creek exp_hell_creek_fin
```

La herramienta ya reconoce esos cuatro ids como válidos y escribe
`assets/video/indice.json`, que es lo que hace que la pantalla los pida. **Sin
índice no se enseñan**: se pidieron a ciegas al principio y dejaban un 404 en la
consola en cada visita al mapa. Después, subir `VERSION` en `sw.js`.

Mientras no exista el fichero no pasa nada: la pantalla no pide nada y no se ve
nada. Se puede publicar el código antes que los vídeos.

## Bloque de ESTILO para cinemática (copiar literal, al final del sujeto)

> Slow aerial-to-ground camera move, wide establishing shot, deep focus, no
> rack focus. Natural light, atmospheric haze layering the distance.
> Photorealistic natural history documentary, cinematic 3D render, single
> continuous shot, no cuts.

## Prompt negativo

> text, watermark, logo, subtitles, people, humans, modern animals, buildings,
> roads, boats, cuts, fast camera shake, morphing, deformed anatomy, extra
> limbs, grass lawn, flowers meadow

`grass lawn` y `flowers meadow` van a propósito: **en el Jurásico no hay
hierba** —las gramíneas son del Cretácico tardío y nunca praderas— y el
generador llena el suelo de césped en cuanto se le dice «llanura». En Hell
Creek sí hay flores, pero tampoco pradera.

## Los cuatro, con sus dos fotogramas

Cada uno son TRES prompts: el fotograma inicial y el final se generan con el
generador de imágenes, y el de movimiento se le da al de vídeo con esos dos
fotogramas atados.

---

### 1 · `exp_morrison` — entrar en la Morrison

Lo que tiene que decir: *esto es una llanura enorme, seca y estacional, y lo que
la habita es más grande que tú*. Nada de amenaza todavía.

**Fotograma inicial** (imagen):

> Aerial view over a vast Late Jurassic floodplain at mid-morning, seen from
> high above. Wide braided river channels split across pale sandy sediment,
> ribbons of dark conifer forest and tree ferns following the water, dry open
> ground between them. Low hills on the far horizon under a hazy warm sky.
> Empty of animals. Photorealistic natural history documentary, cinematic 3D
> render, deep focus.

**Fotograma final** (imagen): el mismo sitio, ya a ras de suelo y con escala.

> Ground-level view across a Late Jurassic floodplain in warm low sunlight. A
> herd of enormous long-necked sauropods —Brachiosaurus and Diplodocus, tiny
> heads on very long necks, walking on four columnar legs, long tapering
> tails held off the ground— crosses a shallow braided river from left to
> right in the middle distance, raising dust and spray. Araucaria conifers and
> cycads along the bank, a single Stegosaurus with tall diamond back plates
> grazing in the foreground at the right. No grass anywhere; ferns and
> horsetails on the ground. Photorealistic natural history documentary,
> cinematic 3D render, deep focus.

**Movimiento** (vídeo, 8 s, los dos fotogramas atados):

> The camera descends slowly and steadily from high above the floodplain toward
> ground level, the braided river opening up beneath it, until it settles at
> eye level as a herd of giant long-necked sauropods walks across the shallow
> channel in front of the lens. Dust and water spray drift in the low sun.
> [bloque de ESTILO]

---

### 2 · `exp_morrison_fin` — cerrar la Morrison

Lo que tiene que decir: *has recorrido esto entero*. Es un plano de retirada, no
de llegada: la cámara se va hacia arriba y la tierra se queda abajo.

**Fotograma inicial** (imagen):

> Ground-level view at dusk across a Late Jurassic floodplain. A large
> Allosaurus —a big predatory theropod with a long low skull, small brow
> horns, three-clawed hands and a heavy balancing tail— stands alone in
> profile on a dry river bar, head raised, backlit by a low orange sun. Long
> shadows across the sand. Photorealistic natural history documentary,
> cinematic 3D render, deep focus.

**Fotograma final** (imagen):

> Very high aerial view of an immense Late Jurassic floodplain at dusk, the
> whole braided river system visible as a pale network across dark forest,
> curving to the horizon. The animals are tiny specks. Deep orange and violet
> sky, layers of atmospheric haze. Photorealistic natural history documentary,
> cinematic 3D render, deep focus.

**Movimiento** (vídeo, 8 s):

> The camera lifts steadily and continuously away from the lone Allosaurus,
> rising higher and higher above the floodplain until the whole braided river
> system and the forests are visible below, the animal shrinking to a speck.
> Slow, calm, no shake. [bloque de ESTILO]

---

### 3 · `exp_hell_creek` — entrar en Hell Creek

Lo que tiene que decir: *otro mundo, trece millones de años después*. Más verde,
más húmedo, con flores, y con un mar al fondo. El mapa del juego baja desde el
bosque hasta la costa, así que el plano hace el mismo viaje.

**Fotograma inicial** (imagen):

> Dense Late Cretaceous forest interior in warm morning light: broad-leaved
> flowering trees, palmettos, magnolias and bald cypress with buttressed
> roots, mist between the trunks, a shallow dark stream in the foreground.
> Photorealistic natural history documentary, cinematic 3D render, deep focus.

**Fotograma final** (imagen):

> Wide view over a Late Cretaceous coastal plain seen from a low ridge at the
> forest edge. A herd of Triceratops —heavy four-legged dinosaurs with a huge
> bony neck frill, one short nose horn and two long brow horns, and a parrot-
> like beak— moves across open ground in the middle distance. Beyond them,
> braided river channels, then a pale shoreline and the flat grey-blue water
> of an inland sea reaching the horizon. Cypress and palmetto stands, warm
> hazy sky. Photorealistic natural history documentary, cinematic 3D render,
> deep focus.

Negativo añadido: `single horn, no frill, rhinoceros, elephant`. Sin decir la
gola y los dos cuernos de la frente, el generador entrega rinocerontes.

**Movimiento** (vídeo, 9 s):

> The camera glides forward through the misty forest, between the trunks and
> over the shallow stream, and emerges at the treeline onto an open coastal
> plain where a herd of horned Triceratops is crossing, the inland sea
> visible far beyond them. Continuous forward movement, no cuts.
> [bloque de ESTILO]

---

### 4 · `exp_hell_creek_fin` — el impacto

El mejor momento que tiene el juego, y lo pide el propio mapa: el dibujo de
`mapa_hell_creek.webp` **termina en el resplandor del impacto**, y el octavo
nodo cae justo encima.

Dos avisos, porque aquí es donde el generador se pone creativo:

- **No es un meteorito ardiendo que cruza despacio como en las películas.** Es
  un trazo blanco de un segundo y luego un fogonazo en el horizonte. Pedir
  «asteroid falling» entrega una bola de fuego lenta y de dibujos animados.
- **El plano se queda ANTES de la destrucción.** El último fotograma es el
  instante del fogonazo con los animales en silueta, no un paisaje arrasado. Es
  el final de una expedición, no un castigo; y una postal de ceniza y cadáveres
  es lo que nadie quiere quedarse mirando cuatro segundos.

**Fotograma inicial** (imagen):

> Late Cretaceous coastal plain at dusk, seen from ground level. A Tyrannosaurus
> rex —massive predatory dinosaur with a deep boxy skull, tiny two-fingered
> arms and a thick horizontal tail— stands in profile on the shore in the
> middle distance, head raised and turned toward the sky. Behind it, the flat
> water of an inland sea and a deep red-orange sunset. Calm, still, no dust.
> Photorealistic natural history documentary, cinematic 3D render, deep focus.

**Fotograma final** (imagen):

> The same Late Cretaceous shoreline, the instant of a blinding white-orange
> flash erupting on the far horizon across the water. The Tyrannosaurus and
> distant animals are reduced to hard black silhouettes against the light. The
> sky above is a violent orange and the water throws a long white reflection
> toward the camera. Nothing destroyed yet, no dust cloud, no fire in the
> foreground. Photorealistic natural history documentary, cinematic 3D render,
> deep focus.

**Movimiento** (vídeo, 8 s):

> A Tyrannosaurus stands still on the shore at dusk and raises its head toward
> the sky. A thin brilliant white streak crosses the sky above the sea in under
> a second and vanishes below the horizon. A beat of stillness. Then a blinding
> white-orange flash erupts on the far horizon and floods the whole scene with
> light, turning every animal into a black silhouette. The camera never moves
> and never cuts. [bloque de ESTILO]

Negativo añadido: `slow fireball, cartoon meteor, comet with long tail,
explosion in foreground, debris, ash cloud, burning trees, corpses`.

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

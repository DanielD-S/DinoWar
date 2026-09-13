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
- **Sin marca de agua.** El primero salió con «KlingAI 3.0» abajo a la derecha:
  hay que exportar sin marca, que es de plan de pago, o pedir que se recorte.

## Dónde va

Original a `src/video/<id>.mp4` con el `id` de la carta (`mosasaurus`,
`spinosaurus`, `antarctosaurus`…). `python tools/videos.py escribir` lo sirve
en `assets/video/`. La apertura del sobre lo busca por el id y no hay lista:
una legendaria sin vídeo sale sin vídeo. La herramienta pasa el nombre a
minúsculas y avisa si no coincide con ninguna carta, que `Tyrannotitan.mp4`
y `maiasaurua.mp4` no fallan, sólo no salen nunca.

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

# Plantillas de prompt para los sonidos

Cómo pedirle a un generador de audio (ElevenLabs Sound Effects, Stable Audio,
Suno/Udio para la música) los sonidos de DinoWar. Hermano de
[PROMPTS.md](PROMPTS.md): la regla es la misma. **El prompt son dos bloques
fijos y un hueco.** El bloque de MATERIAL y el de PROHIBICIONES se copian
literales en cada sonido; sólo cambia el SUJETO. Que cuarenta sonidos suenen a
un mismo juego no sale de describir bien el estilo cada vez: sale de no
reescribirlo nunca.

Los prompts van en inglés porque los generadores responden mejor así.

## Qué hay hoy y qué falta

`src/ui/audio.js` sintetiza 21 tipos con osciladores (`sonido('entrada')`,
`sonido('muerte')`…) y el guión de eventos ya pide cada uno por nombre. Eso es
lo que hay que sustituir uno a uno, **con el mismo nombre de fichero que el
tipo**, para que `guion.js` no se toque: `assets/sonidos/entrada.ogg`,
`assets/sonidos/muerte.ogg`.

Lo que NO existe todavía y hace falta:

- **Música**: menú, partida, la Cuenca (jefe). Ninguna.
- **Ambiente**: un fondo de Morrison para el menú y para el tablero.
- **Combate**: el choque, la embestida y el golpe al hábitat no suenan.
  `animarCombate` no pide ningún sonido.
- **Turno y reloj**: fin de turno, tic cuando se acaba el tiempo.
- **Economía**: dinomonedas ganadas, misión cumplida, sobre comprado.

## Dos límites que vienen del código

- **Ningún efecto de habilidad puede pasar de 600 ms.** Es el tope de compás de
  `test/guion.test.js`: con el campo lleno se disparan diez habilidades
  seguidas y a medio segundo cada una es una espera. Pedir 0,2–0,5 s.
- **Todo empieza en el primer milisegundo.** El guión dispara el sonido al
  arrancar el compás y el gesto visual dura 260–520 ms: un ataque con
  fade-in llega cuando la carta ya se movió. Pedirlo siempre «starts
  instantly, no fade-in».

## Formato

Del generador, **WAV** a 48 kHz y 16 bits, mono para los efectos y estéreo
para música y ambiente, sin normalizar ni fundir. Van a `src/sonidos/` con el
nombre del tipo, y `python tools/sonidos.py escribir` los convierte a AAC en
M4A —lo único que Safari en iPhone decodifica por Web Audio— normalizados a
−16 LUFS.

Las músicas y ambientes tienen que **cerrar en bucle sin costura**: pedirlo en
el prompt no basta, tres de las cuatro primeras llegaron con corte. La
herramienta lo mide y lo cose fundiendo los dos últimos segundos sobre los dos
primeros, así que la pista servida pierde dos segundos: pedir 32 s si se
quieren 30.

---

## Bloque de MATERIAL para efectos (copiar literal)

> Short sound effect for a mobile card game set in the Late Jurassic. Organic,
> earthy, physical materials only: stone, bone, dry wood, leather, brass,
> sand, dust. Close-miked, dry, no reverb tail. Starts instantly, no fade-in,
> ends clean. Mono, single event.

## Bloque de PROHIBICIONES para efectos (copiar literal)

> No music, no melody, no voice, no speech, no words. No synthesizer, no
> electronic, no 8-bit, no sci-fi, no laser, no whoosh-with-reverb, no
> cinematic boom. No echo, no hall. Not longer than the requested duration.

Cada sujeto de abajo se pega ENTRE los dos bloques. Se indica duración y el
nombre de fichero que espera el juego.

---

## 1. Interfaz

| fichero | dura | sujeto (el hueco) |
|---|---|---|
| `toque.ogg` | 0,08 s | A small brass latch clicking shut into a stone slot. Tight, low, satisfying. One click. |
| `carta.ogg` | 0,15 s | A single stiff card slapped face-down onto a dry stone table. Paper and stone only. |
| `revelar.ogg` | 0,25 s | A card flipping face-up: one crisp paper flick with a short rising sweep of air, like a page turning fast. |
| `error.ogg` | 0,2 s | A dull knock on hollow wood, blocked. A short low "no". Muffled, no ring. |
| `zona.ogg` | 0,15 s | A small pebble settling into a shallow hole in rock, one soft tap. |
| `moneda.ogg` | 0,3 s | Three small carved bone coins dropping onto stone in quick succession, a light clatter. Warm, no metallic ring. |
| `mision.ogg` | 0,5 s | A short primitive fanfare: two bone-flute notes rising, punctuated by one frame-drum hit. Celebratory but small. |
| `pantalla.ogg` | 0,3 s | A heavy stone slab sliding sideways over sand, one short push, then stopping. For screen transitions. |

`pantalla` es nuevo: hoy cambiar de pantalla no suena. `moneda` y `mision`
también.

## 2. Sobre

| fichero | dura | sujeto |
|---|---|---|
| `rasgar.ogg` | 0,4 s | Thick waxed paper being torn open slowly by hand, fibers separating, one continuous rip. |
| `deslizar.ogg` | 0,2 s | One card sliding off the top of a stack of cards, paper against paper, a soft short swish. |
| `joya.ogg` | 0,5 s | A rare card reveal: a bright shimmer of small glass beads and brass chimes, short and glittering, quickly decaying. |
| `legendaria.ogg` | 0,8 s | A legendary card reveal: a deep low frame drum hit followed by a swelling shimmer of chimes and a distant, huge dinosaur breath. Awe, not noise. |

`joya` suena hoy para épicas y legendarias por igual; `legendaria` separa la
segunda. `deslizar` va en el gesto de pasar carta, que hoy usa `carta`.

## 3. Combate

Los tres que más faltan. Hoy el combate es mudo salvo la muerte.

| fichero | dura | sujeto |
|---|---|---|
| `choque.ogg` | 0,3 s | Two large animals colliding: a heavy meaty thud with bone impact, dust kicked up. Blunt and short. No roar. |
| `embestida.ogg` | 0,35 s | A large dinosaur charging forward: three fast heavy footsteps on packed earth ending in a thud. Weight and momentum. |
| `habitat.ogg` | 0,4 s | A blow landing on the ground of a nesting territory: a deep earth impact, cracking dry branches, a shower of gravel. Damage, not death. |
| `sinDano.ogg` | 0,2 s | A blow absorbed harmlessly: a soft thump against thick hide, like hitting a leather sack. Deflated. |
| `muerte.ogg` | 0,5 s | A large animal collapsing: a heavy body falling onto dry earth, a final exhale, dust settling. Sad, short, no scream. |
| `fulmina.ogg` | 0,5 s | Something being snatched away: a sharp snap of jaws closing, then a fast dry rustle as the prey is dragged off. |

| `golpe.ogg` | 0,2 s | One dry, hard impact for a hit-stop moment: a heavy club striking bone once. Extremely short, punchy, no tail at all. |
| `pisoton.ogg` | 0,3 s | A single enormous footstep landing on packed earth: deep thud, gravel jump, a brief low rumble. One stomp. |

`sinDano` acompaña al rótulo «sin daño» de `animate.js`. `fulmina` es la
Tijera: `guion.js` ya distingue ese efecto y hoy le pone `muerte`. `golpe` y
`pisoton` los pide la animación nueva del tablero —el hit-stop y la
invocación— y hasta que existan caen en el `default` de `sonido()`, callados.

## 4. Habilidades del guión

Los once nombres que `guion.js` pide. Cada uno es una FAMILIA de cartas, no una
carta, así que el sonido tiene que ser genérico: dice «pasó algo de este tipo»
y el rótulo dice qué.

| fichero | dura | sujeto |
|---|---|---|
| `entrada.ogg` | 0,3 s | A creature arriving: a single heavy footstep on dry ground with a short low growl underneath. Presence. |
| `adaptar.ogg` | 0,35 s | Something growing stronger: a low creak of stretching leather and bone, resolving into a firm thud. |
| `presion.ogg` | 0,35 s | Pressure and threat: a low guttural rumble from a large chest, close, short, menacing. |
| `clima.ogg` | 0,6 s | The weather changing: a gust of warm wind through dry fern fronds with distant thunder rolling once. |
| `mazo.ogg` | 0,25 s | Cards lost from the deck: a small stack of cards thrown down onto stone, then scattered by hand. |
| `descarte.ogg` | 0,2 s | One card discarded: a quick flick of a card tossed onto a pile, dry paper. |
| `buscar.ogg` | 0,35 s | Searching a deck: fast riffling through a stack of cards, then one card pulled out sharply. |
| `reciclar.ogg` | 0,3 s | A card returning to the deck: a card sliding back into a stack, then the stack tapped square on stone. |
| `biomasa.ogg` | 0,3 s | Gaining resources: a handful of seeds and dry leaves poured onto flat stone, a soft organic pour. |
| `curar.ogg` | 0,4 s | Healing: a warm low exhale, like a large animal breathing out slowly and settling. Relief. |
| `trofeo.ogg` | 0,5 s | A trophy earned: one deep frame-drum hit and a short rising bone-flute call. Triumphant, primitive. |

## 5. Turno y reloj

| fichero | dura | sujeto |
|---|---|---|
| `turno.ogg` | 0,3 s | End of turn: a wooden staff struck once against stone, a single dry knock with a short natural decay. |
| `tic.ogg` | 0,1 s | A clock running out: one dry tick of a small bone against a hollow log. Repeatable at one per second. |
| `tiempo.ogg` | 0,4 s | Time is up: a hollow log drum struck once, low and final. |

## 6. Fin de partida

| fichero | dura | sujeto |
|---|---|---|
| `gana.ogg` | 2 s | Victory sting: a short primitive fanfare, frame drums and log drums building over four beats into a bright bone-flute call, ending on a held note. Triumphant. |
| `pierde.ogg` | 2 s | Defeat sting: one low drum hit, then a descending bone-flute phrase over a fading low drone, ending unresolved. Somber, no drama. |
| `jefe-cae.ogg` | 3 s | Boss defeated: a colossal body collapsing to the earth, a long low rumble, then silence, then a distant celebratory drum roll. |

Los stings sí llevan reverb y cola: no van en compás y tienen tiempo. Quitar
para ellos la frase «no reverb tail» del bloque de material.

---

## Bloque de ESTILO para música (copiar literal)

> Instrumental game music for a card game set in the Late Jurassic, Morrison
> Formation. Cinematic nature-documentary feel. Primitive and organic
> instrumentation: log drums, frame drums, hand percussion, bone flutes, low
> bowed strings, deep didgeridoo-like drones, distant animal calls used as
> texture. Warm, dusty, late-afternoon light. Slow build, wide dynamics, lots of
> space. Seamless loop: the ending must flow back into the beginning without a
> cut.

## Bloque de PROHIBICIONES para música (copiar literal)

> No vocals, no lyrics, no choir. No electric guitar, no drum kit, no modern
> drums, no synthesizer leads, no EDM, no orchestral brass fanfares, no
> epic-trailer clichés. No sudden endings, no fade-out.

## 7. Música

**`musica-menu.ogg`, 120 s.** El autor tiene una en mente; este es el
sujeto por si hace falta:

> Menu theme. Calm, patient, inviting. A slow frame-drum heartbeat at 72 BPM
> under a long low drone; a bone flute plays a simple four-note motif that
> returns every 16 bars, like a call across a valley. Distant sauropod calls
> and wind in ferns as texture. It should feel like the moment before
> something begins, never urgent.

**`musica-partida.ogg`, 120 s.**

> Match theme. Tense, focused, driving but restrained. Steady log drums and
> hand percussion at 96 BPM, low bowed strings holding a two-chord ostinato, a
> bone flute answering in short phrases. Builds slightly in intensity every 32
> bars then pulls back. Must not tire the ear over a 15-minute match: no
> hooks, no melody that demands attention.

**`musica-cuenca.ogg`, 120 s.** Es la pantalla del jefe cooperativo.

> Boss hunt theme. Dark, heavy, ceremonial. Deep war drums in a slow tribal
> pattern at 84 BPM, a massive low drone, distant thunder. A deep horn-like
> call from a large animal, used as a recurring motif. Dread and scale; the
> feeling of many small hunters circling something enormous.

**Música del sobre: descartada.** Se generó, se probó durante la ceremonia y
al autor no le gustó. El sobre suena con la música del menú y sus efectos.

## 8. Ambiente

Un fondo bajo, casi inaudible, debajo de la música o solo cuando la música está
apagada. Usar el bloque de MATERIAL cambiando «short» por «long ambient loop»
y quitando «mono, single event».

**`ambiente-morrison.ogg`, 90 s, estéreo.**

> Late Jurassic floodplain at dusk. Warm wind through tall ferns and conifers,
> insects droning, a distant river. Occasional far-off calls of large animals,
> deep and slow, never close. A dry, dusty, peaceful landscape. Seamless loop.

**`ambiente-tormenta.ogg`, 90 s, estéreo.** Para cuando hay un clima en el
campo.

> Late Jurassic floodplain under a gathering storm. Strong gusts, ferns
> thrashing, low continuous thunder, first heavy raindrops on dry earth.
> Distant alarmed animal calls. Tension in the air. Seamless loop.

---

## Cómo se prueban

Pedir tres o cuatro variantes de cada sujeto y escuchar en el móvil, con el
altavoz del teléfono, que es donde se va a oír. Un sonido que suena bien en
auriculares y desaparece en un altavoz de 20 mm es un sonido que no existe.
Los efectos de combate y de habilidad se prueban en fila: `node sim/run.js`
no sirve para esto, hay que jugar una partida con el campo lleno y ver si
diez habilidades seguidas suenan a ritmo o a ruido.

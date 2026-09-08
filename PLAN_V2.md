# PLAN_V2.md — Formación Morrison, rediseño

Especificación de la versión 2. **Pendiente de aprobación antes de escribir código.**
Sustituye a las reglas de `GAME_SPEC.md`; **conserva íntegra su sección 2**, la restricción paleontológica, que es la identidad del juego y no se toca.

---

## 1. Por qué se rehace

La v1 está decidida antes de la mitad. Medido sobre 1.200 partidas `reactiva vs reactiva`:

| Si en el turno 4–6… | …ganas la partida |
|---|---|
| Dominas la Sabana en el turno 4 | **83,8 %** |
| Tienes más unidades en el turno 6 | **87,6 %** |
| Vas por delante en Territorio en el turno 6 | **84,0 %** |

En una partida de doce turnos, los siete últimos son trámite.

### 1.1 La causa, y por qué no son las cuatro zonas

Tres realimentaciones positivas que apuntan en la misma dirección:

1. **Ganas una zona → produces recursos → despliegas más → ganas más zonas.** La renta está atada a ir ganando.
2. **Ganas una zona → el perdedor pierde una unidad → tiene menos Poder → vuelve a perder.**
3. **Con muerte permanente, al perdedor además se le encoge el mazo.**

Frente a eso, la única realimentación negativa era el suelo de ingreso (D3) y robar 2 cartas sin zonas. Insuficiente.

**El número de territorios no es la causa.** Con un único campo el bucle 1 se agrava: hoy, perdida la Sabana, todavía puedes replegarte y disputar el Bosque; con un solo campo no hay a dónde ir. Por eso el rediseño **empieza por romper el bucle 1**, no por quitar zonas:

> **La renta ya no depende de dominar el campo.** Sube sola, por turno, igual para los dos bandos. El campo se disputa por daño y por trofeos, no por ingresos. Es lo que hacen Pokémon (una energía por turno) y Hearthstone (un maná por turno): perder el tablero no te quita además la capacidad de responder.

El bucle 2 se atenúa dando **Vida** a los dinosaurios: perder un intercambio ya no es perder la unidad, es quedar herido. El bucle 3 desaparece porque el mazo deja de encogerse por combate (ver §6.3).

---

## 2. Forma del juego

Dos poblaciones se enfrentan en **un único campo**. Cada bando ocupa una fila de ranuras; las ranuras se enfrentan una a una. Se sigue desplegando **boca abajo y revelando a la vez**: la información oculta era lo mejor de la v1 y se conserva.

```
              BIOMA DEL RIVAL   ♥ 25
        ┌──────┬──────┬──────┬──────┐
 RIVAL  │  R1  │  R2  │      │  R4  │
        ├──────┼──────┼──────┼──────┤
   TÚ   │  T1  │      │  T3  │  T4  │
        └──────┴──────┴──────┴──────┘
              TU BIOMA          ♥ 25

 T1 ⚔ R1   combate
 T2 —      ranura vacía: R2 golpea tu bioma
 T3 → ♥    R3 vacía: T3 golpea el bioma rival
 T4 ⚔ R4   combate
```

**Cuatro ranuras por bando** (valor de partida; el simulador decidirá entre 3 y 4).

La tensión de cada turno sale de aquí: **una fila ancha bloquea el daño a tu bioma pero regala trofeos; una fila estrecha niega trofeos pero abre tu bioma.** No hay postura segura.

---

## 3. Recursos

Un solo recurso para jugar cartas.

| Recurso | Cómo funciona |
|---|---|
| **Biomasa** | `min(turno, TOPE)` al principio de cada turno, **igual para ambos**. No se acumula: lo que no gastas se pierde. Tope inicial propuesto: **8**. |
| **Agua** | Deja de ser un recurso de bolsillo. Cada dinosaurio conserva su **Consumo hídrico**, que solo se cobra cuando sale *Sequía estacional*. |

Quitar la acumulación es deliberado: sin ella no se puede ahorrar tres turnos para soltar una bomba, y la curva de coste manda.

**Territorio desaparece.** Era el marcador de la v1 y su función la asumen las tres victorias de §6.

---

## 4. Dinosaurios

Cada dinosaurio tiene ahora tres cifras en vez de una:

| Cifra | Qué es |
|---|---|
| **Poder** | Daño que inflige por turno. |
| **Vida** | Daño que aguanta antes de morir. Las heridas **no se curan** salvo carta que lo diga. |
| **Coste** | Biomasa para desplegarlo. |
| **Consumo hídrico** | Solo se paga durante una Sequía. |

Vida es la pieza que rompe el bucle 2: perder un intercambio ya no cuesta la unidad entera.

### 4.1 Tipos

Cuatro tipos, que son **clados reales y roles tróficos reales**, no invención:

| Tipo | Taxones del set | Perfil |
|---|---|---|
| **Terópodo** | *Allosaurus*, *Ceratosaurus*, *Torvosaurus*, *Ornitholestes* | Poder alto, Vida media |
| **Saurópodo** | *Apatosaurus*, *Diplodocus*, *Camarasaurus* | Vida muy alta, Poder bajo |
| **Tireóforo** | *Stegosaurus* | Vida alta, devuelve daño |
| **Ornitópodo** | *Dryosaurus* | Barato, frágil, gregario |

El tipo **no es un triángulo arbitrario tipo piedra-papel-tijera: es una red trófica.** Las tres interacciones propuestas están respaldadas por la misma evidencia que ya cita el juego:

- **Terópodo → Ornitópodo: +daño.** Depredación sobre presa pequeña y cursorial.
- **Tireóforo daña a quien lo ataca.** El tagomizador de la v1 pasa de rasgo de carta a propiedad del tipo; la vértebra de *Allosaurus* perforada por una púa caudal lo sostiene.
- **Saurópodo adulto: reduce el daño recibido.** La talla adulta como defensa antipredatoria, que ya era la nota de *Apatosaurus*.

No se añade ninguna relación que no tenga respaldo. Si el balance pidiera una cuarta, se busca la evidencia primero o no se pone.

---

## 5. Los otros tres tipos de carta

### 5.1 Adaptaciones (mejora)

Se juegan sobre un dinosaurio propio y suben sus cifras. Las tres de la v1 siguen valiendo: **Gregarismo**, **Gastrolitos**, **Crecimiento acelerado**.

Harán falta dos o tres más. **No las invento**: cada una necesita un rasgo documentado en la Morrison, con su nota y su nivel de evidencia, y te las paso para revisión antes de escribirlas.

### 5.2 Presiones (perjuicio)

Aquí hay una trampa que conviene ver ahora: **un TCG normal resuelve los perjuicios con hechizos, y en este juego no hay magia.** Nada debilita a un dinosaurio rival porque tú lo decidas.

La salida honesta es que los perjuicios sean **presiones ecológicas y patologías documentadas**, no conjuros: cojeras y fracturas —el registro patológico de *Allosaurus* es abundante y está establecido—, competencia por el nicho, mortandades locales. El jugador no lanza un hechizo: la población rival sufre una presión real.

Es la parte del rediseño con más riesgo de romper la restricción §2, así que las propondré una a una con su referencia.

### 5.3 Campo

**Aquí vuelven las cuatro zonas de la v1, convertidas en cartas.** Los cuatro paleoambientes de la Morrison pasan a ser cartas de campo: hay **una activa a la vez** y cualquiera de los dos bandos puede reemplazarla.

| Carta de campo | Efecto propuesto |
|---|---|
| **Llanura de inundación** | Alta productividad: +1 Biomasa por turno a ambos. |
| **Canal fluvial trenzado** | Los ribereños (*Ceratosaurus*) ganan Poder. Agua abundante: la Sequía no mata. |
| **Bosque de coníferas ribereño** | Ramoneo alto: los saurópodos curan heridas cada turno. |
| **Sabana de helechos** | Terreno abierto, sin cobertura: el daño al bioma aumenta. |

Se conserva el contenido paleoambiental que da carácter al juego, sin obligar a controlar cuatro tableros. Y el campo es una decisión disputada: cambiarlo cuesta y beneficia a quien mejor lo aproveche.

---

## 6. Las tres victorias

### 6.1 Registro fósil (trofeos)

Cada dinosaurio **rival** que muere entra en tu registro fósil. Reúne **6** y ganas. Es el equivalente exacto de los premios de Pokémon, contando extinciones.

### 6.2 Colapso del bioma

Cada bando tiene un bioma con **Vida (25 propuesto)**. El dinosaurio cuya ranura enfrentada esté vacía golpea el bioma rival. A 0, ese bando pierde.

**6.1 y 6.2 no se solapan, se oponen**, y ese es el motor del juego: para negar trofeos hay que desplegar poco, y desplegar poco abre el bioma. Para tapar el bioma hay que llenar la fila, y una fila llena es una cosecha de trofeos.

### 6.3 Extinción (agotamiento del mazo)

Si te toca robar y no te quedan cartas, pierdes. **Las bajas ya no salen del juego**: vuelven al descarte y se rebaraja. La muerte permanente de la v1 se retira porque, con el registro fósil ya premiando las bajas, sumar además la merma del mazo reconstruye el bucle 3 que estamos eliminando. El agotamiento pasa a ser un reloj de fondo, no un segundo castigo por perder.

Mazo propuesto: **30 cartas** (frente a las 20 de la v1), porque hay cuatro familias de carta que representar. El simulador ajustará el número.

---

## 7. Bucle de turno

```
1. ESTACIÓN     Desde el turno 3. Carta de clima, neutral.
2. RENTA        Biomasa = min(turno, 8). Igual para ambos. No acumula.
3. ROBO         1 carta.
4. DESPLIEGUE   Simultáneo y boca abajo: dinosaurios a ranuras libres,
                adaptaciones sobre los propios, presiones sobre los rivales,
                campo al centro.
5. REVELACIÓN   Se voltea todo a la vez.
6. COMBATE      Ranura contra ranura, de la 1 a la 4.
                Ambas ocupadas  → daño simultáneo.
                Una vacía       → el ocupante golpea el bioma rival.
                Muertes → registro fósil del rival.
7. CHEQUEO      6 trofeos · bioma a 0 · sin cartas al robar.
```

---

## 8. Objetivos de balance

Los cuatro primeros se heredan de `GAME_SPEC.md` §10. **El quinto y el sexto son nuevos y son la razón de ser de este rediseño**: si no se cumplen, la v2 no sirve de nada.

| Métrica | Objetivo |
|---|---|
| Duración media | 10 – 14 turnos |
| Victorias del jugador inicial | 48 – 55 % |
| Índice de calibración por carta | 0,70 – 1,30 |
| Partidas sin decisión (tope de turnos) | < 2 % |
| **P(ganar \| vas por delante en el turno 5)** | **55 – 70 %** (en la v1: 87,6 %) |
| **Reparto entre las tres victorias** | ninguna por debajo del **15 %** ni por encima del **60 %** |

---

## 9. Qué se recicla

No es empezar de cero. Sobre unas 2.500 líneas actuales:

| Se conserva tal cual | Se reescribe |
|---|---|
| `engine/rng.js` — PRNG determinista | `engine/resolve.js` — combate por ranuras |
| Arquitectura del reducer `(estado, acción) → estado` | `engine/actions.js` — acciones nuevas |
| `vistaDe()` — la IA no ve tu mano | `engine/ai.js` — heurística nueva |
| `sim/` completo — bucle y métricas | `data/cards.js` — Vida, tipos, familias |
| `test/pureza.test.js` — 7 tests | `data/balance.js` — números nuevos |
| Interfaz: mano en abanico, marcos de carta, fichas, ayuda, log, audio, arte | Tablero: más simple con un campo |
| Los 12 taxones con sus notas y niveles de evidencia | Tests de reglas: 50 tests a rehacer |

Estimación: **~55 % del código sobrevive**. La interfaz sale ganando, porque un campo con ranuras es más simple de dibujar que cuatro zonas.

---

## 10. Orden de trabajo

| Hito | Contenido | Verificación |
|---|---|---|
| **V2-0** | Motor de reglas nuevo + simulador. Sin interfaz. | Los 6 objetivos de §8, con especial atención a la antibola de nieve |
| **V2-1** | Set de cartas definitivo, con notas científicas revisadas por ti | Ninguna carta sin referencia |
| **V2-2** | IA heurística adaptada | Bate a la aleatoria > 60 % |
| **V2-3** | Tablero de ranuras y combate animado | Partida jugable en móvil |
| **V2-4** | Pulido y deploy | Criterios de aceptación |

**V2-0 primero y sin interfaz**, igual que H0. Si la bola de nieve no se rompe en el simulador, no hay que dibujar nada todavía.

---

## 11. Preguntas antes de empezar

1. **Las cifras concretas** —4 ranuras, bioma a 25, 6 trofeos, tope de 8 Biomasa, mazo de 30— son puntos de partida para que el simulador los mueva. ¿Te vale que los calibre yo y te presente los resultados, o hay alguno que quieras fijar tú de entrada?

2. **Cartas nuevas.** Hacen falta 2–3 adaptaciones y 3–4 presiones que no existen. Te las propondré una a una con su referencia paleontológica, su nivel de evidencia y su nota, para que las apruebes antes de que entren. ¿Prefieres revisarlas de golpe cuando tenga la lista completa, o de una en una?

3. **La v1.** ¿La guardo en git antes de empezar, para poder volver o comparar? Ahora mismo el repositorio no está inicializado y una partida jugable se perdería al sobrescribir.

4. **Nombre.** El juego deja de ir de dominar cuatro paleoambientes y pasa a ir de dos poblaciones enfrentadas en uno. *Formación Morrison* le sigue quedando bien, pero si tenías otro en mente, este es el momento.

---

## 12. Resultado de V2-0

Motor nuevo, simulador nuevo, **34 tests en verde**, `BALANCE.md` regenerado sobre 2.000 partidas `heurística vs heurística`. Sin interfaz todavía, como estaba previsto.

### 12.1 La bola de nieve está rota

Es lo único que de verdad justificaba el rediseño:

| | v1 | v2 |
|---|---|---|
| **P(ganar \| vas por delante en el turno 5–6)** | **87,6 %** | **61,8 %** |

Ir ganando sigue siendo una ventaja —faltaría más—, pero ya no es una sentencia. La partida se juega hasta el final.

### 12.2 Objetivos

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 12,59 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 50,3 % | 48 – 55 % | ✅ |
| P(ganar \| ventaja en el turno 5) | 61,8 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 44 % / 17 % / 39 % | cada una 15 – 60 % | ✅ |
| Partidas sin decisión | 0,0 % | < 2 % | ✅ |
| Cartas mal calibradas | 3 de 20 | 0 | ❌ |

Las tres vías de victoria están vivas: **44 % registro fósil, 17 % colapso del bioma, 39 % extinción.**

### 12.3 Números calibrados

Punto de partida → valor final, decidido por el simulador:

| Número | Propuesto | Final | Por qué |
|---|---|---|---|
| Trofeos para ganar | 6 | **12** | Con 6, el 97 % de las partidas acababa por trofeos y duraban 9,9 turnos. |
| Vida del bioma | 25 | **20** | Con 25–30 el bioma casi nunca caía; con 15 caía siempre. |
| Robo por turno | 1 | **2** | Con 1 el mazo no se agotaba nunca y la extinción salía al 0 %. |
| Rebarajado del descarte | sí | **no** | Es lo que convierte el mazo en un reloj real, como en Pokémon. Con 30 cartas y robo de 2, se acaba justo en la franja de turnos objetivo. |
| Compensación del 2º jugador | 1 carta | **0** | Con la carta extra el jugador inicial bajaba al 33–43 %. |
| Desempate a igualdad total | 2º jugador | **1er jugador** | Con daño simultáneo los dos bandos cruzan el umbral en el mismo combate más de lo esperado, y el desempate le regalaba partidas al segundo. |
| Coste de *Diplodocus* | 6 | **5** | A 6 estaba dominado por *Camarasaurus* (5, 3/8): un coste más por 2 de Vida no compensaba. |
| Coste de Competencia trófica | 3 | **2**, y −2 Poder | A 3 y −1 no se jugaba nunca (índice 0,02). |
| Gregarismo | +1 Poder | **+2 Poder** | Mismo motivo: índice 0,28. |

### 12.4 Un error mío que costó nueve cartas

La primera medición daba **16 cartas de 20 mal calibradas**, y la peor era *Diplodocus* con índice 0,09: un 3/10 que la IA no jugaba prácticamente nunca.

No era la carta, era la IA. Mi heurística valoraba **un solo asalto de combate**: si un dinosaurio no mataba a nadie ese turno, no valía nada. Un muro de 10 de Vida no mata nunca, pero bloquea cinco turnos. Añadiendo un factor de permanencia —cuántos turnos se espera que aguante— *Diplodocus* pasó de 0,09 a 0,72 y las mal calibradas cayeron de 16 a 11.

Merece la pena anotarlo: **una IA mala hace que cartas buenas parezcan rotas.** Cualquier lectura del balance vale lo que valga la IA que lo genera.

### 12.5 Lo que sigue mal

Tres cartas fuera de banda, todas por debajo:

| Carta | Índice | Lectura |
|---|---|---|
| Sabana de helechos | 0,70 | Justo en el borde. No la toco. |
| Crecimiento acelerado | 0,61 | A coste 3 compite con desplegar un dinosaurio entero. |
| Mortandad estacional | 0,44 | Daña a los dos bandos: sólo interesa cuando vas perdiendo el campo. Es situacional **por diseño**. |

No he ensanchado la banda para que pasen. Puede que el criterio 0,70–1,30, pensado para un mazo que era todo dinosaurios, no sea el adecuado para cartas situacionales de campo y presión: una carta que sólo se juega cuando toca **debe** tener un índice bajo. Queda planteado, no resuelto por mi cuenta.

### 12.6 Estado del proyecto

- `v1/` — la versión anterior, **jugable**, congelada con sus 57 tests. `cd v1 && python -m http.server 8001`
- La raíz es ahora la v2: motor, simulador y tests. **La interfaz todavía no existe**: `index.html` y `src/ui/` siguen siendo los de la v1 y apuntan a una API que ya no está, así que la v2 no se puede jugar aún. Es lo previsto para V2-0.

| Hito | Estado |
|---|---|
| V2-0 motor + simulador | ✅ |
| V2-1 set de cartas revisado | 🟡 escrito, pendiente de tu revisión |
| V2-2 IA heurística | ✅ adelantado, hizo falta para calibrar |
| V2-3 tablero de ranuras | ⬜ |
| V2-4 pulido y deploy | ⬜ |

---

## 13. V2-3 — la v2 ya se juega

Cinco ranuras por bando (era 4). El cambio no rompió el balance y hasta mejoró el reparto de victorias; sobre 2.000 partidas: duración **11,67** turnos, jugador inicial **50,8 %**, bola de nieve **62,8 %**, reparto **48 % / 34 % / 18 %**. Sigue fallando el mismo objetivo: 5 cartas de 20 fuera de la banda de calibración, todas situacionales y por debajo.

### 13.1 El tablero

```
       BIOMA RIVAL  ████████████░░░░  20
   ┌────┬────┬────┬────┬────┐
   │    │    │    │ R4 │ R5 │      fila del rival
   ├────┴────┴────┴────┴────┤
   │  Sabana de helechos    │      franja de campo
   ├────┬────┬────┬────┬────┤
   │ T1 │    │    │    │    │      tu fila
   └────┴────┴────┴────┴────┘
       TU BIOMA     ███░░░░░░░░░░   4
```

Cada ranura mide 67×94 px a 360 px de ancho, así que la carta se lee entera: coste, Poder, arte, nombre binomial y **barra de Vida con heridas**, que es el dato nuevo de la v2 y tenía que verse siempre.

Las cuatro familias se distinguen por el color del borde: dinosaurio, adaptación (ámbar), presión (rojo) y campo (azul).

### 13.2 Cómo se juega cada familia

Arrastrar y soltar, y el destino válido se resalta mientras arrastras:

| Carta | Dónde se suelta |
|---|---|
| Dinosaurio | una de tus ranuras libres |
| Adaptación | sobre un dinosaurio **tuyo** |
| Fractura consolidada | sobre un dinosaurio **del rival** |
| Competencia trófica | sobre el campo; luego eliges el clado en un diálogo |
| Mortandad estacional | sobre el campo |
| Campo | en la franja central |

Si sueltas donde no toca, el mensaje dice exactamente dónde va esa familia en vez de limitarse a rechazarla.

### 13.3 Una decisión sobre la información oculta

En la v1 se veían las cartas comprometidas del rival como dorsos **en su zona**. Con ranuras enfrentadas eso sería una filtración grave: saber en qué ranura ha jugado el rival es justo lo que necesitas para bloquearle. Ahora la franja central sólo dice **cuántas** ha comprometido, nunca dónde. Tus propias cartas ocultas sí se ven, con borde discontinuo: son tuyas, ya sabes qué has jugado.

### 13.4 El combate

La cámara recorre las ranuras de la 1 a la 5 sobre el tablero previo al combate: sacude las cartas que se golpean, saca números de daño flotantes, tumba a las bajas y baja la barra del bioma. Las ranuras sin acción se saltan.

### 13.5 Verificado en navegador

A 360×640, conduciendo la interfaz real con Pointer Events:

| | |
|---|---|
| Partida completa hasta el final | ✅ 6 turnos, victoria por colapso del bioma |
| Errores en consola | ✅ ninguno |
| Scroll, rebote o zoom | ✅ `scrollWidth/Height` == viewport |
| Arrastre carta → ranura | ✅ paga, sale de la mano, queda boca abajo |
| Abanico con 9 cartas (7 de límite + 2 de robo) | ✅ no invade el botón |
| Reinicio tras el final | ✅ turno 1 limpio, récord persistido |

Un fallo encontrado y corregido: con 9 cartas la curva del abanico metía las de los extremos dentro del botón Listo. La caída vertical ahora está topada.

### 13.6 Estado

| Hito | Estado |
|---|---|
| V2-0 motor + simulador | ✅ |
| V2-1 set de cartas | 🟡 escrito, pendiente de revisión |
| V2-2 IA heurística | ✅ |
| V2-3 tablero jugable | ✅ |
| V2-4 pulido y publicación | ⬜ |

---

## 14. V2-4 — la meta, el set abierto y la calibración

La v2 se publicó, se le añadió la capa de fuera de la partida (colección,
sobres y mazos), el set creció a 31 cartas y se abrió a formaciones que no son
la Morrison. Lo que sigue son las decisiones que quedaban sueltas y cómo se han
cerrado.

### 14.1 El Consumo hídrico se va

Cada dinosaurio llevaba un cuarto número —Consumo hídrico— que sólo existía
para un momento del turno: la Sequía estacional. El jugador lo veía en la ficha
sin poder hacer nada con él y sin poder preverlo desde el tablero, porque en la
carta jugada no se enseña.

La Sequía pasa a cobrar según la **Vida**: 1 herida, y 2 a partir de 7. Dice lo
mismo que decía —el cuerpo grande necesita más agua— con un dato que ya está en
la carta y en la ranura. *Camarasaurus* sigue inmune y el Canal fluvial sigue
anulándola.

Efecto medido: ninguno reseñable en las seis métricas. Y un efecto lateral que
sí importa: la **Mortandad estacional**, fuera de banda desde V2-0, entra sola
(0,74). Sus heridas ya no se solapaban con las de la Sequía.

### 14.2 El índice medía el mazo, no la carta

La pregunta abierta de §12.5 era si la banda 0,70–1,30 vale para cartas
situacionales. La respuesta resultó ser otra: **para tres de las cartas fuera de
banda el problema no era la carta, era cuántas copias llevaba el mazo**.

Sólo puede haber un paleoambiente activo. Llevar tres Sabanas de helechos
significa que la segunda y la tercera no tienen dónde ir; el índice —cuota de
jugadas contra peso en el mazo— cobraba a la carta lo que era un defecto de la
lista. Bajando los climas a una copia, la Sabana pasa de **0,50 a 0,68** sin
tocarle un solo número.

Para separar las dos cosas, el simulador mide ahora una segunda cifra, el
**uso**: de las copias que llegaron a una mano, cuántas se jugaron. No lo mueve
la lista. Con él, veintitrés de las veinticinco cartas del mazo caen entre el
75 % y el 92 %, y las dos que no lo hacen se ven de un vistazo.

Las cuatro plazas que liberan los climas van a Rebrote y a dos cartas que el
mazo de referencia nunca había medido —Neumaticidad y Competencia trófica—, que
salen calibradas a la primera (0,98 y 1,05). Quedan cuatro sin medir: bosque,
llanura, carroña y lago.

### 14.3 Deriva árida: fuera de banda y aun así imprescindible

Es la única que resiste. Índice 0,46 y uso 40 % después de probarle tres
variantes —coste 1, mordida de 8 cartas, y mordida proporcional al tamaño de los
dinosaurios en juego—: ninguna la mueve. La IA la evalúa bien. Muele el mazo de
los dos bandos por igual, así que no cambia quién gana la carrera; sólo la
acorta, y eso sólo interesa si ya vas por delante.

La tentación era sacarla del mazo de referencia. Se probó: **sin ella la
extinción cae del 21 % al 9 %** (800 partidas), fuera del objetivo de que cada
vía valga entre el 15 % y el 60 %. La carta que casi nunca se juega es la que
sostiene una de las tres formas de ganar — existir como amenaza es su función, y
el índice no sabe medir eso.

Así que se queda, y el objetivo de «0 cartas mal calibradas» se declara
**incumplido a propósito**, con una carta y con el motivo escrito. Bajar la
banda para que pase sería cambiar el termómetro.

### 14.4 Interfaz

- El marcador se pisaba a sí mismo: diez recursos con su nombre no caben en una
  fila de 360 px. Pasa a una fila por bando, con el turno en columna propia.
- La barra de hábitat nunca bajaba: se dividía por una constante que no existe
  (`vidaBioma` en vez de `vidaHabitat`), el ancho salía `NaN%` y el navegador
  descartaba la declaración.
- Las cartas se pueden ampliar: la ilustración a pantalla completa y la carta
  entera a 3,1× desde la ficha.
- Se puede **rendirse** y se puede **volver al menú** al terminar. Antes, la
  única salida de la pantalla de fin era empezar otra partida.
- La ayuda explica cómo interactúan Ataque, Defensa y Vida, con el choque de
  ejemplo calculado desde las cartas reales.

### 14.5 Pendiente

- **Cuatro cartas sin medir**: bosque, llanura, carroña y lago. Están en la
  colección y no en el mazo de referencia.
- **Sin CI**: `npm test`, `npm run sim` y `node sim/set.js` se corren a mano.

### 14.6 El mazo se queda en 50

Se planteó bajarlo. Medido, a 40 cartas las seis métricas siguen dentro
—10,3 turnos, inicial 51,7 %, bola 56,9 %— pero el reparto se mueve a
**30/29/41**: la extinción deja de ser una de tres vías y pasa a ser la vía. No
es un problema de balance, es otro juego, y además invalidaría los mazos
guardados de quien ya juega.

**Decisión del autor del proyecto: se queda en 50.** Queda medido por si algún
día interesa un formato corto.

### 14.7 Estado

| Hito | Estado |
|---|---|
| V2-0 motor + simulador | ✅ |
| V2-1 set de cartas | ✅ 31 cartas, todas con referencia |
| V2-2 IA heurística | ✅ |
| V2-3 tablero jugable | ✅ |
| V2-4 pulido y publicación | ✅ publicado, con la meta encima |
| V2-5 calibración | 🟡 1 de 25 fuera de banda, documentada en §14.3 |

---

## 15. V2-6 — el rediseño visual

Encargo del autor, resuelto fuera con Claude Design y entregado como paquete de
referencia (prototipo HTML + memoria de tokens). El motivo declarado: el juego
«parecía tosco, no parecía un videojuego». No cambia ninguna regla ni ningún
número: reordena la jerarquía, unifica la paleta y le da presencia física a lo
que en una mesa es un objeto.

### 15.1 Lo que trae

- Paleta **resina**: un solo acento cálido sobre tierra oscura, en vez de los
  cuatro colores sueltos (verde propio, naranja trofeo, azul agua, rojo vida)
  que competían entre sí.
- **Inter vendorizada**: 48 KB, variable, pesos 300–600. No se trae de un CDN
  porque el juego no pide nada a terceros; es la misma regla que ya cumplían las
  ilustraciones y el audio.
- Una **composición de carta única** para las tres escalas —ranura, mano y
  lectura—: ventana de arte arriba, coste en círculo sobre ella, nombre y
  cifras debajo. Lo que cambia entre ellas es el tamaño, nunca el orden.

### 15.2 La clave de estadísticas

Es el cambio funcional del rediseño, no sólo cosmético. Ataque, Defensa y Vida
eran tres números iguales en fila y no había manera de saber cuál era cuál sin
abrir la ficha. Ahora llevan **glifo y color fijos en todas las pantallas**: A
ámbar, D acero, V arcilla. La Vida enseña el máximo sólo cuando hay heridas
—«5» de sano, «2/6» herido— y la barra de vida desaparece: decía menos que la
cifra y ocupaba más.

### 15.3 Dos cosas del paquete que no se han portado

- **Las ranuras ocultas del rival.** El prototipo las dibuja con el emblema
  sobre el motivo de escamas. Enseñar en qué ranura ha desplegado el rival es
  exactamente la información que el juego oculta a propósito (§13.3): sería
  regalar la lectura del despliegue. El motivo sí se reutiliza donde no filtra
  nada — reverso, sobre y pila de mazo.
- **Las pilas de escritorio de 88×124 px.** El juego es vertical y a 360 px no
  caben; se usa la ficha reducida de dos capas que el propio paquete describe
  para móvil.

### 15.4 Fallos que salieron al aplicarlo

- La mano en fila trajo desbordamiento lateral, y con él un fallo nuevo: al
  desplazarla, el navegador se queda el gesto y manda `pointercancel`, que caía
  en el mismo camino que un toque y abría una ficha por cada arrastre. Ahora se
  limpia sin abrir nada.
- Medir el alto de las ranuras en `vh` desbordaba la pantalla en 360×640, que es
  la más pequeña que el juego declara soportar. Las filas se reparten el hueco
  que queda.
- El tutorial era una cola estricta: un turno 1 sin Biomasa para desplegar lo
  dejaba parado para siempre en el paso del despliegue. Pasa a ser una lista de
  pasos pendientes y se enseña el primero que encaje con lo que acaba de pasar.

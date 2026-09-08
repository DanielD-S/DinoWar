# GAME_SPEC.md — Demo TCG territorial: Formación Morrison

Documento de especificación para implementación. Léelo completo antes de escribir código.

---

## 0. Instrucción de trabajo

1. Lee este documento entero.
2. Escribe `PLAN.md` con tu orden de implementación, decisiones de estructura de datos y dudas. **Detente ahí y espera aprobación.**
3. Implementa por hitos (sección 12). Cada hito debe ser verificable de forma independiente.
4. Si algo de esta spec es ambiguo o contradictorio, pregunta. No asumas.
5. No inventes contenido paleontológico. Ver sección 2: es una restricción dura, no una preferencia estética.

---

## 1. Premisa

Juego de cartas por turnos, un jugador contra IA, para navegador móvil.

El jugador dirige una población de dinosaurios en la **Formación Morrison** (Jurásico Superior, Kimmeridgiense–Titoniense, ~155–146 Ma, oeste de Norteamérica). Compite contra otra población por el control de cuatro paleoambientes que producen recursos. Las cartas se despliegan **boca abajo** y se revelan **simultáneamente**: la tensión central del juego es la información oculta, no la aleatoriedad.

Gana quien acumule **15 puntos de Territorio**.

Partida objetivo: **10–14 turnos, 6–8 minutos**.

---

## 2. Restricciones paleontológicas (dura)

Esta es la regla que diferencia el juego. Se aplica sin excepciones:

- **Ningún híbrido, quimera ni especie inventada.** Todos los taxones existen y están descritos formalmente.
- **Ningún anacronismo.** Todos los taxones provienen de la Formación Morrison y son plausiblemente contemporáneos y simpátricos. No se mezclan continentes ni períodos. Nada de *Tyrannosaurus* ni *Velociraptor*.
- **Nomenclatura binomial correcta**, en cursiva, con la especie tipo o la más completa conocida.
- **Sin inflación de tamaño ni de "poder"**: los valores de Poder correlacionan con masa corporal estimada y rol trófico reales.
- **Cada rasgo de carta declara su nivel de evidencia**, visible para el jugador en la ficha de la carta:
  - `ESTABLECIDO` — respaldado por evidencia fósil directa y consenso amplio.
  - `INFERIDO` — hipótesis razonable a partir de tafonomía, morfología funcional o analogía con fauna actual.
  - `DEBATIDO` — hipótesis publicada pero activamente discutida.
- **Sin plumas en los taxones donde no hay evidencia** (todos los de este set son escamosos o de tegumento desconocido; no se representan plumas en ninguno).
- Las cartas de Adaptación son **rasgos biológicos reales**, no mutaciones. No hay "evolución" dentro de la partida.
- Los eventos climáticos reflejan la **estacionalidad semiárida real** de la Morrison, documentada en paleosuelos y depósitos evaporíticos.

Cada carta lleva un campo `nota_cientifica` de 1–2 frases con el fundamento. Se muestra al mantener pulsada la carta.

---

## 3. Recursos

| Recurso | Símbolo | Uso | Se acumula |
|---|---|---|---|
| **Biomasa** | vegetación / presa disponible | Pagar el despliegue de cartas | Sí |
| **Agua** | acceso hídrico | Sostenimiento durante sequías; habilitar ciertos rasgos | Sí |
| **Territorio** | dominio ecológico | Puntaje de victoria. **No se gasta** | Sí |

Cada dinosaurio tiene un valor de **Consumo hídrico**. En turnos normales no se paga. Solo se paga durante el evento `Sequía estacional`. Esto mantiene el turno normal simple y hace que la sequía duela.

---

## 4. Zonas

Cuatro paleoambientes reales de la Morrison. Producción por turno **para quien la domine**:

| # | Zona | Biomasa | Agua | Territorio | Nota |
|---|---|---|---|---|---|
| 1 | Llanura de inundación | 3 | 0 | 1 | Alta productividad vegetal estacional |
| 2 | Canal fluvial trenzado | 1 | 3 | 1 | Agua permanente, vegetación ribereña estrecha |
| 3 | Bosque de coníferas ribereño | 2 | 1 | 1 | Ramoneo alto disponible |
| 4 | Sabana de helechos | 1 | 0 | 3 | Semiárida, abierta, gran extensión |

**Zona 4 es el motor de victoria pero no alimenta a nadie.** Dominarla obliga a sostenerla con recursos producidos en otra parte. Ese es el dilema estructural del juego.

Una zona está **dominada** por el bando con mayor Poder total en ella al final de la resolución. Empate = zona neutral, nadie produce.

---

## 5. Bucle de turno

```
1. PRODUCCIÓN      Cada bando cobra la producción de las zonas que domina.
2. ESTACIÓN        Desde el turno 4: se voltea la carta superior de la
                   baraja estacional (compartida, neutral). Se resuelve
                   antes del despliegue.
3. ROBO            1 carta. Si no dominas ninguna zona, robas 2.
4. DESPLIEGUE      Ambos bandos colocan cartas boca abajo en las zonas,
                   pagando Biomasa. Simultáneo, sin ver al rival.
                   Máximo 2 cartas por zona por turno.
5. REVELACIÓN      Se voltea todo a la vez.
                   Orden: cartas normales → rasgo Emboscada → Adaptaciones.
6. RESOLUCIÓN      Por zona, de la 1 a la 4:
                   - Se suma Poder de cada bando (con modificadores).
                   - Mayor Poder domina la zona.
                   - El bando perdedor pierde su dinosaurio de menor Poder
                     en esa zona (descarte).
                   - Se disparan rasgos de muerte/victoria.
7. CHEQUEO         ¿Algún bando llegó a 15 de Territorio? Fin.
                   ¿Se agotó el mazo? Se baraja el descarte.
```

Mano máxima: **6 cartas**. Al exceder, se descarta al final del turno.

---

## 6. Set de cartas — Dinosaurios (9)

Todos de la Formación Morrison.

| Carta | Poder | Coste (Biomasa) | Consumo hídrico | Rasgo | Evidencia |
|---|---|---|---|---|---|
| *Allosaurus fragilis* | 5 | 4 | 1 | **Depredador dominante** — al ganar una zona, elimina un segundo dinosaurio rival de esa zona. | ESTABLECIDO |
| *Ceratosaurus nasicornis* | 4 | 3 | 2 | **Ribereño** — +2 Poder en Canal fluvial. | DEBATIDO |
| *Torvosaurus tanneri* | 6 | 6 | 2 | **Escaso** — solo 1 copia en el mazo. Sin sinergias. | ESTABLECIDO |
| *Ornitholestes hermanni* | 1 | 1 | 0 | **Oportunista** — +1 Biomasa cada vez que muere cualquier dinosaurio en su zona. | INFERIDO |
| *Apatosaurus louisae* | 6 | 5 | 3 | **Masa colosal** — sobrevive la primera baja que le correspondería. | ESTABLECIDO |
| *Diplodocus carnegii* | 4 | 4 | 3 | **Ramoneo bajo** — +1 Biomasa de producción en su zona. | ESTABLECIDO |
| *Camarasaurus grandis* | 5 | 5 | 2 | **Migrador** — puede reubicarse a una zona adyacente en vez de desplegar. Inmune a Sequía estacional. | ESTABLECIDO |
| *Stegosaurus stenops* | 3 | 3 | 1 | **Tagomizador** — aunque pierda la zona, elimina un dinosaurio del bando ganador. | ESTABLECIDO |
| *Dryosaurus altus* | 1 | 1 | 0 | **Gregario** — +1 Poder por cada otro *Dryosaurus* en la misma zona. | INFERIDO |

### Notas científicas (campo `nota_cientifica`)

- **Allosaurus** — Taxón de terópodo más abundante de la Morrison. Marcas de mordida atribuidas a *Allosaurus* aparecen en huesos de saurópodos y de *Stegosaurus*.
- **Ceratosaurus** — Menos frecuente que *Allosaurus*. Se ha propuesto una dieta con mayor componente de presa acuática y un uso preferente de ambientes ribereños, a partir de morfología dental y contexto de hallazgos. Hipótesis discutida.
- **Torvosaurus** — El terópodo de mayor tamaño de la formación, pero genuinamente raro en el registro. Su escasez en el mazo replica su escasez fósil.
- **Ornitholestes** — Terópodo pequeño (~2 m). El comportamiento carroñero es una inferencia a partir de talla y analogía ecológica, no de evidencia directa.
- **Apatosaurus** — La talla adulta de los diplodócidos es en sí misma la principal defensa antipredatoria. Nota: la validez de *Brontosaurus* como género separado sigue en discusión; el juego usa *Apatosaurus*.
- **Diplodocus** — El desgaste dental y la postura del cuello sustentan una partición de nicho por ramoneo bajo respecto de otros saurópodos coexistentes.
- **Camarasaurus** — Análisis isotópicos de esmalte dental sugieren desplazamientos estacionales hacia tierras altas durante la estación seca, a diferencia de otros saurópodos de la misma formación. El rasgo Migrador refleja ese resultado.
- **Stegosaurus** — Una vértebra caudal de *Allosaurus* con una perforación compatible con una púa caudal de *Stegosaurus* es evidencia directa de uso defensivo del tagomizador.
- **Dryosaurus** — Ornitópodo pequeño y cursorial. El gregarismo se infiere de acumulaciones multiindividuo, no está demostrado.

---

## 7. Set de cartas — Adaptaciones (3)

Rasgos biológicos reales. Se juegan sobre un dinosaurio ya desplegado.

| Carta | Coste | Efecto | Evidencia |
|---|---|---|---|
| **Gregarismo** | 2 | Todos los dinosaurios de la misma especie en esa zona ganan +1 Poder. | INFERIDO |
| **Gastrolitos** | 2 | El dinosaurio objetivo aporta +1 Biomasa de producción mientras siga en juego. | ESTABLECIDO |
| **Crecimiento acelerado** | 3 | El dinosaurio objetivo gana +2 Poder permanente si sobrevive al turno en que se juega. | ESTABLECIDO |

- **Gregarismo** — Acumulaciones monoespecíficas en la Morrison sugieren agregación en varios taxones. La interpretación de estos yacimientos es discutida (¿manada viva o concentración tafonómica?).
- **Gastrolitos** — Piedras de molleja asociadas a esqueletos de saurópodos jurásicos. Su función exacta en la digestión sigue en debate.
- **Crecimiento acelerado** — La osteohistología muestra tasas de crecimiento altas y sostenidas en saurópodos y en *Allosaurus*, alcanzando talla adulta en pocas décadas o menos.

---

## 8. Baraja estacional (2 tipos, 6 cartas)

Baraja neutral compartida. Se voltea una carta por turno desde el turno 4. Ningún jugador la controla: el clima no es una decisión, es una presión.

| Carta | Copias | Efecto | Evidencia |
|---|---|---|---|
| **Sequía estacional** | 3 | Cada dinosaurio en juego debe pagar su Consumo hídrico en Agua. Los que no se puedan pagar mueren (el dueño elige el orden). *Camarasaurus* es inmune. | ESTABLECIDO |
| **Crecida monzónica** | 3 | Llanura de inundación y Canal fluvial duplican su producción este turno. Desplegar en Sabana de helechos cuesta +1 Biomasa. | ESTABLECIDO |

- **Sequía / Crecida** — Los paleosuelos, los depósitos evaporíticos y la estructura de los yacimientos de la Morrison indican un clima marcadamente estacional, semiárido, con precipitación concentrada. Algunas acumulaciones óseas se han interpretado como mortandades asociadas a sequía o a eventos de crecida.

---

## 9. Composición del mazo (20 cartas, fijo en el demo)

Ambos bandos usan el mismo mazo. No hay construcción de mazos en el demo.

```
3 × Dryosaurus altus
2 × Ornitholestes hermanni
2 × Stegosaurus stenops
2 × Diplodocus carnegii
2 × Camarasaurus grandis
1 × Apatosaurus louisae
2 × Ceratosaurus nasicornis
2 × Allosaurus fragilis
1 × Torvosaurus tanneri
1 × Gregarismo
1 × Gastrolitos
1 × Crecimiento acelerado
────────────────────────
20
```

Mano inicial: 4 cartas. Recursos iniciales: 4 Biomasa, 2 Agua, 0 Territorio. El segundo jugador empieza con +1 Biomasa.

---

## 10. Objetivos de balance (validar en H0, antes de la interfaz)

Corre **2.000 partidas IA aleatoria vs IA aleatoria** en Node y verifica:

| Métrica | Objetivo | Acción si falla |
|---|---|---|
| Duración media | 10–14 turnos | Ajustar umbral de victoria o producción de zona 4 |
| Victorias del jugador inicial | 48–55 % | Ajustar compensación del segundo jugador |
| Frecuencia de juego por carta | 20–80 % de las partidas | Carta fuera de rango = coste o poder mal calibrado |
| Zona más disputada | Ninguna zona dominada por el mismo bando >70 % de los turnos | Rebalancear producción |
| Partidas terminadas por agotamiento de mazo | < 5 % | Subir producción o bajar umbral |

Estas cifras van en `BALANCE.md`, regenerado en cada cambio de números.

---

## 11. IA rival

Heurística, sin ML. Puntúa cada despliegue posible:

```
valor = (produccion_zona × P(ganar_zona)) + (territorio_zona × peso_fase) − coste_biomasa
```

`P(ganar_zona)` se estima con el Poder visible propio, el histórico de despliegue del rival en esa zona y las cartas ya descartadas.

Tres perfiles seleccionables:
- **Territorial** — sobrepondera zona 4 (Sabana de helechos).
- **Economista** — sobrepondera zonas 1 y 3, juega a asfixiar por recursos.
- **Reactiva** — refuerza la zona donde perdió el turno anterior.

En el demo la IA usa el perfil **Reactiva** por defecto.

---

## 12. Hitos

| Hito | Contenido | Verificación |
|---|---|---|
| **H0** | Motor de reglas headless en Node. Simulador IA aleatoria vs IA aleatoria. `BALANCE.md` generado. | Los 5 objetivos de la sección 10 se cumplen |
| **H1** | Esqueleto técnico: loop, máquina de estados, escalado por devicePixelRatio, safe-area, Pointer Events. | Pantalla vacía estable a 60 fps, sin scroll ni zoom |
| **H2** | Refactor del motor de H0 a módulo de funciones puras `(estado, acción) → estado`. Cero DOM. | Los tests de H0 siguen pasando sin cambios |
| **H3** | Interfaz de partida: mano en abanico, 4 zonas, arrastrar carta a zona, contadores de recursos, ficha de carta con nota científica. | Partida completa jugable contra IA aleatoria |
| **H4** | IA heurística con los 3 perfiles. | El perfil Reactiva gana >60 % contra la IA aleatoria |
| **H5** | Legibilidad de la revelación: volteo simultáneo, suma de Poder animada, resaltado de zona ganada, log de turno. | Un tester externo explica correctamente por qué perdió una zona |
| **H6** | Pulido móvil, mute, persistencia de mejor puntaje, deploy en GitHub Pages. | Criterios de aceptación (sección 14) |

**H0 es el hito más importante.** Un día de simulación acá ahorra tres de rebalanceo con la interfaz ya construida. No lo saltes.

---

## 13. Requisitos técnicos

**Stack**
- HTML + CSS + JavaScript vanilla (ES modules). **Renderizado con DOM + CSS transforms, no Canvas** — se necesita texto nítido en cartas pequeñas, reflow por tamaño de pantalla y arrastre.
- Sin frameworks, sin build step, sin dependencias externas ni CDNs.
- Funciona sirviendo el directorio con `python3 -m http.server`. Desplegable tal cual en GitHub Pages.
- Arte generado por código: SVG inline y CSS. Sin binarios pesados.

**Móvil**
- Orientación vertical. De 360×640 a 430×932.
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">`
- Respetar `safe-area-inset-*`.
- Pointer Events únicamente. `touch-action: none`, `overscroll-behavior: none`, sin selección de texto, sin zoom por doble tap, sin pull-to-refresh.
- Zonas táctiles mínimo 44×44 px, en el tercio inferior. Jugable con una mano.
- Audio inicializado solo tras el primer gesto (desbloqueo de `AudioContext`). Botón de mute persistente.
- Pausar en `visibilitychange`; al volver, no acumular delta time.

**Arquitectura**
- Motor de reglas: funciones puras, sin DOM, ejecutable en Node.
- Interfaz: solo lee el estado, nunca lo muta directamente.
- Máquina de estados explícita: `BOOT → MENU → PLAYING → RESOLVING → GAME_OVER`.
- Todos los números de balance en un solo `data/balance.js`. Ninguna constante numérica dispersa en la lógica.
- Todos los datos de carta en `data/cards.js`, incluyendo `nota_cientifica` y `nivel_evidencia`.
- Mejor puntaje en `localStorage` con `try/catch`.
- Overlay de debug (fps, estado, mano de la IA) con `?debug=1`.

**Estructura**
```
index.html
style.css
src/
  main.js
  engine/      (puro, testeable en Node)
    state.js
    actions.js
    resolve.js
    ai.js
  ui/
    render.js
    input.js
    animate.js
  data/
    cards.js
    balance.js
sim/
  run.js       (simulador de balance)
PLAN.md
BALANCE.md
```

---

## 14. Criterios de aceptación

1. 60 fps estables en un móvil de gama media, incluida la animación de revelación.
2. Ningún scroll, rebote ni zoom accidental durante la partida.
3. Jugable íntegramente con una mano, en vertical.
4. Reinicio limpio: tras `GAME_OVER` no quedan timers, listeners ni entidades de la partida previa.
5. Sin errores ni advertencias en consola.
6. Un jugador nuevo entiende el objetivo en menos de 10 segundos sin tutorial.
7. Tras cada resolución, el jugador puede explicar por qué ganó o perdió cada zona.
8. Toda carta muestra nombre binomial correcto, nivel de evidencia y nota científica.
9. `BALANCE.md` refleja la última corrida del simulador y cumple los objetivos de la sección 10.

---

## 15. Fuera de alcance

Construcción de mazos, multijugador, backend, cuentas, monetización, más de una formación geológica, tutorial interactivo, más de 4 zonas, tiempo real.

# PLAN.md — Formación Morrison (demo TCG territorial)

Plan de implementación derivado de `GAME_SPEC.md`. **Pendiente de aprobación antes de escribir código.**

Estado del repositorio: vacío salvo `GAME_SPEC.md`. Entorno: Node v22.15.0 (dispongo de `node:test` y `node --test` nativos, así que los tests de H0/H2 no añaden dependencias). Sin build step, sin CDNs.

---

## 1. Orden de implementación

El orden sigue los hitos de la sección 12, con una desviación deliberada: **H0 se escribe ya con la forma de módulo puro que pide H2**. Escribir el motor dos veces (primero imperativo para simular, luego refactorizado a puro) es trabajo tirado y arriesga que "los tests de H0 siguen pasando" se vuelva trivial en vez de significativo. H2 pasa entonces a ser *verificación* (auditar que no hay DOM, que `reduce` es determinista y libre de efectos) en vez de *refactor*.

| Orden | Hito | Entregable | Verificación |
|---|---|---|---|
| 1 | **H0.a** | `data/cards.js`, `data/balance.js`, `engine/state.js`, `engine/actions.js`, `engine/resolve.js` + tests unitarios de cada rasgo | `node --test` verde: un test por rasgo de carta, uno por evento estacional, uno por regla de dominación |
| 2 | **H0.b** | `engine/ai.js` con perfil `random`, `sim/run.js` (2.000 partidas, semilla fija) | El simulador corre y emite JSON de métricas |
| 3 | **H0.c** | `BALANCE.md` generado + iteración sobre `data/balance.js` | Las 5 métricas de la sección 10 dentro de objetivo |
| 4 | **H1** | `index.html`, `style.css`, `src/main.js`, loop + máquina de estados + escalado DPR + safe-area | Pantalla estable, sin scroll/zoom, 60 fps, consola limpia |
| 5 | **H2** | Auditoría de pureza + `test/purity.test.js` | El motor se importa en Node sin `globalThis.document`; `reduce` con la misma semilla da el mismo estado |
| 6 | **H3** | `ui/render.js`, `ui/input.js` — mano en abanico, 4 zonas, arrastre, contadores, ficha con `nota_cientifica` | Partida completa contra IA aleatoria en móvil |
| 7 | **H4** | Perfiles `territorial`, `economista`, `reactiva` en `engine/ai.js` | `reactiva` gana >60 % contra `random` en 2.000 partidas |
| 8 | **H5** | `ui/animate.js` — volteo simultáneo, suma de Poder animada, resaltado, log de turno | Tester externo explica por qué perdió una zona |
| 9 | **H6** | Pulido móvil, mute, `localStorage`, deploy GitHub Pages | Criterios de la sección 14 |

Cada paso es un commit verificable por separado. No empiezo H1 hasta que `BALANCE.md` cumpla.

---

## 2. Estructura de datos

### 2.1 Principio: instancias planas, zonas por referencia

Hay múltiples copias de la misma carta y las cartas **acumulan estado propio** (`+2` de Crecimiento acelerado, "Masa colosal" ya gastada, adaptaciones adheridas). Por tanto separo *definición* de *instancia*:

```js
// data/cards.js — inmutable, nunca se copia
{
  id: 'allosaurus',
  tipo: 'DINOSAURIO',           // | 'ADAPTACION'
  binomial: 'Allosaurus fragilis',
  poder: 5, coste: 4, consumoHidrico: 1,
  rasgo: { id: 'DEPREDADOR_DOMINANTE', nombre: 'Depredador dominante', texto: '…' },
  nivel_evidencia: 'ESTABLECIDO',
  nota_cientifica: '…'
}
```

```js
// GameState — todo serializable, sin Map/Set/clases/funciones
{
  seed: 1234, rng: 987654321,        // estado del PRNG, dentro del estado (determinismo)
  turno: 1,
  fase: 'ESTACION'|'PRODUCCION'|'ROBO'|'DESPLIEGUE'|'REVELACION'|'RESOLUCION'|'CHEQUEO'|'FIN',
  jugadorInicial: 0,
  estacion: { mazo: ['SEQUIA', …], actual: null, descarte: [] },
  siguienteInstId: 1,
  instancias: {                       // mapa plano id → instancia
    12: { iid: 12, cardId: 'allosaurus', dueno: 0, zona: 2, oculta: false,
          modPoder: 0,                // Crecimiento acelerado, permanente
          colosalGastado: false,      // Apatosaurus
          adherencias: [31],          // iids de adaptaciones sobre este dino
          adheridoA: null, desplegadoEnTurno: 3 }
  },
  jugadores: [
    { biomasa: 4, agua: 2, territorio: 0,
      mazo: [iid…], mano: [iid…], descarte: [iid…],
      pendientes: [ {iid, zona} … ],  // despliegue oculto de este turno
      desplieguesPorZona: [0,0,0,0], listo: false }
  ],
  zonas: [ { id: 1, unidades: [iid…] } … ],  // orden de despliegue preservado
  eventos: [],                        // log del turno actual, consumido por la UI
  ganador: null
}
```

**Por qué mapa plano de instancias y no objetos anidados en las zonas**: las mutaciones puras (`{...state, instancias: {...}}`) tocan un solo nivel; buscar "todas las unidades del jugador 0" no exige recorrer 4 arrays; y las adaptaciones apuntan a un `iid` estable aunque la unidad se reubique (Camarasaurus).

**Todas las cartas son instancias desde el reparto**, incluso en el mazo. Así una carta conserva identidad entre mano → zona → descarte → remezcla, y el log de turno puede referirse a "el mismo *Stegosaurus*".

### 2.2 Reducer

```js
// engine/actions.js
reduce(state, action) → { state, eventos }   // puro, sin excepciones para acciones ilegales
legales(state, jugador) → Action[]           // usado por la IA y para validar la UI
```

Acciones: `DESPLEGAR{jugador,iid,zona}`, `REUBICAR{jugador,iid,zonaDestino}`, `ADAPTAR{jugador,iid,objetivoIid}`, `PASAR{jugador}`, `PAGAR_SEQUIA{jugador,ordenSacrificio}`, `DESCARTAR{jugador,iid}`, `AVANZAR{}`.

Las fases automáticas (producción, robo, revelación, resolución) las ejecuta `AVANZAR`; nunca hay una acción de jugador dentro de ellas. Las acciones ilegales devuelven el estado intacto más un evento `RECHAZADA` — la UI no puede romper el motor y la IA no puede hacer trampa.

**Inmutabilidad**: copia estructural manual en las rutas calientes (`resolve.js`), `structuredClone` en las frías. A 2.000 partidas × ~13 turnos el coste es irrelevante y evita mutaciones accidentales.

**PRNG**: `mulberry32` con la semilla en el estado. Toda partida es reproducible desde `seed`; `BALANCE.md` registra la semilla base del lote.

### 2.3 Balance centralizado

`data/balance.js` exporta un único objeto congelado: umbral de victoria, mano inicial y máxima, recursos iniciales, compensación del segundo jugador, cartas robadas (normal / sin zonas), máximo de despliegues por zona, tabla de producción de las 4 zonas, composición del mazo y de la baraja estacional, pesos de la IA. **Ninguna constante numérica fuera de ahí** — es la condición para que reajustar el balance sea editar un archivo y volver a correr el simulador.

### 2.4 Simulador

`sim/run.js`: N partidas con semillas `seed+i`, agregación en streaming (sin guardar 2.000 estados), salida a `BALANCE.md` (y a stdout en JSON con `--json`). Métricas: duración media y percentiles, victorias del jugador inicial, % de partidas en que se juega cada carta, % de turnos que cada zona pasa dominada por cada bando, partidas terminadas por agotamiento, y —añadido— territorio medio por turno y tasa de partidas que topan el límite de turnos.

---

## 3. Interpretaciones que aplicaré (por defecto)

La spec no las cierra. Voy con esto salvo que corrijas; las que cambian el motor de raíz están en la sección 4.

1. **Los dinosaurios permanecen en zona entre turnos.** Lo implican "mientras siga en juego", "sobrevive al turno en que se juega" y el propio rasgo Migrador. La partida es acumulativa, no una serie de escaramuzas independientes.
2. **Máximo 2 cartas por zona por turno es por bando y cuenta despliegues nuevos**, no unidades acumuladas. Adaptaciones y reubicaciones **sí** consumen uno de los dos huecos de esa zona.
3. **Producción, robo y "no dominas ninguna zona" se evalúan sobre la dominación resultante de la resolución del turno anterior.** En el turno 1 nadie domina nada: ambos roban 2 y el ingreso lo fija el suelo de D3. El bucle arranca en ESTACIÓN (D1).
4. **Zona sin unidades de ningún bando, o con Poder empatado (incluido 0–0): neutral.** Nadie produce, nadie sufre bajas.
5. **Zona con unidades de un solo bando: ese bando domina y no hay baja** (no hay perdedor a quien matarle nada).
6. **Todas las eliminaciones de una zona se calculan sobre el estado previo a la resolución y se aplican a la vez.** Es decir: *Stegosaurus* dispara el tagomizador aunque sea él la baja de su bando, y *Allosaurus* puede morir por tagomizador el mismo turno en que mata. Sin esto el resultado depende del orden de lectura, que es exactamente lo que el criterio de aceptación 7 ("el jugador puede explicar por qué") no perdona.
7. **Desempates de "menor Poder"** (a quién le toca morir, a quién elige *Allosaurus*, a quién mata el tagomizador): menor Poder efectivo; si empatan, la unidad desplegada más recientemente. Determinista y explicable, sin decisión del jugador — mantiene el turno corto.
8. **Allosaurus** elimina, además de la baja normal, la siguiente unidad rival de menor Poder de esa zona. **Dispara cada turno en que su bando gane la zona**, no solo el turno en que la conquista.
9. **Stegosaurus** dispara cuando su bando pierde la zona, esté vivo o sea él la baja; elimina la unidad de menor Poder del bando ganador. Dos *Stegosaurus* en la zona disparan dos veces.
10. **Apatosaurus**: "Masa colosal" es **una carga por estancia en el tablero** (flag en la instancia), no una por turno. Si el *Apatosaurus* muere y vuelve al mazo recupera la carga: es una población nueva, no el mismo individuo. Mismo criterio para el +2 de Crecimiento acelerado, que también se pierde al salir de juego.
11. **Ornitholestes**: +1 Biomasa por cada muerte ajena a él mismo en su zona (de cualquier bando), y solo si sobrevive la resolución.
12. **Diplodocus**: el +1 se suma a la producción de Biomasa de esa zona **solo si su bando la domina** (si no la domina, no hay producción a la que sumar).
13. **Dryosaurus** y **Gregarismo** cuentan únicamente unidades **propias** de la misma especie en la misma zona.
14. **Crecimiento acelerado** no aporta Poder en la resolución del turno en que se juega; el +2 se aplica al final de esa resolución si el objetivo sobrevivió.
15. **Gregarismo / Gastrolitos** duran mientras el dinosaurio portador siga en juego; si muere, la adaptación va al descarte y su efecto cesa.
16. **Torvosaurus "Sin sinergias"**: no puede ser objetivo de Adaptaciones ni recibir bonificaciones de rasgos de otras cartas (Gregarismo). Sí sufre efectos negativos.
17. **Sequía**: cada bando suma el Consumo hídrico de sus unidades no inmunes y lo paga de su reserva de Agua; si no alcanza, sacrifica unidades (eligiendo su dueño) hasta que el total pendiente sea pagable. El Agua gastada no se recupera. *Camarasaurus* no paga ni cuenta para el total.
18. **Adaptaciones** pueden targetear una unidad propia desplegada este mismo turno (se revelan después, como dice el paso 5).
19. **Adyacencia para Migrador**: cadena `1 ↔ 2 ↔ 3 ↔ 4`, siguiendo el gradiente de humedad real (llanura de inundación → canal → bosque ribereño → sabana). Reubicar es gratis en Biomasa y consume un hueco de despliegue de la **zona destino**.
20. **Empate a 15+ Territorio en el mismo turno**: gana quien tenga más Territorio; si siguen empatados, gana el **segundo** jugador (compensa la ventaja de iniciativa; es el único desempate del juego).
21. **Descarte por mano llena**: el jugador elige; la IA descarta la de peor valor heurístico.
22. **El paso 5 menciona un rasgo "Emboscada" que ninguna carta del set tiene.** Dejo el punto de orden de revelación implementado y vacío, sin inventar una carta que lo use.

---

## 4. Decisiones cerradas (ronda 1)

**D1 — La ESTACIÓN pasa al paso 1, antes de la producción.** El bucle queda:

```
1. ESTACIÓN        Desde el turno 4. El clima condiciona el turno entero.
2. PRODUCCIÓN      Modificada por la estación de este turno.
3. ROBO
4. DESPLIEGUE      Modificado por la estación (coste +1 en zona 4 con Crecida).
5. REVELACIÓN
6. RESOLUCIÓN
7. CHEQUEO
```

Con esto la Crecida monzónica hace lo que dice su texto y la Sequía se sufre *antes* de comprometer Biomasa, no después. Consecuencia de diseño que conviene aceptar a sabiendas: el jugador conoce el clima antes de decidir su despliegue, así que la estación deja de ser una emboscada y pasa a ser una restricción que se puede jugar. Es lo correcto para un juego cuya tensión declarada es la información oculta *del rival*, no la del mazo neutral.

**D2 — Modelo de bajas: desgaste continuo.** Cada turno, en cada zona donde **ambos** bandos tengan al menos una unidad, el perdedor pierde su unidad de menor Poder. No hace falta que se haya desplegado nada ese turno. Retirarse por completo de una zona es legal y evita la baja: se concede la dominación, no se pagan cadáveres. (Justificación y alternativa descartada: §4.1.)

**D3 — Suelo de ingreso de Biomasa.** El ingreso de Biomasa de cada bando en el paso de producción es `max(producción_de_zonas_dominadas, INGRESO_MINIMO)`, con `INGRESO_MINIMO` en `data/balance.js`. Valor de partida propuesto: **2**; el simulador elige el definitivo dentro de {1, 2, 3}. Con `INGRESO_MINIMO = 0` se recupera exactamente la spec original, así que la comparación A/B es una línea de configuración. (Justificación y alternativas descartadas: §4.2.)

**D4 — Quedarse sin cartas es perder.** En el paso de ROBO, si el mazo está vacío se baraja el descarte y se convierte en mazo nuevo (como en la spec original). Si en ese momento **mazo y descarte están ambos vacíos** y el jugador debe robar, ese jugador **pierde la partida inmediatamente**. Si ambos quedaran sin cartas el mismo turno, gana quien tenga más Territorio; a igualdad se aplica el desempate de §3.20.

Interacción con la métrica de la sección 10: el agotamiento pasa de ser un final degenerado a ser una **condición de derrota legítima**, pero mantengo el objetivo de `< 5 %` de partidas terminadas así. Una partida que se decide por "a quién se le acabaron los dinosaurios" es menos legible que una decidida por Territorio; el agotamiento debe ser la red de seguridad que impide partidas eternas, no el final habitual. Palanca en reserva si el simulador dice otra cosa: §4.3.

---

### 4.1 Por qué desgaste continuo, y qué pierdo con ello

Las dos lecturas posibles del paso 6, con unidades persistentes en tablero:

| | **A — Desgaste continuo** (elegida) | **B — Solo donde hubo despliegue nuevo** |
|---|---|---|
| Cuándo hay baja | Toda zona con unidades de los dos bandos, cada turno | Solo zonas donde alguien desplegó ese turno |
| Coste de mantener una zona | Alto y recurrente | Cero una vez ganada |
| Coste de atacar | El mismo que el de defender | Lo paga el atacante si falla |

**A favor de A:**

- **Es la única lectura que sostiene el dilema estructural que la spec declara suyo.** La sección 4 dice: "Zona 4 es el motor de victoria pero no alimenta a nadie. Dominarla obliga a sostenerla con recursos producidos en otra parte." Bajo B, sostener la zona 4 no cuesta nada: se conquista una vez y rinde 3 de Territorio por turno gratis hasta el final. El dilema desaparece y la sabana pasa a ser simplemente la zona buena.
- **Cuatro de los nueve rasgos suponen muertes frecuentes.** Oportunista (+1 Biomasa por muerte en su zona), Tagomizador (mata al perder), Depredador dominante (mata de más al ganar) y Masa colosal (absorbe una baja) solo tienen texto interesante si morir es rutina. Bajo B, en una partida de 12 turnos con quizá 4–5 turnos de combate real, esos rasgos se disparan una o dos veces cada uno. *Ornitholestes* y *Stegosaurus* se vuelven cartas casi en blanco.
- **Mantiene los números pequeños y legibles.** El tablero se autolimpia, así que las sumas de Poder por zona se quedan en un rango que cabe en una pantalla de móvil y que el jugador puede recalcular mentalmente. Es un prerrequisito del criterio de aceptación 7.
- **No hay posiciones congeladas.** Bajo B, quien gana una zona con una pila grande no puede ser desalojado salvo sobreinvirtiendo cartas nuevas en una pelea que ya va perdiendo; el tablero se cierra hacia el turno 5 y los últimos ocho turnos son trámite.

**En contra de A — y esto es real, no retórico:**

- **Puede vaciar el tablero más rápido de lo que se llena.** Cada bando despliega 1–2 cartas por turno (limitado por Biomasa, no por la regla de 2 por zona), pero A puede producir hasta 4 bajas por turno, más las extra de *Allosaurus* y *Stegosaurus*. Si el ritmo de muertes supera al de despliegue, las zonas quedan vacías, nadie domina nada, nadie produce y la partida se estira muy por encima de los 14 turnos objetivo. Es el riesgo principal que asume esta decisión.
- **Premia no disputar.** Como retirarse evita la baja, la jugada óptima frente a una zona perdida es abandonarla. Puede emerger un reparto estable 2–2 sin interacción. Lo considero autocorregido —quien no dispute la zona 4 pierde la carrera de Territorio y está obligado a volver—, pero es una hipótesis, no un hecho, y va a la lista de comprobación.
- **Castiga desplegar poco.** El bando con menos Biomasa pierde unidades al mismo ritmo que el rico pero las repone más lento, lo que amplifica exactamente la espiral que arregla D3. D2 y D3 son una sola decisión en dos piezas.

**Cómo lo falsifico en H0.** Añado dos métricas que la sección 10 no pide:

1. `unidades_vivas_medias_por_bando_por_turno`. Si a partir del turno 8 cae por debajo de ~3, el desgaste se está comiendo el juego.
2. `% de turnos con las 4 zonas neutrales`. Si supera el 15 %, el tablero se está vaciando.

Si cualquiera de las dos se dispara, la palanca **no** es volver al modelo B, sino subir el caudal de cartas: límite de 3 despliegues por zona, o robo de 2 por turno para todos. Ambos son números en `data/balance.js`.

---

### 4.2 Solución a la espiral económica

El problema, en concreto: sin ingreso base, un bando que pierde las cuatro zonas y llega a 0 de Biomasa no puede volver a desplegar **nunca**, porque la carta más barata del set cuesta 1. Robar 2 cartas por turno no lo rescata: le da mano, no recursos. La partida sigue diez turnos con un jugador que solo mira.

Opciones consideradas:

| Solución | Qué hace | Por qué no la elijo |
|---|---|---|
| (a) Ingreso base +1 para todos | Suelo universal | También engorda al líder y comprime el valor relativo de la zona 1 (3 Biomasa). Diluye el mapa. |
| (b) "Si no dominas ninguna zona, +2 Biomasa" | Extiende la cláusula de robo ya existente | Crea un escalón perverso: dominar solo el canal fluvial (1 Biomasa) rinde **menos** que no dominar nada (2). |
| **(c) Suelo `max(producción, INGRESO_MINIMO)`** | Misma red que (b), sin escalón | **Elegida** |
| (d) Descartar una carta por 1 Biomasa | Válvula controlada por el jugador | Añade una decisión más al turno y no tiene lectura biológica; el juego no trata de "vender" animales. |
| (e) +1 Biomasa cuando muere un dinosaurio propio | Carroñeo | Pisa el rasgo de *Ornitholestes*, que es justamente su única razón de existir. |

Razones de (c):

- **Solo se activa cuando hace falta.** Muerde únicamente si tu producción es 0 o 1, es decir si no dominas nada o dominas una sola zona marginal. Un jugador con la llanura de inundación (3) no lo nota jamás: el mapa conserva íntegro su valor relativo.
- **Sin escalones ni incentivos perversos.** Es un `max`, no un bonus condicional: nunca es mejor tener menos.
- **Es un solo número.** `INGRESO_MINIMO = 0` reproduce la spec literal, así que H0 corre los dos lotes y enseña la diferencia en vez de discutirla.
- **Tiene lectura paleontológica honesta.** Una población sin dominio ecológico no deja de comer: forrajea en terreno marginal, con peor rendimiento. El suelo no es un regalo del sistema, es la productividad de fondo de la formación. No exige inventar nada ni contradice la sección 2.

Lo que el suelo **no** arregla, y que también mediré: aunque puedas desplegar, si solo te alcanza para *Dryosaurus* de Poder 1 frente a un tablero de saurópodos, la recuperación es nominal.

**Medido en H0** (800 partidas por lote, resto de la configuración idéntico; se reproduce cambiando una línea de `data/balance.js`):

| | `INGRESO_MINIMO = 0` (spec literal) | `INGRESO_MINIMO = 2` |
|---|---|---|
| Turnos-jugador sin ninguna jugada legal | **23,8 %** | 4,4 % |
| Partidas con al menos un turno bloqueado | **89,4 %** | 65,8 % |
| Remontadas tras el turno 8 | **3,1 %** | 29,5 % |
| Duración media | 11,88 turnos | 11,66 turnos |

Sin suelo, en casi uno de cada cuatro turnos-jugador un bando llega al despliegue sin **ninguna** acción legal: no es que juegue mal, es que mira. Y remonta el 3 % de las veces. Con suelo, los bloqueos caen por debajo del umbral de alarma del 5 %, las remontadas se multiplican por diez y la duración no se mueve. El suelo sale gratis. Queda fijado en **2**.

---

### 4.3 Palanca de duración en reserva

Si el simulador da partidas largas (>14 turnos de media), hay una palanca limpia antes de tocar el umbral de 15 de Territorio: **suprimir el rebarajado del descarte**. Con 20 cartas, mano inicial de 4 y robo de 1–2 por turno, el mazo se agota solo hacia el turno 14–16. Eso convierte la duración objetivo en algo *estructural* —la partida tiene un reloj— en vez de algo que hay que esperar que emerja del balance. El coste es que dispara el porcentaje de partidas terminadas por agotamiento, en contra del objetivo de la sección 10. Queda anotado como recambio consciente; no lo aplico de entrada.

---

## 4bis. Preguntas todavía abiertas

Ninguna me bloquea para empezar H0; si no dices lo contrario, voy con el default indicado.

- **P5 — Migrador.** ¿Reubicarse consume el despliegue completo del turno, o solo cuenta como una de las cartas jugadas? *Default: lo segundo.* ¿Adyacencia lineal `1-2-3-4`, o las cuatro zonas mutuamente adyacentes? *Default: lineal.*
- **P6 — Gregarismo.** ¿El +1 de Poder dura mientras el portador siga en la zona, o solo el turno en que se juega? *Default: mientras siga.* ¿Beneficia a los dinosaurios de la misma especie del rival en esa zona? *Default: no.*
- **P7 — Nivel de evidencia de *Ceratosaurus*.** El campo `nivel_evidencia` califica al **rasgo**, no al taxón. *Default:* la ficha lo rotula "Evidencia del rasgo: DEBATIDO", para no sugerir que *Ceratosaurus nasicornis* sea una especie dudosa. Mismo criterio en las nueve cartas.

## 5. Riesgos de balance pre-registrados

Los anoto ahora para que `BALANCE.md` los contraste en vez de descubrirlos tarde:

- **La zona 4 puede ser la única palanca que importe.** 3 Territorio frente a 1: dominarla vale tanto como las otras tres juntas. Si el simulador muestra que la zona 4 está disputada >70 % de los turnos y las zonas 1–3 se abandonan, el dilema estructural que busca la spec no existe — solo hay una zona con adorno alrededor.
- **Ritmo de puntuación.** 15 Territorio en 10–14 turnos exige ~1,2–1,5 puntos por turno, es decir dominar en promedio poco más de una zona pequeña. Si el desgaste del P2 es fuerte, el ritmo real puede quedar en 0,6 y la partida irse a 25 turnos.
- **Torvosaurus (coste 6) frente a una economía que arranca en 4 Biomasa** puede caer por debajo del 20 % de frecuencia de juego solo por inalcanzable. Igual que las tres Adaptaciones, con una sola copia cada una en 20 cartas: 1/20 por partida las deja probablemente fuera del rango 20–80 % **por composición del mazo, no por coste**. Si es así, el arreglo es la lista del mazo, no los números de la carta — te lo señalaré antes de tocar nada.
- **La ventaja de iniciativa** con despliegue simultáneo debería ser pequeña; si el +1 de Biomasa la sobrecompensa, el ajuste natural es darle al segundo jugador una carta en vez de un recurso.

---

## 6. Fuera de este plan

Nada de la sección 15. Además: no añado cartas, taxones ni rasgos que no estén en las secciones 6–8; si el balance exige contenido nuevo, te lo propongo por escrito con la referencia paleontológica antes de escribirlo. Las notas científicas se transcriben literalmente de la spec.


---

## 5. Resultado de H0

`BALANCE.md` refleja la corrida actual: **2.000 partidas, semilla base 1, `aleatoria` vs `aleatoria`**. Reproducible con `node sim/run.js`.

### 5.1 Objetivos de la sección 10

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 11,70 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 50,4 % | 48 – 55 % | ✅ |
| Zona más dominada por un bando | 43,0 % | < 70 % | ✅ |
| Partidas por agotamiento de mazo | 0,0 % | < 5 % | ✅ |
| Cartas fuera del rango 20–80 % | 12 | 0 | ❌ (ver §5.3) |

Métricas de vigilancia de D2: unidades vivas por bando **4,69** en el turno ≥ 8 (alarma < 3), turnos con las cuatro zonas neutrales **0,2 %** (alarma > 15 %). El desgaste continuo **no** se está comiendo el juego, y el tablero no se vacía. Modelo A confirmado por los datos.

### 5.2 Números cambiados respecto a la spec

Tres, y sólo tres. Todo lo demás —Poder, coste, consumo hídrico, rasgos, tabla de zonas, composición del mazo, baraja estacional, mano y recursos iniciales— sigue intacto.

| Número | Spec | Ahora | Por qué |
|---|---|---|---|
| Umbral de victoria | 15 | **38** | Con 15 la partida duraba **6,05 turnos**. Ambos bandos puntúan a la vez y el tablero reparte ~4,2 de Territorio por turno, así que 15 se alcanza en seis. §10 autoriza expresamente esta palanca. |
| Compensación del 2º jugador | +1 Biomasa | **0** | Con despliegue simultáneo **no existe ventaja de iniciativa que compensar**. Con el +1, el segundo jugador ganaba el **57,2 %** de las partidas. Sin él: 50,4 %. |
| Suelo de ingreso de Biomasa | no existe | **2** | Decisión D3, con la evidencia medida de §4.2. |

El umbral escala mal por sí solo (15 → 6,05 turnos; 24 → 8,40; 38 → 11,70): la producción de Territorio **acelera** según se llena el tablero, así que la relación no es lineal. Hay una alternativa medida y validada, más agresiva pero mejor para el diseño, en §5.4.

### 5.3 Objetivo 3: los objetivos 1 y 3 se contradicen

Las doce cartas superan el 80 %. La más rara —*Torvosaurus tanneri*, 1 copia de 20, coste 6— se juega en el **83,8 %** de las partidas.

No es calibración, es aritmética del mazo: en 11,7 turnos cada bando roba la mano inicial (4) más 1–2 por turno, del orden de 16 cartas de un mazo de 20, y encima rebaraja el descarte. Se ven casi todas, y con el suelo de ingreso todas acaban siendo pagables. Bajar del 80 % exige **acortar la partida**, que es exactamente lo que prohíbe el objetivo 1. Con mazo fijo de 20 cartas y sin construcción de mazos (§15), los dos objetivos no pueden cumplirse a la vez.

Comprobación con datos: en la configuración original (6,05 turnos) sólo 6 de 12 cartas cumplían, y *Dryosaurus* llegaba igualmente al 99,2 %. Una carta de coste 1 con 3 copias en 20 **no puede** quedar por debajo del 80 % a ninguna duración jugable.

Lo que el objetivo 3 quería detectar —"coste o poder mal calibrado"— sí es medible. `BALANCE.md` añade un **índice = cuota de despliegues / peso en el mazo**: 1,00 significa que la carta se juega exactamente en proporción a lo que aparece; por debajo de 0,7 los jugadores la evitan; por encima de 1,3 la juegan siempre que la ven.

| Carta | Coste | Índice |
|---|---|---|
| *Dryosaurus altus* | 1 | 1,17 |
| *Ornitholestes hermanni* | 1 | 1,17 |
| *Stegosaurus stenops* | 3 | 1,06 |
| *Ceratosaurus nasicornis* | 3 | 1,05 |
| *Diplodocus carnegii* | 4 | 0,95 |
| *Allosaurus fragilis* | 4 | 0,93 |
| *Apatosaurus louisae* | 5 | 0,81 |
| *Camarasaurus grandis* | 5 | 0,80 |
| *Torvosaurus tanneri* | 6 | 0,72 |

Rango 0,72–1,17 y **monótono con el coste**: ninguna carta se evita, ninguna se juega desproporcionadamente, y lo poco que baja el índice de las caras es exactamente lo que debe bajar por no poder pagarlas siempre. La curva de costes está sana.

**Propongo sustituir el límite superior del objetivo 3 por este índice** (rango sano 0,7–1,3, que hoy cumplen las doce cartas) y conservar el límite inferior del 20 % como detector de cartas muertas, que también se cumple con holgura.

### 5.4 Alternativa medida para el umbral de victoria

Si prefieres conservar el **15** de la premisa (§1) en vez de subirlo a 38, hay una configuración validada que lo consigue **y además afila el dilema estructural** que la spec declara suyo:

> Territorio por zona **0 / 0 / 0 / 2** en lugar de 1 / 1 / 1 / 3, umbral **15**.
> Medido: **13,4 turnos** de media (mediana 12), 50,1 % de victorias del inicial, resto de objetivos igual.

Con ella la Sabana de helechos es la **única** fuente de Territorio: las otras tres alimentan, la cuarta hace ganar. Es literalmente lo que dice §4 —"Zona 4 es el motor de victoria pero no alimenta a nadie. Dominarla obliga a sostenerla con recursos producidos en otra parte"—, mientras que la tabla actual reparte Territorio por las cuatro zonas y permite ganar sin pisar nunca la sabana.

No la he aplicado porque cambia cuatro números de la tabla de zonas en vez de uno, y esa tabla no estaba entre lo que aprobaste tocar. Es un cambio de una línea si te convence.

Variante intermedia, también medida: territorio **0 / 0 / 0 / 3** con umbral **21** → 11,6 turnos. Conserva el 3 de la sabana que fija la spec.

### 5.5 Estado del código

```
src/data/cards.js      12 cartas con nota_cientifica y nivel_evidencia
src/data/balance.js    todos los números, congelado
src/engine/rng.js      mulberry32 puro, semilla dentro del estado
src/engine/state.js    creación + selectores de sólo lectura
src/engine/resolve.js  fases automáticas del turno
src/engine/actions.js  reduce(estado, acción) → estado
src/engine/ai.js       perfil `aleatoria` (los tres de §11 en H4)
sim/partida.js         bucle headless, compartido con los tests
sim/run.js             simulador + generador de BALANCE.md
test/*.test.js         56 tests
```

`npm test` → 56/56 en verde. `npm run sim` → regenera `BALANCE.md`.

H2 va adelantado: `test/pureza.test.js` ya verifica que `reduce()` no muta su argumento, que la misma semilla da partidas idénticas, que el estado es serializable sin funciones ni `Map`/`Set`, que `vistaDe()` oculta la mano y el despliegue del rival, y que ningún archivo de `src/` fuera de `ui/` menciona el DOM.


---

## 6. Resultado de H1 + H3 — demo jugable

Objetivo 3 reinterpretado según §5.3: **aceptado**. El límite superior del 20–80 % queda sustituido por el índice de calibración; el inferior del 20 % se conserva. `BALANCE.md` reporta ambos.

### 6.1 Qué se puede hacer ya

Partida completa contra la IA aleatoria, en vertical y con una mano:

- Mano en abanico, hasta 8 cartas (6 de límite + 2 de robo), sin salirse a 360 px de ancho.
- **Arrastrar** una carta a una zona la compromete boca abajo, pagando Biomasa. Las adaptaciones se sueltan sobre un dinosaurio propio, incluido uno desplegado ese mismo turno.
- **Mantener pulsada** una carta abre su ficha: nombre binomial en cursiva, Poder/Coste/Consumo hídrico, rasgo, `Evidencia del rasgo: …` y la nota científica. También al tocar cualquier unidad del tablero, propia o rival.
- Tu despliegue oculto se ve como carta con borde discontinuo; el del rival, sólo como dorsos: la información oculta está representada, no escondida al jugador que la posee.
- Revelación simultánea, resolución zona por zona con resaltado del ganador y desvanecido de las bajas, y **registro del turno** que dice literalmente por qué se perdió cada zona (`Canal fluvial — tú 0 · rival 4 → la domina el rival`).
- Modales para las dos decisiones que la spec deja al jugador: a quién sacrificar en la **Sequía** y qué descartar al pasarse del **límite de mano**.
- Insignia de estación en el HUD, con su propia ficha al tocarla.
- Mute persistente en `localStorage`, audio sintetizado sin binarios y `AudioContext` creado sólo tras el primer gesto.
- Récord en `localStorage` con `try/catch`: partidas, victorias y mejor victoria en turnos.
- Overlay de depuración con `?debug=1`; semilla fija con `?seed=N`; perfil de IA con `?ia=…`.

### 6.2 Verificado en navegador

A 360×640 y a 375×812, con Pointer Events sintéticos sobre la interfaz real:

| Comprobación | Resultado |
|---|---|
| Partida completa hasta `GAME_OVER` | ✅ 10 turnos, 42–13 |
| Errores o advertencias en consola | ✅ ninguno |
| Scroll, rebote o zoom | ✅ ninguno (`scrollWidth/Height` = viewport) |
| Abanico dentro de pantalla con 8 cartas | ✅ 7 px de margen a cada lado |
| Reinicio tras `GAME_OVER` | ✅ vuelve al turno 1 sin listeners ni temporizadores vivos |
| Persistencia del récord | ✅ sobrevive al reinicio |
| Arrastre real carta → zona | ✅ paga Biomasa, sale de la mano, aparece boca abajo |

### 6.3 Arquitectura

La frontera motor/interfaz es ahora un test, no una intención: `test/pureza.test.js` recorre `src/engine/`, `src/data/` y `sim/` y falla si aparece `document`, `window`, `localStorage`, `navigator`, `requestAnimationFrame` o `alert`. `src/ui/` y `src/main.js` quedan fuera por ser justamente la capa que sí toca el DOM. El test cazó una infracción real —`main.js` estaba dentro del barrido original— y la respuesta fue **estrechar** la aserción a las carpetas que de verdad deben ser puras, no relajarla.

La IA recibe siempre `vistaDe(estado, RIVAL)`, que borra la mano, el mazo y el despliegue oculto del jugador. No puede hacer trampa ni por descuido.

Ningún número de balance vive fuera de `data/balance.js`: el umbral de victoria del menú se inyecta desde ahí en el arranque.

### 6.4 Lo que falta

| Hito | Estado |
|---|---|
| H0 motor + simulador | ✅ |
| H1 esqueleto móvil | ✅ |
| H2 pureza del motor | ✅ (56 tests) |
| H3 partida jugable | ✅ |
| H4 IA heurística con los 3 perfiles | ⬜ hoy juega la aleatoria |
| H5 legibilidad de la revelación | 🟡 animación y log hechos; falta el test con un tester externo |
| H6 pulido, deploy en GitHub Pages | ⬜ |

Pendiente además la decisión de §5.4 (umbral 38 con la tabla de zonas de la spec, frente a territorio `0/0/0/2` con umbral 15). No bloquea nada: es una línea de `data/balance.js` y una nueva corrida del simulador.


---

## 7. Resultado de H4 — IA heurística

Tres perfiles heurísticos (§11), sin ML. La fórmula de la spec

```
valor = produccion_zona × P(ganar_zona) + territorio_zona × peso_fase − coste_biomasa
```

está implementada en su forma **marginal**: lo que puntúa no es la probabilidad de dominar la zona, sino **cuánto la sube esta carta concreta**. Sin eso, la IA apila cartas en zonas ya ganadas y tira cartas a zonas irrecuperables, que es lo que hace la aleatoria.

`P(ganar_zona)` sale de una sigmoide sobre `(mi Poder proyectado − su Poder visible − amenaza esperada)`, donde la amenaza se estima con la **Biomasa que el rival tiene a la vista**. Todo se calcula sobre `vistaDe(estado, RIVAL)`: la IA no ve tu mano, tu mazo ni tu despliegue oculto.

### 7.1 El error que costó la primera versión

La primera implementación **perdía contra el azar: 24 % de victorias**. El diagnóstico no fue mirar el código, fue contar cartas:

| | cartas jugadas por partida |
|---|---|
| aleatoria | 15,5 |
| heurística v1 | **7,2** |

La IA no jugaba mal: **no jugaba**. La causa es económica, no algorítmica. La fórmula comparaba una ganancia de control con un coste de Biomasa como si ambos fueran pagos únicos, pero **dominar una zona cobra todos los turnos que la conserves, mientras que la Biomasa se paga una sola vez**. Con esa contabilidad, casi ninguna carta rentaba y la IA pasaba turno tras turno.

La corrección es un factor `horizonte` en `data/balance.js`: número de turnos que se espera cobrar el dominio.

| horizonte | cartas/partida | victorias vs aleatoria |
|---|---|---|
| 2 | 11,3 | 78,7 % |
| **4** | **12,5** | **86,0 %** |
| 6 | 12,8 | 82,0 % |
| 9 | 12,9 | 81,3 % |

Queda fijado en **4**.

### 7.2 Matriz de perfiles

Reproducible con `node sim/run.js --matriz --n 300`. Cada duelo **alterna el asiento** en partidas pares e impares: sin eso el número mezcla la fuerza del perfil con la ventaja de posición y deja de medir lo que dice medir.

% de victorias de la fila contra la columna, 300 partidas por duelo:

| Perfil | aleatoria | territorial | economista | reactiva |
|---|---|---|---|---|
| **aleatoria** | — | 28,3 % | 10,0 % | 18,0 % |
| **territorial** | 72,3 % | — | 23,0 % | 46,0 % |
| **economista** | 87,7 % | 74,7 % | — | 78,0 % |
| **reactiva** | 82,7 % | 46,3 % | 17,7 % | — |

**Criterio de H4: Reactiva gana el 82,7 % contra la aleatoria, por encima del 60 % exigido.** ✅

El demo usa Reactiva por defecto (§11). `?ia=territorial`, `?ia=economista` o `?ia=aleatoria` cambian de rival sin tocar código.

### 7.3 La matriz demuestra el problema de §5.4

Con la tabla de zonas actual, **el espacio estratégico está degenerado**: Economista gana a Territorial 74,7–25,3 y a todos los demás. Jugar a asfixiar por recursos es estrictamente mejor que jugar a la zona de victoria. Es decir: **el dilema estructural que la spec declara suyo no está en el juego**. Se gana sin pisar la Sabana de helechos.

Repetí la matriz con la alternativa de §5.4 (Territorio por zona `0/0/0/2`, umbral 15), sin tocar nada más:

| Perfil (fila) vs | territorial | economista | reactiva |
|---|---|---|---|
| **territorial** | — | **61 %** | 56 % |
| **economista** | 43 % | — | 68 % |
| **reactiva** | 42 % | 32 % | — |

El orden se invierte y el abanico se cierra: de un rango 14–88 % a un rango 43–61 %. Territorial pasa de ser el peor perfil al mejor, Economista sigue siendo fuerte pero deja de ser dominante, y ninguna estrategia arrolla a las demás.

No es un ajuste de balance más: es la diferencia entre un juego con una sola línea ganadora y un juego con tres líneas que se responden entre sí. **Recomiendo adoptar la configuración B.** Sigo sin aplicarla porque cambia cuatro números de una tabla que no estaba entre lo que aprobaste; es una línea de `data/balance.js` más una corrida del simulador.

### 7.4 Estado

| Hito | Estado |
|---|---|
| H0 motor + simulador | ✅ |
| H1 esqueleto móvil | ✅ |
| H2 pureza del motor | ✅ 56 tests |
| H3 partida jugable | ✅ |
| H4 IA heurística, 3 perfiles | ✅ |
| H5 legibilidad de la revelación | 🟡 animación y log hechos; falta el tester externo |
| H6 pulido, mute, deploy en GitHub Pages | ⬜ mute y persistencia ya están; falta el deploy |

`BALANCE.md` se regeneró tras el cambio y sale idéntico (11,70 turnos, 50,4 %, 43,0 %, 0,0 %): la IA heurística no toca la línea base aleatoria contra la que se calibró el juego.


---

## 8. Tabla de zonas adoptada y tablero tipo playmat

Dos decisiones aprobadas: se aplica la alternativa de §5.4 y el tablero se rehace como playmat.

### 8.1 Balance: la Sabana es ahora la única fuente de Territorio

`Territorio por zona 1/1/1/3 → 0/0/0/2`, umbral **de vuelta al 15 de la premisa** (§1). Con esto, los números cambiados respecto a `GAME_SPEC.md` siguen siendo tres, pero ya no incluyen el umbral de victoria:

| Número | Spec | Ahora |
|---|---|---|
| Territorio por zona | 1/1/1/3 | **0/0/0/2** |
| Compensación del 2º jugador | +1 Biomasa | **0** |
| Suelo de ingreso de Biomasa | no existe | **2** |

Objetivos de §10 sobre 2.000 partidas `aleatoria vs aleatoria`: duración **13,42** turnos (10–14 ✅), jugador inicial **50,1 %** (48–55 ✅), zona más dominada **44,0 %** (<70 ✅), agotamiento **0,9 %** (<5 ✅).

Matriz de perfiles después del cambio, 300 partidas por duelo con asiento alternado:

| Perfil | aleatoria | territorial | economista | reactiva |
|---|---|---|---|---|
| **territorial** | 94,0 % | — | **59,0 %** | 57,7 % |
| **economista** | 89,7 % | 39,0 % | — | 64,0 % |
| **reactiva** | 92,0 % | 41,3 % | 34,3 % | — |

El espacio estratégico se ha abierto: antes Economista batía a Territorial 74,7–25,3 y el juego se ganaba sin pisar la Sabana. Ahora el orden se invierte, el abanico entre heurísticas pasa de 14–88 % a 34–64 %, y jugar a la zona de victoria es viable. Reactiva sigue cumpliendo el criterio de H4 (92,0 % contra la aleatoria) y sigue siendo el rival por defecto del demo, que para un demo está bien: competente y batible.

### 8.2 Objetivo 3 con el criterio nuevo

Aplicado el índice aprobado (cuota de despliegues / peso en el mazo, banda sana 0,70–1,30, conservando el límite inferior del 20 % de partidas como detector de cartas muertas):

**11 de 12 cartas dentro de banda.** El índice es monótono con el coste, de 1,21 (*Ornitholestes*, coste 1) a 0,70 (*Torvosaurus*, coste 6).

La que falla es *Torvosaurus tanneri*, y falla **justo en el borde**: índice 0,70, apenas por debajo del suelo. No lo considero una descalibración: es la carta más cara del set (coste 6) en un juego de renta escasa, así que jugarse algo menos que su peso en el mazo es exactamente lo que debe pasar. **No he ensanchado la banda para que pase**; si el criterio se queda en 0,70 seguirá reportándose como incumplido, y me parece más útil verlo declarado que verlo aprobado por haber movido la portería. Si prefieres una banda de 0,65–1,35, es un número de `sim/run.js`.

### 8.3 El tablero

El problema era de espacio, no de gusto. A 360×640 el presupuesto vertical es HUD 34 + tira 51 + tablero 345 + pie 200. Un playmat reparte ocho áreas (4 zonas × 2 bandos); dándoles tamaño de carta real harían falta ~700 px sólo de tablero. Por eso las unidades eran fichas de 38 px.

La salida es enfocar **una zona a tamaño real** y navegar entre ellas:

- **Tira superior**: las cuatro zonas como marcador compacto —número, Territorio que produce, marcador de Poder `rival–tú` y una barra de color con quién domina—. Se toca para cambiar de zona, y también sirve de destino de arrastre: puedes desplegar en otra zona sin salir de la que estás mirando.
- **Playmat**: banda del rival arriba, banda propia abajo, y en medio el nombre de la zona con su producción. Cada bando muestra su Poder total y —esto faltaba y no era cosmético— **cuántas cartas le quedan en mazo y descarte**, que se pone en ámbar cuando bajan de cuatro. Con la regla D4, quedarse sin cartas es perder: el jugador tiene que poder verlo venir.
- **Cartas de verdad**: 92×129 px en el tablero, más grandes que las de la mano, con marco completo —coste, consumo hídrico, Poder efectivo (en ámbar si está modificado), arte, nombre binomial en cursiva, rasgo y un punto de color con el nivel de evidencia—. Si no caben, se solapan como el banco de cualquier TCG.
- **Fondos de paleoambiente** por zona, generados con gradientes y patrones CSS: bandas horizontales en la llanura, trazos oblicuos en el canal trenzado, verticales en el bosque, retícula fina en la sabana. Sin binarios.
- **La revelación pasea la cámara**: la resolución ya iba zona por zona en el motor, así que ahora la vista la sigue. Se enfoca la zona, se ve la posición previa, se subrayan los dos Poderes, se marca quién gana y caen las bajas. Cuatro escenas en vez de un parpadeo de fichas. Las zonas donde no hay nadie se saltan.

Todo esto es `render.js`, `style.css`, `input.js` y `animate.js`. **Cero líneas del motor**, y los 56 tests siguen pasando sin tocarlos: es lo que compró la decisión de H0 de escribir el motor puro desde el principio.

### 8.4 Verificado

A 360×640, conduciendo la interfaz real con Pointer Events:

| | |
|---|---|
| Partida completa hasta `GAME_OVER` | ✅ 9 turnos |
| Errores en consola | ✅ ninguno |
| Scroll, rebote o zoom | ✅ `scrollWidth/Height` == viewport |
| Arrastre carta → playmat y carta → tira | ✅ ambos despliegan en la zona correcta |
| Cambio de zona por la tira | ✅ repinta sin tocar el estado de juego |
| Tamaño de carta en tablero | ✅ 92×129 px |

### 8.5 Estado

| Hito | Estado |
|---|---|
| H0 motor + simulador | ✅ |
| H1 esqueleto móvil | ✅ |
| H2 pureza del motor | ✅ 56 tests |
| H3 partida jugable | ✅ |
| H4 IA heurística, 3 perfiles | ✅ |
| H5 legibilidad de la revelación | 🟡 falta el tester externo del criterio |
| H6 pulido y deploy en GitHub Pages | ⬜ |

---

## 9. Comprensión: el juego no se explicaba

Feedback del jugador sobre la build anterior: *"no se entiende bien qué son esos números"*, *"tampoco se entienden los valores de las cartas, hay que explicar cómo jugar, para qué sirve cada cosa, cada número qué significa"*. Es un incumplimiento directo de los criterios de aceptación 6 y 8, no una petición de función.

Tres causas, tres arreglos:

**1. Se estaba viendo en escritorio a 1900 px de ancho.** El juego está diseñado para 360–430 px en vertical; estirado a 1900 se convierte en un descampado con dos etiquetas diminutas. Ahora `#app` tiene `max-width: 430px` y se centra, y por encima de 470 px se dibuja como un marco de móvil con borde y sombra sobre un fondo más oscuro. El juego ya no finge ser una aplicación de escritorio.

**2. Los recursos eran cuadraditos de color sin nombre.** Cada uno lleva ahora su etiqueta debajo del número: `0 TERR · 6 BIO · 2 AGUA · 6 MANO`. El HUD pasa de 34 a 38 px, y a cambio se entiende sin adivinar. Se añadió también el contador de mano propia, que antes solo estaba para el rival.

**3. No había ninguna explicación en ninguna parte.** Nueva hoja **Cómo se juega**, accesible desde el menú y desde el botón `?` durante la partida:

- El objetivo, con las dos formas de perder.
- Los tres recursos y para qué sirve cada uno.
- **Anatomía de una carta**: una carta real con cuatro llamadas numeradas sobre coste, consumo hídrico, Poder y rasgo, más la leyenda de los tres niveles de evidencia.
- El turno en cinco pasos.
- Cómo se gana una zona y qué le pasa al perdedor.
- La tabla de las cuatro zonas.
- Por qué los taxones son los que son.

La hoja **se genera desde `balance.js` y `cards.js`**, así que no puede quedarse desfasada respecto a las reglas que ejecuta el motor: si cambia el umbral o la producción de una zona, el texto cambia solo.

Dos colisiones encontradas al hacerlo, ambas arregladas: `.mano` del contenedor de la mano pisaba a `.rec.mano` del HUD (ahora el contenedor se estila por `#mano`), y las etiquetas se partían letra a letra por falta de `white-space: nowrap`.

### 9.1 Sobre rehacer el juego con una sola zona

Propuesta recibida: dejar un solo campo de juego, y añadir una segunda vía de victoria por agotamiento de mazo con un mazo de 50 cartas.

**Una sola zona es un juego distinto, no un ajuste.** La premisa (§1) es competir por cuatro paleoambientes y el dilema declarado (§4) es que la zona que puntúa no alimenta. Con una zona desaparece la decisión de *dónde* desplegar y solo queda *qué* desplegar; se caen Ribereño, Migrador y Ramoneo bajo, y con ellos la economía de zonas entera.

**Agotarse ya es perder** (decisión D4), pero solo ocurre en el 0,9 % de las partidas. Y **un mazo de 50 cartas empuja en dirección contraria**: cuantas más cartas, más difícil agotarlas. Además §9 fija el mazo en 20 y §15 excluye la construcción de mazos.

La palanca que sí convierte el agotamiento en una vía real es otra: **que las muertes sean permanentes**. Hoy un dinosaurio muerto va al descarte y vuelve a barajarse. Si en vez de eso saliera del juego, matar unidades rivales pasaría a ser un segundo eje de victoria, y el mensaje "tu población se extingue" sería literal en vez de decorativo. Es un cambio en `matar()` y una bandera en `balance.js`, y el simulador diría en una corrida qué le hace a la duración. Queda propuesto, pendiente de decisión.

---

## 10. Muerte permanente y la tira como mini-tablero

### 10.1 Las bajas salen del juego

Nueva bandera `muertePermanente` en `data/balance.js`. Un dinosaurio que muere —en combate o de sed— va a una pila de **extintos** en vez de al descarte, y no vuelve a barajarse nunca. Con `false` se recupera el ciclo mazo→descarte→mazo de la spec.

Convierte la derrota por agotamiento (D4) en una vía real: cada baja que le infliges al rival lo acerca a quedarse sin población.

Medido sobre 2.000 partidas `aleatoria vs aleatoria`:

| Métrica | Antes | Con muerte permanente |
|---|---|---|
| Duración media | 13,42 | **12,53** |
| Mediana | 12 | 12 |
| P90 | 19 | **16** |
| Máximo | **37** | **20** |
| Partidas por agotamiento | 0,9 % | **27,7 %** |
| Cartas mal calibradas | 1 | **0** |
| Victorias del jugador inicial | 50,1 % | 49,7 % |
| Zona más dominada | 44,0 % | 43,5 % |

Tres efectos, dos de ellos no buscados:

1. **La segunda vía de victoria funciona**: el 27,7 % de las partidas se deciden por extinción y el 72,3 % por Territorio. Es una amenaza real sin ser el final por defecto.
2. **La cola larga desaparece.** El máximo baja de 37 turnos a 20 y el P90 de 19 a 16. Antes había partidas que se estancaban porque nadie conseguía romper la Sabana; ahora el desgaste pone un reloj a la partida. Esto arregla el riesgo que quedaba anotado en §5.2.
3. ***Torvosaurus* entra en banda.** Era la única carta fuera de calibración (índice 0,70, justo en el borde). Con las bajas permanentes las cartas caras se valoran distinto y su índice sube dentro del rango. **Las doce cartas cumplen ahora.**

**Objetivo de §10 en conflicto.** "Partidas terminadas por agotamiento < 5 %" se escribió cuando el agotamiento era un final degenerado. Ahora es una condición de victoria diseñada a propósito, y sale 27,7 %. El objetivo tal cual está ya no mide lo que quería medir: el guardarraíl útil sería que **no domine** el final de partida (digamos < 40 %), no que casi no ocurra. `sim/run.js` lo sigue reportando como incumplido hasta que se decida.

Matriz de perfiles después del cambio (250 partidas por duelo, asiento alternado):

| Perfil | aleatoria | territorial | economista | reactiva |
|---|---|---|---|---|
| **territorial** | 94,0 % | — | 66,0 % | 62,8 % |
| **economista** | 86,4 % | 33,6 % | — | 56,0 % |
| **reactiva** | 93,6 % | 31,6 % | 38,0 % | — |

Reactiva sigue cumpliendo el criterio de H4 (93,6 % contra la aleatoria). Territorial se refuerza —de 59 % a 66 % contra Economista—: con las bajas permanentes, apostar por la zona que puntúa y desgastar al rival se combinan bien. El abanico entre heurísticas queda en 31,6–66 %, algo más abierto que el 43–61 % anterior, pero muy lejos del 14–88 % de la tabla de zonas original.

### 10.2 La tira deja de ser un marcador

Segunda observación repetida del jugador: *"controlar 4 territorios al mismo tiempo puede ser confuso, normalmente en los TCG solo hay 1 campo de juego"*.

Reducir a una zona sigue siendo rehacer el juego (§9.1). Pero la queja de fondo —no puedo con cuatro sitios a la vez— tiene un arreglo que no quita nada: **hacer que las cuatro zonas se lean sin cambiar de pantalla**. La tira superior ahora muestra, por zona:

- el número y el Territorio que produce,
- **un punto por cada unidad de cada bando** (huecos para las cartas comprometidas y aún sin revelar),
- el Poder de cada bando,
- y una barra de color con quién domina.

Es decir: el estado completo del frente en 63 px de alto. El playmat pasa a ser el zoom donde se actúa, no el único sitio donde te enteras de algo. Si aun así cuatro siguen siendo demasiadas, el siguiente paso sería abrir la partida con dos zonas activas y añadir las otras dos en el turno 4 — pero conviene probarlo así antes.

También se añadió el contador de **extintos** junto a mazo y descarte, y el registro del turno distingue "se extingue … fuera del juego" de una muerte normal.

### 10.3 Nota de desarrollo: caché de módulos

Durante la verificación aparecieron errores fantasma (`Cannot read properties of undefined`) que no correspondían al código en disco: el navegador servía módulos ES cacheados de una versión anterior. `python -m http.server` responde 304 y el navegador se queda con la copia vieja.

No afecta al juego desplegado, pero **al recargar tras un cambio conviene forzar `Ctrl+Shift+R`**. Para desarrollo hay un servidor sin caché en el scratchpad de la sesión; no forma parte del proyecto porque la spec pide que baste con `python3 -m http.server`.

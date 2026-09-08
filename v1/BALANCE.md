# BALANCE.md

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000**
- Semilla base: **1** (partida *i* usa la semilla `1+i`)
- Perfiles de IA: **aleatoria vs aleatoria**
- Umbral de victoria: **15 de Territorio**
- Producción de Territorio por zona: **0 / 0 / 0 / 2**
- Suelo de ingreso de Biomasa (D3): **2**
- Compensación del segundo jugador: **0 Biomasa**
- Modelo de bajas: **A, desgaste continuo** (D2)
- Tiempo de simulación: 103.1 s

## Objetivos de la sección 10

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 12.53 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 49.7 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 0 | 0 | ✅ |
| Zona más dominada por un bando | 43.5 % | < 70 % | ✅ |
| Partidas por agotamiento de mazo | 27.7 % | < 5 % | ❌ |

**Hay objetivos incumplidos.** Ver diagnóstico al final.

## Duración

| | Turnos |
|---|---|
| Mínimo | 9 |
| P10 | 9 |
| Mediana | 12 |
| Media | 12.53 |
| P90 | 16 |
| Máximo | 20 |

| Final de partida | % |
|---|---|
| Por Territorio | 72.3 |
| Por agotamiento de cartas | 27.7 |
| Sin decisión (tope de 40 turnos) | 0.0 |

## Frecuencia de juego por carta

% de partidas en que la carta llega a jugarse al menos una vez.

`Cuota` es el % de todos los despliegues de la partida que fueron esa carta;
`Esperado` es su peso en el mazo. El **índice** (cuota / esperado) es el
diagnóstico real de calibración: 1,00 = se juega en proporción exacta a lo
que aparece; < 0,7 = los jugadores la evitan; > 1,3 = la juegan siempre que
la ven. Ver §"Objetivo 3" al final.

| Carta | Coste | % partidas | Cuota | Esperado | Índice | |
|---|---|---|---|---|---|---|
| *Ornitholestes hermanni* | 1 | 99.8 % | 11.4 % | 10.0 % | 1.14 | ✅ |
| *Dryosaurus altus* | 1 | 100.0 % | 17.1 % | 15.0 % | 1.14 | ✅ |
| *Gastrolitos* | 2 | 94.3 % | 5.5 % | 5.0 % | 1.10 | ✅ |
| *Gregarismo* | 2 | 95.5 % | 5.5 % | 5.0 % | 1.10 | ✅ |
| *Stegosaurus stenops* | 3 | 99.5 % | 10.5 % | 10.0 % | 1.05 | ✅ |
| *Ceratosaurus nasicornis* | 3 | 99.4 % | 10.5 % | 10.0 % | 1.05 | ✅ |
| *Crecimiento acelerado* | 3 | 92.2 % | 4.9 % | 5.0 % | 0.98 | ✅ |
| *Diplodocus carnegii* | 4 | 99.0 % | 9.5 % | 10.0 % | 0.95 | ✅ |
| *Allosaurus fragilis* | 4 | 99.3 % | 9.5 % | 10.0 % | 0.95 | ✅ |
| *Apatosaurus louisae* | 5 | 89.2 % | 4.1 % | 5.0 % | 0.82 | ✅ |
| *Camarasaurus grandis* | 5 | 97.7 % | 7.9 % | 10.0 % | 0.79 | ✅ |
| *Torvosaurus tanneri* | 6 | 84.7 % | 3.5 % | 5.0 % | 0.71 | ✅ |

## Dominación de zona

% de turnos-tablero (medidos tras cada resolución) en que la zona estaba dominada.

| Zona | Territorio/turno | Jugador 1 | Jugador 2 | Neutral |
|---|---|---|---|---|
| 1. Llanura de inundación | 0 | 42.0 % | 42.3 % | 15.7 % |
| 2. Canal fluvial trenzado | 0 | 43.0 % | 43.5 % | 13.4 % |
| 3. Bosque de coníferas ribereño | 0 | 42.1 % | 43.0 % | 14.9 % |
| 4. Sabana de helechos | 2 | 41.2 % | 40.7 % | 18.1 % |

## Métricas de la decisión D2 (desgaste continuo)

No las pide la sección 10; las añade `PLAN.md §4.1` para falsificar el modelo de bajas.

| Métrica | Resultado | Umbral de alarma |
|---|---|---|
| Unidades vivas medias por bando | 3.77 | — |
| Unidades vivas medias, turno ≥ 8 | 4.76 | < 3 = el desgaste se come el juego |
| Turnos con las 4 zonas neutrales | 0.2 % | > 15 % = el tablero se vacía |
| Remontadas tras el turno 8 | 39.8 % | baja = el suelo de ingreso no basta |
| Turnos-jugador sin ninguna jugada posible | 4.9 % | > 5 % = hay bandos mirando |
| Partidas con al menos un turno bloqueado | 69.2 % | — |
| Territorio por turno del ganador | 1.20 | — |

## Objetivo 3: por qué el límite superior de frecuencia es inalcanzable

El objetivo literal de la spec (20–80 % de partidas) lo incumplen 12 de 12 cartas. La más rara, *Torvosaurus tanneri*
(1 copia de 20, coste 6), se juega en el 84.7 % de las partidas.

No es un fallo de calibración: es aritmética del mazo. En una partida de
12.5 turnos cada bando roba mano inicial (4) más 1–2 cartas por turno,
es decir del orden de 17 cartas de un mazo de 20, y además rebaraja el descarte.
Prácticamente todas las cartas se ven, y con el suelo de ingreso todas acaban
siendo pagables. La frecuencia sólo bajaría del 80 % acortando la partida, que
es justo lo que prohíbe el objetivo 1. **Los objetivos 1 y 3 se contradicen**
mientras el mazo sea fijo de 20 cartas y no haya construcción de mazos (§15).

Lo que el objetivo 3 quería detectar —"coste o poder mal calibrado"— sí es
medible, con el **índice** de la tabla anterior. Rango observado:
**0.71 – 1.14**, y monótono con el coste: ninguna carta se evita, ninguna se juega
desproporcionadamente. La curva de costes está sana.

## Números cambiados respecto a GAME_SPEC.md

| Número | Spec | Ahora | Motivo |
|---|---|---|---|
| Territorio por zona | 1/1/1/3 | **0/0/0/2** | Rebalanceo de producción (§10). Con 1/1/1/3 la partida duraba 6,05 turnos y, sobre todo, se podía ganar sin disputar nunca la Sabana: en la matriz de perfiles el Economista batía al Territorial 74,7–25,3. Concentrando el Territorio en la zona 4, los tres perfiles quedan en un rango 34–64 % y vuelve el dilema estructural de §4. |
| Compensación del 2º jugador | 1 Biomasa | **0 Biomasa** | Con despliegue simultáneo no existe ventaja de iniciativa que compensar: con +1 el segundo jugador ganaba el 57,2 % de las partidas. |
| Suelo de ingreso de Biomasa | no existe | **2** | Decisión D3 de PLAN.md. Sin suelo, el 23,8 % de los turnos-jugador un bando no tiene ninguna jugada legal. |

Todo lo demás —Poder, coste, consumo hídrico, rasgos, composición del mazo,
baraja estacional, mano inicial y máxima, recursos iniciales— está sin tocar.

## Diagnóstico

- **Partidas por agotamiento de mazo**: 27.7 % (objetivo < 5 %).


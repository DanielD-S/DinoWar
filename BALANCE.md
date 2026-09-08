# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **34** · Trofeos para ganar: **8**
- Renta: **1/turno hasta 8**, no acumula · Mazo: **50**
- Tiempo: 82.3 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 11.02 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 50.9 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 1 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 61.4 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 38% / 40% / 22% | cada una 15 – 60 % | ✅ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **61.4 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 4 |
| P10 | 8 |
| Mediana | 11 |
| Media | 11.02 |
| P90 | 14 |
| Máximo | 19 |

| Vía de victoria | % |
|---|---|
| Registro fósil (8 trofeos) | 37.6 |
| Colapso del habitat | 40.0 |
| Extinción (sin cartas) | 22.4 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **2.25** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| *Camarasaurus grandis* | Saurópodo | 5 | 64.0 % | 1.13 | 102 % | ✅ |
| Gregarismo | Campo | 2 | 88.0 % | 1.09 | 92 % | ✅ |
| Rebrote tras incendio | Campo | 0 | 91.5 % | 1.09 | 92 % | ✅ |
| Competencia trófica | Campo | 2 | 52.6 % | 1.08 | 94 % | ✅ |
| Gastrolitos | Campo | 2 | 76.7 % | 1.06 | 91 % | ✅ |
| Trampa de depredadores | Campo | 3 | 90.4 % | 1.06 | 90 % | ✅ |
| *Huaxiadraco corollatus* | Pterosaurio | 4 | 77.8 % | 1.05 | 91 % | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 3 | 89.3 % | 1.05 | 90 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 4 | 75.2 % | 1.04 | 92 % | ✅ |
| Fractura consolidada | Campo | 2 | 75.2 % | 1.04 | 93 % | ✅ |
| Neumaticidad ósea | Campo | 2 | 51.3 % | 1.04 | 86 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 5 | 76.3 % | 1.02 | 87 % | ✅ |
| *Nodosaurus textilis* | Tireóforo | 4 | 85.7 % | 1.02 | 88 % | ✅ |
| *Dryosaurus altus* | Ornitópodo | 1 | 88.3 % | 1.01 | 87 % | ✅ |
| Crecimiento acelerado | Campo | 3 | 49.6 % | 0.99 | 87 % | ✅ |
| Canal fluvial trenzado | Campo | 2 | 52.7 % | 0.98 | 87 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 5 | 74.2 % | 0.98 | 86 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 5 | 72.6 % | 0.97 | 85 % | ✅ |
| *Ornitholestes hermanni* | Terópodo | 2 | 88.2 % | 0.97 | 81 % | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 8 | 47.6 % | 0.95 | 82 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 5 | 46.6 % | 0.93 | 79 % | ✅ |
| *Torvosaurus tanneri* | Terópodo | 7 | 47.4 % | 0.93 | 81 % | ✅ |
| *Apatosaurus louisae* | Saurópodo | 7 | 47.1 % | 0.92 | 82 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 4 | 69.5 % | 0.89 | 79 % | ✅ |
| Mortandad estacional | Campo | 3 | 38.4 % | 0.74 | 64 % | ✅ |
| Sabana de helechos | Campo | 2 | 40.3 % | 0.72 | 61 % | ✅ |
| Deriva árida | Campo | 2 | 27.6 % | 0.47 | 40 % | ❌ |

## Diagnóstico

- **Cartas mal calibradas**: 1 (objetivo 0).

  - Deriva árida — índice 0.47, uso 40 % (coste 2)


# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **34** · Trofeos para ganar: **8**
- Renta: **1/turno hasta 8**, no acumula · Mazo: **50**
- Tiempo: 94.3 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 11.04 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 50.9 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 1 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 61.5 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 39% / 39% / 22% | cada una 15 – 60 % | ✅ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **61.5 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 4 |
| P10 | 8 |
| Mediana | 11 |
| Media | 11.04 |
| P90 | 14 |
| Máximo | 19 |

| Vía de victoria | % |
|---|---|
| Registro fósil (8 trofeos) | 38.6 |
| Colapso del habitat | 39.3 |
| Extinción (sin cartas) | 22.1 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **2.24** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| *Camarasaurus grandis* | Saurópodo | 5 | 64.0 % | 1.13 | 102 % | ✅ |
| Gregarismo | Campo | 2 | 87.7 % | 1.08 | 92 % | ✅ |
| Rebrote tras incendio | Campo | 0 | 91.5 % | 1.08 | 92 % | ✅ |
| Competencia trófica | Campo | 2 | 52.5 % | 1.08 | 94 % | ✅ |
| Trampa de depredadores | Campo | 3 | 90.3 % | 1.06 | 91 % | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 3 | 89.5 % | 1.06 | 91 % | ✅ |
| *Huaxiadraco corollatus* | Pterosaurio | 4 | 77.7 % | 1.05 | 92 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 4 | 75.5 % | 1.05 | 93 % | ✅ |
| Gastrolitos | Campo | 2 | 75.9 % | 1.05 | 91 % | ✅ |
| Fractura consolidada | Campo | 2 | 75.2 % | 1.04 | 93 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 5 | 76.3 % | 1.03 | 89 % | ✅ |
| Neumaticidad ósea | Campo | 2 | 50.7 % | 1.03 | 85 % | ✅ |
| *Nodosaurus textilis* | Tireóforo | 4 | 86.0 % | 1.03 | 89 % | ✅ |
| *Dryosaurus altus* | Ornitópodo | 1 | 88.4 % | 1.00 | 86 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 5 | 74.6 % | 0.99 | 87 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 5 | 73.4 % | 0.98 | 86 % | ✅ |
| Crecimiento acelerado | Campo | 3 | 49.0 % | 0.98 | 88 % | ✅ |
| Canal fluvial trenzado | Campo | 2 | 52.0 % | 0.97 | 87 % | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 8 | 47.7 % | 0.96 | 83 % | ✅ |
| *Ornitholestes hermanni* | Terópodo | 2 | 87.8 % | 0.96 | 81 % | ✅ |
| *Torvosaurus tanneri* | Terópodo | 7 | 47.6 % | 0.94 | 82 % | ✅ |
| *Apatosaurus louisae* | Saurópodo | 7 | 47.1 % | 0.92 | 83 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 5 | 46.1 % | 0.92 | 80 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 4 | 70.0 % | 0.90 | 80 % | ✅ |
| Mortandad estacional | Campo | 3 | 38.5 % | 0.75 | 65 % | ✅ |
| Sabana de helechos | Campo | 2 | 40.1 % | 0.72 | 61 % | ✅ |
| Deriva árida | Campo | 2 | 27.3 % | 0.46 | 40 % | ❌ |

## Diagnóstico

- **Cartas mal calibradas**: 1 (objetivo 0).

  - Deriva árida — índice 0.46, uso 40 % (coste 2)


# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **800** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **70** · Trofeos para ganar: **10**
- Renta: **2/turno hasta 12**, acumula · Mazo: **50**
- Tiempo: 82.2 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 12.98 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 53.0 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 3 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 63.6 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 45% / 23% / 32% | cada una 15 – 60 % | ✅ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **63.6 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 6 |
| P10 | 9 |
| Mediana | 12 |
| Media | 12.98 |
| P90 | 17 |
| Máximo | 31 |

| Vía de victoria | % |
|---|---|
| Registro fósil (10 trofeos) | 44.6 |
| Colapso del habitat | 23.0 |
| Extinción (sin cartas) | 32.4 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **2.05** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| Gregarismo | Campo | 1 | 99.1 % | 1.69 | 92 % | ❌ |
| Trampa de depredadores | Campo | 1 | 94.1 % | 1.13 | 96 % | ✅ |
| Crecimiento acelerado | Campo | 1 | 59.9 % | 1.11 | 94 % | ✅ |
| Rebrote tras incendio | Campo | 0 | 94.4 % | 1.11 | 97 % | ✅ |
| Gastrolitos | Campo | 1 | 82.1 % | 1.10 | 94 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 57.1 % | 1.09 | 93 % | ✅ |
| *Nodosaurus textilis* | Tireóforo | 2 | 91.4 % | 1.07 | 92 % | ✅ |
| Fractura consolidada | Campo | 2 | 77.8 % | 1.03 | 81 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 2 | 79.6 % | 1.02 | 91 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 80.1 % | 1.02 | 91 % | ✅ |
| *Dryosaurus altus* | Ornitópodo | 0 | 91.5 % | 1.00 | 85 % | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 1 | 89.4 % | 1.00 | 86 % | ✅ |
| *Ornitholestes hermanni* | Terópodo | 1 | 90.8 % | 0.98 | 84 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 3 | 53.4 % | 0.97 | 81 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 89.3 % | 0.96 | 87 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 3 | 77.4 % | 0.93 | 80 % | ✅ |
| Neumaticidad ósea | Campo | 2 | 50.9 % | 0.91 | 72 % | ✅ |
| *Huaxiadraco corollatus* | Pterosaurio | 2 | 74.4 % | 0.91 | 77 % | ✅ |
| Mortandad estacional | Campo | 1 | 49.9 % | 0.89 | 75 % | ✅ |
| *Apatosaurus louisae* | Saurópodo | 3 | 45.1 % | 0.79 | 71 % | ✅ |
| Deriva árida | Campo | 1 | 50.0 % | 0.77 | 56 % | ✅ |
| Sabana de helechos | Campo | 1 | 47.3 % | 0.76 | 57 % | ✅ |
| *Camarasaurus grandis* | Saurópodo | 3 | 64.6 % | 0.71 | 61 % | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 4 | 41.9 % | 0.71 | 62 % | ✅ |
| Competencia trófica | Campo | 3 | 39.0 % | 0.70 | 41 % | ✅ |
| *Torvosaurus tanneri* | Terópodo | 4 | 39.8 % | 0.68 | 58 % | ❌ |
| Canal fluvial trenzado | Campo | 1 | 20.8 % | 0.32 | 25 % | ❌ |

## Diagnóstico

- **Cartas mal calibradas**: 3 (objetivo 0).

  - Canal fluvial trenzado — índice 0.32, uso 25 % (coste 1)
  - Torvosaurus tanneri — índice 0.68, uso 58 % (coste 4)
  - Gregarismo — índice 1.69, uso 92 % (coste 1)


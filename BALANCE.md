# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **70** · Trofeos para ganar: **10**
- Renta: **2/turno hasta 12**, acumula · Mazo: **50**
- Tiempo: 182.0 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 13.29 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 50.8 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 3 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 64.6 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 42% / 25% / 34% | cada una 15 – 60 % | ✅ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **64.6 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 6 |
| P10 | 9 |
| Mediana | 13 |
| Media | 13.29 |
| P90 | 18 |
| Máximo | 33 |

| Vía de victoria | % |
|---|---|
| Registro fósil (10 trofeos) | 41.9 |
| Colapso del habitat | 24.6 |
| Extinción (sin cartas) | 33.5 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **2.48** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| Gregarismo | Campo | 1 | 99.2 % | 1.73 | 95 % | ❌ |
| Trampa de depredadores | Campo | 1 | 94.3 % | 1.13 | 97 % | ✅ |
| Crecimiento acelerado | Campo | 1 | 61.6 % | 1.12 | 97 % | ✅ |
| Gastrolitos | Campo | 1 | 84.3 % | 1.11 | 96 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 59.5 % | 1.08 | 94 % | ✅ |
| Fractura consolidada | Campo | 2 | 80.5 % | 1.08 | 85 % | ✅ |
| Rebrote tras incendio | Campo | 0 | 94.8 % | 1.07 | 93 % | ✅ |
| *Nodosaurus textilis* | Tireóforo | 2 | 93.3 % | 1.06 | 92 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 81.4 % | 1.04 | 92 % | ✅ |
| Neumaticidad ósea | Campo | 2 | 55.5 % | 1.01 | 80 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 2 | 80.5 % | 1.01 | 89 % | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 1 | 90.5 % | 0.99 | 86 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 90.3 % | 0.98 | 87 % | ✅ |
| *Dryosaurus altus* | Ornitópodo | 0 | 91.8 % | 0.97 | 84 % | ✅ |
| *Ornitholestes hermanni* | Terópodo | 1 | 89.7 % | 0.93 | 80 % | ✅ |
| Competencia trófica | Campo | 3 | 51.4 % | 0.93 | 56 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 3 | 78.3 % | 0.92 | 81 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 3 | 52.0 % | 0.91 | 80 % | ✅ |
| *Huaxiadraco corollatus* | Pterosaurio | 2 | 75.0 % | 0.89 | 78 % | ✅ |
| Mortandad estacional | Campo | 1 | 50.0 % | 0.87 | 76 % | ✅ |
| *Apatosaurus louisae* | Saurópodo | 3 | 48.3 % | 0.83 | 77 % | ✅ |
| Deriva árida | Campo | 1 | 51.0 % | 0.76 | 57 % | ✅ |
| Sabana de helechos | Campo | 1 | 48.5 % | 0.76 | 61 % | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 4 | 43.8 % | 0.73 | 66 % | ✅ |
| *Camarasaurus grandis* | Saurópodo | 3 | 66.2 % | 0.71 | 62 % | ✅ |
| *Torvosaurus tanneri* | Terópodo | 4 | 39.6 % | 0.65 | 58 % | ❌ |
| Canal fluvial trenzado | Campo | 1 | 21.8 % | 0.33 | 26 % | ❌ |

## Diagnóstico

- **Cartas mal calibradas**: 3 (objetivo 0).

  - Canal fluvial trenzado — índice 0.33, uso 26 % (coste 1)
  - Torvosaurus tanneri — índice 0.65, uso 58 % (coste 4)
  - Gregarismo — índice 1.73, uso 95 % (coste 1)


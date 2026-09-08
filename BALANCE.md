# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **70** · Trofeos para ganar: **7**
- Renta: **1/turno hasta 12**, acumula · Mazo: **50**
- Tiempo: 79.4 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 13.16 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 49.8 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 17 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 67.7 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 48% / 21% / 31% | cada una 15 – 60 % | ✅ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **67.7 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 5 |
| P10 | 9 |
| Mediana | 13 |
| Media | 13.16 |
| P90 | 18 |
| Máximo | 31 |

| Vía de victoria | % |
|---|---|
| Registro fósil (7 trofeos) | 47.6 |
| Colapso del habitat | 21.1 |
| Extinción (sin cartas) | 31.2 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **1.99** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| Gregarismo | Campo | 1 | 97.6 % | 1.96 | 91 % | ❌ |
| Trampa de depredadores | Campo | 1 | 93.8 % | 1.48 | 97 % | ❌ |
| Rebrote tras incendio | Campo | 0 | 94.4 % | 1.45 | 99 % | ❌ |
| Crecimiento acelerado | Campo | 1 | 59.8 % | 1.41 | 95 % | ❌ |
| Gastrolitos | Campo | 1 | 81.7 % | 1.39 | 94 % | ❌ |
| *Dryosaurus altus* | Ornitópodo | 0 | 92.2 % | 1.30 | 87 % | ❌ |
| *Ceratosaurus nasicornis* | Terópodo | 1 | 90.8 % | 1.28 | 87 % | ✅ |
| *Ornitholestes hermanni* | Terópodo | 1 | 90.1 % | 1.24 | 84 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 51.5 % | 1.20 | 82 % | ✅ |
| *Nodosaurus textilis* | Tireóforo | 2 | 85.6 % | 1.12 | 75 % | ✅ |
| Mortandad estacional | Campo | 1 | 47.1 % | 1.05 | 70 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 2 | 71.3 % | 1.04 | 70 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 69.9 % | 1.04 | 71 % | ✅ |
| Sabana de helechos | Campo | 1 | 44.5 % | 0.89 | 61 % | ✅ |
| Deriva árida | Campo | 1 | 43.1 % | 0.84 | 54 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 72.0 % | 0.82 | 56 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 3 | 57.4 % | 0.70 | 46 % | ❌ |
| *Lokiceratops rangiformis* | Marginocéfalo | 3 | 27.9 % | 0.59 | 40 % | ❌ |
| *Huaxiadraco corollatus* | Pterosaurio | 2 | 46.9 % | 0.57 | 40 % | ❌ |
| Fractura consolidada | Campo | 2 | 33.8 % | 0.44 | 30 % | ❌ |
| Canal fluvial trenzado | Campo | 1 | 20.4 % | 0.40 | 26 % | ❌ |
| Neumaticidad ósea | Campo | 2 | 16.4 % | 0.35 | 23 % | ❌ |
| *Apatosaurus louisae* | Saurópodo | 3 | 14.3 % | 0.28 | 19 % | ❌ |
| *Camarasaurus grandis* | Saurópodo | 3 | 18.5 % | 0.20 | 13 % | ❌ |
| *Tyrannotitan chubutensis* | Terópodo | 4 | 7.7 % | 0.15 | 11 % | ❌ |
| *Torvosaurus tanneri* | Terópodo | 4 | 4.9 % | 0.10 | 7 % | ❌ |
| Competencia trófica | Campo | 3 | 5.0 % | 0.10 | 6 % | ❌ |

## Diagnóstico

- **Cartas mal calibradas**: 17 (objetivo 0).

  - Torvosaurus tanneri — índice 0.10, uso 7 % (coste 4)
  - Competencia trófica — índice 0.10, uso 6 % (coste 3)
  - Tyrannotitan chubutensis — índice 0.15, uso 11 % (coste 4)
  - Camarasaurus grandis — índice 0.20, uso 13 % (coste 3)
  - Apatosaurus louisae — índice 0.28, uso 19 % (coste 3)
  - Neumaticidad ósea — índice 0.35, uso 23 % (coste 2)
  - Canal fluvial trenzado — índice 0.40, uso 26 % (coste 1)
  - Fractura consolidada — índice 0.44, uso 30 % (coste 2)
  - Huaxiadraco corollatus — índice 0.57, uso 40 % (coste 2)
  - Lokiceratops rangiformis — índice 0.59, uso 40 % (coste 3)
  - Allosaurus fragilis — índice 0.70, uso 46 % (coste 3)
  - Dryosaurus altus — índice 1.30, uso 87 % (coste 0)
  - Gastrolitos — índice 1.39, uso 94 % (coste 1)
  - Crecimiento acelerado — índice 1.41, uso 95 % (coste 1)
  - Rebrote tras incendio — índice 1.45, uso 99 % (coste 0)
  - Trampa de depredadores — índice 1.48, uso 97 % (coste 1)
  - Gregarismo — índice 1.96, uso 91 % (coste 1)


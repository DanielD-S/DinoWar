# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **70** · Trofeos para ganar: **7**
- Renta: **1/turno hasta 12**, acumula · Mazo: **50**
- Tiempo: 77.1 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 13.32 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 49.5 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 19 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 64.1 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 36% / 43% / 21% | cada una 15 – 60 % | ✅ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **64.1 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 6 |
| P10 | 10 |
| Mediana | 13 |
| Media | 13.32 |
| P90 | 17 |
| Máximo | 23 |

| Vía de victoria | % |
|---|---|
| Registro fósil (7 trofeos) | 36.0 |
| Colapso del habitat | 43.3 |
| Extinción (sin cartas) | 20.8 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **1.97** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| Rebrote tras incendio | Campo | 0 | 95.3 % | 1.47 | 100 % | ❌ |
| *Dryosaurus altus* | Ornitópodo | 0 | 94.2 % | 1.46 | 96 % | ❌ |
| *Ceratosaurus nasicornis* | Terópodo | 1 | 93.7 % | 1.44 | 97 % | ❌ |
| Trampa de depredadores | Campo | 1 | 94.0 % | 1.43 | 97 % | ❌ |
| Crecimiento acelerado | Campo | 1 | 60.4 % | 1.43 | 97 % | ❌ |
| Gregarismo | Campo | 1 | 92.8 % | 1.42 | 95 % | ❌ |
| Gastrolitos | Campo | 1 | 82.2 % | 1.42 | 96 % | ❌ |
| *Ornitholestes hermanni* | Terópodo | 1 | 94.0 % | 1.41 | 95 % | ❌ |
| Neumaticidad ósea | Campo | 1 | 55.4 % | 1.30 | 86 % | ❌ |
| *Diplodocus carnegii* | Saurópodo | 2 | 53.9 % | 1.26 | 85 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 74.6 % | 1.19 | 80 % | ✅ |
| *Nodosaurus textilis* | Tireóforo | 2 | 86.0 % | 1.15 | 78 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 2 | 75.7 % | 1.14 | 78 % | ✅ |
| Mortandad estacional | Campo | 1 | 46.9 % | 1.05 | 72 % | ✅ |
| Sabana de helechos | Campo | 1 | 47.4 % | 0.98 | 64 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 61.0 % | 0.85 | 57 % | ✅ |
| Canal fluvial trenzado | Campo | 1 | 38.8 % | 0.78 | 53 % | ✅ |
| Deriva árida | Campo | 1 | 34.8 % | 0.67 | 44 % | ❌ |
| *Huaxiadraco corollatus* | Pterosaurio | 2 | 50.8 % | 0.64 | 44 % | ❌ |
| *Allosaurus fragilis* | Terópodo | 3 | 39.5 % | 0.43 | 28 % | ❌ |
| *Lokiceratops rangiformis* | Marginocéfalo | 3 | 28.6 % | 0.31 | 21 % | ❌ |
| Fractura consolidada | Campo | 2 | 25.3 % | 0.28 | 19 % | ❌ |
| *Apatosaurus louisae* | Saurópodo | 3 | 10.3 % | 0.20 | 14 % | ❌ |
| *Camarasaurus grandis* | Saurópodo | 3 | 9.9 % | 0.17 | 11 % | ❌ |
| *Tyrannotitan chubutensis* | Terópodo | 4 | 3.9 % | 0.08 | 5 % | ❌ |
| *Torvosaurus tanneri* | Terópodo | 4 | 2.3 % | 0.04 | 3 % | ❌ |
| Competencia trófica | Campo | 3 | 0.8 % | 0.01 | 1 % | ❌ |

## Diagnóstico

- **Cartas mal calibradas**: 19 (objetivo 0).

  - Competencia trófica — índice 0.01, uso 1 % (coste 3)
  - Torvosaurus tanneri — índice 0.04, uso 3 % (coste 4)
  - Tyrannotitan chubutensis — índice 0.08, uso 5 % (coste 4)
  - Camarasaurus grandis — índice 0.17, uso 11 % (coste 3)
  - Apatosaurus louisae — índice 0.20, uso 14 % (coste 3)
  - Fractura consolidada — índice 0.28, uso 19 % (coste 2)
  - Lokiceratops rangiformis — índice 0.31, uso 21 % (coste 3)
  - Allosaurus fragilis — índice 0.43, uso 28 % (coste 3)
  - Huaxiadraco corollatus — índice 0.64, uso 44 % (coste 2)
  - Deriva árida — índice 0.67, uso 44 % (coste 1)
  - Neumaticidad ósea — índice 1.30, uso 86 % (coste 1)
  - Ornitholestes hermanni — índice 1.41, uso 95 % (coste 1)
  - Gastrolitos — índice 1.42, uso 96 % (coste 1)
  - Gregarismo — índice 1.42, uso 95 % (coste 1)
  - Crecimiento acelerado — índice 1.43, uso 97 % (coste 1)
  - Trampa de depredadores — índice 1.43, uso 97 % (coste 1)
  - Ceratosaurus nasicornis — índice 1.44, uso 97 % (coste 1)
  - Dryosaurus altus — índice 1.46, uso 96 % (coste 0)
  - Rebrote tras incendio — índice 1.47, uso 100 % (coste 0)


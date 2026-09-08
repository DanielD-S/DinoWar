# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **54** · Trofeos para ganar: **6**
- Renta: **1/turno hasta 12**, acumula · Mazo: **50**
- Tiempo: 64.4 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 11.15 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 48.5 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 13 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 62.8 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 37% / 35% / 28% | cada una 15 – 60 % | ✅ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **62.8 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 3 |
| P10 | 8 |
| Mediana | 11 |
| Media | 11.15 |
| P90 | 15 |
| Máximo | 20 |

| Vía de victoria | % |
|---|---|
| Registro fósil (6 trofeos) | 37.0 |
| Colapso del habitat | 34.9 |
| Extinción (sin cartas) | 28.1 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **1.99** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| Rebrote tras incendio | Campo | 0 | 94.0 % | 1.40 | 99 % | ❌ |
| Trampa de depredadores | Campo | 1 | 92.0 % | 1.36 | 97 % | ❌ |
| *Ceratosaurus nasicornis* | Terópodo | 1 | 90.8 % | 1.32 | 96 % | ❌ |
| *Ornitholestes hermanni* | Terópodo | 1 | 90.7 % | 1.31 | 93 % | ❌ |
| *Dryosaurus altus* | Ornitópodo | 0 | 90.7 % | 1.31 | 96 % | ❌ |
| Gregarismo | Campo | 1 | 88.1 % | 1.28 | 90 % | ✅ |
| Competencia trófica | Campo | 1 | 52.2 % | 1.27 | 92 % | ✅ |
| Crecimiento acelerado | Campo | 1 | 52.5 % | 1.26 | 96 % | ✅ |
| Fractura consolidada | Campo | 1 | 75.3 % | 1.24 | 92 % | ✅ |
| Gastrolitos | Campo | 1 | 74.2 % | 1.21 | 90 % | ✅ |
| Canal fluvial trenzado | Campo | 1 | 53.3 % | 1.18 | 87 % | ✅ |
| Neumaticidad ósea | Campo | 1 | 48.0 % | 1.13 | 82 % | ✅ |
| *Camarasaurus grandis* | Saurópodo | 2 | 39.9 % | 0.98 | 74 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 2 | 67.4 % | 0.94 | 66 % | ✅ |
| Mortandad estacional | Campo | 1 | 37.4 % | 0.88 | 64 % | ✅ |
| Sabana de helechos | Campo | 1 | 40.6 % | 0.85 | 61 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 2 | 58.9 % | 0.81 | 60 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 2 | 60.2 % | 0.81 | 59 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 32.8 % | 0.73 | 53 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 49.1 % | 0.66 | 49 % | ❌ |
| Deriva árida | Campo | 1 | 29.0 % | 0.58 | 42 % | ❌ |
| *Tyrannotitan chubutensis* | Terópodo | 3 | 26.8 % | 0.58 | 42 % | ❌ |
| *Nodosaurus textilis* | Tireóforo | 2 | 57.1 % | 0.58 | 42 % | ❌ |
| *Huaxiadraco corollatus* | Pterosaurio | 2 | 40.9 % | 0.54 | 40 % | ❌ |
| *Torvosaurus tanneri* | Terópodo | 3 | 21.8 % | 0.45 | 34 % | ❌ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 29.4 % | 0.35 | 27 % | ❌ |
| *Apatosaurus louisae* | Saurópodo | 3 | 15.6 % | 0.33 | 25 % | ❌ |

## Diagnóstico

- **Cartas mal calibradas**: 13 (objetivo 0).

  - Apatosaurus louisae — índice 0.33, uso 25 % (coste 3)
  - Brachylophosaurus canadensis — índice 0.35, uso 27 % (coste 2)
  - Torvosaurus tanneri — índice 0.45, uso 34 % (coste 3)
  - Huaxiadraco corollatus — índice 0.54, uso 40 % (coste 2)
  - Nodosaurus textilis — índice 0.58, uso 42 % (coste 2)
  - Tyrannotitan chubutensis — índice 0.58, uso 42 % (coste 3)
  - Deriva árida — índice 0.58, uso 42 % (coste 1)
  - Stegosaurus stenops — índice 0.66, uso 49 % (coste 2)
  - Dryosaurus altus — índice 1.31, uso 96 % (coste 0)
  - Ornitholestes hermanni — índice 1.31, uso 93 % (coste 1)
  - Ceratosaurus nasicornis — índice 1.32, uso 96 % (coste 1)
  - Trampa de depredadores — índice 1.36, uso 97 % (coste 1)
  - Rebrote tras incendio — índice 1.40, uso 99 % (coste 0)


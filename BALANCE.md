# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **70** · Trofeos para ganar: **10**
- Renta: **2/turno hasta 12**, acumula · Mazo: **50**
- Tiempo: 133.7 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 12.29 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 50.5 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 5 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 70.3 % | 55 – 70 % | ❌ |
| Reparto entre las tres victorias | 40% / 32% / 28% | cada una 15 – 60 % | ✅ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **70.3 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 6 |
| P10 | 9 |
| Mediana | 12 |
| Media | 12.29 |
| P90 | 16 |
| Máximo | 31 |

| Vía de victoria | % |
|---|---|
| Registro fósil (10 trofeos) | 40.1 |
| Colapso del habitat | 32.0 |
| Extinción (sin cartas) | 27.9 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **2.03** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| Gregarismo | Campo | 1 | 99.0 % | 1.72 | 93 % | ❌ |
| Trampa de depredadores | Campo | 1 | 93.4 % | 1.16 | 97 % | ✅ |
| Gastrolitos | Campo | 1 | 82.5 % | 1.10 | 95 % | ✅ |
| Rebrote tras incendio | Campo | 0 | 93.9 % | 1.09 | 96 % | ✅ |
| Crecimiento acelerado | Campo | 1 | 58.0 % | 1.09 | 94 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 57.0 % | 1.08 | 95 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 2 | 81.3 % | 1.07 | 93 % | ✅ |
| *Nodosaurus textilis* | Tireóforo | 2 | 92.0 % | 1.07 | 93 % | ✅ |
| Fractura consolidada | Campo | 2 | 77.8 % | 1.06 | 82 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 80.4 % | 1.05 | 92 % | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 1 | 90.5 % | 1.03 | 91 % | ✅ |
| *Dryosaurus altus* | Ornitópodo | 0 | 91.5 % | 1.02 | 89 % | ✅ |
| *Ornitholestes hermanni* | Terópodo | 1 | 91.2 % | 1.02 | 88 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 89.5 % | 1.01 | 91 % | ✅ |
| Neumaticidad ósea | Campo | 2 | 51.7 % | 0.95 | 73 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 3 | 76.7 % | 0.94 | 82 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 3 | 50.9 % | 0.94 | 81 % | ✅ |
| *Huaxiadraco corollatus* | Pterosaurio | 2 | 73.7 % | 0.91 | 80 % | ✅ |
| *Apatosaurus louisae* | Saurópodo | 3 | 47.5 % | 0.87 | 79 % | ✅ |
| Mortandad estacional | Campo | 1 | 46.9 % | 0.86 | 76 % | ✅ |
| Deriva árida | Campo | 1 | 48.3 % | 0.76 | 56 % | ✅ |
| *Camarasaurus grandis* | Saurópodo | 3 | 64.8 % | 0.72 | 63 % | ✅ |
| Sabana de helechos | Campo | 1 | 44.0 % | 0.72 | 58 % | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 4 | 39.3 % | 0.69 | 61 % | ❌ |
| *Torvosaurus tanneri* | Terópodo | 4 | 36.0 % | 0.62 | 55 % | ❌ |
| Canal fluvial trenzado | Campo | 1 | 21.1 % | 0.33 | 25 % | ❌ |
| Competencia trófica | Campo | 3 | 0.0 % | 0.00 | 0 % | ❌ |

## Diagnóstico

- **Cartas mal calibradas**: 5 (objetivo 0).
- **P(ganar | ventaja en el turno 5)**: 70.3 % (objetivo 55 – 70 %).

  - Competencia trófica — índice 0.00, uso 0 % (coste 3)
  - Canal fluvial trenzado — índice 0.33, uso 25 % (coste 1)
  - Torvosaurus tanneri — índice 0.62, uso 55 % (coste 4)
  - Tyrannotitan chubutensis — índice 0.69, uso 61 % (coste 4)
  - Gregarismo — índice 1.72, uso 93 % (coste 1)


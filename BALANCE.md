# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **70** · Trofeos para ganar: **10**
- Renta: **2/turno hasta 12**, acumula · Mazo: **50**
- Tiempo: 144.8 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 12.81 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 49.6 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 3 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 64.8 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 45% / 24% / 31% | cada una 15 – 60 % | ✅ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **64.8 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 6 |
| P10 | 9 |
| Mediana | 12 |
| Media | 12.81 |
| P90 | 16 |
| Máximo | 31 |

| Vía de victoria | % |
|---|---|
| Registro fósil (10 trofeos) | 44.5 |
| Colapso del habitat | 24.1 |
| Extinción (sin cartas) | 31.4 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **2.09** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| Gregarismo | Campo | 1 | 99.0 % | 1.69 | 93 % | ❌ |
| Trampa de depredadores | Campo | 1 | 93.9 % | 1.15 | 96 % | ✅ |
| Rebrote tras incendio | Campo | 0 | 94.7 % | 1.10 | 96 % | ✅ |
| Gastrolitos | Campo | 1 | 83.2 % | 1.10 | 94 % | ✅ |
| Crecimiento acelerado | Campo | 1 | 58.7 % | 1.07 | 93 % | ✅ |
| *Nodosaurus textilis* | Tireóforo | 2 | 91.9 % | 1.07 | 93 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 57.4 % | 1.06 | 93 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 81.4 % | 1.05 | 92 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 2 | 80.3 % | 1.03 | 91 % | ✅ |
| Fractura consolidada | Campo | 2 | 77.5 % | 1.02 | 80 % | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 1 | 90.3 % | 1.01 | 88 % | ✅ |
| *Dryosaurus altus* | Ornitópodo | 0 | 91.7 % | 1.00 | 86 % | ✅ |
| *Ornitholestes hermanni* | Terópodo | 1 | 91.0 % | 0.99 | 86 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 90.0 % | 0.98 | 89 % | ✅ |
| Neumaticidad ósea | Campo | 2 | 52.5 % | 0.94 | 73 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 3 | 51.7 % | 0.93 | 81 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 3 | 77.8 % | 0.92 | 81 % | ✅ |
| *Huaxiadraco corollatus* | Pterosaurio | 2 | 73.7 % | 0.91 | 79 % | ✅ |
| Mortandad estacional | Campo | 1 | 49.1 % | 0.87 | 76 % | ✅ |
| *Apatosaurus louisae* | Saurópodo | 3 | 45.8 % | 0.80 | 73 % | ✅ |
| Deriva árida | Campo | 1 | 49.1 % | 0.75 | 57 % | ✅ |
| Competencia trófica | Campo | 3 | 41.8 % | 0.73 | 43 % | ✅ |
| Sabana de helechos | Campo | 1 | 45.5 % | 0.72 | 58 % | ✅ |
| *Camarasaurus grandis* | Saurópodo | 3 | 65.8 % | 0.71 | 62 % | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 4 | 41.6 % | 0.70 | 63 % | ✅ |
| *Torvosaurus tanneri* | Terópodo | 4 | 37.3 % | 0.63 | 56 % | ❌ |
| Canal fluvial trenzado | Campo | 1 | 21.4 % | 0.33 | 25 % | ❌ |

## Diagnóstico

- **Cartas mal calibradas**: 3 (objetivo 0).

  - Canal fluvial trenzado — índice 0.33, uso 25 % (coste 1)
  - Torvosaurus tanneri — índice 0.63, uso 56 % (coste 4)
  - Gregarismo — índice 1.69, uso 93 % (coste 1)


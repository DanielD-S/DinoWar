# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **70** · Trofeos para ganar: **10**
- Renta: **2/turno hasta 12**, acumula · Mazo: **50**
- Tiempo: 228.1 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 11.43 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 46.1 % | 48 – 55 % | ❌ |
| Cartas mal calibradas | 3 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 66.6 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 36% / 44% / 20% | cada una 15 – 60 % | ✅ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **66.6 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 5 |
| P10 | 8 |
| Mediana | 11 |
| Media | 11.43 |
| P90 | 15 |
| Máximo | 20 |

| Vía de victoria | % |
|---|---|
| Registro fósil (10 trofeos) | 35.7 |
| Colapso del habitat | 44.3 |
| Extinción (sin cartas) | 20.1 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **2.13** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| *Dryosaurus altus* | Ornitópodo | 0 | 93.7 % | 1.16 | 98 % | ✅ |
| *Ornitholestes hermanni* | Terópodo | 1 | 92.1 % | 1.14 | 97 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 57.1 % | 1.14 | 98 % | ✅ |
| Trampa de depredadores | Campo | 1 | 92.7 % | 1.13 | 94 % | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 2 | 92.5 % | 1.12 | 95 % | ✅ |
| Gastrolitos | Campo | 1 | 82.0 % | 1.11 | 96 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 91.3 % | 1.11 | 95 % | ✅ |
| *Huaxiadraco corollatus* | Pterosaurio | 2 | 78.4 % | 1.11 | 96 % | ✅ |
| Gregarismo | Campo | 1 | 89.8 % | 1.10 | 92 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 3 | 80.7 % | 1.10 | 92 % | ✅ |
| Crecimiento acelerado | Campo | 1 | 54.9 % | 1.08 | 96 % | ✅ |
| Rebrote tras incendio | Campo | 0 | 92.5 % | 1.08 | 92 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 3 | 54.0 % | 1.06 | 90 % | ✅ |
| Sabana de helechos | Campo | 1 | 59.3 % | 1.03 | 85 % | ✅ |
| *Nodosaurus textilis* | Tireóforo | 3 | 76.0 % | 1.02 | 86 % | ✅ |
| *Apatosaurus louisae* | Saurópodo | 3 | 51.4 % | 1.00 | 87 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 88.7 % | 1.00 | 88 % | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 4 | 49.7 % | 0.96 | 82 % | ✅ |
| Neumaticidad ósea | Campo | 2 | 48.5 % | 0.95 | 80 % | ✅ |
| Fractura consolidada | Campo | 2 | 72.6 % | 0.95 | 83 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 3 | 67.7 % | 0.85 | 72 % | ✅ |
| Mortandad estacional | Campo | 1 | 44.8 % | 0.85 | 74 % | ✅ |
| *Camarasaurus grandis* | Saurópodo | 3 | 67.9 % | 0.84 | 73 % | ✅ |
| *Torvosaurus tanneri* | Terópodo | 4 | 44.3 % | 0.82 | 71 % | ✅ |
| Deriva árida | Campo | 1 | 36.9 % | 0.61 | 53 % | ❌ |
| Canal fluvial trenzado | Campo | 1 | 0.0 % | 0.00 | 0 % | ❌ |
| Competencia trófica | Campo | 3 | 0.0 % | 0.00 | 0 % | ❌ |

## Diagnóstico

- **Victorias del jugador inicial**: 46.1 % (objetivo 48 – 55 %).
- **Cartas mal calibradas**: 3 (objetivo 0).

  - Canal fluvial trenzado — índice 0.00, uso 0 % (coste 1)
  - Competencia trófica — índice 0.00, uso 0 % (coste 3)
  - Deriva árida — índice 0.61, uso 53 % (coste 1)


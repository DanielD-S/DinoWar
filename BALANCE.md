# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **70** · Trofeos para ganar: **10**
- Renta: **2/turno hasta 12**, acumula · Mazo: **50**
- Tiempo: 116.3 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 11.03 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 49.8 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 4 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 68.2 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 36% / 44% / 19% | cada una 15 – 60 % | ✅ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **68.2 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 6 |
| P10 | 8 |
| Mediana | 11 |
| Media | 11.03 |
| P90 | 14 |
| Máximo | 19 |

| Vía de victoria | % |
|---|---|
| Registro fósil (10 trofeos) | 36.2 |
| Colapso del habitat | 44.4 |
| Extinción (sin cartas) | 19.4 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **2.30** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| Gregarismo | Campo | 1 | 98.8 % | 1.69 | 95 % | ❌ |
| Trampa de depredadores | Campo | 1 | 92.3 % | 1.07 | 97 % | ✅ |
| Sabana de helechos | Campo | 1 | 61.1 % | 1.06 | 87 % | ✅ |
| Gastrolitos | Campo | 1 | 81.0 % | 1.05 | 98 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 55.7 % | 1.05 | 99 % | ✅ |
| Fractura consolidada | Campo | 2 | 78.3 % | 1.04 | 85 % | ✅ |
| *Dryosaurus altus* | Ornitópodo | 0 | 92.5 % | 1.04 | 97 % | ✅ |
| Crecimiento acelerado | Campo | 1 | 56.3 % | 1.04 | 98 % | ✅ |
| *Nodosaurus textilis* | Tireóforo | 2 | 91.5 % | 1.04 | 98 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 2 | 80.2 % | 1.03 | 98 % | ✅ |
| *Ornitholestes hermanni* | Terópodo | 1 | 91.9 % | 1.03 | 96 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 79.7 % | 1.03 | 98 % | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 1 | 90.4 % | 1.02 | 97 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 90.0 % | 1.02 | 97 % | ✅ |
| *Huaxiadraco corollatus* | Pterosaurio | 2 | 78.5 % | 1.00 | 95 % | ✅ |
| Rebrote tras incendio | Campo | 0 | 92.7 % | 1.00 | 93 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 3 | 79.0 % | 0.98 | 91 % | ✅ |
| Neumaticidad ósea | Campo | 2 | 52.6 % | 0.98 | 77 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 3 | 52.4 % | 0.96 | 90 % | ✅ |
| *Apatosaurus louisae* | Saurópodo | 3 | 50.0 % | 0.90 | 88 % | ✅ |
| *Camarasaurus grandis* | Saurópodo | 3 | 70.0 % | 0.83 | 78 % | ✅ |
| Mortandad estacional | Campo | 1 | 45.2 % | 0.82 | 76 % | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 4 | 45.4 % | 0.81 | 77 % | ✅ |
| Deriva árida | Campo | 1 | 46.0 % | 0.72 | 56 % | ✅ |
| *Torvosaurus tanneri* | Terópodo | 4 | 40.6 % | 0.70 | 68 % | ❌ |
| Canal fluvial trenzado | Campo | 1 | 20.5 % | 0.32 | 26 % | ❌ |
| Competencia trófica | Campo | 3 | 0.0 % | 0.00 | 0 % | ❌ |

## Diagnóstico

- **Cartas mal calibradas**: 4 (objetivo 0).

  - Competencia trófica — índice 0.00, uso 0 % (coste 3)
  - Canal fluvial trenzado — índice 0.32, uso 26 % (coste 1)
  - Torvosaurus tanneri — índice 0.70, uso 68 % (coste 4)
  - Gregarismo — índice 1.69, uso 95 % (coste 1)


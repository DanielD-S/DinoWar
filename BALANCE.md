# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **70** · Trofeos para ganar: **10**
- Renta: **2/turno hasta 12**, acumula · Mazo: **50**
- Tiempo: 117.7 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 11.65 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 49.0 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 3 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 68.2 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 51% / 35% / 14% | cada una 15 – 60 % | ❌ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **68.2 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 6 |
| P10 | 9 |
| Mediana | 12 |
| Media | 11.65 |
| P90 | 14 |
| Máximo | 18 |

| Vía de victoria | % |
|---|---|
| Registro fósil (10 trofeos) | 50.8 |
| Colapso del habitat | 34.8 |
| Extinción (sin cartas) | 14.4 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **2.32** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| Trampa de depredadores | Campo | 1 | 92.8 % | 1.12 | 99 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 57.4 % | 1.11 | 99 % | ✅ |
| *Dryosaurus altus* | Ornitópodo | 0 | 93.3 % | 1.11 | 97 % | ✅ |
| Gregarismo | Campo | 1 | 91.2 % | 1.10 | 98 % | ✅ |
| *Nodosaurus textilis* | Tireóforo | 2 | 91.9 % | 1.10 | 98 % | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 1 | 91.8 % | 1.10 | 99 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 3 | 82.7 % | 1.09 | 94 % | ✅ |
| Crecimiento acelerado | Campo | 1 | 57.3 % | 1.09 | 99 % | ✅ |
| *Ornitholestes hermanni* | Terópodo | 1 | 93.2 % | 1.08 | 97 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 91.3 % | 1.08 | 98 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 2 | 81.0 % | 1.07 | 99 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 80.2 % | 1.07 | 98 % | ✅ |
| Gastrolitos | Campo | 1 | 80.0 % | 1.07 | 98 % | ✅ |
| *Huaxiadraco corollatus* | Pterosaurio | 2 | 79.3 % | 1.05 | 96 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 3 | 55.1 % | 1.03 | 94 % | ✅ |
| Fractura consolidada | Campo | 2 | 76.2 % | 1.00 | 93 % | ✅ |
| Sabana de helechos | Campo | 1 | 58.5 % | 0.99 | 87 % | ✅ |
| *Apatosaurus louisae* | Saurópodo | 3 | 52.9 % | 0.98 | 93 % | ✅ |
| Rebrote tras incendio | Campo | 0 | 90.8 % | 0.98 | 89 % | ✅ |
| Neumaticidad ósea | Campo | 2 | 51.5 % | 0.98 | 88 % | ✅ |
| *Camarasaurus grandis* | Saurópodo | 3 | 75.5 % | 0.95 | 85 % | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 4 | 50.0 % | 0.94 | 86 % | ✅ |
| Mortandad estacional | Campo | 1 | 47.9 % | 0.88 | 80 % | ✅ |
| *Torvosaurus tanneri* | Terópodo | 4 | 47.5 % | 0.86 | 80 % | ✅ |
| Deriva árida | Campo | 1 | 31.4 % | 0.50 | 45 % | ❌ |
| Canal fluvial trenzado | Campo | 1 | 0.0 % | 0.00 | 0 % | ❌ |
| Competencia trófica | Campo | 3 | 0.0 % | 0.00 | 0 % | ❌ |

## Diagnóstico

- **Cartas mal calibradas**: 3 (objetivo 0).
- **Reparto entre las tres victorias**: 51% / 35% / 14% (objetivo cada una 15 – 60 %).

  - Canal fluvial trenzado — índice 0.00, uso 0 % (coste 1)
  - Competencia trófica — índice 0.00, uso 0 % (coste 3)
  - Deriva árida — índice 0.50, uso 45 % (coste 1)


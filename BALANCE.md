# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **90** · Trofeos para ganar: **6**
- Renta: **1/turno hasta 12**, acumula · Mazo: **50**
- Tiempo: 56.7 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 10.72 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 48.1 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 12 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 66.4 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 35% / 36% / 29% | cada una 15 – 60 % | ✅ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **66.4 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 3 |
| P10 | 7 |
| Mediana | 11 |
| Media | 10.72 |
| P90 | 14 |
| Máximo | 20 |

| Vía de victoria | % |
|---|---|
| Registro fósil (6 trofeos) | 35.0 |
| Colapso del habitat | 36.3 |
| Extinción (sin cartas) | 28.7 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **1.97** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| Rebrote tras incendio | Campo | 0 | 93.5 % | 1.43 | 99 % | ❌ |
| Trampa de depredadores | Campo | 1 | 91.8 % | 1.39 | 97 % | ❌ |
| *Ornitholestes hermanni* | Terópodo | 1 | 90.6 % | 1.36 | 95 % | ❌ |
| *Dryosaurus altus* | Ornitópodo | 0 | 90.8 % | 1.36 | 98 % | ❌ |
| *Ceratosaurus nasicornis* | Terópodo | 1 | 90.7 % | 1.36 | 97 % | ❌ |
| Gregarismo | Campo | 1 | 87.8 % | 1.30 | 90 % | ✅ |
| Competencia trófica | Campo | 1 | 51.3 % | 1.29 | 92 % | ✅ |
| Crecimiento acelerado | Campo | 1 | 51.0 % | 1.28 | 96 % | ✅ |
| Fractura consolidada | Campo | 1 | 73.8 % | 1.24 | 91 % | ✅ |
| Gastrolitos | Campo | 1 | 73.3 % | 1.24 | 90 % | ✅ |
| Neumaticidad ósea | Campo | 1 | 44.6 % | 1.09 | 78 % | ✅ |
| *Camarasaurus grandis* | Saurópodo | 2 | 44.4 % | 0.87 | 64 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 2 | 61.9 % | 0.86 | 60 % | ✅ |
| Mortandad estacional | Campo | 1 | 36.4 % | 0.86 | 62 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 2 | 58.8 % | 0.84 | 62 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 36.0 % | 0.84 | 60 % | ✅ |
| Sabana de helechos | Campo | 1 | 38.0 % | 0.82 | 57 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 54.9 % | 0.78 | 58 % | ✅ |
| *Nodosaurus textilis* | Tireóforo | 2 | 68.3 % | 0.75 | 54 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 2 | 53.1 % | 0.71 | 52 % | ✅ |
| Canal fluvial trenzado | Campo | 1 | 28.8 % | 0.62 | 45 % | ❌ |
| Deriva árida | Campo | 1 | 28.2 % | 0.59 | 42 % | ❌ |
| *Tyrannotitan chubutensis* | Terópodo | 3 | 25.9 % | 0.58 | 41 % | ❌ |
| *Torvosaurus tanneri* | Terópodo | 3 | 20.8 % | 0.44 | 33 % | ❌ |
| *Apatosaurus louisae* | Saurópodo | 3 | 15.5 % | 0.34 | 25 % | ❌ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 26.6 % | 0.33 | 25 % | ❌ |
| *Huaxiadraco corollatus* | Pterosaurio | 2 | 25.5 % | 0.31 | 23 % | ❌ |

## Diagnóstico

- **Cartas mal calibradas**: 12 (objetivo 0).

  - Huaxiadraco corollatus — índice 0.31, uso 23 % (coste 2)
  - Brachylophosaurus canadensis — índice 0.33, uso 25 % (coste 2)
  - Apatosaurus louisae — índice 0.34, uso 25 % (coste 3)
  - Torvosaurus tanneri — índice 0.44, uso 33 % (coste 3)
  - Tyrannotitan chubutensis — índice 0.58, uso 41 % (coste 3)
  - Deriva árida — índice 0.59, uso 42 % (coste 1)
  - Canal fluvial trenzado — índice 0.62, uso 45 % (coste 1)
  - Ceratosaurus nasicornis — índice 1.36, uso 97 % (coste 1)
  - Dryosaurus altus — índice 1.36, uso 98 % (coste 0)
  - Ornitholestes hermanni — índice 1.36, uso 95 % (coste 1)
  - Trampa de depredadores — índice 1.39, uso 97 % (coste 1)
  - Rebrote tras incendio — índice 1.43, uso 99 % (coste 0)


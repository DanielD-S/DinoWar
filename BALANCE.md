# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **4** · Habitat: **70** · Trofeos para ganar: **10**
- Renta: **2/turno hasta 12**, acumula · Mazo: **55**
- Tiempo: 164.2 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 11.04 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 45.4 % | 48 – 55 % | ❌ |
| Cartas mal calibradas | 0 | 0 | ✅ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 71.2 % | 55 – 70 % | ❌ |
| Reparto entre las tres victorias | 25% / 75% / 0% | cada una 15 – 60 % | ❌ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **71.2 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 5 |
| P10 | 8 |
| Mediana | 11 |
| Media | 11.04 |
| P90 | 14 |
| Máximo | 19 |

| Vía de victoria | % |
|---|---|
| Registro fósil (10 trofeos) | 24.8 |
| Colapso del habitat | 75.3 |
| Extinción (sin cartas) | 0.0 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **1.83** de 4 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| *Iguanodon bernissartensis* | Ornitópodo | 2 | 92.2 % | 1.11 | 97 % | ✅ |
| *Pachycephalosaurus wyomingensis* | Marginocéfalo | 2 | 80.5 % | 1.10 | 98 % | ✅ |
| Bosque de araucarias | Campo | 0 | 82.3 % | 1.08 | 97 % | ✅ |
| Pradera de helechos | Campo | 0 | 98.7 % | 1.08 | 96 % | ✅ |
| *Suchomimus tenerensis* | Terópodo | 3 | 57.4 % | 1.07 | 95 % | ✅ |
| Matorral de cícadas | Campo | 0 | 81.7 % | 1.07 | 96 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 53.6 % | 1.05 | 98 % | ✅ |
| Nube de insectos | Campo | 0 | 78.8 % | 1.04 | 93 % | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 2 | 78.0 % | 1.04 | 92 % | ✅ |
| Gastrolitos | Campo | 1 | 55.9 % | 1.04 | 90 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 3 | 52.3 % | 1.03 | 91 % | ✅ |
| Crecimiento acelerado | Campo | 1 | 56.0 % | 1.03 | 92 % | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 4 | 55.1 % | 1.02 | 89 % | ✅ |
| Sabana de helechos | Campo | 0 | 77.9 % | 1.01 | 92 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 3 | 90.8 % | 1.01 | 91 % | ✅ |
| *Velociraptor mongoliensis* | Terópodo | 0 | 79.1 % | 1.00 | 90 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 53.0 % | 1.00 | 90 % | ✅ |
| *Deltadromeus agilis* | Terópodo | 3 | 54.0 % | 0.99 | 92 % | ✅ |
| *Dryosaurus altus* | Ornitópodo | 0 | 76.8 % | 0.99 | 86 % | ✅ |
| *Amargasaurus cazadorensis* | Saurópodo | 2 | 76.8 % | 0.98 | 90 % | ✅ |
| *Kentrosaurus aethiopicus* | Tireóforo | 1 | 76.9 % | 0.97 | 86 % | ✅ |
| *Apatosaurus louisae* | Saurópodo | 3 | 74.8 % | 0.96 | 89 % | ✅ |
| Nido con huevos | Campo | 1 | 76.6 % | 0.96 | 91 % | ✅ |
| Trampa de depredadores | Campo | 1 | 77.1 % | 0.96 | 87 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 49.6 % | 0.92 | 83 % | ✅ |
| Monzón de verano | Campo | 1 | 57.5 % | 0.91 | 81 % | ✅ |
| Fractura consolidada | Campo | 2 | 72.8 % | 0.90 | 79 % | ✅ |
| Gregarismo | Campo | 1 | 74.3 % | 0.90 | 80 % | ✅ |
| Rebrote tras incendio | Campo | 0 | 74.2 % | 0.86 | 77 % | ✅ |
| Canal fluvial trenzado | Campo | 1 | 45.9 % | 0.83 | 76 % | ✅ |
| *Monolophosaurus jiangi* | Terópodo | 4 | 39.6 % | 0.71 | 65 % | ✅ |

## Diagnóstico

- **Victorias del jugador inicial**: 45.4 % (objetivo 48 – 55 %).
- **P(ganar | ventaja en el turno 5)**: 71.2 % (objetivo 55 – 70 %).
- **Reparto entre las tres victorias**: 25% / 75% / 0% (objetivo cada una 15 – 60 %).


# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **4** · Habitat: **70** · Trofeos para ganar: **10**
- Renta: **2/turno hasta 12**, acumula · Mazo: **55**
- Tiempo: 149.5 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 11.66 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 47.5 % | 48 – 55 % | ❌ |
| Cartas mal calibradas | 0 | 0 | ✅ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 72.1 % | 55 – 70 % | ❌ |
| Reparto entre las tres victorias | 44% / 56% / 0% | cada una 15 – 60 % | ❌ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **72.1 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 5 |
| P10 | 8 |
| Mediana | 12 |
| Media | 11.66 |
| P90 | 15 |
| Máximo | 20 |

| Vía de victoria | % |
|---|---|
| Registro fósil (10 trofeos) | 43.6 |
| Colapso del habitat | 56.3 |
| Extinción (sin cartas) | 0.1 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **1.97** de 4 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| Bosque de araucarias | Campo | 0 | 83.7 % | 1.09 | 96 % | ✅ |
| Pradera de helechos | Campo | 0 | 98.8 % | 1.08 | 96 % | ✅ |
| *Pachycephalosaurus wyomingensis* | Marginocéfalo | 2 | 83.5 % | 1.08 | 96 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 59.5 % | 1.07 | 96 % | ✅ |
| *Iguanodon bernissartensis* | Ornitópodo | 2 | 82.8 % | 1.07 | 95 % | ✅ |
| Gastrolitos | Campo | 1 | 59.1 % | 1.05 | 92 % | ✅ |
| *Amargasaurus cazadorensis* | Saurópodo | 2 | 82.5 % | 1.05 | 92 % | ✅ |
| Matorral de cícadas | Campo | 0 | 83.1 % | 1.05 | 96 % | ✅ |
| Crecimiento acelerado | Campo | 1 | 58.7 % | 1.05 | 93 % | ✅ |
| Nube de insectos | Campo | 0 | 81.5 % | 1.05 | 93 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 3 | 83.3 % | 1.04 | 95 % | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 2 | 83.2 % | 1.03 | 91 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 56.5 % | 1.02 | 90 % | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 4 | 58.4 % | 1.02 | 91 % | ✅ |
| *Ornitholestes hermanni* | Terópodo | 1 | 82.3 % | 1.01 | 90 % | ✅ |
| Sabana de helechos | Campo | 0 | 80.8 % | 1.01 | 93 % | ✅ |
| Nido con huevos | Campo | 1 | 80.5 % | 1.00 | 94 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 3 | 56.0 % | 0.99 | 91 % | ✅ |
| *Huaxiadraco corollatus* | Pterosaurio | 2 | 55.5 % | 0.99 | 92 % | ✅ |
| *Apatosaurus louisae* | Saurópodo | 3 | 54.7 % | 0.97 | 88 % | ✅ |
| *Velociraptor mongoliensis* | Terópodo | 0 | 81.3 % | 0.97 | 86 % | ✅ |
| Trampa de depredadores | Campo | 1 | 80.3 % | 0.97 | 89 % | ✅ |
| *Kentrosaurus aethiopicus* | Tireóforo | 1 | 80.3 % | 0.96 | 86 % | ✅ |
| *Dryosaurus altus* | Ornitópodo | 0 | 90.6 % | 0.96 | 85 % | ✅ |
| Fractura consolidada | Campo | 2 | 77.6 % | 0.95 | 83 % | ✅ |
| Gregarismo | Campo | 1 | 76.4 % | 0.92 | 83 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 51.6 % | 0.90 | 80 % | ✅ |
| *Camarasaurus grandis* | Saurópodo | 3 | 50.7 % | 0.89 | 82 % | ✅ |
| Canal fluvial trenzado | Campo | 1 | 51.1 % | 0.88 | 82 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 3 | 50.6 % | 0.88 | 83 % | ✅ |
| Monzón de verano | Campo | 1 | 57.6 % | 0.86 | 79 % | ✅ |
| Rebrote tras incendio | Campo | 0 | 75.0 % | 0.82 | 74 % | ✅ |

## Diagnóstico

- **Victorias del jugador inicial**: 47.5 % (objetivo 48 – 55 %).
- **P(ganar | ventaja en el turno 5)**: 72.1 % (objetivo 55 – 70 %).
- **Reparto entre las tres victorias**: 44% / 56% / 0% (objetivo cada una 15 – 60 %).


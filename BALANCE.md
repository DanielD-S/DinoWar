# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **4** · Habitat: **70** · Trofeos para ganar: **10**
- Renta: **2/turno hasta 12**, acumula · Mazo: **55**
- Tiempo: 264.8 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 12.64 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 47.5 % | 48 – 55 % | ❌ |
| Cartas mal calibradas | 3 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 68.8 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 36% / 63% / 0% | cada una 15 – 60 % | ❌ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **68.8 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 6 |
| P10 | 9 |
| Mediana | 13 |
| Media | 12.64 |
| P90 | 16 |
| Máximo | 24 |

| Vía de victoria | % |
|---|---|
| Registro fósil (10 trofeos) | 36.3 |
| Colapso del habitat | 63.5 |
| Extinción (sin cartas) | 0.3 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **1.91** de 4 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| Pradera de helechos | Campo | 0 | 99.7 % | 1.12 | 99 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 56.0 % | 1.11 | 96 % | ✅ |
| *Ornitholestes hermanni* | Terópodo | 1 | 91.0 % | 1.09 | 96 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 3 | 55.5 % | 1.08 | 96 % | ✅ |
| *Dryosaurus altus* | Ornitópodo | 0 | 92.3 % | 1.08 | 95 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 3 | 80.5 % | 1.07 | 96 % | ✅ |
| Trampa de depredadores | Campo | 1 | 90.6 % | 1.07 | 97 % | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 4 | 56.8 % | 1.07 | 94 % | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 2 | 80.3 % | 1.07 | 95 % | ✅ |
| *Apatosaurus louisae* | Saurópodo | 3 | 54.4 % | 1.06 | 94 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 90.8 % | 1.06 | 95 % | ✅ |
| Gastrolitos | Campo | 1 | 79.0 % | 1.05 | 97 % | ✅ |
| Gregarismo | Campo | 1 | 90.3 % | 1.05 | 94 % | ✅ |
| *Huaxiadraco corollatus* | Pterosaurio | 2 | 78.9 % | 1.05 | 95 % | ✅ |
| Crecimiento acelerado | Campo | 1 | 54.5 % | 1.04 | 97 % | ✅ |
| Fractura consolidada | Campo | 2 | 76.3 % | 1.04 | 90 % | ✅ |
| Neumaticidad ósea | Campo | 2 | 53.2 % | 1.03 | 88 % | ✅ |
| *Nodosaurus textilis* | Tireóforo | 3 | 76.7 % | 1.03 | 93 % | ✅ |
| *Camarasaurus grandis* | Saurópodo | 3 | 75.8 % | 1.01 | 87 % | ✅ |
| Monzón de verano | Campo | 1 | 58.4 % | 1.01 | 87 % | ✅ |
| *Torvosaurus tanneri* | Terópodo | 4 | 53.4 % | 1.00 | 88 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 3 | 75.7 % | 0.98 | 87 % | ✅ |
| Rebrote tras incendio | Campo | 0 | 89.9 % | 0.97 | 85 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 73.4 % | 0.93 | 86 % | ✅ |
| Mortandad estacional | Campo | 1 | 43.5 % | 0.80 | 73 % | ✅ |
| Sequía prolongada | Campo | 1 | 30.3 % | 0.51 | 45 % | ❌ |
| Bruma de valle | Campo | 1 | 0.0 % | 0.00 | 0 % | ❌ |
| Competencia trófica | Campo | 3 | 0.0 % | 0.00 | 0 % | ❌ |

## Diagnóstico

- **Victorias del jugador inicial**: 47.5 % (objetivo 48 – 55 %).
- **Cartas mal calibradas**: 3 (objetivo 0).
- **Reparto entre las tres victorias**: 36% / 63% / 0% (objetivo cada una 15 – 60 %).

  - Bruma de valle — índice 0.00, uso 0 % (coste 1)
  - Competencia trófica — índice 0.00, uso 0 % (coste 3)
  - Sequía prolongada — índice 0.51, uso 45 % (coste 1)


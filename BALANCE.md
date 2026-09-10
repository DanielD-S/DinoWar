# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **4** · Habitat: **70** · Trofeos para ganar: **10**
- Renta: **2/turno hasta 12**, acumula · Mazo: **50**
- Tiempo: 116.6 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 11.79 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 47.8 % | 48 – 55 % | ❌ |
| Cartas mal calibradas | 3 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 67.3 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 46% / 32% / 22% | cada una 15 – 60 % | ✅ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **67.3 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 5 |
| P10 | 9 |
| Mediana | 12 |
| Media | 11.79 |
| P90 | 15 |
| Máximo | 20 |

| Vía de victoria | % |
|---|---|
| Registro fósil (10 trofeos) | 46.4 |
| Colapso del habitat | 31.8 |
| Extinción (sin cartas) | 21.9 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **1.93** de 4 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| Trampa de depredadores | Campo | 1 | 92.6 % | 1.15 | 95 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 57.9 % | 1.14 | 97 % | ✅ |
| *Dryosaurus altus* | Ornitópodo | 0 | 93.0 % | 1.14 | 95 % | ✅ |
| *Ornitholestes hermanni* | Terópodo | 1 | 91.8 % | 1.13 | 95 % | ✅ |
| Gastrolitos | Campo | 1 | 82.6 % | 1.13 | 96 % | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 2 | 92.2 % | 1.11 | 93 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 3 | 81.2 % | 1.11 | 93 % | ✅ |
| Gregarismo | Campo | 1 | 90.6 % | 1.11 | 93 % | ✅ |
| *Huaxiadraco corollatus* | Pterosaurio | 2 | 78.8 % | 1.10 | 94 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 91.0 % | 1.09 | 93 % | ✅ |
| Crecimiento acelerado | Campo | 1 | 55.8 % | 1.09 | 96 % | ✅ |
| Rebrote tras incendio | Campo | 0 | 92.9 % | 1.09 | 92 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 3 | 54.5 % | 1.07 | 90 % | ✅ |
| Monzón de verano | Campo | 1 | 60.1 % | 1.04 | 85 % | ✅ |
| *Nodosaurus textilis* | Tireóforo | 3 | 77.7 % | 1.01 | 86 % | ✅ |
| *Apatosaurus louisae* | Saurópodo | 3 | 52.1 % | 1.00 | 86 % | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 4 | 51.9 % | 0.99 | 84 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 89.0 % | 0.98 | 85 % | ✅ |
| Fractura consolidada | Campo | 2 | 74.4 % | 0.97 | 84 % | ✅ |
| Neumaticidad ósea | Campo | 2 | 49.6 % | 0.96 | 81 % | ✅ |
| Mortandad estacional | Campo | 1 | 46.4 % | 0.86 | 74 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 3 | 69.0 % | 0.86 | 71 % | ✅ |
| *Camarasaurus grandis* | Saurópodo | 3 | 69.0 % | 0.84 | 72 % | ✅ |
| *Torvosaurus tanneri* | Terópodo | 4 | 45.0 % | 0.82 | 71 % | ✅ |
| Sequía prolongada | Campo | 1 | 38.5 % | 0.63 | 53 % | ❌ |
| Bruma de valle | Campo | 1 | 0.0 % | 0.00 | 0 % | ❌ |
| Competencia trófica | Campo | 3 | 0.0 % | 0.00 | 0 % | ❌ |

## Diagnóstico

- **Victorias del jugador inicial**: 47.8 % (objetivo 48 – 55 %).
- **Cartas mal calibradas**: 3 (objetivo 0).

  - Bruma de valle — índice 0.00, uso 0 % (coste 1)
  - Competencia trófica — índice 0.00, uso 0 % (coste 3)
  - Sequía prolongada — índice 0.63, uso 53 % (coste 1)


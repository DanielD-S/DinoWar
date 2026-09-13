# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **4** · Habitat: **70** · Trofeos para ganar: **10**
- Renta: **2/turno hasta 12**, acumula · Mazo: **50**
- Tiempo: 85.8 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 12.43 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 46.4 % | 48 – 55 % | ❌ |
| Cartas mal calibradas | 3 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 65.6 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 61% / 39% / 0% | cada una 15 – 60 % | ❌ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **65.6 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 5 |
| P10 | 9 |
| Mediana | 12 |
| Media | 12.43 |
| P90 | 15 |
| Máximo | 21 |

| Vía de victoria | % |
|---|---|
| Registro fósil (10 trofeos) | 60.5 |
| Colapso del habitat | 39.1 |
| Extinción (sin cartas) | 0.4 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **1.95** de 4 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| Trampa de depredadores | Campo | 1 | 93.5 % | 1.14 | 96 % | ✅ |
| *Dryosaurus altus* | Ornitópodo | 0 | 93.8 % | 1.13 | 96 % | ✅ |
| *Ornitholestes hermanni* | Terópodo | 1 | 93.3 % | 1.12 | 96 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 59.5 % | 1.11 | 98 % | ✅ |
| Gastrolitos | Campo | 1 | 83.7 % | 1.11 | 97 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 3 | 84.0 % | 1.11 | 94 % | ✅ |
| Gregarismo | Campo | 1 | 92.3 % | 1.10 | 93 % | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 2 | 93.5 % | 1.10 | 93 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 92.6 % | 1.10 | 93 % | ✅ |
| Crecimiento acelerado | Campo | 1 | 58.3 % | 1.10 | 96 % | ✅ |
| Rebrote tras incendio | Campo | 0 | 94.2 % | 1.08 | 91 % | ✅ |
| *Huaxiadraco corollatus* | Pterosaurio | 2 | 80.5 % | 1.07 | 95 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 3 | 57.0 % | 1.07 | 92 % | ✅ |
| Monzón de verano | Campo | 1 | 62.8 % | 1.04 | 86 % | ✅ |
| *Apatosaurus louisae* | Saurópodo | 3 | 55.9 % | 1.03 | 89 % | ✅ |
| *Nodosaurus textilis* | Tireóforo | 3 | 80.3 % | 1.02 | 87 % | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 4 | 55.5 % | 1.01 | 87 % | ✅ |
| Neumaticidad ósea | Campo | 2 | 54.6 % | 1.01 | 85 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 90.7 % | 0.99 | 86 % | ✅ |
| Fractura consolidada | Campo | 2 | 77.0 % | 0.98 | 86 % | ✅ |
| Mortandad estacional | Campo | 1 | 49.4 % | 0.89 | 77 % | ✅ |
| *Torvosaurus tanneri* | Terópodo | 4 | 49.4 % | 0.87 | 74 % | ✅ |
| *Riparovenator milnerae* | Terópodo | 3 | 72.0 % | 0.87 | 74 % | ✅ |
| *Camarasaurus grandis* | Saurópodo | 3 | 72.7 % | 0.86 | 75 % | ✅ |
| Sequía prolongada | Campo | 1 | 33.0 % | 0.52 | 46 % | ❌ |
| Bruma de valle | Campo | 1 | 0.0 % | 0.00 | 0 % | ❌ |
| Competencia trófica | Campo | 3 | 0.0 % | 0.00 | 0 % | ❌ |

## Diagnóstico

- **Victorias del jugador inicial**: 46.4 % (objetivo 48 – 55 %).
- **Cartas mal calibradas**: 3 (objetivo 0).
- **Reparto entre las tres victorias**: 61% / 39% / 0% (objetivo cada una 15 – 60 %).

  - Bruma de valle — índice 0.00, uso 0 % (coste 1)
  - Competencia trófica — índice 0.00, uso 0 % (coste 3)
  - Sequía prolongada — índice 0.52, uso 46 % (coste 1)


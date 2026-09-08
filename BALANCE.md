# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **34** · Trofeos para ganar: **8**
- Renta: **1/turno hasta 8**, no acumula · Mazo: **50**
- Tiempo: 123.8 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 10.79 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 50.6 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 3 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 58.1 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 29% / 44% / 27% | cada una 15 – 60 % | ✅ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **58.1 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 5 |
| P10 | 8 |
| Mediana | 11 |
| Media | 10.79 |
| P90 | 13 |
| Máximo | 20 |

| Vía de victoria | % |
|---|---|
| Registro fósil (8 trofeos) | 28.6 |
| Colapso del habitat | 44.0 |
| Extinción (sin cartas) | 27.4 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **2.23** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

| Carta | Familia | Coste | % partidas | Índice | |
|---|---|---|---|---|---|
| Rebrote tras incendio | Campo | 0 | 78.5 % | 1.15 | ✅ |
| *Huaxiadraco corollatus* | Pterosaurio | 4 | 77.8 % | 1.13 | ✅ |
| Fractura consolidada | Campo | 2 | 75.7 % | 1.12 | ✅ |
| Gregarismo | Campo | 2 | 87.0 % | 1.12 | ✅ |
| *Stegosaurus stenops* | Tireóforo | 4 | 75.3 % | 1.10 | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 3 | 87.6 % | 1.09 | ✅ |
| *Allosaurus fragilis* | Terópodo | 5 | 75.8 % | 1.09 | ✅ |
| *Camarasaurus grandis* | Saurópodo | 5 | 60.8 % | 1.09 | ✅ |
| Trampa de depredadores | Campo | 3 | 89.6 % | 1.09 | ✅ |
| *Nodosaurus textilis* | Tireóforo | 4 | 85.7 % | 1.09 | ✅ |
| Gastrolitos | Campo | 2 | 73.8 % | 1.08 | ✅ |
| *Dryosaurus altus* | Ornitópodo | 1 | 87.5 % | 1.06 | ✅ |
| *Riparovenator milnerae* | Terópodo | 5 | 75.0 % | 1.06 | ✅ |
| Canal fluvial trenzado | Campo | 2 | 50.4 % | 1.06 | ✅ |
| Crecimiento acelerado | Campo | 3 | 48.3 % | 1.05 | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 5 | 71.3 % | 1.03 | ✅ |
| *Ornitholestes hermanni* | Terópodo | 2 | 87.0 % | 1.01 | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 8 | 45.5 % | 0.97 | ✅ |
| *Torvosaurus tanneri* | Terópodo | 7 | 45.5 % | 0.97 | ✅ |
| *Apatosaurus louisae* | Saurópodo | 7 | 44.8 % | 0.93 | ✅ |
| *Diplodocus carnegii* | Saurópodo | 5 | 43.7 % | 0.93 | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 4 | 66.2 % | 0.92 | ✅ |
| Mortandad estacional | Campo | 3 | 33.1 % | 0.66 | ❌ |
| Sabana de helechos | Campo | 2 | 71.6 % | 0.53 | ❌ |
| Deriva árida | Campo | 2 | 45.6 % | 0.45 | ❌ |

## Diagnóstico

- **Cartas mal calibradas**: 3 (objetivo 0).

  - Deriva árida — índice 0.45 (coste 2)
  - Sabana de helechos — índice 0.53 (coste 2)
  - Mortandad estacional — índice 0.66 (coste 3)


# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **26** · Trofeos para ganar: **12**
- Renta: **1/turno hasta 8**, no acumula · Mazo: **33**
- Tiempo: 111.0 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 12.72 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 48.6 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 1 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 61.6 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 37% / 34% / 29% | cada una 15 – 60 % | ✅ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **61.6 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 3 |
| P10 | 9 |
| Mediana | 13 |
| Media | 12.72 |
| P90 | 15 |
| Máximo | 15 |

| Vía de victoria | % |
|---|---|
| Registro fósil (12 trofeos) | 37.1 |
| Colapso del habitat | 33.8 |
| Extinción (sin cartas) | 29.1 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **2.28** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

| Carta | Familia | Coste | % partidas | Índice | |
|---|---|---|---|---|---|
| Carroña abundante | Campo | 0 | 97.2 % | 1.18 | ✅ |
| *Camarasaurus grandis* | Saurópodo | 5 | 93.5 % | 1.16 | ✅ |
| Rebrote tras incendio | Campo | 0 | 97.0 % | 1.16 | ✅ |
| Lago efímero | Campo | 0 | 97.0 % | 1.15 | ✅ |
| *Stegosaurus stenops* | Tireóforo | 4 | 99.5 % | 1.12 | ✅ |
| Llanura de inundación | Campo | 2 | 94.0 % | 1.06 | ✅ |
| *Apatosaurus louisae* | Saurópodo | 7 | 92.5 % | 1.05 | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 3 | 98.9 % | 1.04 | ✅ |
| *Allosaurus fragilis* | Terópodo | 5 | 99.2 % | 1.04 | ✅ |
| Gregarismo | Campo | 2 | 98.0 % | 1.03 | ✅ |
| Canal fluvial trenzado | Campo | 2 | 93.0 % | 1.03 | ✅ |
| *Torvosaurus tanneri* | Terópodo | 7 | 91.9 % | 1.02 | ✅ |
| Competencia trófica | Campo | 2 | 90.3 % | 1.02 | ✅ |
| Gastrolitos | Campo | 2 | 90.3 % | 1.01 | ✅ |
| Fractura consolidada | Campo | 2 | 95.3 % | 1.01 | ✅ |
| Neumaticidad ósea | Campo | 2 | 89.5 % | 1.00 | ✅ |
| *Dryosaurus altus* | Ornitópodo | 1 | 99.7 % | 0.95 | ✅ |
| *Diplodocus carnegii* | Saurópodo | 5 | 96.7 % | 0.94 | ✅ |
| Bosque de coníferas ribereño | Campo | 2 | 88.0 % | 0.92 | ✅ |
| Crecimiento acelerado | Campo | 3 | 85.8 % | 0.87 | ✅ |
| *Ornitholestes hermanni* | Terópodo | 2 | 97.6 % | 0.82 | ✅ |
| Sabana de helechos | Campo | 2 | 82.4 % | 0.72 | ✅ |
| Mortandad estacional | Campo | 3 | 74.5 % | 0.66 | ❌ |

## Diagnóstico

- **Cartas mal calibradas**: 1 (objetivo 0).

  - Mortandad estacional — índice 0.66 (coste 3)


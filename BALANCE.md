# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **34** · Trofeos para ganar: **6**
- Renta: **1/turno hasta 8**, no acumula · Mazo: **50**
- Tiempo: 120.6 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 11.18 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 49.7 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 3 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 65.5 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 45% / 55% / 0% | cada una 15 – 60 % | ❌ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **65.5 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 4 |
| P10 | 8 |
| Mediana | 11 |
| Media | 11.18 |
| P90 | 15 |
| Máximo | 26 |

| Vía de victoria | % |
|---|---|
| Registro fósil (6 trofeos) | 44.5 |
| Colapso del habitat | 55.5 |
| Extinción (sin cartas) | 0.0 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **1.91** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

| Carta | Familia | Coste | % partidas | Índice | |
|---|---|---|---|---|---|
| *Camarasaurus grandis* | Saurópodo | 5 | 79.3 % | 2.32 | ❌ |
| *Stegosaurus stenops* | Tireóforo | 4 | 84.1 % | 1.07 | ✅ |
| *Allosaurus fragilis* | Terópodo | 5 | 82.8 % | 1.05 | ✅ |
| Competencia trófica | Campo | 2 | 79.8 % | 1.04 | ✅ |
| Carroña abundante | Campo | 0 | 92.3 % | 1.04 | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 3 | 91.5 % | 1.03 | ✅ |
| Neumaticidad ósea | Campo | 2 | 79.7 % | 1.02 | ✅ |
| *Dryosaurus altus* | Ornitópodo | 1 | 92.1 % | 1.02 | ✅ |
| Gregarismo | Campo | 2 | 91.3 % | 1.02 | ✅ |
| *Ornitholestes hermanni* | Terópodo | 2 | 92.1 % | 1.01 | ✅ |
| *Torvosaurus tanneri* | Terópodo | 7 | 55.8 % | 1.00 | ✅ |
| *Diplodocus carnegii* | Saurópodo | 5 | 78.5 % | 1.00 | ✅ |
| Llanura de inundación | Campo | 2 | 80.8 % | 1.00 | ✅ |
| Fractura consolidada | Campo | 2 | 78.5 % | 1.00 | ✅ |
| Gastrolitos | Campo | 2 | 78.7 % | 0.99 | ✅ |
| *Apatosaurus louisae* | Saurópodo | 7 | 54.2 % | 0.99 | ✅ |
| Crecimiento acelerado | Campo | 3 | 54.0 % | 0.98 | ✅ |
| Canal fluvial trenzado | Campo | 2 | 79.0 % | 0.94 | ✅ |
| Rebrote tras incendio | Campo | 0 | 87.5 % | 0.89 | ✅ |
| Lago efímero | Campo | 0 | 83.3 % | 0.75 | ✅ |
| Bosque de coníferas ribereño | Campo | 2 | 66.0 % | 0.72 | ✅ |
| Mortandad estacional | Campo | 3 | 39.4 % | 0.69 | ❌ |
| Sabana de helechos | Campo | 2 | 76.8 % | 0.59 | ❌ |

## Diagnóstico

- **Cartas mal calibradas**: 3 (objetivo 0).
- **Reparto entre las tres victorias**: 45% / 55% / 0% (objetivo cada una 15 – 60 %).

  - Sabana de helechos — índice 0.59 (coste 2)
  - Mortandad estacional — índice 0.69 (coste 3)
  - Camarasaurus grandis — índice 2.32 (coste 5)


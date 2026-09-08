# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **5** · Habitat: **34** · Trofeos para ganar: **6**
- Renta: **1/turno hasta 8**, no acumula · Mazo: **50**
- Tiempo: 113.6 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 10.56 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 52.3 % | 48 – 55 % | ✅ |
| Cartas mal calibradas | 5 | 0 | ❌ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 61.6 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 28% / 44% / 28% | cada una 15 – 60 % | ✅ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **61.6 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 3 |
| P10 | 8 |
| Mediana | 10 |
| Media | 10.56 |
| P90 | 14 |
| Máximo | 19 |

| Vía de victoria | % |
|---|---|
| Registro fósil (6 trofeos) | 28.0 |
| Colapso del habitat | 44.3 |
| Extinción (sin cartas) | 27.8 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **1.74** de 5 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

| Carta | Familia | Coste | % partidas | Índice | |
|---|---|---|---|---|---|
| *Camarasaurus grandis* | Saurópodo | 5 | 75.7 % | 2.26 | ❌ |
| Carroña abundante | Campo | 0 | 79.8 % | 1.08 | ✅ |
| *Allosaurus fragilis* | Terópodo | 5 | 79.8 % | 1.07 | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 3 | 91.1 % | 1.07 | ✅ |
| *Dryosaurus altus* | Ornitópodo | 1 | 90.5 % | 1.07 | ✅ |
| *Ornitholestes hermanni* | Terópodo | 2 | 91.1 % | 1.06 | ✅ |
| *Stegosaurus stenops* | Tireóforo | 4 | 79.0 % | 1.05 | ✅ |
| Trampa de depredadores | Campo | 3 | 90.5 % | 1.05 | ✅ |
| *Diplodocus carnegii* | Saurópodo | 5 | 53.4 % | 1.05 | ✅ |
| Gregarismo | Campo | 2 | 88.7 % | 1.03 | ✅ |
| *Torvosaurus tanneri* | Terópodo | 7 | 52.9 % | 1.03 | ✅ |
| Crecimiento acelerado | Campo | 3 | 51.1 % | 1.01 | ✅ |
| Fractura consolidada | Campo | 2 | 75.8 % | 1.00 | ✅ |
| Competencia trófica | Campo | 2 | 74.6 % | 0.99 | ✅ |
| Canal fluvial trenzado | Campo | 2 | 51.1 % | 0.99 | ✅ |
| *Apatosaurus louisae* | Saurópodo | 7 | 49.9 % | 0.98 | ✅ |
| Gastrolitos | Campo | 2 | 75.2 % | 0.98 | ✅ |
| Neumaticidad ósea | Campo | 2 | 74.0 % | 0.98 | ✅ |
| Llanura de inundación | Campo | 2 | 76.3 % | 0.97 | ✅ |
| Rebrote tras incendio | Campo | 0 | 87.8 % | 0.93 | ✅ |
| Lago efímero | Campo | 0 | 68.7 % | 0.80 | ✅ |
| Mortandad estacional | Campo | 3 | 37.9 % | 0.69 | ❌ |
| Bosque de coníferas ribereño | Campo | 2 | 36.2 % | 0.66 | ❌ |
| Sabana de helechos | Campo | 2 | 73.0 % | 0.57 | ❌ |
| Deriva árida | Campo | 2 | 47.4 % | 0.44 | ❌ |

## Diagnóstico

- **Cartas mal calibradas**: 5 (objetivo 0).

  - Deriva árida — índice 0.44 (coste 2)
  - Sabana de helechos — índice 0.57 (coste 2)
  - Bosque de coníferas ribereño — índice 0.66 (coste 2)
  - Mortandad estacional — índice 0.69 (coste 3)
  - Camarasaurus grandis — índice 2.26 (coste 5)


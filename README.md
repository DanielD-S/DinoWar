# DinoWar

Juego de cartas por turnos para navegador móvil, ambientado en la **Formación Morrison**
(Jurásico Superior, Kimmeridgiense–Titoniense, ~155–146 Ma, oeste de Norteamérica).

Dos poblaciones se enfrentan en un campo de cinco ranuras. Se despliega **boca abajo**
y se revela **a la vez**: la tensión del juego es la información oculta, no el azar.

**▶ [Jugar](https://danield-s.github.io/DinoWar/)** · sin instalación, sin cuenta, sin backend.

---

## Tres formas de ganar

| Vía | Cómo |
|---|---|
| **Registro fósil** | Reúne 6 trofeos. Cada dinosaurio rival que muere te da uno. |
| **Colapso del hábitat** | Derriba el hábitat rival, que empieza con 34 de Vida. |
| **Extinción** | Quien se queda sin mazo pierde. El descarte **no se rebaraja**, y hay cartas que le comen el mazo al rival. |

Sobre 2.000 partidas las tres se reparten **28 % / 44 % / 28 %**: ninguna es decorado.

Y de ahí sale la decisión de cada turno: **una fila llena tapa tu hábitat pero regala
trofeos; una fila corta niega trofeos pero deja pasar el daño**. No hay postura segura.

## La regla que lo diferencia

Ningún híbrido, ninguna especie inventada, ningún anacronismo. Los taxones existen, están
descritos formalmente y proceden todos de la Morrison, así que pudieron coincidir en el
tiempo y en el espacio. Ninguno lleva plumas, porque ninguno tiene evidencia tegumentaria
que las respalde.

**Cada rasgo declara su nivel de evidencia** —`ESTABLECIDO`, `INFERIDO` o `DEBATIDO`— y
cada carta lleva su nota científica, visibles en la ficha al mantenerla pulsada. El nivel
califica al **rasgo**, no al taxón: que la preferencia ribereña de *Ceratosaurus* esté
discutida no significa que el animal lo esté.

Los cuatro clados no son un triángulo arbitrario, son una red trófica: los terópodos
hacen daño extra a los ornitópodos, los tireóforos devuelven daño con las púas caudales,
y la Defensa de cada carta sale de su morfología antipredatoria real.

Ver **[SET_DE_CARTAS.md](SET_DE_CARTAS.md)** para las 25 cartas con su referencia.

## Colección, sobres y mazos

Empiezas con las 50 cartas del mazo de referencia y 240 dinomonedas. Se ganan
jugando —60 por victoria, 20 por derrota— y se gastan en sobres de cinco cartas,
con la garantía de una rara o mejor. Las copias que superan el máximo de su
rareza no caben en ningún mazo legal, así que se funden por monedas.

Un mazo son 50 cartas exactas y de cada carta caben tantas copias como diga su
rareza: 3 común, 3 rara, 2 épica, 1 legendaria. Tú llevas el tuyo; la IA lleva
siempre el de referencia, que es el que mide `BALANCE.md`.

Todo se guarda en el navegador, en `localStorage`. No hay cuenta ni servidor.

## Correrlo en local

Sin dependencias, sin build step. Basta servir el directorio:

```bash
python -m http.server 8000
```

y abrir <http://localhost:8000>.

```bash
npm test        # 47 tests del motor y de la colección
npm run sim     # 2.000 partidas IA vs IA → BALANCE.md
node sim/set.js # regenera SET_DE_CARTAS.md desde el código
```

Parámetros de URL: `?debug=1` (overlay de estado), `?seed=N` (partida reproducible),
`?ia=aleatoria` (rival más blando).

## Cómo está hecho

HTML, CSS y JavaScript vanilla con módulos ES. Sin frameworks, sin dependencias, sin
CDNs. El arte son siluetas SVG generadas por código y el audio está sintetizado: no hay
un solo binario en el repositorio.

```
src/data/      cartas y números de balance — ninguna constante suelta fuera de aquí
src/engine/    motor de reglas: (estado, acción) → estado. Puro, sin DOM, corre en Node
src/ui/        interfaz: sólo lee el estado, nunca lo muta. almacen.js es el
               único fichero que toca localStorage
sim/           simulador de balance y generador del set
test/          47 tests
v1/            versión anterior, jugable y congelada (ver v1/LEEME.md)
```

La frontera motor/interfaz no es una intención, es un test: `test/pureza.test.js` falla
si `src/engine/`, `src/data/` o `sim/` mencionan el DOM, si `reduce()` muta su argumento
o si la misma semilla deja de dar la misma partida. La IA recibe siempre una vista
redactada del estado, así que no puede ver tu mano ni tu despliegue oculto.

## Balance

Los números no se ajustan a ojo: se miden. `BALANCE.md` se regenera con cada cambio
sobre 2.000 partidas y declara qué objetivos cumple y cuáles no.

El rediseño de la v2 salió de una medición concreta: en la v1, **quien iba por delante en
el turno 6 ganaba el 87,6 % de las partidas**, porque la renta dependía de ir ganando y la
ventaja se realimentaba sola. Ahora la Biomasa sube por turno igual para los dos y esa
cifra baja al **61,6 %**. La partida se juega hasta el final.

---

Documentos de diseño: [PLAN_V2.md](PLAN_V2.md) (la versión actual),
[PLAN.md](PLAN.md) y [GAME_SPEC.md](GAME_SPEC.md) (la v1, por qué se rehizo).

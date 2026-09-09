# PLAN_TRIBU.md — DinoWar deja de ser sólo un TCG

> Diseño de la capa cooperativa. Qué se coge de Tribal Wars, qué **no**, y cómo
> se construye sin romper lo que ya funciona.

## 0. La restricción que decide todo lo demás

DinoWar no tiene servidor. Es HTML, CSS y JS estáticos servidos por GitHub
Pages, y todo el estado vive en el `localStorage` del navegador. El README lo
vende así, y no es una limitación accidental: es por qué el juego arranca en
medio segundo y no pide cuenta.

**Cooperar con otros usuarios de verdad necesita un servidor.** No hay forma de
esquivarlo: dos navegadores no comparten estado. Así que hay dos decisiones,
y conviene no confundirlas:

1. **Qué reglas tiene la capa cooperativa.** Eso se diseña y se prueba hoy.
2. **Dónde vive el estado compartido.** Eso es infraestructura y va después.

Este plan resuelve (1) entero y deja (2) detrás de una costura de una sola
función. La capa se construye **local primero**: juegas con una tribu cuyos
compañeros simula el propio juego, con las mismas reglas, los mismos tiempos y
los mismos números que tendrá contra un servidor. Cuando haya backend, lo que
cambia es de dónde vienen las aportaciones de los demás — no las reglas.

Eso no es una maqueta: el bucle de un jugador es **idéntico**. Lo que no es, y
hay que decirlo, es multijugador. Hasta que haya servidor, tus compañeros de
tribu no son personas.

## 1. Qué tiene Tribal Wars que un TCG no

Tribal Wars no es mejor juego que un TCG; es **otro reloj**. Un TCG se juega en
sesiones de diez minutos que empiezan y acaban. Tribal Wars se juega en semanas,
y su motor es que **el mundo sigue corriendo mientras no estás**.

Cuatro cosas, y sólo cuatro, hacen eso:

| Pieza | Qué hace de verdad |
|---|---|
| **Producción en tiempo real** | Volver mañana vale algo. Sin esto no hay bucle largo. |
| **Recurso que se aporta a un común** | Convierte «mi progreso» en «nuestro progreso». |
| **Objetivo que no cabe en una persona** | Es lo único que obliga a cooperar de verdad. |
| **Ventana temporal** | Un evento que empieza y acaba fuerza a coincidir. |

Todo lo demás de Tribal Wars —el mapa, los ataques entre jugadores, los
tiempos de viaje, la conquista— es **competición entre usuarios**, y eso es
justo lo que este juego no quiere ser. DinoWar no va de arrasar el pueblo de
otro. Se coge el reloj largo y la cooperación; se deja fuera el saqueo.

## 2. La Cuenca

El marco: tu tribu es un **equipo de excavación** trabajando una cuenca
sedimentaria. No es metáfora forzada — es lo que hace de verdad la gente que
saca estos animales del suelo, y ninguna otra parte del juego lo cuenta.

### 2.1 Fósiles: el recurso que corre solo

Un recurso nuevo, **separado de las dinomonedas**, y esa separación es
deliberada:

- **Dinomonedas** = jugar partidas. Compran sobres. Son tuyas.
- **Fósiles** = pasar el tiempo. Se aportan a la tribu. Son del equipo.

Si el mismo recurso hiciera las dos cosas, abrir sobres y ayudar a la tribu
competirían por lo mismo, y una de las dos moriría.

Los fósiles los produce tu **yacimiento**, a un ritmo por hora, con un
**depósito que se llena**. El depósito es la pieza importante: si no tuviera
tope, el que entra cada día y el que entra cada semana rendirían igual, y si el
tope fuera muy bajo el juego pediría estar encima. Un depósito que tarda ~14
horas en llenarse pide pasar una vez al día y no castiga dormir.

Se acumula **con la pestaña cerrada**, calculado por diferencia de reloj al
volver, igual que Tribal Wars. Nada corre en segundo plano.

### 2.2 La tribu

Un grupo pequeño —hasta 8— con un **almacén común**. Aportas fósiles; el
almacén no se puede gastar en nada personal. Sólo sirve para lo de todos.

Aportar es la decisión: los fósiles aportados **también podrías haberlos
gastado en tu excavación personal**, que sube el ritmo de producción. Ayudar
hoy o producir más mañana. Sin esa tensión, aportar sería un botón, no una
decisión.

### 2.3 Jefes: el objetivo que no cabe en una persona

Un jefe es una criatura con **mucha Vida** —miles— y una ventana de tiempo.
No se le gana en una partida: se le gana entre todos, a lo largo de días.

**Se pelea con el motor que ya existe.** Un asalto al jefe es una partida
normal contra un mazo temático, con el hábitat del jefe muy alto. El daño que
le haces en esa partida se resta de la Vida del jefe **para toda la tribu**.
Ganes o pierdas tu partida, el daño cuenta. Eso importa: en un juego cooperativo
el jugador flojo tiene que poder aportar, o deja de jugar.

Los asaltos cuestan fósiles del almacén común, así que la tribu decide cuántos
asaltos se puede permitir. Y hay un tope de asaltos por persona y día, que es
lo que impide que uno solo haga el trabajo de ocho.

**Al caer el jefe, la carta es para todos los que aportaron.** No para quien dio
el último golpe. Es la regla más importante de todo el diseño: si el premio
fuera para el que remata, la tribu se convertiría en ocho personas esperando a
rematar.

Las cartas de jefe **no salen en sobres**. Es la única forma de conseguirlas, y
la razón por la que la capa cooperativa no es opcional-pero-inútil.

### 2.4 Eventos

Una ventana con nombre y fecha. Dos clases:

- **Jefe**: aparece un jefe durante unos días.
- **Clima de cuenca**: durante la ventana, una regla cambia para todos —una
  aridez persistente, una crecida—. Reutiliza los climas que el motor ya sabe
  aplicar.

Los eventos son datos, no código: una lista con fechas. Eso permite añadir uno
sin tocar el motor, y permite que un servidor los mande cuando lo haya.

## 3. Lo que NO se coge de Tribal Wars

Se dice explícito porque la tentación es real:

- **Ataques entre jugadores.** Convierte al vecino en amenaza. DinoWar ya tiene
  su conflicto en la mesa; no necesita otro fuera.
- **Mapa y tiempos de viaje.** Es el corazón de Tribal Wars y aquí sería
  decorado: no hay territorio que valga nada.
- **Colas de construcción largas.** Esperar cuatro horas a que suba un edificio
  es un peaje, no una decisión.
- **Cualquier cosa que pida estar conectado a una hora concreta.** Es lo que
  quema a la gente y lo que hace que estos juegos se jueguen con alarmas.

## 4. Cómo se construye

```
src/data/tribu.js      reglas puras: producción, aportes, daño al jefe,
                       recompensas. Sin DOM, sin reloj propio, testeable.
src/data/eventos.js    el calendario. Datos.
src/ui/cuenca.js       la pantalla.
src/ui/red.js          LA COSTURA. Hoy: local + compañeros simulados.
                       Mañana: la misma interfaz contra un servidor.
```

`red.js` expone cuatro operaciones y nada más:

```js
estadoDeTribu()          // cómo va el almacén, el jefe, quién aportó
aportar(fosiles)         // sumo al común
asaltar(dano)            // le hago daño al jefe
reclamar()               // cojo lo que me toca de un jefe caído
```

Cuatro funciones. Ésa es toda la superficie que habría que reescribir contra un
servidor, y por eso el resto del juego no se entera de dónde vive el estado.

**El tiempo nunca se lee del reloj dentro de las reglas.** `src/data/tribu.js`
recibe el instante como argumento. Es lo que hace los tests deterministas y lo
que impedirá, cuando haya servidor, que adelantar el reloj del móvil regale
fósiles: el instante bueno lo pondrá el servidor.

## 5. Qué queda sin resolver hasta que haya servidor

Dicho antes de empezar, no después:

- **Identidad.** Hoy no hay cuentas. Una tribu de verdad necesita saber quién
  eres en dos dispositivos.
- **Autoridad.** Con las reglas en el cliente, cualquiera puede decir que hizo
  un millón de daño. Local no importa; en cuanto haya tribus reales, el daño lo
  tiene que validar el servidor. El diseño lo permite porque el asalto es una
  partida con semilla: el servidor puede re-jugarla y comprobar el resultado.
- **Reloj.** Ver arriba.

Nada de eso bloquea diseñar y probar el bucle. Todo eso bloquea abrirlo a
desconocidos.

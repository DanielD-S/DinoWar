"""El arte de las Expediciones: del PNG original al WebP servido.

    python tools/expediciones.py            # dice qué haría
    python tools/expediciones.py escribir   # escribe en assets/piel/expediciones/

Tres familias y dos tratamientos:

- **Los mapas** (`mapa_<formacion>.png`) son un fondo a sangre: no se keyean,
  sólo se escalan a 900 de ancho. El juego los desplaza en vertical.
- **Los medallones de nodo** (`nodo_bloqueado`, `nodo_abierto`, `nodo_vencido`,
  `nodo_semana`) y **la cartela del rival** llegan sobre magenta y con un hueco
  magenta dentro, donde el juego pinta el retrato. Se keyean con la función de
  `tools/marcos.py`, que quita TODO el magenta, también el del hueco: la
  inundación de `placas.py` no llegaría a un hueco cerrado.

Y se MIDE el hueco del retrato, en porcentaje de la pieza recortada: esos son
los números que van en `style.css`, como los huecos de los marcos de carta.
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from marcos import keyear, distancia_a_magenta  # noqa: E402
from placas import sangrar_color  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'src' / 'piel' / 'expediciones'
DESTINO = RAIZ / 'assets' / 'piel' / 'expediciones'

# original -> ancho servido. Los nodos se ven a ~76 px; 192 es el doble a 2x
# con margen. La cartela a ~340 px en el móvil; 768 cubre densidad 2x.
PIEZAS = {
    'nodo_bloqueado': 192,
    'nodo_abierto': 192,
    'nodo_vencido': 192,
    'nodo_semana': 224,
    'cartela_rival': 768,
}
MAPAS = ('mapa_morrison', 'mapa_hell_creek', 'mapa_tendaguru', 'mapa_kem_kem')
ANCHO_MAPA = 900


def limpiar_halo(im):
    """Quita el halo rosado que el generador deja alrededor de los brillos.

    El nodo abierto se pidió con un halo dorado sobre magenta, y el generador lo
    pintó como un aro ROSA casi opaco: a esa distancia del magenta, `keyear` lo
    da por parte de la pieza. Cortar el azul de lo semitransparente no bastó,
    porque no era semitransparente.

    Lo que distingue el rosa de todo lo que sí es pieza es cuánto se parece al
    magenta: rojo Y azul altos con el verde bajo, `min(r, b) − g`. El oro tiene
    poco azul, la piedra es gris, el lacre rojo y la laca tienen poco azul: en
    todos sale negativo o cerca de cero. En el rosa sale muy positivo, y en esa
    medida se vuelve transparente. El brillo que se pierde lo pone el CSS con
    `drop-shadow`, que además sigue la silueta.
    """
    a = np.asarray(im).astype(float)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    magentez = np.minimum(r, b) - g
    # 5 y 55, no 15 y 70: con los primeros quedaba un hilo melocotón en el
    # borde del nodo abierto y otro rojizo en el hueco del bloqueado.
    queda = 1 - np.clip((magentez - 5) / 55, 0, 1)
    al2 = al * queda
    b2 = np.where(al2 < 250, np.minimum(b, g), b)
    return Image.fromarray(np.dstack([r, g, b2, al2]).astype(np.uint8), 'RGBA')


def recortar(im, margen_rel=0.01):
    caja = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    if not caja:
        return im, (0, 0, im.size[0], im.size[1])
    m = round(margen_rel * max(im.size))
    caja = (max(0, caja[0] - m), max(0, caja[1] - m), min(im.size[0], caja[2] + m), min(im.size[1], caja[3] + m))
    return im.crop(caja), caja


def medir_hueco(original, caja):
    """El hueco magenta INTERIOR mayor: el que no toca el borde de la pieza."""
    rgb = np.asarray(original.convert('RGB').crop(caja)).astype(int)
    magenta = distancia_a_magenta(rgb) < 60
    alto, ancho = magenta.shape
    visto = np.zeros_like(magenta)
    mejor = None
    for y0 in range(0, alto, 4):
        for x0 in range(0, ancho, 4):
            if not magenta[y0, x0] or visto[y0, x0]:
                continue
            cola = deque([(y0, x0)])
            visto[y0, x0] = True
            xs, ys, toca = [], [], False
            while cola:
                y, x = cola.popleft()
                xs.append(x)
                ys.append(y)
                if y in (0, alto - 1) or x in (0, ancho - 1):
                    toca = True
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < alto and 0 <= nx < ancho and magenta[ny, nx] and not visto[ny, nx]:
                        visto[ny, nx] = True
                        cola.append((ny, nx))
            if toca or len(xs) < 400:
                continue
            if mejor is None or len(xs) > mejor[0]:
                mejor = (len(xs), min(xs), min(ys), max(xs), max(ys))
    if not mejor:
        return None
    _, x0, y0, x1, y1 = mejor
    return {
        'izq': 100 * x0 / ancho, 'arriba': 100 * y0 / alto,
        'ancho': 100 * (x1 - x0 + 1) / ancho, 'alto': 100 * (y1 - y0 + 1) / alto,
    }


def guardar(im, nombre, ancho, calidad=86):
    DESTINO.mkdir(parents=True, exist_ok=True)
    # Antes de escalar, el color del canto por debajo de lo transparente:
    # `Image.resize` mezcla el color sin mirar el alfa, y lo transparente sigue
    # siendo magenta. Es la trampa de las placas, con la función de las placas.
    if im.mode == 'RGBA':
        im = sangrar_color(im)
    alto = round(ancho * im.size[1] / im.size[0])
    im.resize((ancho, alto), Image.LANCZOS).save(DESTINO / f'{nombre}.webp', 'WEBP', quality=calidad)


def main(escribir):
    if not ORIGEN.is_dir():
        sys.exit(f'No existe {ORIGEN.relative_to(RAIZ)}. Deja ahí los originales.')
    usados = set()
    for nombre, ancho in PIEZAS.items():
        p = next((ORIGEN / f'{nombre}{e}' for e in ('.png', '.PNG') if (ORIGEN / f'{nombre}{e}').exists()), None)
        if p is None:
            print(f'{nombre}: no está')
            continue
        usados.add(p.name)
        original = Image.open(p)
        recortada, caja = recortar(limpiar_halo(keyear(original)))
        print(f'{p.name} {original.size[0]}×{original.size[1]} -> {nombre}.webp @{ancho}')
        h = medir_hueco(original, caja)
        if h:
            print(f"  hueco del retrato (para style.css): izq {h['izq']:.2f}%  arriba {h['arriba']:.2f}%  "
                  f"ancho {h['ancho']:.2f}%  alto {h['alto']:.2f}%")
        else:
            print('  AVISO: no se encontró hueco magenta interior')
        if escribir:
            guardar(recortada, nombre, ancho)
    for nombre in MAPAS:
        p = next((ORIGEN / f'{nombre}{e}' for e in ('.png', '.PNG', '.jpg', '.webp') if (ORIGEN / f'{nombre}{e}').exists()), None)
        if p is None:
            print(f'{nombre}: no está')
            continue
        usados.add(p.name)
        im = Image.open(p).convert('RGB')
        print(f'{p.name} {im.size[0]}×{im.size[1]}  fondo, sólo se escala -> {nombre}.webp @{min(ANCHO_MAPA, im.size[0])}')
        if escribir:
            guardar(im, nombre, min(ANCHO_MAPA, im.size[0]), calidad=80)
    for f in sorted(ORIGEN.iterdir()):
        if f.is_file() and f.name not in usados:
            print(f'  sin usar: {f.name}')
    # El índice sale de lo que SE SIRVE, no de lo que esta pasada convirtió: es lo
    # que el juego consulta para no pedir piezas que no existen.
    if escribir:
        import json
        DESTINO.mkdir(parents=True, exist_ok=True)
        servidas = sorted(p.stem for p in DESTINO.glob('*.webp'))
        (DESTINO / 'indice.json').write_text(json.dumps({'piezas': servidas}, indent=2) + '\n', encoding='utf-8')
        print(f'indice.json: {len(servidas)} piezas')


if __name__ == '__main__':
    main('escribir' in sys.argv[1:])

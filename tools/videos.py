"""Los vídeos de las legendarias: del MP4 del generador al MP4 que sirve el juego.

    python tools/videos.py            # dice qué haría
    python tools/videos.py escribir   # escribe los MP4 en assets/video/

Cada legendaria puede llevar un vídeo corto que se enseña en la apertura del
sobre antes de voltear la carta. El original llega a src/video/<id>.mp4 —fuera
del repositorio, como las ilustraciones y los sonidos— tal como lo entregue el
generador: el primero vino a 1176×784, 24 fps, 11,6 Mb/s y 14,6 MB para diez
segundos, que un móvil no descarga a tiempo para una ceremonia.

Se sirve en H.264 —lo único que reproduce todo, Safari en iPhone incluido— a
ANCHO píxeles de ancho, sin pista de audio (el juego pone su música) y con el
índice al principio del fichero (`faststart`), que sin eso el navegador tiene
que bajarlo entero antes del primer fotograma. A CRF 27 el mosasaurio queda
en 1,2 MB; a 23 en 2,3 y no se le nota en un móvil. Se recorta a TOPE
segundos por el principio, que el final es el que importa: es sobre el
último fotograma donde se pinta la carta. Lo que está en SIN_TOPE no se
recorta: no es una carta, es una pieza montada, y cortarle el principio la
destroza.

Y se le quita la marca de agua. Kling la pone en la esquina de abajo a la
derecha —«KlingAI 3.0», logo incluido— y SÍ escala con el cuadro, aunque
durante nueve vídeos pareciera que no: los tres primeros lotes vinieron todos
a ~1176 de ancho, así que unos píxeles fijos valían. El intro llegó a
1916×1080 y la marca vino de 187×36 en vez de 138×26 — el rectángulo fijo
dejaba fuera 51 píxeles por la izquierda. Por eso MARCA va en PROPORCIÓN del
cuadro, medida sobre las dos resoluciones y con holgura.

Medirla no es cosa de ojo: la marca es lo ÚNICO del plano que no se mueve, así
que sale de la varianza por píxel entre una decena de fotogramas repartidos —
quieto y claro es marca; quieto y oscuro es fondo—. Si un día cambia de sitio,
se vuelve a medir así.

El filtro `delogo` de ffmpeg no recorta imagen: rellena el rectángulo con lo
que hay alrededor. A tamaño real no se nota; a tres aumentos, sobre cielo
liso, se intuye el contorno. Va ANTES de escalar, que a más resolución el
relleno se difumina mejor y luego se comprime una sola vez.

El nombre es el `id` de la carta, igual que en las ilustraciones: la apertura
busca `assets/video/<id>.mp4` y, si no existe, voltea la carta sin más.
Hace falta ffmpeg en el PATH (`scoop install ffmpeg`).
"""
import json
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'src' / 'video'
DESTINO = RAIZ / 'assets' / 'video'

ANCHO = 960
CRF = 27
TOPE = 10.0
# Lo que NO es una carta y por tanto no se recorta: el tope existe porque en un
# sobre lo que importa es el último fotograma —es el lienzo de la carta— y diez
# segundos de espera ya son muchos. Una cinemática es una pieza montada y
# cortarle el principio la destroza.
SIN_TOPE = {'intro'}

# La marca de agua, en PROPORCIÓN del cuadro y no en píxeles: Kling la escala
# con la resolución de salida. Medido sobre dos entregas —1176×784 y 1916×1080—
# la marca ocupa entre el 9,8 % y el 11,7 % del ancho, así que unos valores
# fijos que cubrían la primera dejaban fuera 51 px de la segunda por la
# izquierda. Con holgura sobre lo medido en las dos; `delogo` exige además que
# el rectángulo no toque el borde.
MARCA = {'derecha': 0.018, 'abajo': 0.024, 'ancho': 0.125, 'alto': 0.042}
EXTENSIONES = {'.mp4', '.mov', '.webm', '.mkv', '.m4v'}


def ids_de_cartas():
    """Los `id` de cards.js, leídos con una expresión regular: es Python y el
    set es JavaScript, y para comprobar un nombre no hace falta más."""
    fuente = (RAIZ / 'src' / 'data' / 'cards.js').read_text(encoding='utf-8')
    return set(re.findall(r"\bid:\s*'([a-z0-9_]+)'", fuente))


def medir(ruta):
    salida = subprocess.run(
        ['ffprobe', '-v', 'error', '-select_streams', 'v:0',
         '-show_entries', 'stream=width,height,r_frame_rate:format=duration,size',
         '-of', 'json', str(ruta)], check=True, capture_output=True, text=True).stdout
    d = json.loads(salida)
    v, f = d['streams'][0], d['format']
    return {
        'ancho': v['width'], 'alto': v['height'],
        'dura': float(f['duration']), 'kb': int(f['size']) // 1024,
    }


def sin_marca(ancho, alto):
    w = max(8, round(ancho * MARCA['ancho']))
    h = max(8, round(alto * MARCA['alto']))
    # `max(1, …)`: el rectángulo no puede tocar el borde o delogo se queja.
    x = max(1, ancho - round(ancho * MARCA['derecha']) - w)
    y = max(1, alto - round(alto * MARCA['abajo']) - h)
    return f'delogo=x={x}:y={y}:w={w}:h={h}'


def convertir(entrada, salida, m, entero=False):
    dura = m['dura']
    orden = ['ffmpeg', '-y', '-loglevel', 'error']
    if dura > TOPE and not entero:
        # Se quita el principio, no el final: el último fotograma es el que
        # queda debajo de la carta.
        orden += ['-ss', f'{dura - TOPE:.3f}']
    orden += [
        '-i', str(entrada),
        '-vf', f"{sin_marca(m['ancho'], m['alto'])},scale={ANCHO}:-2", '-r', '24',
        '-c:v', 'libx264', '-crf', str(CRF), '-preset', 'slow', '-profile:v', 'main',
        '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart',
        str(salida),
    ]
    subprocess.run(orden, check=True)


def main(escribir):
    if not ORIGEN.exists():
        sys.exit(f'no existe {ORIGEN}: los vídeos del generador van ahí')
    fuentes = sorted(f for f in ORIGEN.iterdir() if f.is_file() and f.suffix.lower() in EXTENSIONES)
    if not fuentes:
        sys.exit(f'no hay ningún vídeo en {ORIGEN}')
    if escribir:
        DESTINO.mkdir(exist_ok=True)

    # Con nombres detrás de «escribir» sólo se convierten ésos: re-codificar
    # los nueve que ya están servidos cada vez que llega uno nuevo cambia sus
    # bytes sin cambiar nada que se vea, y eso es ruido en el repositorio.
    solo = {s.lower() for s in sys.argv[2:]}
    if solo:
        fuentes = [f for f in fuentes if f.stem.lower() in solo]

    ids = ids_de_cartas() | SIN_TOPE
    for f in fuentes:
        # En minúsculas: la apertura pide `<id>.mp4` y el id va en minúsculas.
        # Y contra la lista de cartas, que un vídeo con el nombre mal escrito
        # no falla en ningún sitio: sencillamente no sale nunca. Llegaron
        # `Tyrannotitan.mp4` y `maiasaurua.mp4` en el primer lote.
        nombre = f.stem.lower()
        if nombre not in ids:
            print(f'{f.name}: ¡«{nombre}» no es el id de ninguna carta! No se enseñará. Se convierte igual.')
        destino = DESTINO / f'{nombre}.mp4'
        m = medir(f)
        origen = f"{m['ancho']}×{m['alto']}, {m['dura']:.1f} s, {m['kb'] // 1024}.{m['kb'] % 1024 * 10 // 1024} MB"
        if escribir:
            convertir(f, destino, m, entero=nombre in SIN_TOPE)
            s = medir(destino)
            print(f"{f.name}: {origen} -> {destino.relative_to(RAIZ)} "
                  f"{s['ancho']}×{s['alto']}, {s['dura']:.1f} s, {s['kb']} KB")
        else:
            print(f'{f.name}: {origen} -> {destino.relative_to(RAIZ)}')

    if not escribir:
        print('\n(sin escribir; pasa «escribir» para generar)')


if __name__ == '__main__':
    main(escribir=len(sys.argv) > 1 and sys.argv[1] == 'escribir')

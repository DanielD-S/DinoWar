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
último fotograma donde se pinta la carta.

El nombre es el `id` de la carta, igual que en las ilustraciones: la apertura
busca `assets/video/<id>.mp4` y, si no existe, voltea la carta sin más.
Hace falta ffmpeg en el PATH (`scoop install ffmpeg`).
"""
import json
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'src' / 'video'
DESTINO = RAIZ / 'assets' / 'video'

ANCHO = 960
CRF = 27
TOPE = 10.0
EXTENSIONES = {'.mp4', '.mov', '.webm', '.mkv', '.m4v'}


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


def convertir(entrada, salida, dura):
    orden = ['ffmpeg', '-y', '-loglevel', 'error']
    if dura > TOPE:
        # Se quita el principio, no el final: el último fotograma es el que
        # queda debajo de la carta.
        orden += ['-ss', f'{dura - TOPE:.3f}']
    orden += [
        '-i', str(entrada),
        '-vf', f'scale={ANCHO}:-2', '-r', '24',
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

    for f in fuentes:
        destino = DESTINO / f'{f.stem}.mp4'
        m = medir(f)
        origen = f"{m['ancho']}×{m['alto']}, {m['dura']:.1f} s, {m['kb'] // 1024}.{m['kb'] % 1024 * 10 // 1024} MB"
        if escribir:
            convertir(f, destino, m['dura'])
            s = medir(destino)
            print(f"{f.name}: {origen} -> {destino.relative_to(RAIZ)} "
                  f"{s['ancho']}×{s['alto']}, {s['dura']:.1f} s, {s['kb']} KB")
        else:
            print(f'{f.name}: {origen} -> {destino.relative_to(RAIZ)}')

    if not escribir:
        print('\n(sin escribir; pasa «escribir» para generar)')


if __name__ == '__main__':
    main(escribir=len(sys.argv) > 1 and sys.argv[1] == 'escribir')

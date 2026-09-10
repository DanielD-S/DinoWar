#!/usr/bin/env python3
"""Prepara las ilustraciones de las cartas para servirlas en el juego.

    python tools/imagenes.py

Lee lo que haya en `src/dinos/`, lo reduce y lo deja en `assets/dinos/` con el
id de la carta por nombre, más un `indice.json` con lo que ha producido. Ese
índice es lo que `src/ui/art.js` consulta al arrancar: si no existe —y en el
repositorio publicado no existe, ver assets/LEEME.md— el juego dibuja sus
siluetas SVG y no pide ni una imagen.

El original puede llamarse por el binomio (`Allosaurus fragilis.jpg`) o
directamente por el id de la carta (`allosaurus.png`), en cualquier formato que
Pillow sepa abrir. Lo que no reconozca lo dice y sigue.

Pillow es la única dependencia y es de herramienta, no del juego: lo que se
sirve al navegador sigue sin depender de nada.
"""

import json
import re
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit('Falta Pillow. Instálalo con:  pip install Pillow')

# La consola de Windows viene en cp1252 y revienta con una flecha o una tilde.
for flujo in (sys.stdout, sys.stderr):
    try:
        flujo.reconfigure(encoding='utf-8', errors='replace')
    except (AttributeError, ValueError):
        pass

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'src' / 'dinos'
DESTINO = RAIZ / 'assets' / 'dinos'

# Lado mayor en píxeles. Las cartas del tablero miden 56 px y la ficha 74, así
# que 460 da margen de sobra para pantallas de densidad 3x sin que una partida
# se coma varios megabytes.
# 1200 px de lado mayor: la ventana más grande es la ilustración de la ficha,
# 394x222 css en un movil de 430 px, que a DPR 3 son 1182x665 px reales. Con
# 460 se veian blandas y con 900 la ficha las ampliaba un 30 %.
# Son unos 2 MB para las quince, que el service worker cachea en tiempo muerto.
# Si eso pesa demasiado, bajar a 1000 deja la ficha con un 18 % de ampliacion,
# que a esta densidad ya no se distingue.
LADO = 1200
CALIDAD = 80

# Las CARTAS ENTERAS son otra cosa que las ilustraciones, y por eso van por su
# lado. Una ilustración es el dibujo pelado que el juego monta dentro de su
# marco; una carta entera es la carta ya compuesta —marco, nombre y cifras
# incluidos— que sólo se enseña en el visor, en el modo «Original».
#
# Tres diferencias que justifican el segundo montón: son verticales y no 3:2,
# se sirven a 1100 px porque el visor las enseña casi a pantalla completa, y NO
# se precalientan en la caché, porque pesan un cuarto de mega cada una y casi
# nadie abre ese modo.
ORIGEN_CARTAS = RAIZ / 'src' / 'cartas'
DESTINO_CARTAS = RAIZ / 'assets' / 'cartas'
LADO_CARTA = 1100


def ids_de_cartas():
    """Ids del set, leídos de cards.js para no mantener la lista por duplicado."""
    fuente = (RAIZ / 'src' / 'data' / 'cards.js').read_text(encoding='utf-8')
    return set(re.findall(r"^\s*id: '([a-z_]+)'", fuente, re.MULTILINE))


def id_de(nombre, validos):
    """Del nombre del fichero al id de la carta. Acepta binomio, id o género.

    El prefijo `jefe_` se prueba al final porque las dos recompensas del modo
    cooperativo llevan ese prefijo en su id y no en el nombre del fichero: las
    ilustraciones llegaron como «Saurophaganax.PNG» y «Barosaurus.PNG» y se
    quedaron dos meses en la lista de «sin usar», con el juego dibujando la
    silueta de las dos únicas cartas que se ganan cooperando.
    """
    limpio = nombre.strip().lower().replace('-', ' ').replace('_', ' ')
    genero = limpio.split()[0] if limpio.split() else ''
    sueltos = (limpio.replace(' ', '_'), limpio.replace(' ', ''), genero)
    for candidato in sueltos + tuple(f'jefe_{c}' for c in sueltos):
        if candidato in validos:
            return candidato
    return None


def subir_version_sw(motivo):
    """Sube la VERSION del service worker.

    Sin esto, un navegador que ya entró se queda con el índice viejo y sigue
    dibujando siluetas para las cartas nuevas. Pasó con treinta y seis
    ilustraciones: el aviso escrito en sw.js no bastó, porque de lo que hay que
    acordarse a mano uno se olvida.
    """
    sw = RAIZ / 'sw.js'
    if not sw.exists():
        return
    texto = sw.read_text(encoding='utf-8')
    m = re.search(r"const VERSION = 'dinowar-v(\d+)';", texto)
    if not m:
        print('aviso: no se ha encontrado la VERSION en sw.js, súbela a mano')
        return
    n = int(m.group(1)) + 1
    sw.write_text(texto.replace(m.group(0), f"const VERSION = 'dinowar-v{n}';", 1),
                  encoding='utf-8')
    print(f'sw.js: VERSION subida a dinowar-v{n}, porque {motivo}')


def procesar_cartas(validos):
    """Segunda pasada: las cartas enteras de `src/cartas/` → `assets/cartas/`.

    No tenerlas es el estado normal: hoy sólo hay una. Por eso la carpeta puede
    no existir y eso no es un fallo.
    """
    if not ORIGEN_CARTAS.is_dir():
        return False

    DESTINO_CARTAS.mkdir(parents=True, exist_ok=True)
    reemplazadas, kb = [], 0.0
    for f in sorted(ORIGEN_CARTAS.iterdir()):
        if not f.is_file() or f.name.startswith('.') or f.suffix.lower() == '.md':
            continue
        cid = id_de(f.stem, validos)
        if cid is None:
            print(f'  sin usar: {f.name} (el nombre no coincide con ninguna carta)')
            continue
        try:
            im = Image.open(f)
        except Exception as e:                      # noqa: BLE001
            print(f'  sin usar: {f.name} ({e})')
            continue

        if im.mode in ('RGBA', 'LA', 'P'):
            im = im.convert('RGBA')
            fondo = Image.new('RGB', im.size, (25, 21, 16))
            fondo.paste(im, mask=im.split()[-1])
            im = fondo
        else:
            im = im.convert('RGB')

        escala = LADO_CARTA / max(im.size)
        if escala < 1:
            im = im.resize((round(im.width * escala), round(im.height * escala)), Image.LANCZOS)

        salida = DESTINO_CARTAS / f'{cid}.jpg'
        antes = salida.read_bytes() if salida.exists() else None
        im.save(salida, 'JPEG', quality=CALIDAD, optimize=True, progressive=True)
        if salida.read_bytes() != antes:
            reemplazadas.append(cid)
        kb += salida.stat().st_size / 1024
        print(f'  {cid:15s} {im.size[0]}x{im.size[1]}  {salida.stat().st_size / 1024:5.0f} KB')

    # Igual que el otro índice: la lista sale de lo que SE SIRVE, no de lo que
    # esta pasada haya convertido.
    servidas = sorted(q.stem for q in DESTINO_CARTAS.glob('*.jpg'))
    ruta = DESTINO_CARTAS / 'indice.json'
    nuevo = json.dumps({'cartas': servidas}, ensure_ascii=False, indent=2) + '\n'
    cambio = (not ruta.exists()) or ruta.read_text(encoding='utf-8') != nuevo or bool(reemplazadas)
    ruta.write_text(nuevo, encoding='utf-8')
    if servidas:
        print(f'\n{len(servidas)} cartas enteras, {kb:.0f} KB → assets/cartas/')
    return cambio


def main():
    if not ORIGEN.is_dir():
        sys.exit(f'No existe {ORIGEN.relative_to(RAIZ)}. Deja ahí los originales.')

    validos = ids_de_cartas()
    DESTINO.mkdir(parents=True, exist_ok=True)

    hechas, kb_total, ignoradas, reemplazadas = [], 0.0, [], []
    for f in sorted(ORIGEN.iterdir()):
        if not f.is_file() or f.name.startswith('.') or f.suffix.lower() == '.md':
            continue

        cid = id_de(f.stem, validos)
        if cid is None:
            ignoradas.append(f.name)
            continue

        try:
            im = Image.open(f)
        except Exception as e:                      # noqa: BLE001 - vale cualquier fallo
            ignoradas.append(f'{f.name} ({e})')
            continue

        # Fondo negro para lo que traiga transparencia: el juego es oscuro y un
        # PNG con alfa sobre blanco se ve como un recorte pegado.
        if im.mode in ('RGBA', 'LA', 'P'):
            im = im.convert('RGBA')
            fondo = Image.new('RGB', im.size, (25, 21, 16))
            fondo.paste(im, mask=im.split()[-1])
            im = fondo
        else:
            im = im.convert('RGB')

        ancho, alto = im.size
        escala = LADO / max(ancho, alto)
        if escala < 1:
            im = im.resize((max(1, round(ancho * escala)), max(1, round(alto * escala))),
                           Image.LANCZOS)

        salida = DESTINO / f'{cid}.jpg'
        antes = salida.read_bytes() if salida.exists() else None
        im.save(salida, 'JPEG', quality=CALIDAD, optimize=True, progressive=True)
        if salida.read_bytes() != antes:
            reemplazadas.append(cid)
        kb = salida.stat().st_size / 1024
        kb_total += kb
        hechas.append(cid)
        print(f'  {cid:15s} {ancho}x{alto} → {im.size[0]}x{im.size[1]}  {kb:5.0f} KB')

    # El índice dice qué ilustraciones SE SIRVEN, y eso es lo que hay en
    # assets/dinos/ — no lo que esta pasada haya convertido.
    #
    # Es la diferencia que importa: `src/dinos/` está en .gitignore porque los
    # originales pesan 29 MB y no viajan, así que en un clon recién hecho está
    # vacío. Construir la lista con lo convertido significaba que añadir UNA
    # ilustración borraba del índice las otras cincuenta y dos, que seguían en
    # disco. Y el fallo es mudo: el juego dibuja siluetas y no se queja.
    servidas = sorted(p.stem for p in DESTINO.glob('*.jpg'))

    # Los puntos focales escritos a mano sobreviven a cualquier regeneración,
    # mientras la ilustración a la que apuntan siga sirviéndose.
    indice_ruta = DESTINO / 'indice.json'
    foco = {}
    if indice_ruta.exists():
        try:
            previo = json.loads(indice_ruta.read_text(encoding='utf-8'))
            if isinstance(previo, dict):
                foco = {k: v for k, v in previo.get('foco', {}).items() if k in servidas}
        except json.JSONDecodeError:
            pass

    nuevo = json.dumps({'cartas': servidas, 'foco': foco},
                       ensure_ascii=False, indent=2) + '\n'
    # La VERSION sube si cambia CUALQUIER byte servido, no sólo la lista.
    #
    # Antes subía sólo con el índice, y sustituir una ilustración por otra mejor
    # no cambia la lista: el fichero nuevo se escribía y el service worker seguía
    # sirviendo el viejo de la caché para siempre, porque las ilustraciones están
    # cacheadas sin revalidar a propósito —pesan y se supone que no cambian—.
    cambio = ((not indice_ruta.exists())
              or indice_ruta.read_text(encoding='utf-8') != nuevo
              or bool(reemplazadas))
    indice_ruta.write_text(nuevo, encoding='utf-8')
    print()
    cambio_cartas = procesar_cartas(validos)

    if cambio or cambio_cartas:
        if cambio_cartas and not cambio:
            subir_version_sw('han cambiado cartas enteras')
        elif reemplazadas:
            subir_version_sw('han cambiado ilustraciones ya servidas: '
                             + ', '.join(sorted(reemplazadas)))
        else:
            subir_version_sw('el índice ha cambiado')

    print(f'\n{len(hechas)} ilustraciones, {kb_total:.0f} KB en total → assets/dinos/')
    if ignoradas:
        print('\nSin usar (el nombre no coincide con ninguna carta):')
        for n in ignoradas:
            print(f'  {n}')
        print('\nRenómbralas con el binomio o con el id de la carta. Los ids son:')
        print('  ' + ', '.join(sorted(validos)))

    faltan = sorted(validos - set(servidas))
    if faltan and len(faltan) < len(validos):
        print(f'\nSin ilustración, se dibujan con su silueta SVG:\n  {", ".join(faltan)}')


if __name__ == '__main__':
    main()

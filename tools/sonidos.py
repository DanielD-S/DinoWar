"""Los sonidos: del WAV del generador al M4A que sirve el juego.

    python tools/sonidos.py            # dice qué haría y mide las costuras
    python tools/sonidos.py escribir   # escribe los M4A en assets/sonidos/

Los originales llegan a src/sonidos/ —fuera del repositorio, como los PNG de
las ilustraciones— en lo que entregue el generador: se pide WAV, pero la
segunda música del menú llegó como M4A con extensión .wav, así que aquí se
decodifica cualquier cosa que ffmpeg entienda y no se mira la extensión. Se
sirven como AAC en M4A a 128 kb/s: es lo único
que decodifica `decodeAudioData` en todos los navegadores, Safari en iPhone
incluido. Opus en OGG pesa menos y hace el bucle mejor, pero Safari no lo
decodifica por Web Audio.

Cada pista se normaliza a −16 LUFS para que ninguna suene más que otra: los
generadores entregan cada una a un volumen distinto y el jugador cambia de
pantalla sin cambiar de volumen.

Y la COSTURA del bucle, que ffmpeg no mira. Las músicas se piden en bucle sin
corte, y el generador lo promete y tres de las cuatro primeras llegaron con
uno. Se mide el salto entre la última muestra y la primera contra el salto
típico entre dos muestras cualesquiera: un bucle limpio da un cociente de 1 o
2; un corte, de 20 o más. Y se ARREGLA aquí, no en el navegador: los últimos
SOLAPE segundos se funden sobre los primeros y la pista se acorta en eso, así
que el fichero servido cierra solo y `loop = true` basta. Hacerlo al vuelo
con dos fuentes solapadas funcionaría igual y costaría un reloj en el cliente
por cada vuelta.

Hace falta ffmpeg en el PATH (`scoop install ffmpeg`).
"""
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'src' / 'sonidos'
DESTINO = RAIZ / 'assets' / 'sonidos'

# Las músicas y los ambientes van en estéreo y en bucle; los efectos, en mono.
# Un fichero que empiece por uno de estos prefijos se trata como pista larga.
PISTAS = ('musica-', 'ambiente-')
EXTENSIONES = {'.wav', '.mp3', '.m4a', '.aac', '.ogg', '.opus', '.flac'}

LUFS = -16
# Por debajo de esta fracción de la sonoridad típica, un extremo es fundido y se quita.
UMBRAL_FUNDIDO = 0.6
# Segundos del final que se funden sobre el principio para cerrar el bucle.
SOLAPE = 3.0
BITRATE_PISTA = '128k'
BITRATE_EFECTO = '96k'


def es_wav(ruta):
    with open(ruta, 'rb') as f:
        return f.read(4) == b'RIFF'


def leer(ruta):
    """Muestras y frecuencia de cualquier fichero de audio, vía ffmpeg si no es WAV."""
    if not es_wav(ruta):
        decodificado = DESTINO / '_decodificado.wav'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(ruta),
                        '-ar', '48000', '-c:a', 'pcm_s16le', str(decodificado)], check=True)
        try:
            return leer(decodificado)
        finally:
            decodificado.unlink(missing_ok=True)
    with wave.open(str(ruta)) as w:
        n, canales, ancho, hz = w.getnframes(), w.getnchannels(), w.getsampwidth(), w.getframerate()
        crudo = w.readframes(n)
    if ancho != 2:
        sys.exit(f'{ruta.name}: se esperan 16 bits, llegaron {ancho * 8}')
    return np.frombuffer(crudo, dtype='<i2').reshape(-1, canales).astype(np.float64), hz


def escribir_wav(ruta, muestras, hz):
    with wave.open(str(ruta), 'wb') as w:
        w.setnchannels(muestras.shape[1])
        w.setsampwidth(2)
        w.setframerate(hz)
        w.writeframes(np.clip(np.rint(muestras), -32768, 32767).astype('<i2').tobytes())


def costura(muestras):
    """Cociente entre el salto de la costura del bucle y el salto típico."""
    saltos = np.abs(np.diff(muestras, axis=0)).mean()
    if saltos == 0:
        return None
    return np.abs(muestras[0] - muestras[-1]).mean() / saltos


VENTANA = 0.5   # segundos por ventana del perfil de sonoridad


def perfil(muestras, hz):
    """RMS por ventana de medio segundo."""
    v = int(hz * VENTANA)
    return np.array([np.sqrt((muestras[i:i + v] ** 2).mean()) for i in range(0, len(muestras) - v + 1, v)]), v


def recortar_fundidos(muestras, hz):
    """Quita el fundido de entrada y el de salida: lo que queda por debajo de
    UMBRAL_FUNDIDO de la sonoridad típica en cada extremo. Devuelve también
    cuántos segundos se fueron por cada lado."""
    rms, v = perfil(muestras, hz)
    mediana = np.median(rms)
    if mediana == 0:
        return muestras, 0.0, 0.0
    vivas = np.flatnonzero(rms >= UMBRAL_FUNDIDO * mediana)
    desde, hasta = vivas[0] * v, (vivas[-1] + 1) * v
    return muestras[desde:hasta], desde / hz, (len(muestras) - hasta) / hz


def hueco(muestras, hz):
    """Cuánto se hunde el volumen en la costura, relativo a la sonoridad típica
    de la pista: el mínimo en los segundos que rodean el punto de cierre del
    bucle, que es la muestra 0. ×1 es que no se nota; ×0,1 es un agujero."""
    rms, _ = perfil(muestras, hz)
    borde, _ = perfil(np.concatenate([muestras[-4 * hz:], muestras[:4 * hz]]), hz)
    return borde.min() / np.median(rms)


def enlazar(muestras, hz):
    """Funde la cola sobre la cabeza y acorta la pista: el bucle cierra solo."""
    n = int(SOLAPE * hz)
    if len(muestras) < 3 * n:
        return muestras
    # Fundido de potencia constante: a mitad de camino las dos suman 1 de
    # energía, no 1 de amplitud, y el volumen no se hunde en el cruce.
    t = np.linspace(0, np.pi / 2, n)[:, None]
    cabeza = muestras[:n] * np.sin(t) + muestras[-n:] * np.cos(t)
    return np.concatenate([cabeza, muestras[n:-n]])


def convertir(entrada, salida, pista):
    orden = [
        'ffmpeg', '-y', '-loglevel', 'error', '-i', str(entrada),
        '-af', f'loudnorm=I={LUFS}:TP=-1.5:LRA=11',
        '-ar', '48000',
        '-ac', '2' if pista else '1',
        '-c:a', 'aac', '-b:a', BITRATE_PISTA if pista else BITRATE_EFECTO,
        '-movflags', '+faststart',
        str(salida),
    ]
    subprocess.run(orden, check=True)


def main(escribir):
    if not ORIGEN.exists():
        sys.exit(f'no existe {ORIGEN}: los WAV del generador van ahí')
    fuentes = sorted(f for f in ORIGEN.iterdir()
                     if f.is_file() and f.suffix.lower() in EXTENSIONES)
    if not fuentes:
        sys.exit(f'no hay ningún fichero de audio en {ORIGEN}')
    if escribir:
        DESTINO.mkdir(exist_ok=True)

    temporal = DESTINO / '_enlazada.wav'
    for f in fuentes:
        pista = f.stem.startswith(PISTAS)
        destino = DESTINO / f'{f.stem}.m4a'
        entrada = f
        aviso = ''
        if pista:
            muestras, hz = leer(f)
            antes = costura(muestras)
            muestras, cabeza, cola = recortar_fundidos(muestras, hz)
            muestras = enlazar(muestras, hz)
            despues = costura(muestras)
            aviso = (f'  costura ×{antes:.0f} -> ×{despues:.1f}, {len(muestras) / hz:.1f} s'
                     f', fundidos quitados {cabeza:.1f}+{cola:.1f} s'
                     f', hueco en el bucle ×{hueco(muestras, hz):.2f}')
            if escribir:
                escribir_wav(temporal, muestras, hz)
                entrada = temporal
        if escribir:
            convertir(entrada, destino, pista)
            print(f'{f.name} -> {destino.relative_to(RAIZ)} ({destino.stat().st_size // 1024} KB){aviso}')
        else:
            print(f'{f.name} -> {destino.relative_to(RAIZ)}{aviso}')

    if escribir:
        temporal.unlink(missing_ok=True)
    else:
        print('\n(sin escribir; pasa «escribir» para generar)')


if __name__ == '__main__':
    main(escribir=len(sys.argv) > 1 and sys.argv[1] == 'escribir')

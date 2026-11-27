# Piloto de la edición 4 · L04

**Measure Review Time, Quality, and Cost · 5:09 · 1080p.** Compara 40 PR iniciales con 40 del piloto. Examina la espera, el esfuerzo, los siete retrabajos y el libro de gasto antes de decidir si ampliar el despliegue.

[Descargar el episodio en inglés](https://github.com/Finithe-Phoenix/Path-Level-Managers-IA/raw/refs/heads/pilots/v4/pilots/v4/media/L04.mp4) · [Subtítulos SRT](https://github.com/Finithe-Phoenix/Path-Level-Managers-IA/raw/refs/heads/pilots/v4/pilots/v4/work/L04/audio/captions.srt) · [Reproductor con subtítulos y capítulos](review-player/) · [Ejercicio de transferencia](evaluation/participantes/L04/).

[Descargar el libro de cálculo editable](https://github.com/Finithe-Phoenix/Path-Level-Managers-IA/raw/refs/heads/pilots/v4/pilots/v4/work/L04/visual/evidence/pilot-ledger.xlsx) o [consultar los 80 registros sintéticos](work/L04/visual/evidence/pull_requests.csv).

## Evaluación en otro dispositivo

El facilitador puede entregar las copias por código en el orden asignado. Cada paquete incluye la película completa y un reproductor con subtítulos en inglés y capítulos. [Paquete K](https://github.com/Finithe-Phoenix/Path-Level-Managers-IA/raw/refs/heads/pilots/v4/pilots/v4/review/participants/K.zip) · [Paquete R](https://github.com/Finithe-Phoenix/Path-Level-Managers-IA/raw/refs/heads/pilots/v4/pilots/v4/review/participants/R.zip). Los dos paquetes corresponden a dos ediciones del mismo caso.

## Trabajar sobre el piloto

Esta rama contiene un candidato de evaluación. La [edición 3 publicada](https://github.com/Finithe-Phoenix/Path-Level-Managers-IA/releases/tag/v3.0.0) sigue disponible. Las hojas individuales, las soluciones y la correspondencia ciega de los medios se entregan por separado a quien facilite la prueba. La decisión de extender el formato exige la revisión del evaluador y los participantes de los dos pilotos.

1. En el workspace Linux, abre esta carpeta. Instala Node.js y FFmpeg con libx264, AAC, soporte SRT y `ffprobe`. La producción se comprobó con Node.js 24.22.3, Python 3.12 y FFmpeg 7.1.5. Los paquetes y las tipografías están fijados en los archivos de producción.
2. Edita [el guion y las tomas](work/L04/lesson.json) y [la composición con sus fuentes de evidencia](work/L04/visual/README.md). Los gestos se sincronizan con las marcas del relato.
3. Usa el audio versionado para cambios visuales. Para editar una frase o una pausa, sigue la [guía de voz](voice/README.md) y conserva juntos la toma, los tiempos y los subtítulos. [Archivo de tomas seleccionadas](work/L04/take/raw-wavs.zip).
4. Revisa la imagen en una pantalla de teléfono, activa CC y repite el cambio decisivo. Una persona del equipo puede revisar el código y los checks del PR desde la terminal autorizada con GitHub CLI.

```bash
npm ci --prefix studio
python3 studio/verify.py --decode
node studio/render.cjs --work work/L04 --output build/L04-rebuild.mp4
node studio/project.cjs --work work/L04 --out build/L04
```

El exportador crea un proyecto editable para HyperFrames y Remotion. [Guía de adaptadores](studio/ADAPTADORES.md) · [Plan de los 24 episodios restantes](evaluation/producer/rollout.md) · [Manifiesto de la candidatura](manifest.json).

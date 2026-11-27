# Producir y editar la narración de los pilotos

Cada piloto contiene un diálogo inglés limpio, un SRT sincronizado y una toma editable por unidad de interpretación. La selección de voz es **provisional** y requiere una prueba con participantes. Los tiempos para resolver una pregunta forman parte del montaje del video.

## Preparar la estación en GCP

Usa Python 3.12 y FFmpeg con FFprobe. La edición entregada se generó con FFmpeg 7.1.5. Los comandos parten de `pilots/v4/`, el directorio de la rama candidata que contiene `voice/` y `work/`. El entorno de validación fue un workspace Linux en CPU con recursos locales. El equipo responsable de GCP debe comprobar su imagen, sus políticas de descarga y la conexión de VS Code al workspace corporativo.

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r voice/requirements.txt
python voice/assets.py
```

La primera descarga verifica por SHA-256 los pesos de Supertonic 3, los tres timbres oficiales y el alineador acústico de inglés. Desde ese momento puedes desconectar la red. La inferencia usa un hilo de CPU y el equipo local solo necesita acceso a VS Code. Puedes elegir la caché con `--assets`.

## Reconstruir el diálogo a partir de las tomas entregadas

```bash
pilot=M02  # En el repositorio de managers, usa L04.
python voice/pilot.py --stage pack --lesson "work/$pilot/lesson.json" --cache "work/$pilot/take" --out "build/$pilot/audio" --profile workshop
python voice/verify.py --lesson "work/$pilot/lesson.json" --source "build/$pilot/audio"
```

El empaquetador comprueba cada WAV de `take/raw-wavs.zip` con `take/sha256.json`. El archivo `take/script.json` identifica cada frase, su intención y la semilla inicial. `take/choices.json` identifica las segundas lecturas elegidas y conserva su velocidad y sus divisiones por oración. El archivo comprimido contiene únicamente las tomas seleccionadas.

La salida se compone de `narration.m4a`, `captions.srt` y `episode.json`. El diálogo se masteriza en mono, AAC a 48 kHz y 192 kb/s, cerca de −18 LUFS. El auditor comprueba que cada palabra del guion aparezca en los subtítulos y verifica sus límites, el audio, los capítulos y las pausas de práctica. `speech-audit.json` deja la transcripción automática de control para el equipo de producción. Puede confundir homófonos, nombres de producto y palabras compuestas.

## Cambiar la explicación o probar otra interpretación

Edita el texto de los `beats` en `lesson.json` y conserva su concatenación exacta en `narration`. La toma inicial usa la puntuación, el tipo de instrucción y `voiceDirection` como señales. Las preguntas, acciones y resultados tienen velocidades y pausas diferentes. Los silencios para practicar provienen de `practiceHoldSeconds`.

```bash
python voice/pilot.py --stage all --lesson "work/$pilot/lesson.json" --cache "build/$pilot/take" --out "build/$pilot/audio" --profile workshop --choices "work/$pilot/take/choices.json"
```

Al editar el texto o cambiar el perfil, usa un directorio de salida nuevo y omite `--choices` para volver a dirigir las líneas. `profiles.json` ofrece tres timbres oficiales, llamados `reference`, `workshop` y `reader`. Los números de fotograma se recalculan para la nueva lectura. Una nueva duración requiere volver a montar el video con el `episode.json` generado. Las tomas publicadas permiten conservar la interpretación original incluso cuando se actualiza el entorno de síntesis.

## Cómo se leen los tiempos

El reloj corre a 24 fotogramas por segundo. Cada escena contiene un `startFrame` absoluto y una duración entera en fotogramas. En cada beat, `startFrame`, `endFrame`, `start`, `end` y `speechEnd` son relativos al inicio de su escena. `holdSeconds` mide el silencio posterior a la última frase. Los `cues` usan segundos relativos a su escena. El SRT suma los desplazamientos de las escenas para dar tiempos absolutos. El alineador deriva los límites de la voz sintetizada.

## Audición sin etiquetas de voz

`casting.py` monta tres lecturas del mismo guion. La primera salida crea una clave aleatoria únicamente en el directorio privado indicado con `--private`. Un `timeline.json` existente conserva exactamente el montaje visual en las reconstrucciones. Los tres AAC usan esa misma secuencia de fotogramas junto con un SRT individual. Para compartir una audición se distribuyen los medios finales, sin el directorio privado ni los resultados técnicos.

[Pesos y licencia de Supertonic 3](https://huggingface.co/Supertone/supertonic-3/tree/3cadd1ee6394adea1bd021217a0e650ede09a323) · [Alineador ONNX](https://huggingface.co/Xenova/wav2vec2-base-960h/tree/a19f851b3d42865797e410752b4c570c871e4825).

# Narración en inglés

La edición 3 usa Supertonic 3 en CPU. El motor sintetiza a 44,1 kHz a partir de la voz de catálogo M3. El texto hablado se conserva en `lessons/episodes.json`. El preajuste, el número de pasos de difusión y el ritmo de preguntas, acciones y explicaciones se controlan en [profile.json](profile.json).

El motor interpreta grupos de frases completos y conserva las pausas internas que genera al leerlos. Una pregunta deja tiempo para anticipar la respuesta. Después de una indicación o de un resultado hay una pausa para mirar la pantalla. Una semilla por episodio, escena y frase permite repetir la interpretación con la misma configuración.

## Cambiar el guion o la interpretación

Ejecuta estos comandos en la raíz del repositorio en el workspace de GCP. El ejemplo `ID` representa un ID de la lista de episodios.

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r voice/requirements.txt
python voice/assets.py
python studio.py list
python studio.py voice ID
python studio.py render ID
python studio.py verify ID --decode
```

La descarga inicial verifica todos los pesos y el preajuste mediante [model-lock.json](model-lock.json). La generación posterior se ejecuta sin conexión. Las sesiones ONNX usan un hilo por defecto. Para comparar otra voz oficial, añade su JSON al manifiesto con la revisión y el SHA-256 correctos y selecciona el nombre en el perfil.

## Ajustar solo el ritmo

```bash
python studio.py pace ID --target-wpm 145
python studio.py render ID
python studio.py verify ID --decode
```

La toma base está en `takes/ID/`. El ajuste de ritmo parte de esa toma, conserva el tono y adapta las marcas al reloj de 24 fotogramas por segundo. La pista final está en `narration/ID/`, acompañada por `timing.json`. El SRT entregable está en `subtitles/`.

## Alineación y masterización

El alineador acústico inglés wav2vec 2.0 identifica los fotogramas de audio que corresponden a cada grupo del subtítulo mediante una trayectoria CTC de máxima puntuación. La transcripción mostrada conserva la ortografía del guion aunque la pronunciación de una sigla se desarrolle para la voz. Las marcas se recalculan después del ajuste de tempo. Si una palabra queda sola y breve, `display_captions.py` prolonga el subtítulo hasta 650 milisegundos cuando hay pausa. El dato `speechEnd` conserva el final acústico de la palabra para mezclar los efectos.

El máster de diálogo es mono, AAC a 48 kHz y 192 kb/s. La mezcla usa un filtro pasaaltos a 55 Hz y una medición de sonoridad en dos pasadas con objetivo de −18 LUFS. Los modelos se descargan desde revisiones públicas fijadas. Los pesos de Supertonic están sujetos a la licencia OpenRAIL-M del proveedor y el alineador usa la arquitectura wav2vec 2.0.

[Supertonic 3 y su licencia](https://huggingface.co/Supertone/supertonic-3/tree/3cadd1ee6394adea1bd021217a0e650ede09a323) · [Alineador ONNX](https://huggingface.co/Xenova/wav2vec2-base-960h/tree/a19f851b3d42865797e410752b4c570c871e4825) · [Modelo acústico original](https://huggingface.co/facebook/wav2vec2-base-960h).

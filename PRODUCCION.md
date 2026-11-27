# Producción · Managers

Esta guía reconstruye **L01** usando la voz y los tiempos de la edición publicada. Puedes sustituir su ID por el de cualquier episodio del [temario](README.md).

## Preparar el workspace

Ejecuta los comandos en el workspace Linux de GCP. Puedes abrir ese checkout con VS Code y GitHub Copilot desde tu equipo. Claude Code, OpenCode, las herramientas de compilación y GitHub CLI se ejecutan en el entorno remoto.

La edición se produjo con Python 3.12 y Node.js 24. El máster requiere FFmpeg con libx264 y AAC, además de `ffprobe`. El motor incluye las tipografías y fija las dependencias de Node en su archivo de bloqueo.

```bash
git clone https://github.com/Finithe-Phoenix/Path-Level-Managers-IA.git
cd Path-Level-Managers-IA
npm ci --prefix engine
python3 studio.py list
```

Para comprobar que las fuentes y los medios de este checkout coinciden con su manifiesto, ejecuta `python3 studio.py verify all --release`.

## Reconstruir el MP4 con la pista publicada

Desde la raíz del repositorio, ejecuta lo siguiente.

```bash
python3 studio.py render L01
python3 studio.py verify L01 --decode
```

El resultado queda en `videos/L01.mp4`, con video H.264 a 1280 × 720, audio AAC, capítulos y subtítulos en inglés. La verificación comprueba formatos, duración y capítulos y decodifica el audio y la imagen. Para reconstruir todo el nivel, usa `python3 studio.py render all`.

## Editar la demostración

1. Localiza el episodio y su escena en [lessons/episodes.json](lessons/episodes.json). Conserva el ID del episodio. En cada escena, `action` describe la acción, `code` y `result` contienen la entrada y el resultado que se muestran, y `focus` indica el detalle que el alumno debe observar.
2. Si la escena tiene un dibujo específico, busca su ID en [engine/](engine/). Actualiza también las cifras, los comandos y las etiquetas que aparecen dibujados. La sección «Edit the motion» de la [guía del motor](engine/README.md) identifica los módulos de cada tipo de escena.
3. Si conservaste el texto hablado y el orden de las escenas, puedes volver a renderizar el MP4 con el audio versionado. Si cambiaste la narración, los IDs de escena, la cantidad de escenas o su orden, regenera antes la voz siguiendo los pasos siguientes.
4. Ejecuta `python3 studio.py project L01` y abre `build/L01/preview.html` en la vista previa del workspace. Recorre el instante de la acción y el de su resultado. Para llevar la escena a Remotion o HyperFrames, sigue las instrucciones de la [guía del motor](engine/README.md).

## Cambiar la voz o el ritmo

Edita `narration` en el guion para cambiar lo que se escucha. La narración se escribe en inglés. El timbre y la mezcla se configuran en [voice/profile.json](voice/profile.json). La primera síntesis descarga el modelo y las voces definidos en [voice/model-lock.json](voice/model-lock.json) y comprueba sus hashes.

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r voice/requirements.txt
python voice/assets.py
python studio.py voice L01
python studio.py render L01
python studio.py verify L01 --decode
```

Para ajustar únicamente la velocidad, puedes usar la toma que ya está en [takes/](takes/). Este ejemplo fija un objetivo de 142 palabras por minuto y recalcula la duración de las escenas y los subtítulos.

```bash
python3 studio.py pace L01 --target-wpm 142
python3 studio.py render L01
python3 studio.py verify L01 --decode
```

La pista final y el archivo de tiempos se guardan en [narration/](narration/), y los SRT en [subtitles/](subtitles/). La [guía de narración](voice/README.md) explica la pronunciación, la mezcla y la sincronización.

## Guardar una edición

Trabaja en una rama. Reproduce el episodio modificado con audio, activa los subtítulos y revisa sus cortes de capítulo. Si cambiaste las escenas usadas en el fragmento animado de la portada, regenera el GIF con `python3 preview.py`. Los puntos de corte están en [preview-scenes.json](preview-scenes.json).

```bash
python3 studio.py manifest
python3 studio.py verify all --release
```

Incluye el guion, los cambios en el motor o la voz, los archivos generados y el manifiesto actualizado en el mismo PR. Desde el terminal autorizado, el revisor puede consultar el alcance, los cambios y los checks con `gh pr view`, `gh pr diff` y `gh pr checks`. Al publicar, conserva las etiquetas anteriores y actualiza los enlaces del temario a la nueva edición.

[Guía para agentes](AGENTS.md) · [Manifiesto de esta edición](release-manifest.json) · [Fuentes de la primera edición](archive/v1/) · [Videos de la segunda edición](https://github.com/Finithe-Phoenix/Path-Level-Managers-IA/releases/tag/videos-v2.0.0).

## Actualizar la ilustración de la portada

La fuente editable es [docs/portada.svg](docs/portada.svg). Tras editarla, genera el PNG que muestra GitHub desde la raíz del repositorio, con las dependencias del motor instaladas.

```bash
FONTCONFIG_FILE="$PWD/engine/fonts/fonts.conf" node -e "require('./engine/node_modules/sharp')('docs/portada.svg').png().toFile('docs/portada.png')"
```

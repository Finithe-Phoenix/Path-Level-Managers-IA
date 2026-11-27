# Editar y renderizar con Remotion o HyperFrames

Los dos proyectos usan la función visual de la lección, su narración en inglés y el reloj de la edición 4. La composición mide 1920 × 1080 y avanza a 24 fotogramas por segundo. La escena siguiente empieza exactamente en el primer fotograma indicado por el acumulado de `durationFrames`.

Ejecuta los comandos en el workspace de producción aprobado, desde la carpeta que contiene `studio/` y `work/`. Necesitas Node 22 o posterior para HyperFrames. Cada proyecto generado incluye las versiones de los paquetes y su archivo de bloqueo. Chromium y FFmpeg permiten producir y verificar las salidas en el propio workspace.

## Generar una lección

```sh
node studio/project.cjs --work work/L04 --out build/L04
```

Para L04, sustituye `L04` por `L04`. El generador valida que los IDs, la narración escrita y la duración correspondan a `work/L04/audio/episode.json`. Copia el audio, los subtítulos SRT y las seis fuentes tipográficas. Incorpora las imágenes, el JSON de evidencia y los fragmentos de texto usados por `visual/scene.cjs` en el código del proyecto. Los medios y las tipografías se cargan desde archivos locales.

Edita la composición en `work/L04/visual/scene.cjs`, los datos de la toma en `work/L04/visual/` y el guion en `work/L04/lesson.json`. Si cambias palabras, vuelve a producir la voz y el archivo de tiempos antes de generar los proyectos. Los archivos de `build/` se pueden regenerar. Para añadir una imagen en el módulo visual, usa el mismo patrón de lectura local que las tomas existentes, con nombre de archivo literal y codificación `base64`. Se admiten también textos `utf8` e importaciones JSON locales.

## Remotion

```sh
cd build/L04/remotion
npm ci
npm run studio
```

Desde la misma carpeta, estos comandos exportan una imagen del fotograma 240 o la película.

```sh
npm run still -- frame-240.png --frame=240
npm run render -- L04-remotion.mp4
```

La composición se llama `Workshop`. Con Chromium preinstalado, añade `--browser-executable=/ruta/a/chromium` al comando de exportación. La escena React espera a que se carguen las fuentes y reproduce el archivo `public/narration.m4a`. Conserva junto al proyecto el archivo `public/captions.srt`. [Documentación de Remotion](https://www.remotion.dev/docs/)

## HyperFrames

```sh
cd build/L04/hyperframes
npm ci
npm run preview
```

La posición de captura se expresa en segundos. El fotograma 240 corresponde al segundo 10.

```sh
npm run snapshot -- --at 10 --no-end --output stills
npm run render -- --output L04-hyperframes.mp4
```

Para exportar únicamente el tramo entre los segundos 10 y 12, usa `npm run render -- --start=10 --end=12 --output tramo.mp4`. Con Chromium preinstalado, define `PRODUCER_HEADLESS_SHELL_PATH` con su ruta. Si el directorio de caché del usuario es de solo lectura, configura `HYPERFRAMES_CACHE_DIR` en una carpeta privada con permiso de escritura del workspace, fuera del proyecto generado. La composición HTML incluye una pista de narración y distribuye `captions.srt` junto a ella. [Documentación de HyperFrames](https://hyperframes.heygen.com/)

## Verificar una toma

Instala las dependencias en `studio/` y ambas carpetas generadas. Desde la carpeta raíz de esta edición, elige un fotograma durante una frase audible y deja al menos un segundo de material por delante.

```sh
node studio/test-project.cjs --work work/L04 --project build/L04 --out qa/L04-adapters --frame 240 --clip
```

Si el workspace ya tiene navegador, añade `--chrome /ruta/a/chromium`. El test compara el SVG exacto de los tres motores en el inicio, mitad y final de cada escena. Después ejecuta los dos CLI para capturar el fotograma elegido, lo compara con el PNG nativo y guarda las tres imágenes y sus métricas. Con `--clip`, también exporta un segundo de vídeo en cada motor, comprueba dimensiones, duración y audio, y compara su forma de onda con ese mismo tramo de la narración original. Los rasterizadores pueden suavizar bordes y letras de manera ligeramente distinta. `adapter-check.json` conserva las diferencias y las versiones utilizadas.

El render de distribución con capítulos y subtítulos conmutables se obtiene desde la fuente nativa de esta edición. Los MP4 de edición de Remotion y HyperFrames conservan la narración. El SRT acompaña los proyectos para usos posteriores.

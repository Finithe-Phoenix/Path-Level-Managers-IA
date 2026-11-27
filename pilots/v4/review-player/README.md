# Ver la lección con subtítulos y capítulos

## Desde el espacio de trabajo

Sirve la carpeta que contiene este reproductor y el video. Desde la carpeta que contiene `media/` y `review-player/`, ejecuta `python3 -m http.server 8000 --bind 127.0.0.1` en el espacio de trabajo autorizado. Abre el puerto 8000 mediante su vista previa HTTPS y navega a `review-player/player.html`. El reproductor lee `lesson.json` de su carpeta y carga el MP4, `captions.en.vtt` y `chapters.json` mediante rutas relativas. Usa **CC en inglés** y **Ir a un capítulo**.

## Con el ZIP

Extrae la carpeta. Al servir esa carpeta por HTTP, abre `player.html` y los archivos se cargarán automáticamente. En un navegador que admita HTML local con JavaScript, abre directamente `player.html`. En **Abrir los archivos de la lección**, selecciona `episode.mp4`, `captions.en.vtt` y `chapters.json`. Los archivos elegidos se leen en el propio navegador. Algunos visores de documentos del teléfono muestran una previsualización sin JavaScript. En ese caso, abre la vista previa HTTPS del espacio de trabajo en Safari o Chrome.

El ZIP también incluye `captions.en.srt` para un reproductor de escritorio o móvil compatible. Los subtítulos ingleses del HTML son una pista WebVTT externa. La lista de capítulos usa el mismo reloj del MP4. El navegador conserva sus controles nativos de reproducción. Las pruebas en Safari de un iPhone físico y en Chrome de un Android físico se registran por separado durante la evaluación.

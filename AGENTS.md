# Producción de los videos

Trabaja desde un checkout del nivel en el workspace autorizado de GCP. VS Code y GitHub Copilot pueden abrirse en el equipo local. Ejecuta los comandos, Claude Code y OpenCode en el workspace remoto. Para revisar un PR del curso, la persona revisora usa `gh pr view`, `gh pr diff` y `gh pr checks` en el terminal autorizado.

## Editar un episodio

1. Lee el episodio en `lessons/episodes.json` y la referencia técnica enlazada en `sources`. Conserva el identificador del episodio. Usa datos sintéticos en pantallas, comandos, salidas y ejemplos.
2. En cada escena, define lo que el alumno hace (`action`), lo que aparece en la pantalla (`code`, `result`) y qué detalle demuestra el resultado (`focus`). Escribe `narration` en inglés conversacional. Explica por qué importa la acción y cómo comprobar el resultado.
3. Las escenas personalizadas tienen dibujos y valores de ejemplo en los módulos `foundations.cjs`, `architecture.cjs`, `manager-visuals.cjs` o `workbenches.cjs` de `engine/`. Busca el ID de episodio y el ID de escena antes de cambiar un dato o un comando. Mantén alineados el guion y las etiquetas dibujadas.
4. Si editas la voz, cambias un ID de escena, añades una escena o alteras su orden, reconstruye la narración. El README incluye los comandos. Para un cambio visual puedes usar la pista de voz y las marcas de tiempo versionadas.
5. Renderiza el episodio desde la raíz y ejecuta la verificación con `--decode`. Reproduce el MP4 con audio. Comprueba la pronunciación de comandos, los subtítulos y que el resultado visual aparece cuando la voz lo explica.
6. Guarda juntos el guion, el motor si cambió, el audio si cambió, los tiempos, los subtítulos y el MP4 resultante. La siguiente revisión puede identificar el episodio por su ID y comparar las escenas en Git. Una edición publicada se identifica por su etiqueta de Git.

La reconstrucción visual usa los archivos de este repositorio. Las dependencias de voz y los pesos con licencia se documentan en `voice/`. El motor se encuentra en `engine/`. La edición anterior está documentada en `archive/v1/`.

# Sonido de las demostraciones

La mezcla conserva la voz del instructor en el centro. Al empezar cada episodio se escucha una firma breve. Durante la demostración, un toque coincide con la primera acción de una escena de trabajo y otro con la aparición de un resultado. Ambos señalan el instante que conviene observar. La última señal también sirve para una prueba que falla.

## Generar la mezcla

Ejecuta el siguiente comando desde la raíz del repositorio con Python 3 y FFmpeg. Sustituye las rutas por el JSON con tiempos, la narración limpia y el destino del nuevo máster.

```bash
python3 sound/sounddesign.py \
  --episode build/L01/episode.json \
  --voice narration/L01/narration.m4a \
  --output build/L01/mix.m4a
```

El resultado es AAC mono a 48 kHz, con una duración calculada a partir del número de fotogramas. El archivo de entrada queda disponible como pista de voz sola. Agrega `--events-json build/L01/sonido.json` para ver el segundo exacto y los materiales de cada intervención.

## Editar las señales

Las frecuencias, amplitudes y duraciones de cada apertura están en `SIGNATURES` en [sounddesign.py](sounddesign.py). Básico usa dos resonancias de vidrio. Medio combina el golpe de un interruptor y la vibración de una pieza metálica. Avanzado usa un barrido corto y una resonancia. Managers combina una percusión de madera con un brillo breve. Los sonidos se sintetizan a partir de osciladores y ruido con semilla fija, sin grabaciones ni música de terceros.

La función `reveal` sigue el cálculo de `resultAt` del escenario en [stage.cjs](../engine/stage.cjs). Al ajustar ese cálculo, revisa ambos archivos y compara la señal con la aparición del resultado. Las marcas de subtítulos reducen suavemente el nivel de los efectos mientras se habla. Un limitador con compensación de latencia protege los picos antes de codificar el audio.

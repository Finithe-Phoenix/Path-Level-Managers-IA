# Decidir sobre cada piloto

Hay cinco plazas reales por piloto y dos turnos por plaza. Las celdas vacías significan **pendiente**. Una prueba técnica, una respuesta de demostración o la opinión del equipo de producción no ocupa una plaza.

## Regla predefinida

1. **Aprobación editorial.** La persona que fija el estándar registra en `evaluador.csv` sus cuatro calificaciones, la evidencia y el instante de cada una, la ruta de calibración elegida y su aprobación explícita por piloto. Si elige una referencia externa, registra título y tramo. Si calibra con X/Y, documenta los instantes de su comparación; los campos externos quedan opcionales y figuran como «pendiente/no aportada». Se requieren **4/5 o más en claridad, naturalidad, credibilidad y legibilidad, cada una por separado**. Una nota inferior o una decisión explícita de revisión requiere corregir el piloto. Una evaluación en blanco mantiene la decisión pendiente.
2. **Transferencia con cinco alumnos.** Se necesitan las diez observaciones de cada piloto, una por edición y por persona. En la edición 4, **al menos cuatro de las mismas cinco personas** deben completar y justificar independientemente su caso y calificar claridad **y** naturalidad con 4 o 5. Cuenta la intersección por asiento. El turno con ayuda de contenido aporta información descriptiva y queda fuera de los éxitos independientes.
3. **Dispositivos físicos.** Comprueba el piloto final en **un iPhone físico con Safari y un Android físico con Chrome**. Debe abrir, oírse, permitir leer los subtítulos ingleses por la ruta ofrecida, saltar a un paso y continuar. Registra evidencia en ambos teléfonos.

Presenta las valoraciones de credibilidad y legibilidad de los alumnos y el contraste entre v3 y v4 como hallazgos descriptivos. Una preferencia agregada o el rendimiento de v3 no añade una condición a la decisión. Las notas de credibilidad y legibilidad que sí forman parte de la aprobación son las de la persona que fija el estándar.

`CUMPLE` exige los tres requisitos. La hoja muestra `REVISAR` cuando quien fija el estándar rechaza el piloto o califica una dimensión por debajo de 4. Mientras falten la valoración, la aprobación o la evidencia de la ruta que seleccionó, muestra `PENDIENTE`. La ausencia de enlace externo permite seguir la ruta A/B. Tras su aprobación, una prueba completa de alumnos o teléfono que incumpla su requisito da `REVISAR`. Si aún faltan observaciones obligatorias queda `PENDIENTE`. Solo dos pilotos en `CUMPLE` permiten recomendar ampliar el tratamiento al catálogo.

## Cómo registrar y volver a probar

En `observaciones.csv`, `consiente`, `completa`, `justifica` y `ayuda_contenido` aceptan 0 o 1. Anota las cuatro valoraciones de la persona tal como las dio, de 1 a 5. `evidencia` contiene una observación concreta de su trabajo, y `momento` un instante aproximado o la acción en pantalla. No escribas nombres, correos ni datos de empresa. Valora cada caso mediante `soluciones/criterios.md`.

Anota por separado el instante problemático, conducta observada y cambio propuesto. Un fallo de comprensión exige revisar la demostración o la explicación; uno de escucha exige revisar la toma precisa; uno de dispositivo exige corregir el reproductor o la legibilidad y repetir el chequeo físico. Para una nueva ronda de aprendizaje, conserva los resultados previos, identifica los nuevos archivos y usa cinco personas nuevas con ejercicios inéditos equivalentes. No reemplaces observaciones desfavorables para alcanzar cuatro.

Desde la carpeta `facilitacion`, ejecuta `python puntuar.py` para imprimir recuentos y estado. Usa `--observaciones`, `--dispositivos` y `--evaluador` para trabajar sobre copias privadas. El informe lee los datos sin modificarlos.

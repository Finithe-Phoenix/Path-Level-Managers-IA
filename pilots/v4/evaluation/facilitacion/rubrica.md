# Rúbrica editorial y de aprendizaje

La persona que fija el estándar editorial puntúa por separado los cuatro aspectos de cada piloto terminado. Registra su propio juicio y un instante observable para cada dimensión en `evaluador.csv`. La persona que facilita recoge aparte las cuatro respuestas de cada alumno después de cada exposición. Conserva la valoración declarada por el alumno. **2 y 4 son puntos intermedios**. Un 4 indica que pudo realizar la acción descrita en el ancla superior con una fricción menor.

| Dimensión | 1 | 3 | 5 |
|---|---|---|---|
| Claridad | No identifica qué se estaba comprobando o confunde la entrada con el resultado. | Reconstruye el paso principal al volver atrás, pero pierde un enlace entre acción y consecuencia. | Explica el objetivo, la acción y el resultado en orden y aplica la idea al caso nuevo. |
| Naturalidad de la voz | El ritmo, la entonación o una pronunciación impiden seguir una frase decisiva. | Entiende las frases, aunque una pausa o un énfasis le obliga a reajustar la escucha. | La lectura en inglés resulta conversacional, enfatiza el dato decisivo y deja tiempo para observarlo. |
| Credibilidad | La conclusión aparece sin una prueba, operación o resultado identificable. | Reconoce el resultado al repetir el fragmento, pero le cuesta localizar la entrada o el vínculo causal. | Señala la entrada, la acción y la evidencia visible que sustentan la conclusión. |
| Legibilidad | En el dispositivo de prueba no puede leer el comando, cifra o comparación decisivos. | Puede leer la información con pausa, zoom manual o al repetir el fragmento. | Lee la información decisiva durante la primera reproducción en la orientación elegida y la localiza de nuevo. |

El tiempo de respuesta y el momento señalado sirven para diagnosticar fallos. La columna de legibilidad describe el dispositivo real de esa persona. La comprobación de iPhone y Android utiliza un formulario distinto.

## Calibración con dos fragmentos v3 y un estándar elegido por la persona que evalúa

1. **M02 v3, 01:38–02:02**. Sigue la afirmación sobre el cero hasta el resultado de la prueba. La persona que fija el estándar anota el instante exacto en que pierde claridad, qué esperaba ver y qué gesto hubiera permitido seguir la relación. Si no identifica una pérdida, registra el instante más exigente y la evidencia que lo mantuvo comprensible. [Abrir M02 v3](https://github.com/Finithe-Phoenix/Path-Level-2-IA/raw/v3.0.0/videos/M02.mp4)
2. **L04 v3, 01:12–01:43**. Sigue los dos conteos y su comparación con el umbral. Repite el mismo ejercicio indicando la cifra, imagen o frase concreta que ayuda o dificulta entender la decisión. [Abrir L04 v3](https://github.com/Finithe-Phoenix/Path-Level-Managers-IA/raw/v3.0.0/videos/L04.mp4)
3. **Estándar de publicación**. La persona responsable puede elegir un taller externo que considera publicable y registrar `ruta_calibracion=externa`, su título y el tramo observado. Añade el enlace o localizador cuando esté disponible. Puede elegirlo ahora o más adelante. Si no dispone de una referencia externa y decide calibrar con evidencia A/B, registra `ruta_calibracion=ab`, mira los montajes X e Y de M02 con la misma voz y documenta en `comparacion_ab_con_instantes` los segundos y las acciones que fundamentan su estándar. Dos instantes posibles para empezar la comparación son 00:08 y 00:27. En ambas rutas explica qué conservaría y por qué. Los campos de título, enlace y tramo externos quedan en blanco si no se aportó una referencia.

Al evaluar la edición 4, compara cada piloto con el estándar acordado. Para cada puntuación incluye minuto/segundo, qué se ve u oye y cómo afectó a la comprensión. Registra `aprobacion_editorial=1` si la persona que fija el estándar aprueba ese piloto, `0` si pide revisión y deja el campo vacío si sigue pendiente. Cada una de sus cuatro puntuaciones debe ser al menos 4/5.

Para la prueba de transferencia, coteja las respuestas con `soluciones/criterios.md`. Si dos evaluadores discrepan, conservan las notas originales, reproducen el artefacto o calculan la operación y documentan el acuerdo. Un dato técnico que siga sin poder verificarse recibe 0 en el criterio correspondiente. Si falla el acceso al material, el turno queda pendiente de una repetición completa con un caso fresco.

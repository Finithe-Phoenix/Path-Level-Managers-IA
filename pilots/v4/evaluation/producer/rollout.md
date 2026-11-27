# Producción de los 24 episodios restantes

La edición 4 tiene dos pilotos, M02 y L04. Este plan conserva los títulos, identificadores y rutas de los otros 24 episodios. Cada tanda entrega seis películas. La secuencia aprovecha los materiales de la tanda anterior. La evaluación de los dos pilotos determina si procede ampliar la producción conforme a la [regla acordada](../facilitacion/decision.md).

## Entorno y evidencia

- En el equipo local se usa VS Code con GitHub Copilot. Agent lleva el trabajo paso a paso y Plan permite predecir y acotar cambios antes de editar. La edición, los tests y los comandos que requieran un runner se documentan con el entorno donde realmente se ejecutaron.
- Claude Code y OpenCode viven en el GCP Workspace aprobado. Las capturas deben identificar cliente, versión y checkout. Una reconstrucción se rotula como tal y conserva el fixture o la salida que representa.
- GitHub es el SCM. Una persona revisa el PR con `gh pr view`, `gh pr diff` y `gh pr checks`. Si se graba un veredicto real, usa la cuenta autorizada del revisor y la cabeza vigente. Las demostraciones prescinden de la revisión automática de Copilot en GitHub web.
- Para cada episodio se versionan guion y tomas editables, dirección de voz inglesa, fuente de la captura, subtítulos, solución de la práctica y datos de reproducción. El momento de predicción aparece antes de la solución. Verificar que el dato decisivo y los subtítulos sean legibles al reproducir la película en móvil.

El [CSV con los 24 episodios](rollout.csv) contiene los mismos pasos en columnas para asignar trabajo. Las referencias de B03 se actualizan en la fecha de grabación. El catálogo público y la disponibilidad del tenant se registran en campos distintos.

Las siguientes páginas oficiales respondieron el 27 de noviembre de 2026. Para B03, guardar una ficha fechada de cada fabricante, una ficha del servicio de despliegue que se vaya a explicar y, cuando esté disponible, una evidencia separada del selector de la organización. La página de Phi identifica una familia propia de Microsoft. [OpenAI](https://developers.openai.com/api/docs/models) · [Anthropic](https://platform.claude.com/docs/en/models/overview) · [Microsoft Phi](https://azure.microsoft.com/en-us/products/phi) · [GitHub Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models)

## Tanda 1 · Fundamentos en el editor

### B01 · How a Language Model Uses Context

**Decisión.** ¿Cambiará la explicación si la conversación contiene el test pero omite el requisito?  
**Toma.** Guardar dos solicitudes con el mismo texto y adjuntos distintos. Abrir el archivo citado a la revisión concreta y marcar qué afirmaciones respalda.  
**Transferencia.** Dar una docstring desactualizada y un test actual. Pedir la frase que sí puede sostener y la prueba que falta.  
**Para liberar.** Checkout didáctico fijado y captura autorizada de la conversación o reconstrucción identificada.

### B02 · The Main Types of AI Models

**Decisión.** ¿Una petición necesita generar texto, buscar por similitud, clasificar, transcribir o crear una imagen?  
**Toma.** Seguir entradas y salidas de cinco ejemplos mínimos. En la búsqueda, abrir el pasaje recuperado. En transcripción, comparar una palabra con el audio fuente.  
**Transferencia.** Ante una nota de voz sobre una política, ordenar transcripción, búsqueda y verificación del pasaje.  
**Para liberar.** B01. Preparar audio propio y notas de muestra con una respuesta comprobable.

### B03 · OpenAI, Anthropic, and Microsoft Models

**Decisión.** ¿Quién fabrica el modelo, en qué servicio se ofrece y qué cliente permite elegirlo?  
**Toma.** Fechar los catálogos de OpenAI, Anthropic y Microsoft y el listado de modelos compatibles de Copilot. Contrastar una familia por fabricante con el selector autorizado de esa organización si se dispone de él. Distinguir modelos propios de Microsoft de los modelos de terceros que distribuye.  
**Transferencia.** Entregar una ficha de catálogo y un selector de otra organización. Registrar modelo, plataforma, cliente y la afirmación de disponibilidad que permiten.  
**Para liberar.** B02. Verificar fuente oficial, fecha y versión al producir. Sin evidencia autorizada del selector, registrar disponibilidad del tenant como desconocida.

### B04 · Choose a Model for the Task

**Decisión.** ¿Cuál de dos configuraciones resuelve el encargo con el menor coste de revisión?  
**Toma.** Guardar el mismo prompt, archivos y revisión para ambas ejecuciones. Comparar respuesta, test y cambios fuera de alcance antes del tiempo observado.  
**Transferencia.** Repetir con un fallo de redondeo. Rechazar una respuesta veloz si altera una interfaz exigida por el ticket.  
**Para liberar.** B03. Se necesitan acceso confirmado a las configuraciones y salidas reproducibles o dos resultados didácticos rotulados.

### B05 · What Is an AI Agent?

**Decisión.** ¿En qué momento debe detenerse un agente y pedir al usuario una decisión?  
**Toma.** Seguir una petición por lectura, propuesta de edición y orden de prueba. Registrar las herramientas efectivamente disponibles y el resultado observado en el runner.  
**Transferencia.** Después de un cambio de documentación, aparece una petición de una dependencia ajena. Elegir el próximo paso y respaldarlo con el alcance original.  
**Para liberar.** B01. Preparar una rama aislada y revisar qué operaciones ofrece esa sesión.

### B06 · Prompt Engineering for Coding Tasks

**Decisión.** ¿Qué detalle de un prompt convierte una respuesta convincente en un resultado que se puede verificar?  
**Toma.** Mostrar dos solicitudes sobre el mismo archivo. Añadir objetivo, alcance, salida y criterio de aceptación de uno en uno. Contrastar el resultado con el mismo test.  
**Transferencia.** Reescribir un encargo ambiguo para decidir si un cupón sigue siendo válido el día de vencimiento, aplicando la política entregada.  
**Para liberar.** B01 y B05. Congelar la política y una prueba que discrimine entre los dos comportamientos.

## Tanda 2 · Aplicación, revisión y decisión inicial

### B07 · Give Copilot the Right Context

**Decisión.** ¿Qué adjunto permite resolver la discrepancia y cuál distrae?  
**Toma.** Comparar un chat limpio con dos selecciones de contexto. Abrir el símbolo y el test citados, retirar una nota irrelevante y conservar la ruta y revisión.  
**Transferencia.** Explicar un fallo de importación con un árbol de módulos nuevo. Elegir los dos adjuntos que reproducen la causa.  
**Para liberar.** B01 y B06. Dos conversaciones independientes sobre la misma revisión.

### B08 · Verify and Undo an AI Edit

**Decisión.** ¿Qué fragmento de una edición se puede revertir conservando el trabajo previo de otra persona?  
**Toma.** Capturar el estado inicial y un diff con dos fragmentos independientes. Revertir únicamente el ajeno al ticket en una rama de práctica. Comparar el diff y repetir la prueba.  
**Transferencia.** Recuperar un comentario del usuario que ya existía junto a una edición de estilo innecesaria. Entregar el diff que demuestra su conservación.  
**Para liberar.** B05 y B07. Fixture con cambios previos conocidos y recuperación ensayada.

### M01 · From Issue to Reviewed PR

**Decisión.** ¿Se puede rastrear cada criterio del issue hasta una prueba y una decisión de revisión?  
**Toma.** Conservar issue, plan, dos ejecuciones, parche y SHA de cabeza. En el PR de práctica, un compañero abre el diff y los checks con gh y registra su revisión humana.  
**Transferencia.** Dar un segundo ticket cuya implementación cambia dos archivos. Asociar ambos con aceptación, prueba y comentario verificable.  
**Para liberar.** B08 y piloto M02. PR didáctico y segunda identidad humana autorizada para una revisión real.

### M03 · Review a Pull Request with GitHub CLI

**Decisión.** ¿La evidencia permite aprobar la cabeza actual del PR?  
**Toma.** Capturar gh pr view, gh pr diff y gh pr checks con el SHA antes y después de una actualización. Mostrar el juicio de la persona revisora sobre la revisión nueva.  
**Transferencia.** Entregar checks verdes de una cabeza anterior. Pedir cuál evidencia volver a consultar antes de emitir una revisión.  
**Para liberar.** M01. PR de práctica con check requerido y una actualización trazable.

### L01 · Choose a Model and Tool for a Business Task

**Decisión.** ¿Cuál de dos opciones cumple el criterio exigido aunque demande más intervención?  
**Toma.** Abrir el conjunto acordado de ocho casos, las salidas por caso, la mediana de intervención y el criterio que descalifica o admite a cada opción.  
**Transferencia.** Elegir en un conjunto nuevo donde ambas opciones pasan el requisito y la más costosa ofrece poco beneficio adicional. Justificar la elección con el coste de seguimiento.  
**Para liberar.** B03 y B04. Rúbrica, corpus sintético y resultados fechados de cada configuración.

### L02 · Decide What an Agent Can Do

**Decisión.** ¿Qué permiso necesita la tarea y quién puede autorizar el siguiente paso?  
**Toma.** Recorrer una solicitud de dependencia frente al comando aprobado. Vincular operación, datos, persona responsable y alcance autorizado en una matriz del ejercicio.  
**Transferencia.** Un agente pide permiso de publicación cuando solo se ha autorizado preparar un borrador. Señalar quién puede actuar y qué evidencia falta.  
**Para liberar.** B05 y L01. Matriz de roles de entrenamiento y límites confirmados del entorno.

## Tanda 3 · Instrucciones, herramientas y diseño de pilotos

### M04 · Reusable Prompts and Repository Instructions

**Decisión.** ¿Una preferencia se mantiene como instrucción del repositorio o pertenece solo a la solicitud?  
**Toma.** Editar un prompt reutilizable y .github/copilot-instructions.md en la rama de práctica. Abrir una conversación limpia y contrastar el contexto cargado con el comportamiento observado.  
**Transferencia.** Clasificar una convención estable de nombres y una excepción de migración para un único ticket. Probarlas con una tarea ajena.  
**Para liberar.** B06 y B07. Comprobar el mecanismo de carga en la versión del cliente utilizada.

### M05 · What Is a Skill? Build Your First One

**Decisión.** ¿Una skill puede producir un resumen honesto cuando le falta la salida del test?  
**Toma.** Versionar SKILL.md, ejecutar un caso completo, uno incompleto y una petición ajena. Conservar evidencia de activación y del hueco declarado.  
**Transferencia.** Entregar dos informes con el mismo nombre de archivo y revisiones distintas. Pedir a la skill que identifique cuál respalda el resultado.  
**Para liberar.** M04. Directorio de skills confirmado para ese agente y muestras con origen verificable.

### M06 · Build a Workflow with Review Checkpoints

**Decisión.** ¿Qué punto del flujo detiene una entrega aunque los pasos previos hayan terminado?  
**Toma.** Reproducir un flujo con checkpoint humano de alcance, prueba roja, verde, diff y revisión. Dejar un check requerido pendiente para observar exactamente dónde se detiene.  
**Transferencia.** Introducir una actualización de cabeza después del visto bueno inicial. Identificar qué evidencia se invalida y quién reanuda el flujo.  
**Para liberar.** M01, M02 y M03. Dos estados de checks del mismo PR de práctica.

### A01 · Start an Agent Session in GCP

**Decisión.** ¿En qué máquina, rama y revisión actuaría esta sesión de agente?  
**Toma.** En GCP registrar pwd, estado de Git, SHA y versiones de Claude Code y OpenCode. Contrastar dos rutas devueltas por una petición de solo lectura con el checkout.  
**Transferencia.** Una copia idéntica está en otra rama. Detectarla y preparar la orden de inspección para la revisión solicitada.  
**Para liberar.** B05. Acceso aprobado al GCP Workspace y a los clientes que se vayan a mostrar.

### A02 · Version Instructions and Skills Across Tools

**Decisión.** ¿Qué definición de una skill o instrucción cargó cada cliente?  
**Toma.** Versionar una skill didáctica bajo las rutas documentadas para Claude Code y OpenCode. En sesiones limpias contrastar contenido en disco, descubrimiento, coincidencia y petición ajena.  
**Transferencia.** Introducir dos definiciones de igual nombre con instrucciones de formato diferentes. Verificar cuál rige y documentar el alcance.  
**Para liberar.** A01 y M05. Versiones y mecanismos de descubrimiento confirmados en ambos clientes GCP.

### L03 · Design a Pilot Around a Real Bottleneck

**Decisión.** ¿Qué dos eventos delimitan el cuello de botella que se quiere mejorar?  
**Toma.** Abrir una cronología de PR con calendario laboral. Separar un acuse de recibo del primer comentario sustantivo y fijar antes de medir las definiciones, umbrales y responsable.  
**Transferencia.** Con un festivo en otro calendario, recalcular la espera y explicar por qué un check automático no cierra el intervalo.  
**Para liberar.** L01 y L02. Datos sintéticos con zona horaria, días laborables y eventos rastreables.

## Tanda 4 · Arquitectura, evaluación y cierre de gestión

### A03 · Run a Multi-File Change in Stages

**Decisión.** ¿Conviene aprobar el segundo archivo propuesto en este paso?  
**Toma.** Capturar una rama con regla compartida, llamador CLI y llamador API. Entre etapas, registrar tests y diffs. Mostrar dónde se aparta un cambio de despliegue del alcance acordado.  
**Transferencia.** Dos llamadores comparten formato de fecha. Dividir la migración y decidir dónde comprobar la compatibilidad del segundo cliente.  
**Para liberar.** A01, A02 y M06. Fixture de múltiples archivos con contratos observables antes de editar.

### A04 · What Is MCP? Connect One Scoped Tool

**Decisión.** ¿Qué dato recibirá el servidor y qué operación describe la llamada MCP propuesta?  
**Toma.** Usar un servidor MCP de práctica de solo lectura. Mostrar el esquema, el argumento de issue, la respuesta sintética y el contraste con el fixture de ese mismo identificador.  
**Transferencia.** Recibir un segundo issue con un criterio ausente. Comprobar el argumento y explicar qué puede responderse con la herramienta concedida.  
**Para liberar.** A01 y L02. Conector permitido y fixture de entrenamiento o replay identificado de la llamada.

### A05 · Design a Workflow with Deterministic Checks

**Decisión.** ¿Qué fallo de un control determinista impide que el flujo continúe?  
**Toma.** Guardar comando, código de salida y salida de prueba en una revisión fijada. Reproducir la parada por fallo, el paso tras la corrección y la revisión humana en gh.  
**Transferencia.** Entregar una ejecución que devuelve éxito descubriendo cero tests. Especificar el control de descubrimiento que faltaría antes de continuar.  
**Para liberar.** A03 y M06. Workflow versionado y salida de CI o replay de CI trazable.

### A06 · RAG and Embeddings for Repository Knowledge

**Decisión.** ¿El pasaje recuperado y su revisión respaldan realmente la respuesta generada?  
**Toma.** Versionar pregunta, dos documentos, cálculo de ranking y citas. Abrir el fragmento ganador. Cambiar la revisión y reproducir el comportamiento si la evidencia deja de estar disponible.  
**Transferencia.** Una consulta de devoluciones recupera una política vencida con mayor similitud. Decidir si se cita, se busca otra fuente o se declara el vacío.  
**Para liberar.** B02 y A01. Corpus sintético fechado, métrica y versiones de recuperación registradas.

### A07 · Evaluate Models and Agents on the Same Task

**Decisión.** ¿Qué configuración elegir después de aplicar primero las condiciones obligatorias?  
**Toma.** Ejecutar el mismo caso en checkouts limpios con restricciones equivalentes. Conservar pruebas, cambios extra, redirecciones y minutos de revisión. Comparar alcance y después esfuerzo.  
**Transferencia.** Una configuración gana en la primera tarea y pierde en una segunda. Delimitar la recomendación y diseñar la próxima comparación.  
**Para liberar.** B04 y A05. Configuración de cada cliente, tarea común, rúbrica definida y registro de intervención.

### L05 · Decide Whether to Expand, Adjust, or Pause

**Decisión.** ¿Qué evidencia cambia la decisión de ampliar a ajustar o pausar?  
**Toma.** Abrir los umbrales acordados, scorecard, ejemplos de retrabajo y registro de incidentes. Escribir el siguiente paso, responsable y condición de reevaluación.  
**Transferencia.** Intercalar tres casos nuevos con una mejora de espera, una desviación corregible y un incidente grave. Justificar cada rama con la señal que la activa.  
**Para liberar.** L03 y piloto L04. Definiciones, registro de decisión y tres expedientes sintéticos completos.

## Entrega por tanda

El productor puede reconstruir una lección a partir de su etiqueta de Git, abrir las fuentes indicadas en cada toma y verificar el resultado del ejercicio con su solución privada. El catálogo de cada ruta enlaza el MP4, los subtítulos y la misma versión de las fuentes. Mantener los resultados de participantes y las decisiones de publicación en el expediente de evaluación correspondiente.


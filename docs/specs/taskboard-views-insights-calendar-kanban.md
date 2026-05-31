# Taskboard Views Spec: Insights, Calendar, Kanban

## Objetivo

Definir las vistas principales disponibles dentro de un taskboard:

- Main Table
- Insights
- Calendar
- Kanban

La intencion es que cada vista tenga un proposito claro y complemente a las demas sin convertir el board en una herramienta pesada de configuracion.

## Principios

- Main Table es la vista principal para edicion densa.
- Insights responde como va el board y donde hay riesgo.
- Calendar organiza el trabajo por fechas.
- Kanban muestra el flujo visual por agrupaciones.
- Las vistas deben reutilizar los datos actuales del board.
- La personalizacion debe ser ligera y predecible.

## Plan por Etapas

### Etapa 1: Workflow Meaning e Insights

Estado: implementada.

Incluye:

- `workflowMeaning` opcional en opciones de columnas `status`, `singleSelect` y `multiSelect`.
- Persistencia backend/API para `workflowMeaning`.
- Renombrar `Charts` a `Insights`.
- Metricas fijas iniciales basadas en workflow: total, open, completed, new, in progress, overdue, due soon y unclassified.
- Indicador visual corto en el picker de opciones: `New`, `Progress`, `Done`.
- Migracion para permitir status/priority custom en tareas.

### Etapa 2: Calendar Filters

Estado: implementada.

Objetivo:

Agregar filtros simples y reutilizables a Calendar para que el usuario pueda reducir ruido sin configurar una vista personalizada.

Incluye:

- Barra compacta de filtros en Calendar.
- Filtro por task group.
- Filtro por assignee.
- Filtro por priority.
- Filtro por workflow state: new, in progress, done, unclassified.
- Filtros por opciones/tags de columnas compatibles.
- Empty state cuando no haya tareas visibles con los filtros activos.
- Base utilitaria reutilizable para que Kanban pueda usar los mismos criterios despues.
- Persistencia de filtros por board durante la sesion hasta que el usuario use `Clear`.

### Etapa 2.1: Calendar Display Modes

Estado: implementada.

Objetivo:

Agregar modos de visualizacion diarios, semanales y mensuales al Calendar, manteniendo los filtros existentes.

Incluye:

- Control de modo junto al boton `Today`: `Daily`, `Weekly`, `Monthly`.
- `Monthly`: muestra el calendario completo del mes.
- `Weekly`: muestra solo la semana que contiene la fecha activa.
- `Daily`: muestra solo el dia activo.
- Las flechas de navegacion cambian segun el modo activo.
- `Today` regresa al dia/semana/mes actual segun el modo activo.
- Al cambiar de modo, la fecha activa se conserva como ancla.
- Persistencia del modo activo en session storage por board.
- Selector nativo de fecha para saltar directamente a un dia especifico.

### Etapa 3: Kanban by Task Group

Estado: implementada.

Incluye:

- Nueva tab `Kanban`.
- Columnas basadas en task groups.
- Cards con task name, assignees, due date, priority, status/workflow, progress y updates.
- Movimiento de cards entre task groups usando el movimiento existente del board.
- Reuso de filtros basicos de Calendar mediante una barra compartida.
- Persistencia de filtros de Kanban por board durante la sesion hasta que el usuario use `Clear`.
- Menu de click derecho para crear tasks desde Kanban y Calendar.
- Menu de click derecho sobre tasks en Kanban y Calendar con acciones rapidas.
- Eliminacion directa desde menus, sin `confirm` nativo del navegador para tasks o groups.
- Correccion de movimiento dentro del mismo grupo para evitar que una task desaparezca del estado local.
- Edicion rapida en Kanban para status, priority, due date, assignees y progress desde la card.
- Drag and drop en Calendar para mover tareas entre dias y actualizar `dueDate`.

Objetivo:

Agregar una vista visual de flujo donde cada task group funciona como una columna kanban. Esta vista debe estar enfocada en planear y mover trabajo rapidamente, no en reemplazar la tabla.

Alcance recomendado:

- Mostrar una columna por task group.
- Respetar el orden actual de los task groups.
- Mostrar tareas como cards compactas.
- Permitir click en card para abrir el panel de detalle.
- Permitir mover cards entre grupos.
- Reutilizar filtros existentes de Calendar si es posible.
- Mantener una primera version simple antes de agregar agrupaciones configurables.

Fuera de alcance para esta etapa:

- Agrupar Kanban por status, assignee o priority.
- Crear multiples vistas Kanban guardadas.
- WIP limits.
- Automatizaciones al mover cards.
- Edicion completa inline dentro de la card.

## Renombrar Charts a Insights

La vista actual `Charts` debe evolucionar a `Insights`.

Motivo:

`Charts` describe el formato visual, pero no el valor de producto. `Insights` comunica que la vista ayuda a entender estado, riesgo y foco operativo.

Recomendacion de tabs:

- `Main Table`
- `Insights`
- `Calendar`
- `Kanban`

## Insights

### Proposito

Mostrar un diagnostico fijo del board sin pedir al usuario que construya dashboards personalizados.

### Alcance

Insights debe ser una vista fija, no un dashboard editable. La pagina global de Metrics puede cubrir dashboards mas amplios o configurables. Dentro del taskboard, el objetivo es dar respuestas rapidas.

### Metricas Recomendadas

Resumen superior:

- Total tasks
- Open tasks
- Completed tasks
- In progress tasks
- Overdue tasks
- Due soon tasks
- Unclassified tasks

Secciones analiticas:

- Workflow breakdown: new, in progress, done, unclassified.
- Progress by task group: avance o carga por grupo.
- Overdue by task group: grupos con mas riesgo.
- High priority open tasks: tareas criticas no completadas.
- Workload by assignee: distribucion de tareas abiertas.
- Tasks by priority: distribucion de prioridad.
- Stale tasks: tareas sin actualizaciones recientes.

### Dependencia de Workflow Meaning

Insights debe usar `workflowMeaning` para calcular estado operativo.

Reglas:

- `Completed` usa tareas resueltas como `done`.
- `Open` usa tareas resueltas como `new`, `in_progress` o `unclassified`.
- `In progress` usa tareas resueltas como `in_progress`.
- `New` usa tareas resueltas como `new`.
- `Unclassified` usa tareas sin significado de workflow.

Si el board no tiene ningun `workflowMeaning` configurado:

- Mostrar total tasks, due dates, priorities, task groups y assignees.
- Mostrar completed/open como no disponible o neutral.
- Mostrar una tarjeta de `Unclassified tasks` indicando que el board aun no ha mapeado su workflow.

### Filtros

Insights puede iniciar sin filtros complejos.

Filtros ligeros recomendados:

- Task group
- Assignee
- Priority
- Date range

No se recomienda personalizacion de cards en esta etapa.

### Interaccion

- Las metricas agregadas pueden permitir click para abrir lista filtrada o enfocar tareas relacionadas.
- Las tareas mostradas en listas de riesgo deben abrir el panel de detalle.
- Los graficos deben priorizar lectura rapida sobre densidad visual.

## Calendar

### Proposito

Mostrar tareas por fecha para revisar vencimientos y carga temporal.

### Base Actual

La vista actual mensual es una buena base. Debe mantenerse simple y enfocada en tareas con `dueDate`.

### Filtros Recomendados

Agregar una barra compacta de filtros:

- Task group
- Assignee
- Priority
- Workflow meaning: new, in progress, done, unclassified
- Status/options/tags de columnas compatibles

Las columnas compatibles para filtros de tags son:

- `status`
- `singleSelect`
- `multiSelect`

Los filtros de tags deben derivarse de opciones discretas, no de campos libres.

Nota: `priority` y `assignee` pueden usarse como filtros propios, pero no deben duplicarse dentro del filtro de tags. `priority` tampoco debe tener `workflowMeaning`.

### Implementacion de Etapa 2

La primera version de filtros de Calendar debe mantenerse local al frontend, usando el payload actual del taskboard. No requiere endpoints nuevos.

Controles recomendados:

- `Task group`: multi-select con los grupos del board.
- `Assignee`: multi-select con usuarios disponibles; debe incluir una opcion `Unassigned` si hay tareas sin asignados.
- `Priority`: multi-select con `boardConfig.priorityOptions`.
- `Workflow`: multi-select con `New`, `Progress`, `Done`, `Unclassified`.
- `Tags`: menu agrupado por columna compatible, mostrando opciones de `status`, `singleSelect` y `multiSelect`.

Comportamiento de filtros:

- Si un filtro no tiene seleccion, no restringe resultados.
- Entre categorias diferentes se usa AND.
- Dentro de una misma categoria multi-select se usa OR.
- Una tarea debe coincidir con todos los filtros activos para mostrarse.
- El contador de tareas visibles puede mostrarse en la barra para dar feedback rapido.
- Debe existir una accion clara para limpiar todos los filtros.

Matching por categoria:

- Task group: `task.groupId`.
- Assignee: `task.assigneeIds`; si esta vacio, usar `Unassigned`.
- Priority: `task.priority`.
- Workflow: estado resuelto por `resolveTaskWorkflow`.
- Tags: valores de columnas `status`, `singleSelect` y `multiSelect`.

Columnas no incluidas en filtros de tags en la etapa 2:

- `priority`, porque ya tiene filtro propio.
- `person` y `assignee`, porque assignee ya tiene filtro propio.
- Campos libres o numericos.

### Comportamiento

- Por defecto, mostrar todas las tareas con `dueDate`.
- Los filtros se combinan de forma acumulativa.
- Las tareas filtradas no aparecen en el calendario.
- El color de la tarea puede seguir usando el color del task group.
- Al hacer click en una tarea, se abre el panel de detalle.
- Click derecho sobre un dia permite crear una task para esa fecha.
- Como Calendar no implica un unico task group, el menu de creacion debe pedir seleccionar el grupo destino.
- La creacion desde Calendar debe persistir `dueDate` en backend, no solo en estado optimista.
- Calendar debe mantener los cuadros de dia visibles aunque no haya tareas en el rango, para que crear por fecha y drag/drop sigan funcionando.
- Arrastrar una task a otro dia actualiza su `dueDate`.
- Click derecho sobre una task en Calendar permite abrir detalle, renombrar, mover de grupo, limpiar fecha y borrar.
- Calendar no debe reemplazar el grid por un empty state cuando no hay tareas; el feedback de cero resultados debe vivir en el contador/barra, manteniendo los dias interactivos.

### Estados Utiles

- Tareas overdue pueden tener indicador visual sutil.
- Tareas done pueden mostrarse con menor intensidad si el filtro las incluye.
- Si no hay tareas para el mes/filtros, mantener el grid visible y mostrar feedback breve en el contador/barra de filtros.

### Modos de Visualizacion

Calendar debe soportar tres modos:

- `Daily`
- `Weekly`
- `Monthly`

El modo por defecto recomendado es `Monthly`.

Estado:

- Mantener una sola fecha activa, `currentDate`, como ancla del calendario.
- Mantener un modo activo, `calendarMode`, con valores `day`, `week`, `month`.
- Persistir `calendarMode` en session storage por board.
- Los filtros ya persistidos deben aplicarse igual en los tres modos.

Controles:

- Los botones de modo deben vivir en el mismo bloque visual que `Today`.
- `Today` debe seguir siendo una accion independiente.
- El modo seleccionado debe tener estado visual claro.
- Labels visibles recomendados: `Daily`, `Weekly`, `Monthly`.

Navegacion:

- En modo `Daily`, flecha izquierda/derecha mueve un dia.
- En modo `Weekly`, flecha izquierda/derecha mueve una semana.
- En modo `Monthly`, flecha izquierda/derecha mueve un mes.
- `Today` cambia `currentDate` a la fecha actual sin cambiar el modo activo.

Cambio de modo:

- Al pasar de `Weekly` a `Monthly`, se muestra el mes que contiene la fecha activa.
- Al pasar de `Monthly` a `Weekly`, se muestra la semana que contiene la fecha activa.
- Al pasar de `Weekly` a `Daily`, se muestra la fecha activa actual.
- Al pasar de `Daily` a `Weekly` o `Monthly`, se usa la fecha activa como ancla.

Layouts:

- `Monthly`: grid mensual actual de 7 columnas.
- `Weekly`: grid de 7 columnas, una por dia de la semana activa.
- `Daily`: lista o columna unica con las tareas del dia activo.

Empty states:

- Si no hay tareas visibles en el rango actual, el grid/lista del modo activo permanece visible.
- La barra de filtros/contador muestra `0 scheduled`.
- Los dias siguen aceptando click derecho para crear y drag/drop para actualizar due date.

## Kanban

### Proposito

Mostrar el trabajo como tarjetas organizadas en columnas para revisar flujo y mover tareas visualmente.

### Primera Version Recomendada

Crear Kanban agrupado por task groups.

Razon:

El modelo actual ya tiene `TaskGroup` como agrupacion principal y mover una tarea entre columnas puede mapearse claramente a cambiar `groupId`.

Columnas:

- Una columna por task group.
- Ordenadas por `TaskGroup.order`.
- Color o acento visual basado en `TaskGroup.color`.

Tarjetas:

- Task name
- Assignees
- Due date
- Priority
- Workflow/status tag principal si existe
- Progress si aporta valor
- Updates count como senal compacta de actividad
- Click derecho en una columna permite crear una task dentro de ese task group.
- Click derecho sobre una card permite abrir detalle, renombrar, mover de grupo y borrar.
- Status, priority, due date, assignees y progress pueden editarse directamente desde la card.
- Progress se edita con opciones rapidas de 25 en 25: `0%`, `25%`, `50%`, `75%`, `100%`.
- Clicks sobre campos editables no deben abrir el panel de detalle ni iniciar drag.

Detalle recomendado de card:

- Titulo de la tarea.
- Avatares o iniciales de assignees.
- Due date con indicador si esta vencida.
- Priority como chip compacto.
- Workflow/status visible como chip si existe.
- Progress como barra pequena solo si el valor es mayor a 0 o si aporta lectura.

### Drag and Drop

Mover una tarjeta entre columnas cambia el `groupId` de la tarea.

Reglas:

- Debe respetar permisos existentes de edicion.
- Debe actualizar el orden visual de tareas dentro del grupo si el modelo lo soporta.
- Si el orden por grupo todavia no se persiste, puede mantenerse orden actual como primera version.
- Mover dentro del mismo grupo debe reinsertar la task en la nueva posicion sin sacarla del grupo.

Primera implementacion aceptable:

- Drag and drop entre columnas actualiza `groupId`.
- Drag and drop sobre otra card usa la posicion de esa card como referencia.
- El movimiento usa `moveTask` con `position` para mantener la misma ruta de persistencia de Main Table.
- Empty columns muestran un drop target claro.

### Filtros

Kanban debe compartir filtros basicos con Calendar cuando sea posible:

- Task group
- Assignee
- Priority
- Workflow meaning
- Tags/opciones de columnas compatibles

En Kanban, si se filtra por task group, simplemente se muestran las columnas seleccionadas.

Persistencia:

- Los filtros de Kanban se guardan en session storage por board.
- Los filtros se mantienen al salir y volver a la vista durante la sesion.
- `Clear` elimina los filtros activos y limpia la persistencia de esa vista.

### Agrupaciones Futuras

Despues de la primera version, se puede evaluar un control simple `Group by`.

Opciones posibles:

- Task group
- Workflow
- Status column
- Assignee
- Priority

No se recomienda iniciar con esto si aumenta demasiado la implementacion. La primera version debe ser `Kanban by Task Group`.

## Navegacion y Estado

Las vistas deben convivir en tabs dentro del taskboard.

Estado recomendado:

- `activeView` debe soportar `table`, `insights`, `calendar`, `kanban`.
- La vista `chart` actual debe migrar o mapearse a `insights`.
- Si existen boards guardados con vista `chart`, deben seguir abriendo correctamente como `insights`.

## API y Datos

Las vistas deben trabajar principalmente con el payload actual del taskboard:

- board config
- groups
- tasks
- users
- column definitions
- select options

Los cambios necesarios de API estan ligados principalmente al nuevo `workflowMeaning` en opciones de columnas.

## Criterios de Aceptacion

### Insights

- La vista se muestra como `Insights`, no como `Charts`.
- Las metricas principales son fijas.
- Open/completed/in progress/new usan `workflowMeaning`.
- Boards sin workflow mapeado muestran tareas no clasificadas sin romper la vista.
- Las tareas de listas o tarjetas accionables abren el panel de detalle.

### Calendar

- El calendario permite filtrar por task group.
- El calendario permite filtrar por assignee, priority y workflow meaning.
- El calendario permite filtrar por opciones/tags de columnas compatibles.
- Los filtros no requieren configurar una vista personalizada.
- Las tareas filtradas abren el panel de detalle.
- Existe una accion para limpiar todos los filtros activos.
- Calendar muestra feedback cuando no hay tareas visibles por filtros.
- Calendar permite cambiar entre vistas Daily, Weekly y Monthly.
- Las flechas y el boton Today respetan el modo activo.
- El modo activo se mantiene al salir y volver a Calendar durante la sesion.

### Kanban

- Existe una tab `Kanban`.
- Las columnas iniciales son los task groups.
- Las tarjetas muestran informacion suficiente para priorizar trabajo.
- Mover una tarjeta entre columnas actualiza su task group.
- La vista puede filtrarse por los mismos criterios basicos que Calendar.

## Fuera de Alcance Inicial

- Dashboard de Insights totalmente personalizable.
- Multiples vistas guardadas por usuario.
- Kanban configurable con cualquier columna desde la primera version.
- Automatizaciones basadas en cambios de workflow.
- Reglas avanzadas para bloquear combinaciones contradictorias de tags.

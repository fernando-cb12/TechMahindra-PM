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

Estado: implementada como base inicial.

Incluye:

- `workflowMeaning` opcional en opciones de columnas `status`, `singleSelect` y `multiSelect`.
- Persistencia backend/API para `workflowMeaning`.
- Renombrar `Charts` a `Insights`.
- Metricas fijas iniciales basadas en workflow: total, open, completed, new, in progress, overdue, due soon y unclassified.
- Indicador visual corto en el picker de opciones: `New`, `Progress`, `Done`.
- Migracion para permitir status/priority custom en tareas.

### Etapa 2: Calendar Filters

Estado: siguiente etapa de implementacion.

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

### Etapa 3: Kanban by Task Group

Estado: posterior a Calendar filters.

Incluye:

- Nueva tab `Kanban`.
- Columnas basadas en task groups.
- Cards con task name, assignees, due date, priority y workflow/status tag principal.
- Movimiento de cards entre task groups.
- Reuso de filtros basicos de Calendar cuando esten disponibles.

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

### Estados Utiles

- Tareas overdue pueden tener indicador visual sutil.
- Tareas done pueden mostrarse con menor intensidad si el filtro las incluye.
- Si no hay tareas para el mes/filtros, mostrar empty state breve.

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

### Drag and Drop

Mover una tarjeta entre columnas cambia el `groupId` de la tarea.

Reglas:

- Debe respetar permisos existentes de edicion.
- Debe actualizar el orden visual de tareas dentro del grupo si el modelo lo soporta.
- Si el orden por grupo todavia no se persiste, puede mantenerse orden actual como primera version.

### Filtros

Kanban debe compartir filtros basicos con Calendar cuando sea posible:

- Task group
- Assignee
- Priority
- Workflow meaning
- Tags/opciones de columnas compatibles

En Kanban, si se filtra por task group, simplemente se muestran las columnas seleccionadas.

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

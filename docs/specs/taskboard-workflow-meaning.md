# Taskboard Workflow Meaning Spec

## Objetivo

Agregar significado operativo opcional a las opciones de columnas tipo select dentro de los taskboards, sin imponer un flujo de trabajo fijo. Esto permite mantener la personalizacion actual de los boards y, al mismo tiempo, habilitar insights consistentes como tareas nuevas, en progreso, completadas y no clasificadas.

## Problema

Hoy los taskboards permiten crear columnas y opciones personalizadas. Esto es flexible, pero dificulta calcular metricas fijas porque no existe una definicion confiable de que significa "new", "in progress" o "done" para cada board.

Ejemplos:

- Un board puede usar `To Do`, `Doing`, `Done`.
- Otro puede usar `Backlog`, `QA`, `Ready for Launch`.
- Otro puede tener varias columnas select con tags que representan diferentes dimensiones del trabajo.

No se debe depender del texto del tag para inferir estado, porque los nombres pueden cambiar, estar en diferentes idiomas o tener significados especificos del equipo.

## Solucion Propuesta

Cada opcion/tag configurable de columnas compatibles puede tener un campo opcional llamado `workflowMeaning`.

Valores permitidos:

- `none`
- `new`
- `in_progress`
- `done`

El valor por defecto es `none`.

Esto permite que el usuario decida que opciones del board deben participar en el flujo operativo. Un tag puede seguir siendo puramente informativo si deja `workflowMeaning` en `none`.

## Columnas Compatibles

La opcion debe estar disponible para columnas que trabajen con opciones/tags de tareas:

- `status`
- `singleSelect`
- `multiSelect`

Tambien puede considerarse para cualquier tipo futuro que represente opciones discretas reutilizables en tareas.

No aplica a columnas libres como:

- `text`
- `shortText`
- `longText`
- `number`
- `currency`
- `percentage`
- `date`
- `timeline`
- `priority`
- `url`
- `email`
- `phone`
- `file`
- `files`
- `checkbox`
- `formula`

## Modelo Conceptual

Cada opcion de columna mantiene sus campos actuales y agrega el nuevo campo opcional.

```ts
type WorkflowMeaning = 'none' | 'new' | 'in_progress' | 'done';

interface SelectOption {
  id: string;
  label: string;
  color: string;
  workflowMeaning?: WorkflowMeaning;
}
```

Reglas:

- Si `workflowMeaning` falta, se interpreta como `none`.
- La propiedad pertenece a la opcion/tag, no a la tarea.
- Una misma columna puede tener multiples opciones con el mismo `workflowMeaning`.
- No es obligatorio que un board tenga opciones asignadas a los tres estados.
- No se bloquea que varias columnas tengan opciones con `workflowMeaning`.

## UX de Configuracion

En el menu donde se crea o edita una opcion/tag, junto al nombre y color, se agrega una seccion compacta para asignar significado de workflow.

Controles:

- Boton `New`
- Boton `In progress`
- Boton `Done`

Comportamiento:

- Por defecto, ninguno esta seleccionado.
- Al seleccionar uno, se marca con el rojo de marca usado por la app.
- Solo puede estar activo un significado por opcion.
- Si el usuario vuelve a seleccionar el significado activo, se deselecciona y vuelve a `none`.
- Cambiar nombre o color no cambia el `workflowMeaning`.
- El control debe ser opcional y no bloquear el guardado.

Principio de interfaz:

El usuario no esta obligado a modelar su workflow. La app solo ofrece una forma ligera de decir "este tag cuenta como parte del flujo".

## UX de Visualizacion

Las opciones con `workflowMeaning` deben mostrar una senal visible en el picker normal de opciones, no solo dentro del modo de edicion.

Labels recomendados:

- `new` se muestra como `New`.
- `in_progress` se muestra como `Progress`.
- `done` se muestra como `Done`.

Reglas:

- El indicador debe ser pequeno y secundario.
- No debe mostrarse en la celda de la tabla por defecto para evitar ruido visual.
- Debe aparecer junto a la opcion cuando el usuario esta seleccionando un tag/status.
- Las opciones con `none` no muestran indicador.

## Resolucion de Estado por Tarea

Una tarea puede tener varios valores con `workflowMeaning`, especialmente si se usan columnas `multiSelect` o varias columnas compatibles. Para que Insights sea estable, se define una prioridad de resolucion.

Prioridad:

1. `done`
2. `in_progress`
3. `new`
4. `none`

Reglas:

- Si una tarea tiene cualquier opcion con `done`, la tarea cuenta como `done`.
- Si no tiene `done`, pero tiene alguna opcion con `in_progress`, cuenta como `in_progress`.
- Si no tiene `done` ni `in_progress`, pero tiene alguna opcion con `new`, cuenta como `new`.
- Si no tiene ninguna opcion con significado, cuenta como `unclassified`.

Esta prioridad evita que una tarea con tags contradictorios rompa los calculos. Por ejemplo, una tarea con `in_progress` y `done` cuenta como `done`.

## Uso en Insights

Los calculos de Insights deben usar el estado resuelto de la tarea, no nombres de opciones.

Definiciones:

- `Completed`: tareas resueltas como `done`.
- `Open`: tareas resueltas como `new`, `in_progress` o `unclassified`.
- `In progress`: tareas resueltas como `in_progress`.
- `New`: tareas resueltas como `new`.
- `Unclassified`: tareas sin ningun significado de workflow.

El dashboard de Insights puede mostrar tareas no clasificadas para ayudar a los usuarios a completar la configuracion si desean metricas mas precisas.

## Persistencia

El backend debe persistir `workflowMeaning` como parte de la definicion de opcion de columna.

Consideraciones:

- Debe existir migracion para agregar el campo sin romper datos existentes.
- Las opciones existentes deben comportarse como `none`.
- Las respuestas de API deben incluir el campo para que frontend pueda calcular vistas e interfaces.
- Las solicitudes de creacion/actualizacion de columnas deben aceptar el campo.

## Compatibilidad

Este cambio debe ser backward compatible.

- Boards existentes siguen funcionando.
- Opciones existentes no cambian visualmente hasta que el usuario asigne significado.
- Insights debe manejar boards sin ningun `workflowMeaning`.
- Calendar y Kanban no dependen obligatoriamente de este campo para renderizar.

## Casos Borde

- Si una tarea tiene `done` y `in_progress`, cuenta como `done`.
- Si una opcion con `workflowMeaning` se elimina, las tareas dejan de aportar ese significado.
- Si una columna compatible se oculta, sus opciones siguen existiendo; se debe decidir por producto si siguen contando para Insights. Recomendacion: si el valor existe en la tarea, sigue contando aunque la columna este oculta.
- Si un board no tiene ningun significado configurado, Insights muestra metricas neutrales y una tarjeta de tareas no clasificadas.

## Criterios de Aceptacion

- El usuario puede asignar `new`, `in_progress`, `done` o ningun significado a opciones de columnas compatibles.
- El significado se guarda y se recupera desde backend.
- Las opciones existentes se interpretan como `none`.
- Una tarea puede resolverse a `new`, `in_progress`, `done` o `unclassified`.
- La resolucion usa prioridad `done > in_progress > new > none`.
- La configuracion es opcional y no bloquea la personalizacion actual del board.

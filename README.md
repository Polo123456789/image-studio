# Image Studio

## Revisión de imágenes

En el estudio, los pulgares sobre cada imagen permiten marcarla como buena o mala. Pulsar de nuevo la misma evaluación la retira. La evaluación pertenece a esa versión: regenerar crea una imagen pendiente y conserva las evaluaciones anteriores.

Mientras haya imágenes generadas sin revisar, un botón flotante inferior muestra el contador y abre la revisión individual a pantalla completa. La cola incluye las versiones anteriores que sigan pendientes. No incluye formatos sin imagen ni conceptos descartados.

- **← / →:** mala / buena y pasar a la siguiente imagen.
- **Espacio:** dejar para después, sin evaluar.
- **Ctrl / ⌘ Z:** deshacer la última evaluación de esta sesión de edición.
- **R:** regenerar la versión actual sin calificarla.
- **Escape:** salir; las evaluaciones confirmadas ya están guardadas.

El botón Regenerar junto a los pulgares usa el prompt y formato de esa versión. La retira de la cola y permite seguir revisando mientras se genera otra. Si la nueva versión llega durante la revisión, va al final; si llega cuando la revisión ya terminó, queda pendiente para la próxima entrada. Si falla, la original vuelve a pendientes y aparece el error. La versión reemplazada sigue en el historial y conserva cualquier evaluación que ya tuviera.

La revisión permite salir y retomar los pendientes, y muestra un resumen al terminar o posponer todas las imágenes. No borra imágenes ni modifica generación, aprobación o exportación según la evaluación.

## Actualización de base de datos

Antes de ejecutar la nueva versión:

```sh
bun run db:migrate
```

La migración `0013_chilly_tomas` agrega `studio_variants.review_rating`, inicialmente nulo. La migración `0014_tired_diamondback` agrega `studio_variants.review_excluded` para conservar la exclusión de versiones reemplazadas sin marcarlas como buenas o malas. Los backups de los dos esquemas anteriores se actualizan en una copia temporal al restaurarlos; los nuevos incluyen las evaluaciones.

## Filtro de revisión

El selector de la revisión permite ver todas las pendientes, sólo las versiones seleccionadas actualmente en el estudio o la última tanda con imágenes recibida en esta sesión. Esta última opción se habilita al generar, regenerar o finalizar imágenes; no se infiere de fechas ni se reconstruye al recargar. Una generación fallida no sustituye la última tanda con imágenes.

Al revisar una tanda, sus imágenes pendientes se conservan y las nuevas llegadas se añaden al final. Cambiar de filtro reinicia el recorrido y los aplazamientos, conservando las evaluaciones. El contador flotante siempre indica todas las pendientes del proyecto.

## Bandeja de regeneraciones

La bandeja flotante está disponible tanto en la revisión como en el resto de la app. Muestra las regeneraciones iniciadas desde los pulgares o desde el botón habitual del estudio, con filtros por actividad en curso, resultados listos y errores.

Pulsar una fila en curso lleva al concepto, formato y versión original en el estudio. Pulsar un resultado listo abre exactamente la versión generada, aunque se haya seleccionado otra después. Desde otra sección de la app, la bandeja navega al proyecto correspondiente. Dentro de la revisión, estos enlaces salen al estudio conservando las evaluaciones.

Reintentar conserva el prompt, formato, tamaño, versión de referencia y modo de la solicitud original. Un reintento exitoso retira el error anterior. La actividad se conserva al navegar entre secciones durante esta sesión de la app; la lista no se reconstruye al recargar la página.

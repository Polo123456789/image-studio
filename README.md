# Image Studio

## Revisión de imágenes

En el estudio, los pulgares sobre cada imagen permiten marcarla como buena o mala. Pulsar de nuevo la misma evaluación la retira. La evaluación pertenece a esa versión: regenerar crea una imagen pendiente y conserva las evaluaciones anteriores.

Mientras haya imágenes generadas sin revisar, un botón flotante inferior muestra el contador y abre la revisión individual a pantalla completa. La cola incluye las versiones anteriores que sigan pendientes. No incluye formatos sin imagen ni conceptos descartados.

- **← / →:** mala / buena y pasar a la siguiente imagen.
- **Espacio:** dejar para después, sin evaluar.
- **Ctrl / ⌘ Z:** deshacer la última evaluación de esta sesión de edición.
- **Escape:** salir; las evaluaciones confirmadas ya están guardadas.

La revisión permite salir y retomar los pendientes, y muestra un resumen al terminar o posponer todas las imágenes. No borra imágenes ni modifica generación, aprobación o exportación según la evaluación.

## Actualización de base de datos

Antes de ejecutar la nueva versión:

```sh
bun run db:migrate
```

La migración `0013_chilly_tomas` agrega `studio_variants.review_rating`, inicialmente nulo. Los backups del esquema inmediatamente anterior se actualizan en una copia temporal al restaurarlos; los nuevos incluyen las evaluaciones.

# Revisiones independientes

Se realizaron dos rondas con agentes distintos de `gpt-6.1-sol`, razonamiento `high` y contexto inicial limpio. Ninguno heredó el historial de implementación. Los informes incluyeron revisión de código y comprobaciones en Chromium; no se llamó a Gemini ni se restauraron backups.

## Primera ronda

Rango auditado: `2caa671...cc33666`. Se confirmaron siete hallazgos:

| Hallazgo | Corrección |
|---|---|
| Bloqueo del scroll al cambiar de móvil a escritorio con el menú abierto | Cierre del menú al cruzar el breakpoint y liberación del bloqueo |
| Un prompt vacío pendiente impedía guardar otra sección | Validación del payload efectivo de la sección activa |
| Foco fuera del menú, fondo activo y Escape sin cerrar | Foco inicial y contenido, fondo inerte, Escape y restauración del foco |
| Acciones de restauración fuera de pantalla en horizontal | Cuerpo desplazable y cabecera/pie sin contracción |
| Selector de fotos inaccesible por teclado | Botón accesible para activar un input compartido |
| Diferencias de hidratación del prompt de ingeniería inversa | Inicialización consistente mediante server prefetch |
| Cierre del editor de prompt sin nombre accesible | Nombre del control y SVG excluido del árbol accesible |

Las correcciones están en `3b91a10` y `78e5f11`. Durante las comprobaciones también se eliminó un formulario anidado de Ajustes que causaba avisos de hidratación. El revisor confirmó build, typecheck y 65 tests, además de comparar la versión base y producción.

## Segunda ronda

Rango auditado: `2caa671...78e5f11`. Se confirmaron otros tres hallazgos:

| Hallazgo | Corrección en `f549cc8` |
|---|---|
| Configuración y tema inaccesibles en el menú a 740 × 360 px | Desplazamiento interno del menú |
| El fallo de análisis quedaba oculto al abrir Resultado durante la petición | Alerta visible en Resultado y acción para volver a Referencias |
| El resumen de revisión recortaba su encabezado a 360 × 640 px | Contenido sin contracción y márgenes automáticos que permiten recuperar el inicio mediante scroll |

El mismo revisor recomprobó independientemente `f549cc8` y confirmó que no quedan abiertos los tres hallazgos. Verificó el desplazamiento táctil y navegación del menú, el error de análisis con regreso a Referencias conservando la imagen, y el resumen con Retomar pendientes. No observó regresiones directas ni errores JavaScript en esos escenarios. Los diez hallazgos confirmados entre ambas rondas están corregidos.

## Validación final

- Build y typecheck correctos.
- 65 tests pasan con `bun test --timeout 30000`.
- 41 comprobaciones de rutas y diálogo en producción, sin errores de JavaScript o hidratación ni desbordamiento horizontal.
- Los tres escenarios de la segunda ronda pasan también en una compilación de producción de `f549cc8`.

La validación cubre Chromium emulado. Safari/iOS, teclado virtual y selector de fotos en dispositivo físico quedan pendientes de comprobación manual.

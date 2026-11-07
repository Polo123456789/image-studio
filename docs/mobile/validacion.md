# Validación móvil

La implementación mantiene la generación, las evaluaciones y las reglas de exportación. Adapta la presentación y añade borradores de brief locales. Las capturas son de una compilación de producción y usan datos de ejemplo en una copia temporal de SQLite.

## Comprobaciones

- `bun run build`
- `bun run typecheck`
- `bun test --timeout 30000`, con la CLI `sqlite3` disponible para los tests de migraciones. Los tests de backups pueden superar el límite predeterminado de cinco segundos en este entorno.
- Chromium con entrada táctil a 360, 390 y 430 px, y escritorio a 1280 px. Se revisaron las diez rutas principales, sin errores JavaScript o de hidratación ni desbordamiento horizontal.
- Diálogo de revisión a 360 × 640, 390 × 844, 430 × 740 y 1280 × 844. Los controles de evaluación quedan dentro del viewport.
- Evaluar una imagen guarda la decisión; deshacer restaura el contador y la evaluación. Tras aplazar toda la cola, el resumen conserva su encabezado accesible a 360 × 640 px.
- Guardar un borrador, recargar y recuperarlo conserva el brief.
- Guardar una sección de Ajustes no envía los cambios pendientes de otra sección ni los borra del formulario, incluso si otra sección tiene un prompt vacío sin guardar.
- Menú móvil: foco inicial, ciclo con Tab, Escape, devolución del foco, desbloqueo al redimensionar a escritorio y scroll para alcanzar Configuración y tema a 740 × 360 px.
- Abrir y cerrar el detalle de biblioteca restaura el scroll de fondo. El diálogo conserva el selector de versiones y el enlace al estudio.
- Fallo de regeneración simulado a 360 × 640 px: bandeja contenida en pantalla y Reintentar accesible, sin llamadas reales al proveedor.
- Acceso directo a ingeniería inversa sin el anterior error de contexto de Nuxt ni diferencias de hidratación del prompt. Al fallar un análisis mientras se muestra Resultado, el error queda visible y permite volver a Referencias.
- Restauración a 844 × 390 px: cuerpo desplazable, acciones visibles y confirmación accesible, sin ejecutar la restauración.
- Selector de fotos activado con Enter y control de cierre del editor con nombre accesible.
- Configuración sin formularios anidados ni avisos de hidratación.

No se realizaron llamadas reales de generación con Gemini, restauraciones destructivas ni pruebas en Safari o en un teléfono físico. El teclado virtual y los selectores de fotos nativos requieren comprobación en dispositivo. Las alturas dinámicas, áreas seguras y tamaño de campos están contemplados en los estilos y el viewport.

## Capturas

![Conceptos, una propuesta cada vez](conceptos.png)

![Revisión con imagen grande y controles debajo](revision.png)

![Detalle con versiones y descarga](detalle.png)

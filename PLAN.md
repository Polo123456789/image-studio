# Plan: externalizar imagenes de Studio

## Objetivo

Mover los originales generados fuera de SQLite sin perder datos, conservar cada JPEG o PNG en su formato real, generar thumbnails WebP y limitar las respuestas de Studio y Library.

## Implementacion

1. Añadir metadatos y URL de thumbnail a `studio_variants`, manteniendo `image_url` compatible durante la migracion.
2. Guardar originales inmutables en `public/uploads/generated/originals` con nombre SHA-256 y thumbnails WebP en `public/uploads/generated/thumbnails`.
3. Cambiar Gemini y la persistencia para validar y guardar archivos antes de insertar una variante; nunca persistir nuevos `data:`.
4. Añadir un migrador reanudable y un verificador que trabajen por lotes, actualicen cada fila solo despues de verificar los archivos y puedan ejecutarse sobre una copia mediante argumentos de ruta.
5. Paginar Library desde SQL, usar thumbnails en listados y cargar el historial al abrir el detalle.
6. Hacer que exportacion y backup incluyan los originales con su formato real y que los backups nuevos incluyan todo `public/uploads`.
7. Coordinar backup/restore con una ventana de mantenimiento que rechace solicitudes nuevas, espere las solicitudes activas y valide esquema, indices, foreign keys, assets, referencias, originales, thumbnails WebP y hashes antes de reemplazar datos.
8. Crear, descargar, subir y extraer backups en streaming. Los limites son configurables con `IMAGE_STUDIO_BACKUP_MAX_BYTES`, `IMAGE_STUDIO_BACKUP_MAX_ENTRIES` e `IMAGE_STUDIO_BACKUP_MAX_EXPANDED_BYTES`.
9. Mantener la raiz configurada de uploads durante un restore: copiar archivos entrantes sin borrar los vigentes, hacer `fsync` y cambiar SQLite con `rename` atomico. Esto conserva un bind mount/volumen y deja el estado anterior utilizable hasta el ultimo paso.

## Migracion y despliegue

1. Crear un snapshot SQLite y copia completa de uploads con hashes antes de tocar los datos.
2. Ensayar esquema, migracion, verificacion, compactacion y restore sobre una copia temporal del snapshot local.
3. Preparar el build antes de la ventana de mantenimiento de produccion.
4. Detener el servicio en todas las replicas, crear y verificar otro backup, comprobar espacio, aplicar migraciones y ejecutar el migrador. Los endpoints de backup/restore requieren que la app opere como una sola instancia; un despliegue con replicas debe drenar las demas externamente.
5. Compactar con `VACUUM INTO`, validar la DB nueva y reemplazarla atomicamente.
6. Arrancar, ejecutar smoke tests y conservar el backup para rollback conjunto de DB, uploads y release.

Comandos de datos dentro de la ventana, ejecutados desde el release desplegado:

```bash
bun run db:migrate
bun run db:migrate-images -- --batch=10
bun run db:verify-images
```

La compactacion debe hacerse hacia un archivo nuevo con `VACUUM INTO`, validarlo y solo entonces intercambiarlo por `local.db` mientras el servicio sigue detenido.

## Criterios de aceptacion

- Cero variantes migradas contienen `data:image` y cada ruta apunta a un original cuyo SHA coincide con los bytes previos.
- JPEG permanece JPEG y PNG permanece PNG; WebP se usa exclusivamente para thumbnails.
- Conteos, claves activas, integridad SQLite y foreign keys no cambian.
- Library pagina 40 elementos por defecto y obtiene versiones bajo demanda.
- Ninguna respuesta inicial contiene imagenes Base64 y los listados usan thumbnails.
- Exportaciones, backups v2 y restores conservan todos los archivos.
- Restore conserva el mount point de uploads y cambia la DB atomicamente; backups incompletos, corruptos o con esquema incompatible se rechazan antes del intercambio.
- Pruebas automatizadas y `bun run build` terminan correctamente.

# Image Studio

Aplicación interna para idear, generar, iterar y organizar imágenes publicitarias con IA.

## Setup

Este repo usa Bun como flujo principal:

```bash
bun install
```

## Comandos

```bash
bun run dev
bun run build
bun run preview
bun run db:generate
bun run db:migrate
```

## Base de datos

La app usa SQLite local en `server/db/local.db` con Drizzle ORM.

Modelo vigente:
- `app_settings`: configuración general y prompts base.
- `brands`: marcas.
- `style_guides`: guías de estilo globales o por marca.
- `assets`: assets reutilizables globales o por marca.
- `studio_projects`: proyectos/sesiones creativas.
- `studio_concepts`: conceptos generados dentro de un proyecto.
- `studio_concept_formats`: formatos y ratio por concepto.
- `studio_variants`: historial de previews, finales e iteraciones por formato.

Las tablas antiguas `projects`, `project_assets`, `images` e `image_versions` quedaron obsoletas y fueron retiradas del esquema en favor del modelo `studio_*`.

Para sincronizar el esquema local:

```bash
bun run db:generate
bun run db:migrate
```

## Desarrollo

Servidor local:

```bash
bun run dev
```

App disponible en `http://localhost:3000`.

## Build

```bash
bun run build
```

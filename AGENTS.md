# AGENTS.md

## Workflow

- Use Bun. Verified repo scripts: `bun install`, `bun run dev`, `bun run build`, `bun run preview`, `bun run db:generate`, `bun run db:migrate`, `bun run db:studio`.
- `bun run build` is the only full-project verification script currently configured.
- There is no `test` script, `lint` script, CI workflow, pre-commit config, or repo-local `opencode.json`.
- `.nuxt/` and `.output/` are generated artifacts; do not edit them directly.

## App Shape

- This is a single Nuxt 4 app, not a monorepo.
- UI lives in `app/`, Nitro handlers in `server/api/`, shared contracts in `shared/types/`.
- `/` immediately redirects to `/studio` (`app/pages/index.vue`). The main product surfaces wired into the default layout are `/studio`, `/library`, `/assets`, `/styles`, `/brands`, and `/settings`.
- Client-side studio state is centralized in `app/composables/useStudioSession.ts`.
- Route handlers are intentionally thin; most business logic lives in `server/utils/*`.

## Database And Files

- SQLite lives at `server/db/local.db`.
- Drizzle schema source is `server/db/schema.ts`; generated migrations go in `server/db/migrations/`.
- Open the database through `server/db/client.ts`.
- When changing the schema, keep `server/db/schema.ts` and `server/db/migrations/` in sync by running `bun run db:generate` then `bun run db:migrate`.
- Studio project briefs are stored as serialized JSON in `studio_projects.brief`; concepts, formats, and variants are normalized across `studio_concepts`, `studio_concept_formats`, and `studio_variants`.
- Uploaded asset files live in `public/uploads/assets`; the DB stores the public URL (`/uploads/assets/...`) in `assets.file_path`.

## Gemini And Settings

- Gemini configuration is read from the single `app_settings` row with `id = 1` in `server/utils/settings.ts`.
- Server code falls back to `process.env.GEMINI_API_KEY` only if the DB setting is empty.
- Missing Gemini credentials is an expected setup error path: studio generation and AI asset description rely on it.
- `server/api/studio/concepts.post.ts` updates the stored brief before generation, then persists results via `saveStudioConcepts()` in `server/utils/studio-projects.ts`.

## Frontend Styling

- Theme tokens live in `app/assets/css/main.css`; dark mode is default and light mode is enabled by adding `.light` to `<html>`.
- Tailwind maps those tokens in `tailwind.config.ts`; prefer token-backed classes like `bg-surface`, `text-text`, `border-border`, and `text-accent` over hardcoded colors.
- Fonts are loaded globally in `nuxt.config.ts` (`Fraunces`, `DM Sans`, `JetBrains Mono`).

## Product Copy

- Existing UI copy, prompts, and error messages are mostly Spanish. Keep new product-facing copy in Spanish unless the task clearly calls for another language.

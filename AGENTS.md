# AGENTS.md

This file gives coding agents the minimal repo-specific context needed to work safely and consistently in this repository.

## Repo Summary

- Project: `image-studio`
- Stack: Nuxt 4, Vue 3, TypeScript, Drizzle ORM, SQLite local
- Package manager: Bun-first, with npm-compatible scripts available
- Runtime style: web app + Nitro server routes + local SQLite database
- Current app state: early scaffold, one-page placeholder UI, initial Drizzle schema in `server/db/schema.ts`

## Rules Sources

- No `.cursor/rules/` directory was found.
- No `.cursorrules` file was found.
- No `.github/copilot-instructions.md` file was found.
- If any of those are added later, treat them as higher-priority repo instructions and follow them.

## Common Commands

Use Bun unless the user explicitly asks for npm.

```bash
bun install
bun run dev
bun run build
bun run preview
bun run db:generate
bun run db:migrate
bun run db:studio
```

### Package Install

- Install runtime and dev dependencies with `bun add` / `bun add -d`.
- Do not install packages unless the user asked for it or the task clearly requires it.
- Prefer the smallest dependency set that solves the problem.

### Build

- `bun run build`
- This is the main verification command for app and server compilation.

### Dev

- `bun run dev`
- Use this to validate Nuxt rendering, server routes, and local DB wiring.

### Database

- `bun run db:generate` generates Drizzle migrations from `server/db/schema.ts`.
- `bun run db:migrate` applies migrations to the local SQLite database.
- `bun run db:studio` opens Drizzle Studio.

### Tests

- There is no test runner configured yet in `package.json`.
- If tests are added, prefer Bun's test runner unless the repo later standardizes on something else.
- Single test file:
  - `bun test path/to/file.test.ts`
- Single test by name:
  - `bun test --filter "test name"`
- If a future task introduces tests, add the relevant script to `package.json` and document it here.

### Lint

- There is no lint script configured yet.
- If linting is added, prefer a single `bun run lint` script and keep the configuration minimal.

## Source Layout

- `app/` contains Nuxt app UI.
- `server/api/` contains Nitro API routes.
- `server/db/` contains the database client and schema.
- `public/` contains static files.
- Keep new files near the feature they support.

## TypeScript Style

- Use TypeScript for all non-trivial code.
- Prefer explicit types on exported functions, public helpers, and DB-facing code when inference is not obvious.
- Avoid `any` unless there is no realistic alternative.
- Use `unknown` for external inputs and narrow before use.
- Prefer small, focused types over large catch-all shapes.

## Formatting

- Use 2-space indentation.
- Use single quotes in TypeScript/JavaScript files.
- Omit semicolons, matching the current codebase style.
- Keep lines reasonably short and readable.
- Prefer clean, minimal diffs.

## Imports

- Group imports as external first, then local.
- Prefer named imports where possible.
- Remove unused imports immediately.
- Keep import paths explicit and stable.
- Do not introduce barrel files unless they clearly reduce duplication.

## Naming Conventions

- Use `camelCase` for variables, functions, and object properties in TypeScript.
- Use `PascalCase` for Vue components, types, and classes.
- Use `snake_case` for SQL table and column names.
- Keep Drizzle table names aligned with the schema naming already in use.
- Use descriptive names for DB columns such as `createdAt`, `updatedAt`, and `filePath` in TypeScript while mapping to snake_case in SQL.

## Nuxt Conventions

- Prefer Nuxt auto-imports when they are standard and keep code concise.
- Use `defineNuxtConfig` in `nuxt.config.ts`.
- Keep server logic in `server/api/` or `server/db/` rather than scattering it through UI code.
- Favor simple SFCs when the UI is still a scaffold.

## Vue Style

- Use the `<script setup>` format for non-trivial components.
- Keep templates simple and declarative.
- Extract reusable UI only when there is a clear second use.
- Avoid overengineering state before the product shape is stable.

## Drizzle and SQLite

- Keep the initial schema small and product-driven.
- Prefer explicit foreign keys and unique constraints when they reflect real product rules.
- Use snake_case table and column names in SQL schema definitions.
- Use timestamps consistently for creation and update tracking.
- Keep `server/db/client.ts` as the single place that opens the SQLite connection.
- Local DB file currently lives at `server/db/local.db`.

## Error Handling

- Throw clear errors when a required invariant is violated.
- In server routes, return structured errors rather than opaque failures when possible.
- Validate external input before touching the database or filesystem.
- Avoid swallowing errors silently.
- If an error is expected, make the failure mode explicit.

## Filesystem and Assets

- Treat local file storage as part of the product surface.
- Keep generated files and uploaded assets in predictable paths.
- Do not hardcode environment-specific absolute paths.
- Prefer paths derived from project or asset metadata.

## Change Discipline

- Make the smallest correct change.
- Do not refactor unrelated code while implementing a focused task.
- Do not revert user changes unless explicitly asked.
- If the worktree contains unexpected changes, leave them alone unless they block the current task.
- When updating schema, keep migrations and schema in sync.

## Verification Expectations

- For app changes, run `bun run build` when practical.
- For DB schema changes, run `bun run db:generate` and `bun run db:migrate` when the task requires it.
- For UI-only changes, a quick `bun run dev` sanity check is usually enough if build time is not necessary.
- If you cannot run a command, explain why and state the residual risk.

## Practical Defaults

- Prefer Bun over npm for new commands and local workflow.
- Prefer Nuxt-native solutions before adding extra packages.
- Prefer straightforward data models over premature abstraction.
- Prefer local SQLite and local file storage until the product shape justifies scaling changes.

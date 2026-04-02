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

## UI And Styling

- Build the UI with a custom design rather than a component library.
- Prefer Tailwind CSS for component and layout styling.
- Keep the initial design system minimal: core colors, spacing, radii, and shadows only.
- Support both light and dark mode from the first version. Dark is the default.
- Use small, reusable base components for common controls when they have a clear second use.

### Visual Direction

The aesthetic is `dark studio`: a dense, focused workspace that feels like a professional editing room.
Refined, tool-like, with enough character to feel intentional and creative.

**Theme**: Dark by default. Light mode is a secondary, lighter inversion of the same palette.

**Accent color**: Sage green. Muted, sophisticated, unusual. Not electric, not pastel — somewhere between
natural and architectural.

**Typography**:
- Display / headings: `Fraunces` (Google Fonts) — a variable optical-size serif with personality.
  Use for titles, section headers, and any large text that anchors the layout.
- Body / UI: `DM Sans` (Google Fonts) — clean, neutral, highly readable at small sizes.
  Use for labels, inputs, descriptions, and all interface copy.
- Monospace / prompts: `JetBrains Mono` (Google Fonts) — for prompt text, code, and generated content.

### Design Tokens

All tokens are CSS custom properties defined in the global stylesheet.
Tailwind should extend its theme to reference these variables where possible.

```css
/* Colors — dark mode (default) */
--color-bg:          #0f0f0e;   /* near-black warm */
--color-surface:     #181817;   /* card and panel backgrounds */
--color-surface-2:   #222220;   /* elevated surfaces, hover states */
--color-border:      #2e2e2b;   /* subtle separators */
--color-text:        #e8e6df;   /* primary text */
--color-text-muted:  #7a7870;   /* secondary text, placeholders */
--color-accent:      #7d9e7e;   /* sage green — primary accent */
--color-accent-dim:  #4a6b4b;   /* accent at lower intensity */
--color-accent-glow: #7d9e7e26; /* accent as translucent wash */
--color-danger:      #b96a5e;   /* errors and destructive actions */

/* Colors — light mode */
--color-bg:          #f5f4f0;
--color-surface:     #ffffff;
--color-surface-2:   #eeede9;
--color-border:      #dddbd5;
--color-text:        #1a1a18;
--color-text-muted:  #8a8880;
--color-accent:      #4f7350;
--color-accent-dim:  #c6d9c6;
--color-accent-glow: #4f735018;
--color-danger:      #a0453a;

/* Radii */
--radius-sm:   4px;
--radius-md:   8px;
--radius-lg:   14px;
--radius-xl:   20px;
--radius-full: 9999px;

/* Shadows */
--shadow-sm:  0 1px 3px rgba(0,0,0,0.4);
--shadow-md:  0 4px 12px rgba(0,0,0,0.5);
--shadow-lg:  0 12px 32px rgba(0,0,0,0.6);

/* Typography scale */
--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.375rem;  /* 22px */
--text-2xl:  1.75rem;   /* 28px */
--text-3xl:  2.25rem;   /* 36px */

/* Spacing (used as base for layout rhythm) */
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-6:  24px;
--space-8:  32px;
--space-12: 48px;
--space-16: 64px;
```

### Dark / Light Mode

- Dark mode is the default. Apply tokens inside `:root`.
- Light mode is activated by adding the class `light` to `<html>`.
- Never use `prefers-color-scheme` as the sole mechanism; always allow manual override.

### Component Conventions

- Base components live in `app/components/base/`.
- Prefix base components with `App`: `AppButton`, `AppInput`, `AppCard`, `AppModal`, etc.
- Use Tailwind classes for layout and spacing.
- Use CSS variables (via `var(--token)`) for any color, shadow, or radius that must
  respond to theme changes.
- Avoid hardcoded hex values inside component styles.

### What to Avoid

- Generic font families: Inter, Roboto, Arial, system-ui as display fonts.
- Purple gradients, blue glows, or any "AI product" clichés.
- Flat, colorless UIs with no atmospheric depth.
- Overuse of the accent: sage green is for emphasis, not decoration.

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

# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router (routes, layouts). Localized routes under `src/app/[locale]/...` and API handlers in `src/app/api`.
- `src/components/`: Reusable React components (PascalCase `.tsx`).
- `src/hooks/`: Custom hooks (camelCase, `useX` prefix).
- `src/lib/`, `src/utils/`, `src/services/`: Utilities, helpers, service clients; prefer kebab-case files.
- `src/stores/`: Zustand stores (e.g., `auth.store.ts`).
- `src/types/`: Shared TypeScript types.
- `messages/`: i18n message catalogs for `next-intl`.
- `public/`: Static assets. Root configs: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`.

## Build, Test, and Development Commands
- `npm install`: Install dependencies.
- `npm run dev`: Start local dev server (Next 15).
- `npm run build`: Production build.
- `npm start`: Run production build locally.
- `npm run lint`: Lint with Next/TypeScript rules.
Example: copy env and run dev — `cp .env.development .env && npm run dev`.

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Indentation: 2 spaces.
- Components: PascalCase files and exports (e.g., `CreateCommentModal.tsx`).
- Hooks: `useX.ts(x)` (e.g., `useNotifications.ts`).
- Utilities/services: kebab-case or lowerCamel (match existing), keep modules focused.
- Imports: use path alias `@/*` defined in `tsconfig.json`.
- Lint before pushing: `npm run lint` must pass.

## Testing Guidelines
- Currently no test runner configured. When adding tests, prefer Vitest + React Testing Library.
- Co-locate tests as `*.test.ts(x)` next to source; keep fast and deterministic.
- Include minimal fixtures and verify key rendering/logic paths.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits — `feat:`, `fix:`, `refactor:`, etc. (matches existing history).
- PRs: clear description, linked issues, steps to reproduce/verify, and screenshots/GIFs for UI.
- Requirements: pass lint, build locally, avoid unrelated changes, note i18n impacts (`messages/`, `[locale]` routes).

## Security & Configuration Tips
- Never commit secrets. Configure env via `.env` (see `.env.development`). Key var: `NEXT_PUBLIC_API_URL`.
- Images are remote-enabled via `next.config.ts`; prefer `public/` for local assets.
- Auth token is read from cookies on server routes—be mindful when adding server calls.


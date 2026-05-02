# Repository Guidelines

## Project Structure & Module Organization

This repository is a PNPM + Turborepo monorepo.

- `packages/core`: Express 5 API, auth, controllers, middleware, media providers.
- `packages/admin`: React + Vite admin UI (`src/pages`, `src/components`, `src/context`).
- `packages/db`: PostgreSQL access, migrations in `src/migrations/*.sql`, reset/migrate utilities.
- `packages/schema`: content schema builder/validation utilities.
- `packages/cli`: distributable `plank` CLI.
- `docs/`: project documentation.
- `scripts/`: release/version automation scripts.

## Build, Test, and Development Commands

Run from repo root unless noted.

- `pnpm dev`: starts all package dev tasks via Turbo.
- `pnpm build`: builds all packages in dependency order.
- `pnpm lint`: runs ESLint across workspaces.
- `pnpm format`: formats the repo with Prettier.
- `pnpm db:reset`: resets DB state using `.env`.
- `pnpm --filter @plank-cms/admin dev`: run only admin locally.
- `pnpm --filter @plank-cms/core dev`: run only API locally.

## Coding Style & Naming Conventions

- Language: TypeScript (strict mode via `tsconfig.base.json`).
- Formatting (Prettier): no semicolons, single quotes, trailing commas, `printWidth: 100`.
- Linting: ESLint + `typescript-eslint` (`@typescript-eslint/no-unused-vars` warns; prefix intentionally unused args with `_`).
- Naming: `camelCase` for variables/functions, `PascalCase` for React components, kebab-case for migration filenames (numeric prefix first, e.g. `026_user_backup_codes.sql`).

## Testing Guidelines

There is currently no dedicated automated test suite configured in root scripts. For changes:

- run `pnpm lint` and relevant package `build` commands,
- validate key flows manually (admin UI, auth, content operations, media uploads),
- include reproduction/verification steps in PRs.
  If you add tests, colocate them with source files and use `*.test.ts` / `*.test.tsx` naming.

## Commit & Pull Request Guidelines

Recent history favors short, imperative commit messages (e.g. `Fix 2FA QR generation`, `Add backup codes support`) and version-tag commits (`0.15.1`).

- Keep commits focused and atomic.
- Use imperative subject lines; optionally include a scope (`core:`, `admin:`).
- PRs should include: purpose, affected packages, manual test steps, env/migration notes, and screenshots for UI changes.
- Link related issues and call out breaking changes explicitly.
- Never commit on behalf of the user. Creating commits is exclusively the user's responsibility.
- If the user asks for help with commits, provide only: (1) a list of files and (2) suggested commit message(s) following the user's commit style.
- If changes span multiple tasks, group files by task and propose one possible commit per group.
- Commit assistance must always be provided as a list of suggested commits, each including the files that should be grouped together. This assistance should be automatically triggered when the user confirms a task is complete, and also whenever the user explicitly requests it.

## Shadcn Component Sourcing

- If a required Shadcn component is not available in this repository, fetch it directly from the official registry: `https://github.com/shadcn-ui/ui/tree/main/apps/v4/registry/new-york-v4/ui`.
- Copy the component into the repository exactly as-is, without modifying its source on import.
- If the imported component depends on packages that are not yet installed in this repository, install those dependencies.

## Security & Configuration Tips

- Never commit secrets; keep credentials in local `.env`.
- Validate DB migrations against a non-production database before release.
- For auth/security changes, verify JWT, 2FA, and role permissions end-to-end.

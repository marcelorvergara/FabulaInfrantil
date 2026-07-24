# Repository Guidelines

## Project Structure & Module Organization

This repository contains two TypeScript applications. `front-end-2/` is a Next.js Pages Router UI: routes live in `pages/`, reusable UI in `components/`, shared browser logic in `helpers/` and `hooks/`, types in `interfaces/`, and static files in `public/`. `back-end/` is an Express API organized by `routes/`, `controllers/`, `services/`, `repository/`, `utils/`, and `interfaces/`. Standalone audio/TTS tooling belongs in `back-end/scripts/`; do not include it in deployed runtime paths.

## Build, Test, and Development Commands

Run commands from the relevant application directory after `npm install` (or `npm ci` for a clean install).

- `cd front-end-2; npm run dev` starts Next.js on port 3006.
- `cd front-end-2; npm run lint` runs the Next.js ESLint check.
- `cd front-end-2; npm run build` creates the production frontend build.
- `cd back-end; npm run dev` watches TypeScript and runs Express locally (port 3005).
- `cd back-end; npm run build` compiles the server to `back-end/dist/`.
- `cd back-end; npx tsc --noEmit` and `npm run typecheck:scripts` match the backend CI checks.

The backend currently has no automated test suite (`npm test` intentionally fails). Add focused tests with any behavioral change, and run the relevant type checks and frontend build before opening a PR.

## Coding Style & Naming Conventions

Use TypeScript and two-space indentation. Keep existing import ordering and use the `@/` alias in frontend code. Name React components and their files in PascalCase (for example, `SleepNarrationPlayer.tsx`); name hooks `useX.ts`; use camelCase for helpers, services, and functions. Place request parsing in controllers, business/API calls in services, and persistence in repositories. Preserve strict backend typing; avoid `any` unless an external API requires it.

## Configuration & Security

Keep secrets in ignored local files: `back-end/.env` and `front-end-2/.env.local`. Never commit API keys, service-account JSON, or generated credentials. Backend changes involving CORS, internal metrics, OpenAI, Fal, Firestore, or GCS should document required environment variables and avoid logging secrets.

## Commit & Pull Request Guidelines

Follow the existing Conventional Commit style: `feat: add sleep timer`, `fix: correct timer spacing`, or `docs: update telemetry notes`. Keep commits scoped and imperative. PRs should explain the user-visible change, note configuration or deployment impact, link the issue when available, and include screenshots or a short recording for frontend/UI changes. Ensure GitHub Actions' backend type checks and frontend build pass.

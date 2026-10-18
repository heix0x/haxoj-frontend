# haxoj-frontend

Frontend of an online judge (OJ) system — a single-page application built with Vue 3 + Vite + TypeScript.

## 1. Overview

**Positioning**: the web frontend of the OJ system, providing the home page, problem list, problem solving (in-browser code editor), contests, ranking, user center and an admin console.

**Core pages**

| Page | Route | Notes |
| --- | --- | --- |
| Home | `/` | landing page |
| Problems | `/problems` | problem list (search, pagination, refresh) |
| Solve | `/problems/:id` | problem detail + Monaco editor + submit |
| Contests | `/contests` | contest list |
| Ranking | `/ranking` | leaderboard |
| About | `/about` | site introduction |
| User center | `/user/center` | login required |
| Admin console | `/admin/*` | admin only: overview / users / questions / create question |
| Login / Register | `/user/login`, `/user/register` | standalone layout without the top bar |

## 2. Tech Stack

All versions come from `package.json`:

| Category | Choice | Version |
| --- | --- | --- |
| Framework | Vue | `^3.5.13` |
| Build tool | Vite | `^6.2.4` (`@vitejs/plugin-vue ^5.2.3`, `vite-plugin-vue-devtools ^7.7.2`) |
| Language | TypeScript | `~5.8.0` (type checking via `vue-tsc ^2.2.8`) |
| Routing | vue-router | `^4.5.0` |
| State management | Pinia | `^3.0.1` + `pinia-plugin-persistedstate ^4.3.0` |
| UI library | Arco Design (`@arco-design/web-vue`) | `^2.57.0` (note: declared under `devDependencies`) |
| HTTP | axios | `^1.16.1` |
| Code editor | monaco-editor | `^0.56.0` |
| Markdown | ByteMD (`@bytemd/vue-next ^1.22.0` + `plugin-gfm` / `plugin-highlight`) | `^1.22.0` |
| Time handling | moment | `^2.30.1` |
| API codegen | openapi-typescript-codegen | `^0.30.0` |
| Linting | ESLint `^9.22.0`, Prettier `3.5.3`, eslint-plugin-vue `~10.0.0` | — |
| Testing | Vitest `^3.1.1` + `@vue/test-utils ^2.4.6` + jsdom `^26.0.0` | — |
| Node types | `@types/node ^22.14.0`, `@tsconfig/node22 ^22.0.1` | implies Node 22 |

## 3. Requirements

| Component | Requirement | Notes |
| --- | --- | --- |
| Node.js | 22.x (recommended) | `@types/node ^22.14.0`, `@tsconfig/node22` |
| Package manager | npm | a `package-lock.json` exists (no yarn / pnpm lockfile) |
| Backend | a running OJ backend | user / question services for API work; the sandbox service for judging |

## 4. Quick Start

```bash
# 1. install dependencies
npm install

# 2. configure the backend URL: edit .env in the project root
#    VITE_API_BASE_URL=http://localhost:8001

# 3. start the dev server (Vite default port 5173)
npm run dev

# 4. production build / local preview
npm run build
npm run preview
```

**Available npm scripts**

| Script | Purpose |
| --- | --- |
| `dev` | start the Vite dev server |
| `build` | type-check + production build (`run-p type-check build-only`) |
| `build-only` | build only, `vite build` |
| `type-check` | type checking, `vue-tsc --build` |
| `preview` | preview the built output locally |
| `test:unit` | run Vitest unit tests |
| `lint` | ESLint check and fix |
| `format` | Prettier format `src/` |
| `api:download` | fetch the OpenAPI document from the backend into `api-docs.json` |
| `api:generate` | fetch → generate `src/api` → run the post-process patch script |

## 5. Project Structure

```
haxoj-frontend/
├── .env                       # VITE_API_BASE_URL (currently the gateway, http://localhost:8001)
├── vite.config.ts             # plugins [vue(), vueDevTools()], alias @ → ./src
├── scripts/postprocess-api.cjs# post-process for api:generate (BASE from env, WITH_CREDENTIALS → true)
├── src/
│   ├── main.ts                # app entry
│   ├── App.vue                # root component (just <router-view />)
│   ├── api/                   # OpenAPI-generated client (core / models / services)
│   ├── plugins/axios.ts       # global axios instance: withCredentials + interceptors + redirect on expiry
│   ├── router/                # index.ts (router + guards), routes.ts (route table)
│   ├── stores/                # Pinia: user (user state, persisted under key haxoj-user)
│   ├── access/                # accessEnum (NOT_LOGIN / USER / ADMIN), checkAccess
│   ├── layouts/               # BasicLayout (top bar + back bar), UserLayout (login/register)
│   ├── components/            # MonacoEditor, MdEditor, HaxHeader, custom-lang-monarch
│   ├── views/                 # pages (Home / Problems / ProblemDetail / Admin* / user/* ...)
│   ├── utils/                 # question.ts (formatting), questionListCache.ts (list cache)
│   └── assets/                # styles and static assets
└── dist/                      # build output (already present in the repo)
```

**Conventions**

- Route metadata is documented in the header comment of `src/router/routes.ts`: `meta.title` (page title and menu label), `meta.access` (permission), `meta.hideInMenu`, `meta.activeMenu`.
- **`src/api` is generated — never hand-write files there** (they are wiped by the next `api:generate`); put custom code in `src/plugins`, `src/utils`, etc.
- Admin pages all live under `/admin/*` (`/admin` itself is a group route redirecting to `/admin/overview`); each sub-page has its own URL, so it can be refreshed and bookmarked.
- Snowflake IDs (19 digits) are handled as **strings** end to end; never convert them to `Number`.

## 6. Routing & Access Control

- **Permission model** (`src/access/accessEnum.ts`): `NOT_LOGIN` (anyone) / `USER` (logged-in user) / `ADMIN` (administrator).
- **Two layers**: the menu is filtered by `meta.access`, and the global `beforeEach` guard in `src/router/index.ts` is the backstop.
- **Layouts**: main pages share the parent route `/` (`BasicLayout`, with the top-bar menu); login/register use a separate `/user` (`UserLayout`, no top bar). `App.vue` keeps only `<router-view />` to avoid rendering the layout twice.
- **Route order matters**: specific paths (e.g. `/user/login`) must be declared before wildcard paths, otherwise the wrong layout matches; `/admin` uses `redirect` for its group entry.

## 7. Backend Integration

**Where the API comes from**: the backend exposes an OpenAPI document via Knife4j; the frontend generates a TypeScript client with `openapi-typescript-codegen`.

```bash
npm run api:download   # fetch the document straight from one service, e.g. curl http://localhost:8101/api/v2/api-docs?group=default → api-docs.json (the gateway does not aggregate docs yet)
npm run api:generate    # generate src/api and run scripts/postprocess-api.cjs
```

**Two key conventions** (enforced by the post-process script)

1. `BASE` in `src/api/core/OpenAPI.ts` reads `VITE_API_BASE_URL` (`http://localhost:8001`, **without `/api`**) — because the generated request paths **already carry the `/api` prefix** (matching each backend service's `context-path`); adding `/api` to BASE would produce a doubled `/api`.
2. `OpenAPI.WITH_CREDENTIALS = true`: when frontend (5173) and backend gateway (8001) are cross-origin, cookies must be sent to establish and keep the backend's Session-based login state. The generator defaults to `false`, and the script forces it back to `true`.

**Backend port mapping** (microservice edition)

| Service | Port | context-path | Public |
| --- | --- | --- | --- |
| **Gateway** | **8001** | — (routes configured) | ✅ **the only public entry** |
| User service | 8101 | `/api` | ❌ internal only |
| Question service | 8102 | `/api` | ❌ internal only |
| Judge service | 8103 | `/api` | ❌ internal only (inner endpoints only; the gateway exposes no route) |

> ✅ The frontend needs just **one** `VITE_API_BASE_URL` pointing at the gateway (8001). The gateway dispatches by `Path`: `/api/user/**`, `/api/file/**` → user service; `/api/question/**`, `/api/question_submit/**` → question service. The frontend is **unaware** of 8101/8102/8103 — those ports are used only for internal service-to-service calls.
> Note: the gateway routes **do not cover** `/api/inner/**` (service-to-service endpoints), so inner endpoints are unreachable from the frontend.

## 8. Deployment

- **Build**: `npm run build`; output goes to `dist/` (the Vite default).
- **Hosting**: `dist/` is pure static content and can be served by any static server. As an SPA it needs a **history-mode fallback** (all unknown paths → `index.html`), otherwise refreshing a sub-route returns 404.
- **Environment variables**: `VITE_API_BASE_URL` is injected **at build time**; it must be set to the production backend before building (a placeholder is left as a comment in `.env`).
- **Repo status**: there is **no** `Dockerfile`, `nginx.conf` or CI config in this directory; containerization and reverse proxying must be added.

## 9. FAQ

| Symptom | Cause | Fix |
| --- | --- | --- |
| Request path contains a doubled `/api` | `VITE_API_BASE_URL` mistakenly includes `/api` | keep BASE to host + port only, e.g. `http://localhost:8001` |
| Login succeeds but the UI still shows logged out | cross-origin cookies not sent | ensure `OpenAPI.WITH_CREDENTIALS = true` and axios `withCredentials`; backend must allow CORS |
| Refreshing a sub-page returns 404 | static server lacks the history fallback | fall back all paths to `index.html` |
| Hand-written files vanish after `api:generate` | the generator rebuilds `src/api` | never put hand-written code in `src/api` |
| Problem list is stale after submitting code | the list cache is not invalidated | clear the cache in `src/utils/questionListCache.ts` after submit/CRUD (or use the refresh button) |
| Monaco copy/delete misbehaves | incompatibility with the new EditContext API | the editor sets `editContext: false` — do not remove it |
| Generated `Post*` / `WxMp` APIs are unreachable | they come from the old monolith's document | the microservice backend does not provide those services; regenerate or ignore them |

## 10. Contributing

**Branches & commits**

- Branch model: `main` (stable) → `feature/*`, `fix/*`.
- Commit messages follow Conventional Commits: `feat:` / `fix:` / `refactor:` / `docs:` / `chore:`.

**PR flow**

1. Branch off `main`; run `npm run lint` and `npm run build` locally before submitting.
2. Open a PR describing the change and how you verified it (screenshots / steps).
3. Merge after at least one maintainer review.

**Conventions**

- Update `package-lock.json` when adding a dependency; never commit `node_modules`.
- When API types change, regenerate via `npm run api:generate` — do not hand-edit `src/api`.

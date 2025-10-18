## Project overview

This repository is a two-tier restaurant CRM with a React frontend (Create React App) and an Express backend.

- Frontend: `crm_restaurant_frontend` — React (CRA), MUI, axios for API calls, RTL styling via Emotion + stylis-plugin-rtl. Entry: `src/index.js`, UI shell in `src/App.js`, routes in `src/Routes.js`.
- Backend: `crm_restaurant_backend` — Express API mounted under `/api`. Server entry: `index.js`. Routes organized under `src/routes/**` (e.g. `src/routes/branch`, `src/routes/company`).

Key principle: frontend talks to backend at `http://localhost:3000/api` (see `src/components/service/axiosInstance.js`).

## What to know first (high-value facts)

- Authentication
  - JWT-based. Login stores `authToken` and `authTokenExpiry` in `localStorage` (see `src/pages/Authentication/Login.js`).
  - Requests use `src/components/service/axiosInstance.js` which attaches `Authorization: Bearer <token>` and redirects to `/` when token is expired or backend returns 401. Any agent change to auth should update both axios interceptors and components that read/write localStorage (e.g. `Sidebar.js`, `ProtectedRoute.js`).

- API shape and patterns
  - Most endpoints follow REST-like naming with `index`, `filter`, `show/:id`, `store`, `update/:id`, `delete/:id`. Examples: `/branch/index`, `/branch/filter`, `/branch/store`.
  - POST/PUT payloads are plain JSON; file uploads (items/company logos) use multipart/form-data in places that set `config` with `FormData` (search for usages in `src/pages/Item/*` and `src/pages/Company/*`).

- UI & localization
  - RTL-first UI: theme direction is `'rtl'` in `src/App.js` and Emotion cache uses `stylis-plugin-rtl`.
  - Strings contain localized text (Persian/Arabic script) in many pages — don't change language content unless localization is intended.

## Developer workflows (how to build, run, debug)

- Frontend
  - Start dev server: from `crm_restaurant_frontend` run `npm start` (CRA dev server). The app expects the backend at `http://localhost:3000/api` or you can set `REACT_APP_API_URL`.
  - Build for production: `npm run build`.
  - Tests: `npm test` (CRA test runner).

- Backend
  - Start: from `crm_restaurant_backend` run `npm run dev` (nodemon) or `npm start` to run `node index.js`.
  - The Express app serves uploads under `/uploads` from `src/uploads` and mounts API routes at `/api`.

## Project-specific conventions and patterns

- Directory layout: frontend pages live in `src/pages/<Feature>/` and components under `src/components/`. Routes and API calls are kept in page components (lots of small page components using `axiosInstance`).
- API clients: use the shared `axiosInstance` from `src/components/service/axiosInstance.js` for all HTTP calls (it handles tokens and redirect logic). Avoid creating new axios instances unless necessary.
- Local state & forms: many forms use utilities in `src/components/utils/formUtils.js` (use `handleChange`, `resetForm`, and `clearTextField` helpers for consistency).
- Error handling: components typically show feedback using `Snackbar` / `Alert`. Backend errors often surface in `error.response.data` — check `.message` and `.error` fields.

## Integration points and notable files to inspect

- Authentication: `src/pages/Authentication/Login.js`, `src/pages/Authentication/auth.js`, `src/components/service/axiosInstance.js`, `src/components/service/ProtectedRoute.js`.
- API surface: `crm_restaurant_backend/src/routes/**` and controllers under `crm_restaurant_backend/src/controllers/**`.
- Uploads: backend serves files at `/uploads` (static) — frontend may reference them as `${BASE_URL}/uploads/<filename>`.
- Config constants: `src/config/constants.js` (contains `BASE_URL` fallback).
- RTL and theme: `src/App.js` (Emotion cache and MUI theme setup).

## Safe editing guidelines for an AI agent

1. Preserve localization: many strings use Persian/Arabic script. Don't auto-translate or remove them.
2. For auth/token changes:
   - Update `localStorage` keys consistently: `authToken`, `authTokenExpiry`, `showSessionExpiredMessage`.
   - Update `axiosInstance` interceptors and `ProtectedRoute` logic together.
3. When adding API calls, follow the repository's path conventions (e.g., `/resource/store`, `/resource/update/:id`). Prefer `axiosInstance.post('/resource/store', payload)`.
4. When touching UI components, keep RTL layout and MUI theme-aware patterns (use MUI components and `sx` prop used widely in code).
5. Avoid changing the Create React App structure unless explicitly required (build commands and scripts rely on CRA defaults).

## Examples (copy-paste friendly)

- Add Authorization header using shared client (preferred):

  import axiosInstance from 'src/components/service/axiosInstance';
  await axiosInstance.get('/branch/index');

- Token decode helper usage:

  import { getCurrentUserId } from 'src/pages/Authentication/auth.js';
  const id = getCurrentUserId();

## Quick checks you should run when editing

- Frontend compile: `cd crm_restaurant_frontend && npm start` (or `npm run build`) — ensure no runtime console errors.
- Backend: `cd crm_restaurant_backend && npm run dev` — check the API endpoints used by the frontend are mounted under `/api`.

## Where to ask if something is unclear

- If you need API input/output shapes or database details, inspect `crm_restaurant_backend/src/controllers/**` and `crm_restaurant_backend/src/models/**`.
- Ask the repo owner for environment variables (JWT secret, DB credentials) — these are not in source control.

---
If you'd like, I can refine this document with more concrete endpoint examples (controller method names or request/response JSON) — tell me which feature (e.g., Item, Branch, Customer) to focus on next.

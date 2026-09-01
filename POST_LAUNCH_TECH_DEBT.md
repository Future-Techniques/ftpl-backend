# Post-Launch Tech Debt

> Created: 2026-08-20
> Review these within **30 days of launch**. None of these block the initial deployment, but all should be resolved before the site reaches significant traffic.

---

## 1. Migrate `swiper` v8 → v14 (CRITICAL priority)

- **Why**: `swiper` versions 6.5.1–12.1.1 have a critical prototype pollution vulnerability (CVE: GHSA-hmx5-qpq5-p643). This package ships in the **production browser bundle** — it is user-facing.
- **Current risk**: Medium in practice — the DOMPurify XSS fix removes the most likely exploitation vector, but prototype pollution without a separate XSS hole is still theoretically exploitable.
- **Fix**: Upgrade to `swiper@14` via `npm install swiper@latest`
- **Effort**: High — swiper v14 has breaking API changes. All `<Swiper>` component usages, import paths, and CSS imports need to be updated. Review the [swiper migration guide](https://swiperjs.com/migration-guide-v9) and [v14 changelog](https://github.com/nolimits4web/swiper/releases).
- **Affects**: `futuretek-frontend` only

---

## 2. Migrate `react-router-dom` v6 → v7 (MODERATE priority)

- **Why**: `react-router` versions 6.0.0–7.17.0 have two moderate CVEs:
  - GHSA-wrjc-x8rr-h8h6: Open redirect via backslash in `<Link>` and `useNavigate`
  - GHSA-337j-9hxr-rhxg: Arbitrary Constructor Injection via `deserializeErrors()` in SSR hydration (low real risk since this app does not use SSR)
- **Fix**: `npm install react-router-dom@latest` (both in `futuretek-frontend` and `FutureTek-admin`)
- **Effort**: Medium — React Router v7 introduces changes to route definition syntax, data loading patterns, and some hook APIs. Review the [React Router v7 upgrade guide](https://reactrouter.com/upgrading/v6).
- **Affects**: `futuretek-frontend` and `FutureTek-admin`

---

## 3. Migrate `futuretek-frontend` from Create React App → Vite (LOW urgency, HIGH long-term value)

- **Why**: Create React App (`react-scripts`) is effectively unmaintained (last release 2022). It brings in a large tree of build-tool dependencies (webpack, jest, postcss, svgo, workbox, etc.) many of which have known CVEs. These CVEs are **dev-environment only** (not shipped to users), but they are nearly impossible to patch individually without breaking `react-scripts` itself. The root fix is replacing CRA with a modern, actively maintained bundler.
- **Fix**: Migrate to [Vite](https://vitejs.dev/) using `create-vite` or follow the [CRA to Vite migration guide](https://vitejs.dev/guide/migration.html). This will also significantly improve dev server startup time and hot-module reload speed.
- **Effort**: Medium-High — requires replacing `react-scripts` build/start/test scripts, updating `index.html`, adjusting environment variable prefix from `REACT_APP_` to `VITE_`, and verifying all imports and aliases.
- **Affects**: `futuretek-frontend` only
- **Note**: `FutureTek-admin` may benefit from the same migration if it is also CRA-based.

---

## 4. Supabase Keepalive & UptimeRobot Monitoring Dependency (CRITICAL operational requirement)

- **Why**: Supabase projects on the Free Plan automatically pause compute instances after **7 days of database inactivity**. The backend health endpoint at `/health` and `/api/health` executes a live PostgreSQL query (`SELECT NOW() as db_time, 1 as active`) on every request.
- **Monitoring setup**: UptimeRobot is configured to ping `https://ftpl-backend.onrender.com/health` every 5 minutes (288 DB queries/day).
- **Critical notice**: If UptimeRobot monitoring is ever disabled, paused, or the target URL changes, the Supabase database **WILL pause again after 7 days of inactivity**, which will cause the Render backend to crash on subsequent restarts.
- **Affects**: `futuretek-backend-NEW` & Supabase PostgreSQL (`ftpl-db`)

---

## Status Tracking

| Task | Priority | Assigned | Target Date | Done |
|------|----------|----------|-------------|------|
| Supabase Keepalive via UptimeRobot `/health` | Critical | DevOps | Implemented | [x] |
| swiper v8→v14 migration | Critical | - | 30 days post-launch | [ ] |
| react-router v6→v7 migration | Moderate | - | 30 days post-launch | [ ] |
| CRA → Vite migration | Low urgency | - | 90 days post-launch | [ ] |

---

> **How to use this file**: Check it off as tasks are completed. Fill in "Assigned" and "Target Date" columns when you schedule the work. Delete this file once all three items are done and the app is on clean dependencies.

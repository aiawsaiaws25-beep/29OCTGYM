# PulseFit

A modern gym app to plan workouts, track progress, book classes and stay motivated.
React frontend, Vercel-style `/api` functions, Neon Postgres.

## Run locally (no Neon needed)

```bash
npm install
npm run dev
```

With `DATABASE_URL` empty, the API uses an embedded Postgres (PGlite) stored in
`./.pglite`. Tables and sample data are created automatically on first start.
Open http://localhost:5174 and sign up. `JWT_SECRET` is generated into `.env`
on the first run if it is empty.

## Switch to Neon (before deploying to Vercel)

1. Neon dashboard → your project → Connection Details → copy the string.
2. Put it in `.env` as `DATABASE_URL=postgresql://...` and set the same
   `DATABASE_URL` and `JWT_SECRET` in Vercel's environment settings.
3. Run `npm run db:setup` once to create tables and seed data on Neon.

## How `npm run dev` works

It starts two processes with one command:

- the Vite frontend on http://localhost:5174
- a small Express server on port 3001 that mounts every file in `/api`
  exactly as Vercel will. Vite proxies `/api/*` to it.

The database is only ever touched from `/api` and `lib/server`. The frontend
never sees `DATABASE_URL`.

## Scripts

| Script             | What it does                                   |
| ------------------ | ---------------------------------------------- |
| `npm run dev`      | API server + Vite with proxy                   |
| `npm run db:setup` | Runs `db/schema.sql` then `db/seed.sql`        |
| `npm run build`    | Production build of the frontend               |
| `npm run lint`     | oxlint                                         |

## Structure

```
api/                Serverless functions (auth, exercises, classes, workouts, dashboard, stats)
lib/server/         db client, auth (JWT + cookie), env checks, http helpers  (server only)
server/dev-api.js   Local Express host for /api (dev only)
db/                 schema.sql, seed.sql, setup.js
src/
  components/       Reusable UI (Layout, GlassCard, ProgressRing, AuthShell, RequireAuth, ...)
  context/          Theme, Toast, Auth (session), App (per-user stats)
  lib/              api.js fetch wrapper, dates.js helpers
  pages/            Landing, Login, Signup, Dashboard, Library, LiveWorkout, Progress, Classes, Profile
  data/mockData.js  Quotes, strength history, PRs and achievement definitions (no table yet)
```

## API

| Route                     | Method | Auth | Purpose                                      |
| ------------------------- | ------ | ---- | -------------------------------------------- |
| `/api/auth/signup`        | POST   | no   | Create account, sets session cookie          |
| `/api/auth/login`         | POST   | no   | Log in, sets session cookie                  |
| `/api/auth/logout`        | POST   | no   | Clears the cookie                            |
| `/api/auth/me`            | GET    | no   | Current user or `null`                       |
| `/api/stats`              | GET    | no   | Landing page counters                        |
| `/api/exercises`          | GET    | no   | Exercise library                             |
| `/api/classes`            | GET    | opt  | This week's classes with spots left          |
| `/api/classes/book`       | POST   | yes  | Toggle a booking                             |
| `/api/workouts/today`     | GET    | yes  | Today's workout (generated on first request) |
| `/api/workouts/sets`      | POST   | yes  | Tick / untick a set                          |
| `/api/workouts/complete`  | POST   | yes  | Mark the workout completed                   |
| `/api/dashboard`          | GET    | yes  | Weekly activity, streaks, goals, totals      |

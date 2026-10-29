# PulseFit Test Report

Date: 2026-10-16
Command to run everything: `npm run test:all`

## Totals

| Suite                               | Tests | Passed | Failed |
| ----------------------------------- | ----- | ------ | ------ |
| Backend API + unit (Vitest)         | 77    | 77     | 0      |
| Browser, desktop Chrome (Playwright)| 8     | 8      | 0      |
| Browser, iPhone 13 size (Playwright)| 8     | 8      | 0      |
| **Total**                           | **93**| **93** | **0**  |

Production build (`npm run build`): 0 errors. Lint: 0 errors (2 style warnings).

Tests never touch real data: the backend suite uses a throwaway in-memory
Postgres per test file and deletes its `e2e-*@pulsefit.test` users; the browser
suite boots its own API on an in-memory database on separate ports.

## What is covered

Backend (`tests/api`, `tests/unit`)
- Sign up: success, cookie flags, lower-cased email, duplicate email, weak and empty password, bad email, missing name, out-of-range goals, wrong method.
- Login: success, wrong password, unknown email, missing fields, logout clears the cookie, tampered cookie ignored.
- `/api/auth/me` logged in and out. Every protected route returns 401 without login.
- `/api/stats` numeric fields and member count increments.
- `/api/exercises` all 30, each of the 6 muscle-group filters returns 5, unknown group rejected.
- Classes: list with spots left, book, cancel, unknown id, full class refused.
- Workouts: generate today's workout (5 exercises with sets), same workout on repeat, different per date, add exercise, duplicate/unknown rejected, custom session, remove exercise, start, tick and untick a set, complete with duration, duration floor of 1 minute, no adding after completion.
- Security: user B cannot see, tick, start, complete or edit user A's workout; dashboards are isolated.
- Dashboard with fixed dates: zero state, 7-day chart, 3-day streak, missed day resets, yesterday keeps streak alive, today+yesterday = 2, only completed workouts count, last week excluded, goals-hit logic, bookings total.
- Pure streak and ring maths: 10 ring cases prove the value is never NaN and never above 100%.

Browser (`tests/e2e`, run on desktop and mobile)
- Landing: PulseFit in navbar, headline, footer and tab title; counters animate; no horizontal scroll; no console errors.
- "Start Your Workout" goes to sign up when logged out. Keyboard: Tab reaches it, Enter activates it.
- Protected pages redirect to login when logged out. Wrong password shows a friendly message.
- Full journey: sign up, dashboard, each library filter shows 5 matching cards, search empty state, add 2 exercises, dashboard lists them, Start, rest timer counts down, tick every set, completion screen with confetti canvas, dashboard streak/chart/rings update, survive a page refresh, profile and classes work, book a class, logout, protected pages redirect.
- Accessibility: every button has a name and every image has alt text on 6 pages.

## Bugs found and fixed

1. **Logout landed on the login page instead of home.** Logging out from Profile cleared the session before leaving the protected route, so the guard redirected to `/login`. Fixed by navigating home first in both logout handlers.
2. **Mobile bottom-nav "Train" link had no accessible name** (icon only). Added `aria-label` to the nav links. Found by Lighthouse.
3. **Faint text failed contrast** (3.5:1 for 10px labels). Dark-mode faint grey lightened from `#667080` to `#8690a0`, light mode darkened slightly. Same look, now passes.
4. **Heading levels skipped (h1 to h3)** on Landing, Library, Classes and Progress. Changed to h2 with identical styling.
5. **Landing page had no `<main>` landmark.** Wrapped the content sections.
6. **`robots.txt` was missing**, so the SPA fallback served HTML for it. Added a real one.
7. **Render-blocking Google Fonts stylesheet.** Now loaded asynchronously with a no-script fallback.
8. **One 840 KB JavaScript bundle on every page.** Screens are now lazy-loaded; the landing page no longer downloads the chart library.
9. **Express 5 read-only `req.query`** crashed every local API call. Fixed in the dev server adapter.
10. Added the routes the tests required: `/api/workouts/start`, `/api/workouts/exercises` (add and remove), and a `?group=` filter on `/api/exercises`, plus an "Add to today" button on library cards.

## Lighthouse (mobile, production build)

| Page      | Before (Perf / A11y / BP / SEO) | After (Perf / A11y / BP / SEO) |
| --------- | ------------------------------- | ------------------------------ |
| `/`       | 81 / 96 / 100 / 91              | 93 / 100 / 100 / 100           |
| `/classes`| 96 / 88 / 100 / 100             | 97 / 100 / 100 / 100           |
| `/login`  | not measured                    | 92 / 100 / 100 / 100           |

Remaining Lighthouse notes are informational only (some unused JavaScript in shared vendor code, LCP around 3 s on simulated slow 4G).

## Please check by hand

- Confetti is verified by the canvas appearing; watch it once with your own eyes.
- Switch to Neon before deploying: set `DATABASE_URL` and `JWT_SECRET` in Vercel, then run `npm run db:setup` once with the Neon URL in `.env`.
- Logged-in pages were not Lighthouse-scored (they need a session); their shared layout is the same as the measured pages.
- The Progress page strength chart and personal records are still sample data; there is no table for them yet.
- Timezones: dates use the browser's local day. If you deploy for users far from your own timezone, check that "today" rolls over when you expect.

# Modiri AI — Web App (React)

React web frontend for Modiri AI, built to talk directly to your **existing**
Node/Express backend and PostgreSQL database — no backend changes, no new
database. It calls the exact same REST API your Flutter mobile app uses.

## Phase 1 — what's included in this delivery

- Project scaffold: Vite + React 18 + React Router 6 + Tailwind CSS
- Dark theme matching your dashboard screenshot (navy base, blue/violet
  gradients, glass cards)
- Full auth flow, wired to `backend/src/modules/auth`:
  - Register → Verify email (6-digit code, with resend) → Login
  - Forgot password → Reset password
  - JWT access + refresh token handling, with automatic silent refresh
    on 401s (`src/api/client.js`)
- Business-type onboarding screen (`/onboarding/business-type`), shown
  right after email verification, mirroring the mobile app's flow
- App shell: sidebar + topbar, matching your screenshot's layout
- Main Dashboard:
  - Restaurant/Café companies see the full restaurant dashboard from
    your screenshot (Today's Orders, Active Orders, Today's Revenue,
    Tables occupied, Reservations today, Outstanding — all pulled live
    from `GET /restaurant/dashboard`), plus the Active Orders panel and
    quick-action buttons
  - Every other business type sees a generic KPI dashboard from the
    core `GET /dashboard` endpoint (Revenue/Expenses/Profit/Sales/Low
    stock/Unpaid invoices)
- Restaurant API layer (`src/api/restaurant.js`) already fully mapped
  to every backend route (tables, menu items, orders, reservations,
  inventory) — ready for Phase 2's screens to use directly
- Placeholder "coming soon" pages for Tables, Menu, Orders,
  Reservations, Expenses, Reports, Settings so navigation is complete

## Getting it running

1. **Start your existing backend** (unchanged):
   ```bash
   cd backend
   npm install
   cp .env.example .env   # fill in DATABASE_URL, JWT secrets, SMTP, etc.
   npm run dev
   ```
   It listens on `http://localhost:4000` with routes under `/api`.

2. **Configure this web app to point at it:**
   ```bash
   cp .env.example .env
   # .env
   VITE_API_BASE_URL=http://localhost:4000/api
   ```
   If your backend is deployed somewhere else, put that URL here instead.

3. **Install and run the web app:**
   ```bash
   npm install
   npm run dev
   ```
   Open the URL Vite prints (default `http://localhost:5173`).

4. **Build for production:**
   ```bash
   npm run build
   ```
   Output goes to `dist/` — deploy it to any static host (Vercel,
   Netlify, S3+CloudFront, nginx, etc.). Remember to set
   `VITE_API_BASE_URL` to your production backend URL at build time,
   and make sure `CORS_ORIGIN` in the backend's `.env` allows the
   domain you deploy this to.

## Project structure

```
src/
  api/            One file per backend module, thin wrappers around axios
  components/
    layout/       Sidebar, Topbar, AppLayout (the shell)
    ui/           StatCard, Input, Alert, Spinner, EmptyState
  context/        AuthContext — session, company, login/logout
  pages/
    auth/         Login, Register, VerifyEmail, Forgot/ResetPassword
    onboarding/   BusinessTypePage
    DashboardPage.jsx
  routes/         ProtectedRoute (redirects to /login if signed out)
  utils/          currency + business-type label helpers
```

## Remaining phases (not yet built)

### Phase 2 — Restaurant module screens
Full UI for the module whose API layer is already wired up:
- **Tables**: grid view with live status (available/occupied/reserved),
  tap to change status, add/edit tables
- **Menu**: item list with categories, availability toggle, image
  upload (via the shared `/images` endpoint), ingredient/recipe editor
- **Orders**: create an order (pick table, add menu items), order
  list + filters, order detail, status progression
  (pending→preparing→ready→served→completed), record payments,
  refunds, view/download the PDF invoice
- **Reservations**: create/list reservations, confirm/cancel/no-show
- **Inventory**: stock items, low-stock indicator, manual adjustments,
  movement history

### Phase 3 — Core modules shared by every business type
- **Products**, **Sales** (point-of-sale style flow), **Invoices**
- **Expenses** (with the day-proration your backend already computes)
- **Employees** (incl. salary cost), **Customers**, **Suppliers**
- **Credit** (credit sales + repayments, outstanding balances)
- **Reports** (revenue/expense/profit charts over custom ranges)
- **Notifications** center
- **Settings**: company profile, business type change, currency,
  team/employee accounts, password change
- Product image upload/serving (shared `/images` module)

### Phase 4 — Other business verticals
Dedicated dashboards + entity screens for each specialized module your
backend already supports:
- **Clinic** (appointments, consultations, prescriptions, documents,
  payments)
- **Pharmacy**
- **Superette** (grocery/mini-market)
- **Clothing** (attributes: size/color/etc.)
- **Enterprise** (projects)

Each of these already has a working backend module
(`backend/src/modules/<name>`) — this phase is purely front-end.

### Phase 5 — AI features & polish
- AI Assistant chat (`POST /ai/chat`)
- Invoice scanner (OCR + vision model, `POST /ai/invoices/scan` +
  confirm flow)
- AI Insights panel (`GET /ai/insights`)
- Multi-language UI (Arabic/French/English, matching the mobile app's
  `l10n`) incl. RTL support for Arabic
- Code-splitting/lazy loading (the production build currently warns
  about one large bundle — trivial to fix once there are more routes
  to split on)
- Deployment guide (Docker/nginx or Vercel) and a CI build check

Say "continue" any time and I'll pick up with the next phase.

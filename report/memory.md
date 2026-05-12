# Conversation Memory — Session Summary

## Project Overview

- **Project:** Next.js 16 app built from scratch (not create-next-app), located at `/home/shumon/Documents/next-app-by-hand`
- **Stack:** Next.js 16.2.6 (Turbopack), Prisma 7.8.0, PostgreSQL 17 (Docker), Zustand, jose (JWT), bcryptjs, Tailwind CSS
- **Important:** This Next.js version may differ from standard conventions — always check `node_modules/next/dist/docs/` before writing code.
- **Date:** 2026-05-13

---

## Database Setup

### Docker PostgreSQL
- Running via `docker-compose.yml` with image `postgres:17-alpine`
- Container: `nextapp_postgres`, port `5433:5432`
- Credentials: user=`nextapp`, password=`nextapp_secret`, db=`nextapp_db`
- Connection string: `postgresql://nextapp:nextapp_secret@localhost:5433/nextapp_db`

### Prisma Configuration
- Schema: `prisma/schema.prisma`
- Config: `prisma.config.ts` (Prisma v7 style)
- Generated client output: `generated/prisma`
- Migrations directory: `prisma/migrations`
- Migration was reset and recreated with `npx prisma migrate dev --name init`

### Environment Variables (`.env`)
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — secret key for JWT signing/verification (user set their own value)

### Models (5 tables)
- **User** — id, email (unique), name, password, createdAt, updatedAt
- **Profile** — id, bio, avatar, phone, userId (unique FK → User) — 1:1 with User
- **Post** — id, title, content, published, authorId (FK → User), createdAt, updatedAt — 1:M with User (newly added)
- **Role** — id, name (unique)
- **UserRole** — composite PK [userId, roleId] — M:M join table between User and Role

### Seed File (`prisma/seed.ts`)
- Creates only 2 roles (`admin`, `customer`) and 1 admin user (`admin@example.com` / `admin123`)
- No demo customer users or profiles — users are created via the register form

---

## Authentication System

### Token-based auth with HttpOnly cookie
- JWT signed with `jose` library (Edge Runtime compatible, not `jsonwebtoken`)
- Token payload: `{ userId, email, roles }`
- Stored in HttpOnly cookie: `token=<jwt>; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`
- Expires after 7 days, no refresh mechanism

### Auth Files
- `lib/auth.ts` — `signToken()`, `verifyToken()`, `getSession()` using jose
- `lib/prisma.ts` — PrismaClient singleton with PrismaPg adapter
- `stores/auth-store.ts` — Zustand store for UI state only (user, isAuthenticated, fetchUser, logout)
- Zustand does NOT store the token — only user data in memory, re-fetched from `/api/auth/me` on page refresh

### API Routes
- `POST /api/auth/login` — verifies credentials, sets JWT cookie, returns user
- `POST /api/auth/register` — creates user with customer role, sets JWT cookie
- `POST /api/auth/logout` — clears cookie with `Max-Age=0`
- `GET /api/auth/me` — reads cookie, returns current user data (used to rehydrate Zustand)
- `GET/POST /api/users` — admin-only user management
- `GET/PATCH/DELETE /api/users/[id]` — admin-only single user management

---

## Middleware (`proxy.ts`)

Route-level authentication and role-based access control:
- Public routes (`/`, `/login`, `/register`, `/api/auth/*`) — accessible to everyone
- Logged-in users visiting `/login` or `/register` get redirected: admin → `/admin`, customer → `/customer`
- Admin routes (`/admin`, `/api/users`) — require `admin` role
- Customer routes (`/customer`) — require `customer` role
- Profile routes (`/profile`) — require any authenticated user

---

## App Layouts

### Public Layout (`app/(public)/layout.tsx`)
- Top navbar + footer, auth-aware header (shows login/register or profile/logout based on auth state)
- Client component, fetches user on mount via Zustand
- Wraps: `/`, `/login`, `/register`

### Admin Layout (`app/admin/layout.tsx`)
- Dark sidebar (Dashboard, Users nav) + white header with logout
- Wraps: `/admin`, `/admin/users`

### Customer Layout (`app/customer/layout.tsx`)
- Dark sidebar (Dashboard nav) + white header with logout
- Wraps: `/customer`

---

## Pages

- `/` — Simple public landing page (no counter, just welcome text)
- `/login` — Email/password login, redirects admin → `/admin`, customer → `/customer`
- `/register` — Name/email/password registration, redirects to role-based dashboard
- `/admin` — Admin dashboard with Counter component
- `/admin/users` — User management table
- `/customer` — Customer dashboard with Counter component

---

## Issues Fixed During Session

1. **Prisma client not generated** — ran `npx prisma generate` after creating `.env` with `DATABASE_URL`
2. **`DATABASE_URL` missing** — created `.env` file with connection string
3. **`JWT_SECRET` missing** — added to `.env`, was causing "Cannot set property message" error on register
4. **Login/register input text color** — added `text-black` class to all form inputs
5. **Middleware gaps** — `/customer` routes were unprotected, customer redirect went to `/` instead of `/customer`, register page didn't redirect by role
6. **Migration drift** — reset database with `npx prisma migrate reset` then recreated migration

---

## Report Files Created

- `report/database-relations.md` — 1:1, 1:M, M:M relationship documentation
- `report/layouts.md` — Layout descriptions with ASCII diagrams
- `report/middleware.md` — Middleware access matrix and flow
- `report/auth-flow.md` — Full token lifecycle (login → usage → expiry → logout)

---

## Known Gaps / Not Yet Implemented

- No `Secure` flag on cookie (needed for production HTTPS)
- No token refresh mechanism
- No token blacklist/revocation
- No Post CRUD API or pages yet (model exists in schema only)
- pgAdmin on remote server (`95.111.233.190:5055`) — user was setting up connection to local Postgres

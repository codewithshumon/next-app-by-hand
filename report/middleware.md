# Middleware (proxy.ts)

The middleware runs on every request and handles authentication and role-based access control using JWT tokens stored in an HttpOnly cookie.

## Authentication

- JWT token is read from the `token` cookie
- Verified using `jose` with the `JWT_SECRET` environment variable
- Decoded payload contains: `userId`, `email`, `roles` (array)

## Route Access Matrix

| Route | Unauthenticated | Customer | Admin |
|-------|----------------|----------|-------|
| `/` | Allowed | Allowed | Allowed |
| `/login` | Allowed | Redirects to `/customer` | Redirects to `/admin` |
| `/register` | Allowed | Redirects to `/customer` | Redirects to `/admin` |
| `/api/auth/login` | Allowed | Allowed | Allowed |
| `/api/auth/register` | Allowed | Allowed | Allowed |
| `/customer` | Redirects to `/login` | Allowed | Redirects to `/` |
| `/admin` | Redirects to `/login` | Redirects to `/` | Allowed |
| `/api/users` | Redirects to `/login` | Redirects to `/` | Allowed |
| `/profile` | Redirects to `/login` | Allowed | Allowed |
| `/_next`, `/favicon` | Allowed | Allowed | Allowed |

## Middleware Flow

```
Request
  │
  ├─ Public routes (/login, /register, /api/auth/*)
  │    └─ If logged in → redirect to role-based dashboard
  │    └─ If not logged in → allow
  │
  ├─ Static assets (/_next, /favicon) → allow
  │
  ├─ Home page (/) → allow (always public)
  │
  ├─ Admin routes (/admin, /api/users)
  │    └─ No token → redirect to /login
  │    └─ Not admin → redirect to /
  │    └─ Admin → allow
  │
  ├─ Customer routes (/customer)
  │    └─ No token → redirect to /login
  │    └─ Not customer → redirect to /
  │    └─ Customer → allow
  │
  ├─ Profile routes (/profile)
  │    └─ No token → redirect to /login
  │    └─ Logged in → allow (any role)
  │
  └─ All other routes → allow
```

## Matcher Config

Skips middleware for static files: `_next/static`, `_next/image`, `favicon.ico`, and image files (svg, png, jpg, jpeg, gif, webp).

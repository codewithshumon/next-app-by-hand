# Authentication Flow — Token Lifecycle

## Overview

The app uses JWT (JSON Web Token) stored in an HttpOnly cookie for authentication. No token is stored in Zustand, localStorage, or sessionStorage — only in the cookie.

---

## 1. Login — Token Generation

**Endpoint:** `POST /api/auth/login`

**Flow:**
1. User submits email and password
2. Server finds user in database, verifies password with bcrypt
3. Server creates a JWT containing `{ userId, email, roles }`
4. JWT is signed with `JWT_SECRET` using HMAC-SHA256 (via `jose` library)
5. Token is set as an HttpOnly cookie on the response:

```
Set-Cookie: token=<jwt>; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax
```

6. User data (without token) is returned in the response body
7. Zustand stores user data in memory for UI rendering

```
Browser                           Server
  │                                 │
  │  POST /api/auth/login           │
  │  { email, password }            │
  │ ──────────────────────────────→ │
  │                                 │ Verify password (bcrypt)
  │                                 │ Generate JWT (jose + JWT_SECRET)
  │                                 │
  │  Response + Set-Cookie: token   │
  │ ←────────────────────────────── │
  │                                 │
  │  Zustand: setUser(data.user)    │
  │  Cookie stored automatically    │
```

---

## 2. Using the Token — Authentication on Subsequent Requests

The browser automatically sends the cookie with every request to the same origin. No manual header needed.

**Middleware (proxy.ts):**
1. Reads `token` cookie from the request
2. Verifies JWT signature and expiration using `jose`
3. Extracts `{ userId, email, roles }` from payload
4. Checks route access based on roles
5. Allows or redirects the request

**API routes (e.g., /api/auth/me):**
1. Reads cookie via `cookies()` (server-side)
2. Verifies JWT, gets user ID
3. Fetches fresh user data from database
4. Returns user info

```
Browser                           Server
  │                                 │
  │  GET /customer                  │
  │  Cookie: token=<jwt>            │
  │ ──────────────────────────────→ │
  │                                 │ Middleware reads cookie
  │                                 │ Verify JWT signature
  │                                 │ Check role: customer? → allow
  │                                 │
  │  200 OK (customer page)         │
  │ ←────────────────────────────── │
```

---

## 3. Token Expiration — What Happens

**Token lifetime:** 7 days (`Max-Age=604800`, `expiresIn: "7d"`)

**When token expires:**
1. Browser still sends the cookie (it's still within Max-Age)
2. `jwtVerify()` fails with an expiration error
3. Middleware treats it as no token → redirects to `/login`
4. API routes return `401 Not authenticated`
5. Zustand state is stale — user appears "logged in" in UI but requests fail

**Current limitation:** There is no automatic token refresh. The user must log in again after 7 days.

---

## 4. Logout — Token Destruction

**Endpoint:** `POST /api/auth/logout`

**Flow:**
1. Server responds with an expired cookie to overwrite the existing one:

```
Set-Cookie: token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax
```

2. `Max-Age=0` tells the browser to delete the cookie immediately
3. Zustand state is cleared on the client side via `logout()`

```
Browser                           Server
  │                                 │
  │  POST /api/auth/logout          │
  │  Cookie: token=<jwt>            │
  │ ──────────────────────────────→ │
  │                                 │
  │  Set-Cookie: token=; Max-Age=0  │
  │ ←────────────────────────────── │
  │                                 │
  │  Cookie deleted by browser      │
  │  Zustand: logout() → cleared    │
```

---

## 5. Why HttpOnly Cookie (Not localStorage or Zustand)

| Storage | XSS Risk | CSRF Risk | Auto-sent | Survives Refresh |
|---------|----------|-----------|-----------|-----------------|
| **HttpOnly Cookie** (used) | Safe — JS cannot read | Mitigated by SameSite | Yes | Yes |
| localStorage | Vulnerable — JS can read | Not vulnerable | No (manual header) | Yes |
| Zustand (memory) | Vulnerable if token stored | Not vulnerable | No (manual header) | No |

**Why HttpOnly + SameSite is the right choice:**

- **XSS protection:** If an attacker injects JavaScript into your app, they cannot read the token from an HttpOnly cookie. With localStorage, one XSS vulnerability = token stolen = account compromised.
- **CSRF protection:** `SameSite=Lax` prevents the cookie from being sent on cross-site POST requests. Only same-origin navigation sends it.
- **Automatic:** Browser handles sending the cookie. No need to manually attach `Authorization` headers.

---

## 6. Risks and Gaps in Current Setup

| Risk | Severity | Description |
|------|----------|-------------|
| No token refresh | Medium | After 7 days user is forced to log in again. No silent renewal mechanism. |
| Missing `Secure` flag | Medium (production) | Cookie can be sent over HTTP in production. Should add `Secure` flag for HTTPS-only. |
| No server-side token blacklist | Low | If a token is compromised, it cannot be revoked before expiration. Logout only clears the browser cookie. |
| Zustand stale on expiry | Low | UI shows user as logged in until page refresh reveals the expired token. Could add client-side expiry check. |
| JWT_SECRET in .env | Low | If `.env` is committed to git, the secret is exposed. Ensure `.env` is in `.gitignore`. |

### Recommended Improvements

1. **Add `Secure` flag** — prevents token transmission over HTTP in production
2. **Add token refresh** — issue a new token before the current one expires
3. **Token blacklist** — store invalidated tokens in Redis/database for revocation
4. **Client-side expiry awareness** — decode JWT expiry on client and auto-redirect when expired

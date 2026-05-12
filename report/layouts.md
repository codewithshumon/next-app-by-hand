# App Layouts

## Public Layout — `app/(public)/layout.tsx`

A top navbar + footer layout for unauthenticated and public pages. Wraps the landing page (`/`), login (`/login`), and register (`/register`) routes.

- **Header**: Sticky top navbar with "Store" branding on the left, auth-aware actions on the right
  - Logged out: shows Login and Register links
  - Logged in: shows Admin link (if admin role), Profile link, and Logout button
- **Main**: Full-width content area between header and footer
- **Footer**: Simple centered footer with app name
- **Client component**: Fetches current user on mount via Zustand auth store

```
┌─────────────────────────────────────────┐
│ Header (Store)          Login / Register│
├─────────────────────────────────────────┤
│                                         │
│              {children}                 │
│                                         │
├─────────────────────────────────────────┤
│              Footer                     │
└─────────────────────────────────────────┘
```

---

## Admin Layout — `app/admin/layout.tsx`

A sidebar + header dashboard layout for admin pages. Wraps `/admin` and `/admin/users` routes.

- **Sidebar** (dark, 256px wide):
  - Title: "Admin Panel"
  - Nav links: Dashboard, Users
  - Bottom link: "Back to Store" (returns to `/`)
- **Header**: White bar with "Admin" title and logout button
- **Main**: Content area rendered via `{children}`

```
┌──────────┬──────────────────────────────┐
│ Admin    │ Header (Admin)    [Logout]   │
│ Panel    ├──────────────────────────────┤
│          │                              │
│ Dashboard│                              │
│ Users    │        {children}            │
│          │                              │
│          │                              │
│ ← Store  │                              │
└──────────┴──────────────────────────────┘
```

---

## Customer Layout — `app/customer/layout.tsx`

A sidebar + header dashboard layout for customer pages. Wraps `/customer` route.

- **Sidebar** (dark, 256px wide):
  - Title: "My Account"
  - Nav links: Dashboard
  - Bottom link: "Back to Store" (returns to `/`)
- **Header**: White bar with "Customer" title and logout button
- **Main**: Content area rendered via `{children}`

```
┌──────────┬──────────────────────────────┐
│ My       │ Header (Customer) [Logout]   │
│ Account  ├──────────────────────────────┤
│          │                              │
│ Dashboard│                              │
│          │        {children}            │
│          │                              │
│          │                              │
│ ← Store  │                              │
└──────────┴──────────────────────────────┘
```

# SSR and CSR Components

## Overview

The app uses two rendering strategies in the App Router:

- **SSR (Server-Side Rendering)** — The page is an `async` server component. It queries the database directly via Prisma and returns fully-rendered HTML on every request. No `"use client"` directive. Exported as `dynamic = "force-dynamic"` to guarantee fresh data (no caching).
- **CSR (Client-Side Rendering)** — The page is a client component marked with `"use client"`. It renders an empty/loading shell first, then fetches data from an API route using `fetch()` or SWR after the JavaScript bundle loads in the browser.

---

## 1. SSR Pages — Server Components with Direct DB Access

SSR pages live in the App Router as `async` server components. They never ship JavaScript to the browser for data fetching — the HTML arrives fully populated.

### How SSR Works Here

```
Browser                           Server
  │                                 │
  │  GET /admin/posts               │
  │ ──────────────────────────────→ │
  │                                 │ 1. Read JWT cookie → verify session
  │                                 │ 2. Check role === "admin"
  │                                 │ 3. prisma.post.findMany(...)
  │                                 │ 4. Render full HTML with data
  │                                 │
  │  200 OK (complete HTML table)   │
  │ ←────────────────────────────── │
  │                                 │
  │  (no JS fetch, no loading spin) │
```

### File: `app/admin/posts/page.tsx`

```ts
export const dynamic = "force-dynamic";  // fresh data every request

export default async function AdminPostsPage() {
  // Auth check — server-side cookie reading
  const session = token ? await verifyToken(token) : null;
  if (!session?.roles.includes("admin")) redirect("/login");

  // Direct Prisma query — no API route needed
  const posts = await prisma.post.findMany({
    include: { author: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return <table>...</table>;  // fully-rendered HTML
}
```

**Key characteristics:**
- `dynamic = "force-dynamic"` — bypasses all caching, hits the database on every request
- Server-side auth check via `cookies()` — no client-side auth gate needed
- Direct Prisma call — no HTTP roundtrip to an API route
- Client components for interactive actions are passed only the data they need (e.g., `postId`, `published`)

### File: `app/admin/users/page.tsx`

Same pattern as admin/posts — `async` server component, `dynamic = "force-dynamic"`, direct Prisma query with `include` for relations (profile, roles).

### SSR + Client Component Split

SSR pages render the full table, but interactive buttons (delete, publish) must be client components. The split is:

```
┌─────────────────────────────────────────────────┐
│  app/admin/posts/page.tsx  (Server Component)   │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  Full <table> with Prisma data            │  │
│  │                                           │  │
│  │  ┌─────────────────────┐                  │  │
│  │  │ AdminPostActions    │  ← "use client"  │  │
│  │  │ postId="abc123"     │    Client comp   │  │
│  │  │ published={true}    │                  │  │
│  │  │ [Publish] [Delete]  │    fetch() +     │  │
│  │  └─────────────────────┘    router.refresh │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

After a client action (delete/publish), `router.refresh()` triggers a server re-render — the server component re-queries Prisma and returns fresh HTML. No manual state sync needed.

### File: `app/admin/posts/post-actions.tsx` (Client Component)

```ts
"use client";

export default function AdminPostActions({ postId, published }) {
  const router = useRouter();

  const handleTogglePublish = async () => {
    await fetch(`/api/posts/${postId}`, {
      method: "PUT",
      body: JSON.stringify({ published: !published }),
    });
    router.refresh();  // re-runs the parent server component
  };
}
```

**Why `router.refresh()` instead of SWR or state?** Because the parent is a server component — it doesn't have React state. `router.refresh()` asks Next.js to re-execute the server component and stream the updated HTML without a full page reload.

---

## 2. CSR Pages — Client Components with API Fetching

CSR pages use `"use client"` and fetch data in the browser via `fetch()` or SWR. The server sends a loading shell, then JavaScript populates it.

### How CSR Works Here

```
Browser                           Server
  │                                 │
  │  GET /customer/posts            │
  │ ──────────────────────────────→ │
  │                                 │ Returns static shell (empty div)
  │  200 OK (loading skeleton)      │
  │ ←────────────────────────────── │
  │                                 │
  │  JS hydrates, useSWR fires      │
  │  GET /api/posts                 │
  │ ──────────────────────────────→ │
  │                                 │ Reads JWT, queries Prisma,
  │                                 │ returns JSON
  │  200 OK (JSON array)            │
  │ ←────────────────────────────── │
  │                                 │
  │  React renders post list        │
```

### CSR Pages in the App

| Page | File | Fetch Method | Purpose |
|------|------|-------------|---------|
| Customer Posts List | `app/customer/posts/page.tsx` | `useSWR` | List + delete with cache revalidation |
| New Post | `app/customer/posts/new/page.tsx` | `fetch()` | Form with `useState` |
| Edit Post | `app/customer/posts/[id]/edit/page.tsx` | `useEffect` + `fetch()` | Load then edit |
| Login | `app/(public)/login/page.tsx` | `fetch()` | Auth form |
| Register | `app/(public)/register/page.tsx` | `fetch()` | Auth form |
| Profile | `app/(public)/profile/page.tsx` | Zustand store | Reads from client state |
| Admin Delete User | `app/admin/users/user-actions.tsx` | `fetch()` + `router.refresh()` | Server component action |
| Admin Post Actions | `app/admin/posts/post-actions.tsx` | `fetch()` + `router.refresh()` | Server component action |

### File: `app/customer/posts/page.tsx` (SWR)

```ts
"use client";
import useSWR from "swr";

export default function CustomerPostsPage() {
  const { data: posts, isLoading, error, mutate } = useSWR<Post[]>("/api/posts", fetcher);

  const handleDelete = async (id) => {
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    mutate();  // revalidate SWR cache
  };
}
```

**SWR vs raw `fetch()` here:** SWR provides automatic caching, revalidation on focus/reconnect, deduplication of identical requests, and `mutate()` for manual cache invalidation after a delete. The `isLoading` and `error` states come for free.

### File: `app/customer/posts/new/page.tsx` (Raw fetch)

```ts
"use client";

export default function NewPostPage() {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    const res = await fetch("/api/posts", {
      method: "POST",
      body: JSON.stringify({ title, content, published }),
    });
    if (!res.ok) { setError(...); return; }
    router.push("/customer/posts");
  };
}
```

**Why raw `fetch()` instead of SWR for forms?** SWR is for reading data (GET). For mutations (POST, PUT, DELETE), raw `fetch()` is simpler. After the mutation succeeds, we navigate away (`router.push`) or call `mutate()` to refresh the SWR cache.

### File: `app/customer/posts/[id]/edit/page.tsx` (useEffect + fetch)

```ts
"use client";

export default function EditPostPage() {
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetch(`/api/posts/${params.id}`)
      .then(res => res.json())
      .then(post => { setTitle(post.title); ... });
  }, [params.id]);

  const handleSubmit = async (e) => {
    await fetch(`/api/posts/${params.id}`, {
      method: "PUT",
      body: JSON.stringify({ title, content, published }),
    });
    router.push("/customer/posts");
  };
}
```

This page uses `useEffect` to load the post data on mount, then `fetch()` to submit changes. It could also use SWR's `usePost(id)` hook — the current approach shows both patterns in the codebase.

---

## 3. SSR vs CSR Decision Guide

| Factor | SSR | CSR |
|--------|-----|-----|
| **SEO** | Full HTML in response — crawlers see content | Empty shell — crawlers see nothing |
| **First paint** | Data in HTML, no loading spinner | Loading spinner until JS fetches data |
| **Auth required?** | Server reads cookies directly | Client reads from Zustand / fetches /api/auth/me |
| **Interactivity** | Server component + client action islands | Full client-side interactivity |
| **Cache strategy** | `force-dynamic` = no cache | SWR = client-side cache with revalidation |
| **Best for** | Admin dashboards, tables, protected pages | Interactive forms, real-time lists, public dashboards |

### Where Each is Used

```
SSR (Server Components)                    CSR (Client Components)
─────────────────────                      ───────────────────────
/admin/posts    → Posts table              /customer/posts      → SWR post list
/admin/users    → Users table              /customer/posts/new  → Create form
/blog           → ISR (revalidate=60)      /customer/posts/[id]/edit → Edit form
/blog/[id]      → ISR + generateStaticParams  /login             → Login form
                (public, SEO-friendly)     /register           → Register form
                                            /profile            → Zustand state
```

---

## 4. Data Flow Comparison

### SSR Data Flow (Admin Posts)

```
Request → middleware.ts (auth check)
        → server component reads cookies()
        → verifyToken() → session
        → prisma.post.findMany() → data
        → render HTML with data
        → inject client islands (AdminPostActions)
        → response to browser
```

### CSR Data Flow (Customer Posts)

```
Request → static HTML shell (no data)
        → browser receives empty page
        → JS hydrates "use client" component
        → useSWR("/api/posts", fetcher)
        → fetch("/api/posts")
        → API route reads cookies() → session
        → prisma.post.findMany() → data
        → Response.json(posts)
        → SWR caches + React renders
```

The key difference: SSR renders data into HTML on the server. CSR sends empty HTML, then JavaScript fetches JSON from an API route.

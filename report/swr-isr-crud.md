# SWR and ISR — Post CRUD

## Overview

This app uses two data strategies for the Post CRUD:

- **ISR (Incremental Static Regeneration)** — Public blog pages (`/blog`, `/blog/[id]`) are statically generated and cached, then revalidated every 60 seconds. Uses `export const revalidate` and `generateStaticParams`.
- **SWR (Stale-While-Revalidate)** — Customer post management (`/customer/posts`) fetches data client-side with automatic caching, deduplication, and background revalidation. Uses the `swr` library.

Both strategies hit the same API routes and Prisma queries — the difference is **where** and **when** data is fetched.

---

## 1. ISR — Incremental Static Regeneration

ISR generates static HTML pages at build time, then revalidates them in the background at a fixed interval. This gives the speed of static pages with the freshness of dynamic content.

### How ISR Works Here

```
                         Build Time
                         ──────────
                         generateStaticParams()
                         → prisma.post.findMany()
                         → [ { id: "abc" }, { id: "def" } ]
                         → Pre-render /blog/abc and /blog/def as static HTML


First Request            After 60 seconds          Second Request
─────────────            ────────────────          ──────────────
Return cached            Trigger background         Return new cached
static HTML              revalidation:              static HTML
                         → prisma.post.findMany()
                         → Regenerate HTML
                         → Replace cache
```

### File: `app/(public)/blog/page.tsx` — Blog Listing

```ts
export const revalidate = 60;  // revalidate every 60 seconds

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return <div>{posts.map(post => <article>...</article>)}</div>;
}
```

**How it works:**
1. At build time, the page runs the Prisma query and generates static HTML
2. The HTML is cached on the server (CDN in production)
3. When a request comes in, the cached HTML is served instantly
4. If the cache is older than 60 seconds, a background request re-runs the Prisma query and regenerates the HTML
5. The next request gets the updated page

**Build output:** `○ /blog  revalidate: 1m` — Next.js marks it as ISR with 1-minute revalidation.

### File: `app/(public)/blog/[id]/page.tsx` — Individual Blog Post

```ts
export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { id: true },
  });
  return posts.map((p) => ({ id: p.id }));
}

export default async function BlogPostPage(props) {
  const { id } = await props.params;
  const post = await prisma.post.findUnique({ where: { id }, include: ... });
  if (!post || !post.published) notFound();
  return <article>...</article>;
}
```

**How it works:**
1. `generateStaticParams()` runs at build time, returning all published post IDs
2. Next.js pre-renders `/blog/abc`, `/blog/def`, etc. as static HTML
3. If a new post is created, the first request to `/blog/new-id` generates it on-demand (ISR fallback)
4. All pages revalidate every 60 seconds

**Build output:** `● /blog/[id]` — SSG with `generateStaticParams`.

### ISR Timing Diagram

```
Time    0s          30s         60s         90s         120s
        │           │           │           │           │
Cache   [BUILD]─────│──STALE────│──REVALID──│──FRESH────│──STALE──
        │           │           │           │           │
        build       served      background  served      background
        query       from cache  requery     from new    requery
                                + rebuild   cache       + rebuild
```

- **0–60s:** Serve cached HTML (fast, no DB hit)
- **60–61s:** Serve stale HTML, trigger background regeneration
- **61–120s:** Serve newly regenerated HTML (fast, no DB hit)
- **Repeats:** Every 60 seconds, one request triggers a background revalidation

### ISR vs SSR vs CSR

| Aspect | ISR | SSR | CSR |
|--------|-----|-----|-----|
| **Where HTML is generated** | Server (at build + background) | Server (every request) | Browser |
| **Database hits** | 1 per 60s per page | 1 per request | 1 per SWR revalidation |
| **Time to first byte** | Instant (cached) | Slow (DB query) | Fast (shell) + slow (JS fetch) |
| **SEO** | Full HTML, always indexable | Full HTML, always indexable | Empty shell, not indexable |
| **Freshness** | Up to 60s stale | Always fresh | Always fresh (after JS loads) |
| **Best for** | Public blog, marketing pages | Admin dashboards, private data | Interactive dashboards |

---

## 2. SWR — Stale-While-Revalidate (Client-Side Data Fetching)

SWR is a client-side data fetching library. It returns cached data immediately (stale), then revalidates in the background (revalidate). This gives instant renders with eventual consistency.

### SWR Architecture in the App

```
┌─────────────────────────────────────────────────────┐
│                   Browser                            │
│                                                     │
│  ┌─────────────┐     ┌──────────────┐               │
│  │ useSWR()    │────→│ fetcher()    │               │
│  │ hook call   │     │ lib/fetcher  │               │
│  └──────┬──────┘     └──────┬───────┘               │
│         │                   │                       │
│    cache hit?          fetch("/api/posts")          │
│         │                   │                       │
│    ┌────┴────┐              │                       │
│    │         │              │                       │
│   YES       NO             │                       │
│    │         │              │                       │
│  return   show          ┌───┴────────────┐          │
│  cached   loading...    │  API Route     │          │
│  data     spinner       │  /api/posts    │          │
│    │                     │                │          │
│    │         ┌───────────│  getSession()  │          │
│  trigger     │           │  prisma.find() │          │
│  background  │           │  Response.json │          │
│  revalidate  │           └───┬────────────┘          │
│    │         │               │                       │
│    │    receive JSON         │                       │
│    │         │               │                       │
│    └────→ update cache ←────┘                       │
│           + re-render                               │
└─────────────────────────────────────────────────────┘
```

### File: `lib/fetcher.ts` — Shared Fetch Wrapper

```ts
export async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}
```

Every SWR hook uses this fetcher. It prepends `/api`, checks for errors, and returns typed JSON.

### File: `lib/use-posts.ts` — Reusable SWR Hooks

```ts
export function usePosts(authorId?: string) {
  const endpoint = authorId ? `/posts?authorId=${authorId}` : "/posts";
  const { data, error, isLoading, mutate } = useSWR<Post[]>(endpoint, fetcher);
  return { posts: data ?? [], error, isLoading, mutate };
}

export function usePost(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Post>(
    id ? `/posts/${id}` : null,   // null = don't fetch
    fetcher
  );
  return { post: data, error, isLoading, mutate };
}
```

**Key patterns:**
- **Conditional fetching:** `id ? /posts/${id} : null` — SWR skips the request when the key is `null`
- **`mutate()` return:** Exposed so consumers can trigger manual revalidation after mutations
- **`data ?? []` default:** Prevents undefined errors when rendering before data arrives

### File: `app/customer/posts/page.tsx` — SWR in Action

```ts
"use client";
import useSWR from "swr";

export default function CustomerPostsPage() {
  const { data: posts, isLoading, error, mutate } = useSWR<Post[]>("/api/posts", fetcher);

  const handleDelete = async (id: string) => {
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    mutate();  // invalidate SWR cache → refetch
  };
}
```

**SWR lifecycle for this page:**

```
1. Component mounts
2. useSWR("/api/posts", fetcher) — cache miss
3. isLoading = true → render "Loading..."
4. fetcher("/api/posts") → GET /api/posts
5. API route → prisma.post.findMany() → JSON response
6. SWR caches the response under key "/api/posts"
7. isLoading = false, data = [post1, post2, ...]
8. React renders post list

--- User clicks Delete ---

9. fetch("/api/posts/abc", { method: "DELETE" })
10. mutate() → SWR invalidates cache for "/api/posts"
11. fetcher("/api/posts") → GET /api/posts (refetch)
12. SWR updates cache → React re-renders with updated list

--- User switches tabs and comes back ---

13. useSWR("/api/posts", fetcher) — cache hit!
14. Immediately renders cached data (stale)
15. Background: fetcher("/api/posts") → revalidates
16. If data changed → silently updates the render
```

### SWR Features Used

| Feature | How It's Used | Benefit |
|---------|--------------|---------|
| **Caching** | Same key `/api/posts` is cached across renders | No duplicate fetches when switching tabs |
| **Revalidation on focus** | Default SWR behavior | Data refreshes when user returns to tab |
| **Revalidation on reconnect** | Default SWR behavior | Data refreshes when network reconnects |
| **Deduplication** | Multiple components with same SWR key | One fetch shared across all consumers |
| **`mutate()`** | Called after DELETE | Manual cache invalidation after mutation |
| **Error handling** | `error` from useSWR | Automatic error state from fetch failures |
| **Loading state** | `isLoading` from useSWR | Automatic loading spinner on first fetch |

---

## 3. Full CRUD API Routes

Both ISR and SWR pages consume the same API routes. Here's the complete Post CRUD:

### `app/api/posts/route.ts`

| Method | Endpoint | Auth | Behavior |
|--------|----------|------|----------|
| `GET` | `/api/posts` | None (public) | Returns published posts only |
| `GET` | `/api/posts?authorId=xyz` | None | Returns all posts (including drafts) for that author |
| `POST` | `/api/posts` | Any logged-in user | Creates a post, sets `authorId` from session |

### `app/api/posts/[id]/route.ts`

| Method | Endpoint | Auth | Behavior |
|--------|----------|------|----------|
| `GET` | `/api/posts/[id]` | Published = public, Draft = owner/admin | Returns single post |
| `PUT` | `/api/posts/[id]` | Owner or admin | Updates title/content/published |
| `DELETE` | `/api/posts/[id]` | Owner or admin | Deletes the post |

### Access Control Matrix

```
Action         Public    Customer (author)    Customer (not author)    Admin
─────────      ──────    ─────────────────    ─────────────────────    ─────
GET published  Yes       Yes                  Yes                      Yes
GET draft      No        Yes (own posts)      No                       Yes
POST create    No        Yes                  N/A                      Yes
PUT update     No        Yes (own posts)      No                       Yes
DELETE         No        Yes (own posts)      No                       Yes
```

---

## 4. Which Strategy Serves Which Page

```
Route                        Strategy    Data Source           Cache Layer
──────────────────────────   ─────────   ──────────────────   ────────────
GET /blog                    ISR         Prisma (server)       Next.js CDN cache (60s)
GET /blog/[id]               ISR         Prisma (server)       Next.js CDN cache (60s)
GET /admin/posts             SSR         Prisma (server)       None (force-dynamic)
GET /customer/posts          CSR + SWR   /api/posts (client)   SWR memory cache
POST /customer/posts/new     CSR         /api/posts (client)   mutate() on success
PUT /customer/posts/[id]     CSR         /api/posts/[id]       router.push on success
DELETE (any)                 CSR         /api/posts/[id]       mutate() or router.refresh()
```

---

## 5. SWR + ISR Interaction

When a customer publishes a post through the CSR flow, ISR pages pick up the change on the next revalidation cycle:

```
Customer creates post (CSR)          Blog page (ISR)
───────────────────────              ───────────────
1. POST /api/posts                   3. Background timer (60s)
   { title, published: true }           ↓
2. Post saved to DB                 4. revalidate fires
   mutate() → SWR refreshes            prisma.post.findMany()
                                       New post appears in list
                                       Static HTML regenerated
                                    5. Next visitor sees new post
```

There is up to 60 seconds of delay between a post being published and it appearing on the blog. For real-time updates, ISR is not the right choice — use CSR + SWR or WebSocket instead. The 60-second delay is acceptable for a public blog where SEO and performance matter more than instant updates.

---

## 6. Shared Infrastructure

### Files shared by both ISR and SWR

```
lib/prisma.ts     → PrismaClient singleton (used by server components + API routes)
lib/auth.ts       → JWT session helpers (used by SSR auth checks + API route guards)
lib/fetcher.ts    → fetch wrapper (used by SWR hooks)
lib/use-posts.ts  → usePosts() / usePost() hooks (used by CSR pages)
```

### Seed Data (`prisma/seed.ts`)

Three sample posts are created for the admin user:

| # | Title | Published | Purpose |
|---|-------|-----------|---------|
| 1 | Getting Started with Next.js Rendering Patterns | Yes | ISR demo |
| 2 | Understanding SWR for Data Fetching | Yes | ISR demo |
| 3 | Work in Progress: Advanced Patterns | No | Draft — visible in admin SSR and customer CSR, not in public ISR |

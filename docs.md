CRUN server side and client side
page layout public and private
middleware public and private
server side and clent side component togather used 'action only client side'
SWR, ISR need to use both in same component
zustand state management (increment, depliment, reset)
authentication session with zuatand, with time...
RBAC admin, create role and assion role. user login with role
websocket with nextjs
nextjs job and queue BullMQ
pub sub with websocket redis - model, event, trigger
service for controller function
handle 1M req per second
use try catch function, error show in seperate file
DB ACID with try catch function - commit, - role back
prisma - one to one, one ot many, many to many, solve circular error, n+1 query solve, egar loading and lazy loading (database)



Create CRUD with CSR + SSR with SWR + ISR. Including ORM (1:1, 1:M, M:M), + use layout for 2 user way (Admin, customer), use middleware for RBAC. And use user way layout.

## Rendering Patterns — Applied

### ISR (Incremental Static Regeneration)
- `/blog` — lists published posts, `revalidate = 60s`
- `/blog/[id]` — individual post with `generateStaticParams` + `revalidate = 60s`

### SSR (Server-Side Rendering)
- `/admin/posts` — `dynamic = "force-dynamic"`, direct Prisma query in async server component, fresh data every request
- `/admin/users` — same SSR pattern (existing)

### CSR + SWR (Client-Side Rendering)
- `/customer/posts` — SWR fetches `/api/posts` on the client, auto-revalidates
- `/customer/posts/new` — CSR form with `useState`
- `/customer/posts/[id]/edit` — CSR fetch + form
- `lib/use-posts.ts` — reusable SWR hooks (`usePosts`, `usePost`)
- `lib/fetcher.ts` — shared fetcher for SWR

### API Routes (Post CRUD)
- `GET /api/posts` — published posts (public) or filter by authorId
- `POST /api/posts` — create (authenticated)
- `GET /api/posts/[id]` — single post (published or owner/admin)
- `PUT /api/posts/[id]` — update (owner or admin)
- `DELETE /api/posts/[id]` — delete (owner or admin)





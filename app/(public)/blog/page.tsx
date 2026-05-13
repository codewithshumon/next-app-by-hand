import Link from "next/link";

const REVALIDATE_SECONDS = 60;

export default async function BlogPage() {
  let posts: { id: string; title: string; content: string | null; createdAt: string; author: { name: string } }[] = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/posts`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (res.ok) posts = await res.json();
  } catch {
    // API unavailable at build time — ISR will regenerate at runtime
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>

      {posts.length === 0 ? (
        <p className="text-gray-500">No posts yet.</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <article key={post.id} className="border rounded-lg p-6 hover:shadow transition-shadow">
              <Link href={`/blog/${post.id}`}>
                <h2 className="text-xl font-semibold mb-2 hover:text-blue-600">{post.title}</h2>
              </Link>
              {post.content && (
                <p className="text-gray-600 line-clamp-3 mb-3">{post.content}</p>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>By {post.author.name}</span>
                <span>&middot;</span>
                <time>{new Date(post.createdAt).toLocaleDateString()}</time>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-10 text-xs text-gray-400">
        ISR &middot; revalidate = {REVALIDATE_SECONDS}s
      </p>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";

const REVALIDATE_SECONDS = 60;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateStaticParams() {
  try {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const posts: { id: string }[] = await res.json();
    return posts.map((p) => ({ id: p.id }));
  } catch {
    return [];
  }
}

export default async function BlogPostPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  let post: { id: string; title: string; content: string | null; published: boolean; createdAt: string; author: { name: string } } | null = null;
  try {
    const res = await fetch(`${BASE_URL}/api/posts/${id}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (res.ok) post = await res.json();
  } catch {
    // API unavailable — ISR will retry
  }

  if (!post || !post.published) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link href="/blog" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
        &larr; Back to Blog
      </Link>

      <article>
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-8">
          <span>By {post.author.name}</span>
          <span>&middot;</span>
          <time>{new Date(post.createdAt).toLocaleDateString()}</time>
        </div>
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{post.content}</p>
        </div>
      </article>

      <p className="mt-10 text-xs text-gray-400">
        ISR &middot; revalidate = {REVALIDATE_SECONDS}s &middot; generateStaticParams
      </p>
    </div>
  );
}

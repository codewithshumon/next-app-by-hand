import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

// ISR: revalidate individual post pages every 60 seconds
export const revalidate = 60;

// Pre-generate pages for all published posts at build time
// Falls back to empty array if DB is unavailable (pages generated on-demand via ISR)
export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: { id: true },
    });
    return posts.map((p) => ({ id: p.id }));
  } catch {
    return [];
  }
}

export default async function BlogPostPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: { select: { name: true } } },
  });

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
        ISR &middot; revalidate = {revalidate}s &middot; generateStaticParams
      </p>
    </div>
  );
}

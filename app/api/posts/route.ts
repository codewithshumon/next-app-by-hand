import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/posts — published posts (public) or all (author's own)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authorId = searchParams.get("authorId");
  const session = await getSession();

  if (authorId) {
    // Customer fetching their own posts (all, including drafts)
    const posts = await prisma.post.findMany({
      where: { authorId },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(posts);
  }

  // Public: only published posts
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(posts);
}

// POST /api/posts — create post (authenticated user)
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, content, published } = await request.json();

  const post = await prisma.post.create({
    data: {
      title,
      content,
      published: published ?? false,
      authorId: session.userId,
    },
    include: { author: { select: { name: true } } },
  });

  return Response.json(post, { status: 201 });
}

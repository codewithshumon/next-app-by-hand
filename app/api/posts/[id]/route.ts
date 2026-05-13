import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/posts/[id]
export async function GET(_req: Request, ctx: RouteContext<"/api/posts/[id]">) {
  const { id } = await ctx.params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: { select: { name: true } } },
  });

  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  if (!post.published) {
    const session = await getSession();
    if (!session || (session.userId !== post.authorId && !session.roles.includes("admin"))) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
  }

  return Response.json(post);
}

// PUT /api/posts/[id]
export async function PUT(request: Request, ctx: RouteContext<"/api/posts/[id]">) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });

  if (post.authorId !== session.userId && !session.roles.includes("admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, content, published } = await request.json();
  const updated = await prisma.post.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(published !== undefined && { published }),
    },
    include: { author: { select: { name: true } } },
  });

  return Response.json(updated);
}

// DELETE /api/posts/[id]
export async function DELETE(_req: Request, ctx: RouteContext<"/api/posts/[id]">) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });

  if (post.authorId !== session.userId && !session.roles.includes("admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.post.delete({ where: { id } });
  return Response.json({ message: "Deleted" });
}

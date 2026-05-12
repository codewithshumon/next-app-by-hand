import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hashSync } from "bcryptjs";

export async function GET(_req: Request, ctx: RouteContext<"/api/users/[id]">) {
  const session = await getSession();
  if (!session?.roles.includes("admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true, roles: { include: { role: true } } },
  });

  if (!user) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({
    id: user.id,
    email: user.email,
    name: user.name,
    profile: user.profile,
    roles: user.roles.map((ur) => ur.role.name),
  });
}

export async function PUT(request: Request, ctx: RouteContext<"/api/users/[id]">) {
  const session = await getSession();
  if (!session?.roles.includes("admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const { name, email, password, roleNames, bio, phone } = await request.json();

  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (password) data.password = hashSync(password, 10);

  if (bio !== undefined || phone !== undefined) {
    data.profile = { upsert: { create: { bio, phone }, update: { bio, phone } } };
  }

  if (roleNames?.length) {
    const roles = await prisma.role.findMany({ where: { name: { in: roleNames } } });
    await prisma.userRole.deleteMany({ where: { userId: id } });
    data.roles = { create: roles.map((r) => ({ roleId: r.id })) };
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { profile: true, roles: { include: { role: true } } },
  });

  return Response.json({
    id: user.id,
    email: user.email,
    name: user.name,
    profile: user.profile,
    roles: user.roles.map((ur) => ur.role.name),
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/users/[id]">) {
  const session = await getSession();
  if (!session?.roles.includes("admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (session.userId === id) {
    return Response.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return Response.json({ message: "Deleted" });
}

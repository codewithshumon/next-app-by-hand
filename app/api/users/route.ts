import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hashSync } from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session?.roles.includes("admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    include: { profile: true, roles: { include: { role: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      profile: u.profile,
      roles: u.roles.map((ur) => ur.role.name),
      createdAt: u.createdAt,
    }))
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.roles.includes("admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, password, roleNames, bio, phone } = await request.json();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "Email already exists" }, { status: 409 });
  }

  const roles = roleNames?.length
    ? await prisma.role.findMany({ where: { name: { in: roleNames } } })
    : await prisma.role.findMany({ where: { name: "customer" } });

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashSync(password, 10),
      profile: bio || phone ? { create: { bio, phone } } : undefined,
      roles: { create: roles.map((r) => ({ roleId: r.id })) },
    },
    include: { profile: true, roles: { include: { role: true } } },
  });

  return Response.json({
    id: user.id,
    email: user.email,
    name: user.name,
    profile: user.profile,
    roles: user.roles.map((ur) => ur.role.name),
  }, { status: 201 });
}

import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { hashSync } from "bcryptjs";

export async function POST(request: Request) {
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return Response.json({ error: "All fields required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "Email already registered" }, { status: 409 });
  }

  const customerRole = await prisma.role.findUnique({ where: { name: "customer" } });
  if (!customerRole) {
    return Response.json({ error: "Customer role not found. Run seed first." }, { status: 500 });
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashSync(password, 10),
      roles: { create: { roleId: customerRole.id } },
    },
    include: { roles: { include: { role: true } } },
  });

  const roles = user.roles.map((ur) => ur.role.name);
  const token = await signToken({ userId: user.id, email: user.email, roles });

  const response = Response.json({
    user: { id: user.id, email: user.email, name: user.name, roles },
  });

  response.headers.append(
    "Set-Cookie",
    `token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`
  );

  return response;
}

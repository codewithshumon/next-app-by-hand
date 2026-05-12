import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { compareSync } from "bcryptjs";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: { include: { role: true } },
    },
  });

  if (!user || !compareSync(password, user.password)) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

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

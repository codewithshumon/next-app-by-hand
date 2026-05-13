import "dotenv/config";
import { hashSync } from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminRole = await prisma.role.create({ data: { name: "admin" } });
  await prisma.role.create({ data: { name: "customer" } });

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      password: hashSync("admin123", 10),
      roles: { create: { roleId: adminRole.id } },
    },
  });

  // Sample posts for ISR blog demo
  await prisma.post.createMany({
    data: [
      {
        title: "Getting Started with Next.js Rendering Patterns",
        content: "Next.js supports multiple rendering strategies: SSR, CSR, ISR, and SSG. Each has its own use case. Server-Side Rendering is great for dynamic, personalized content. Client-Side Rendering works well for interactive dashboards. ISR gives you the best of static and dynamic worlds.",
        published: true,
        authorId: admin.id,
      },
      {
        title: "Understanding SWR for Data Fetching",
        content: "SWR (stale-while-revalidate) is a strategy for client-side data fetching. It first returns cached (stale) data, then sends a request to revalidate, and finally comes back with up-to-date data. This provides a fast, reactive user experience.",
        published: true,
        authorId: admin.id,
      },
      {
        title: "Work in Progress: Advanced Patterns",
        content: "This is a draft post about advanced Next.js patterns including parallel routes, intercepting routes, and server actions.",
        published: false,
        authorId: admin.id,
      },
    ],
  });

  console.log("Seed data created successfully");
  console.log("Admin: admin@example.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

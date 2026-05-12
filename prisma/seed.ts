import "dotenv/config";
import { hashSync } from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminRole = await prisma.role.create({ data: { name: "admin" } });
  await prisma.role.create({ data: { name: "customer" } });

  await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      password: hashSync("admin123", 10),
      roles: { create: { roleId: adminRole.id } },
    },
  });

  console.log("Seed data created successfully");
  console.log("Admin: admin@example.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import "dotenv/config";
import { hashSync } from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminRole = await prisma.role.create({ data: { name: "admin" } });
  const customerRole = await prisma.role.create({ data: { name: "customer" } });

  await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      password: hashSync("admin123", 10),
      profile: { create: { bio: "System administrator", phone: "+1234567890" } },
      roles: { create: { roleId: adminRole.id } },
    },
  });

  await prisma.user.create({
    data: {
      email: "john@example.com",
      name: "John Doe",
      password: hashSync("password123", 10),
      profile: { create: { bio: "Coffee enthusiast", phone: "+1987654321" } },
      roles: { create: { roleId: customerRole.id } },
    },
  });

  await prisma.user.create({
    data: {
      email: "jane@example.com",
      name: "Jane Smith",
      password: hashSync("password123", 10),
      roles: { create: { roleId: customerRole.id } },
    },
  });

  console.log("Seed data created successfully");
  console.log("Admin: admin@example.com / admin123");
  console.log("Customer 1: john@example.com / password123");
  console.log("Customer 2: jane@example.com / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

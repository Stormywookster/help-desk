import { prisma } from "../src/db.js";
import { seedDatabase } from "../src/seed.js";

await seedDatabase(prisma);
await prisma.$disconnect();

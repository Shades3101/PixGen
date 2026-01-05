import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
export * from "./generated/prisma/client"


//Prisma Singleton
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const globalForPrisma = global as unknown as { prismaClient: PrismaClient };

export const prismaClient =
  globalForPrisma.prismaClient || new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaClient = prismaClient;
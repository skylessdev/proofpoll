import { PrismaClient } from '@prisma/client'

// Create fresh client for each request to avoid prepared statement conflicts
export function createDb() {
  return new PrismaClient({
    log: ['error', 'warn'],
  })
}

// Fallback singleton for non-request contexts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createDb()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
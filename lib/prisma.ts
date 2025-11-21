/**
 * Prisma Client Instance with Connection Pooling
 * 
 * Singleton pattern for Prisma Client to avoid multiple instances
 * in development hot-reload scenarios.
 * 
 * PostgreSQL connection pool configuration:
 * - Prisma automatically manages connection pooling
 * - Connection pool size can be configured via DATABASE_URL query params
 * - Example: postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
 */

import { PrismaClient } from '@prisma/client'

console.log('Initializing Prisma Client...')
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL)
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 10))
} else {
  console.error('CRITICAL: DATABASE_URL is missing!')
}


const globalForPrisma = globalThis as unknown as {
  prisma_v2: PrismaClient | undefined
}

// Connection pool configuration
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'file:./dev.db',
      },
    },
  })
}

export const prisma = globalForPrisma.prisma_v2 ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v2 = prisma

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

// Health check helper
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}


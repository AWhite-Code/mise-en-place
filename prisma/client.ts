import { PrismaClient } from '@prisma/client';

// Uses default .db unless NODE_ENV is set to test, usually by package.json
function createPrismaClient() {
  if (process.env.NODE_ENV === 'test') {
    return new PrismaClient({
      datasources: {
        db: {
          url: 'file:./prisma/test.db'
        }
      }
    });
  }
  
  return new PrismaClient(); // Uses the DATABASE_URL from .env
}

// Create a singleton instance and exports
const prisma = createPrismaClient();
export { prisma };
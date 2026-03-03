/**
 * @module prisma/client
 * Singleton PrismaClient instance shared across the application.
 *
 * Import from here rather than constructing new PrismaClient() elsewhere
 * to avoid multiple connection pools in development or test.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export { prisma };

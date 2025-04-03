import { prisma } from './prisma/client';
import { resetWithBaseSeed } from './prisma/utils/db-utils';

beforeAll(async () => {
    await resetWithBaseSeed();      // Initialize test database with base seed
});

afterAll(async () => {
    await prisma.$disconnect();
});
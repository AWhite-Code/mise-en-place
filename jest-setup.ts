import { execSync } from 'child_process';
import { prisma } from './prisma/client.js';
import { resetWithBaseSeed } from './prisma/utils/db-utils.js';

beforeAll(async () => {

    // Point to the test database
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    console.log('Applying migrations to test database...');
    execSync('npx prisma migrate deploy');
    
    // Initialize test database with base seed
    console.log('Seeding test database...');
    await resetWithBaseSeed();
});

afterAll(async () => {
    await prisma.$disconnect();
});
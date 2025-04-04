import { execSync } from 'child_process';
import { prisma } from './prisma/client';
import { resetWithBaseSeed } from './prisma/utils/db-utils';

beforeAll(async () => {

    // Set up the test database schema
    console.log('Applying migrations to test database...');
    execSync('npx prisma migrate deploy', { 
        env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' } 
    });
    
    // Initialize test database with base seed
    console.log('Seeding test database...');
    await resetWithBaseSeed();
});

afterAll(async () => {
    await prisma.$disconnect();
});
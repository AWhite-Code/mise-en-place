import supertest from 'supertest';
import { app, server } from '../src/server.js'; // Import app and server
import { prisma } from '../prisma/client.js';
import { resetWithBaseSeed, cleanDatabase } from '../prisma/utils/db-utils.js';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables for this test file
dotenv.config({ path: './.env.test' });

const request = supertest(app);

describe('Recipe API', () => {
    
    beforeAll(() => {
        execSync('npx prisma migrate deploy');
    });

    beforeEach(async () => {
        await resetWithBaseSeed();
    });

    afterEach(async () => {
    await cleanDatabase();
    });

    afterAll(async () => {
        await prisma.$disconnect();
        server.close();
    });
    
    test('should retrieve the Beef Chili recipe via API', async () => {
        const recipe = await prisma.recipe.findFirst({
            where: { name: 'Beef Chili' }
        });

        const response = await request.get(`/api/recipes/${recipe?.id}`);

        expect(response.status).toBe(200);
        expect(response.body.name).toContain('Beef Chili');
    });

        test('GET /api/recipes should return all seeded recipes', async () => {
        const response = await request.get('/api/recipes');

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(1);
        expect(response.body[0].name).toBe('Beef Chili');
    });
});
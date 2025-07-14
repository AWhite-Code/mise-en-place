import supertest from 'supertest';
import { app, server } from '../src/server.js'; // Import app and server
import { prisma } from '../prisma/client.js';
import { resetWithBaseSeed } from '../prisma/utils/db-utils.js';
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

    afterAll(async () => {
        await prisma.$disconnect();
        server.close();
    });
    
    test('should retrieve the Beef Chili recipe via API', async () => {
        const recipe = await prisma.recipe.findFirst({
            where: { name: 'Beef Chili' }
        });

        const response = await request.get(`/api/recipes/${recipe?.id}`); // NOTE: This route doesn't exist yet!

        expect(response.status).toBe(200);
        expect(response.body.description).toContain('Chilli con Carne');
    });
});
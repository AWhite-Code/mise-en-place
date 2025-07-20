import supertest from 'supertest';
import { app, server } from '../src/server.js';
import { prisma } from '../prisma/client.js';
import { resetWithBaseSeed } from '../prisma/utils/db-utils.js';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

const REQUEST = supertest(app);

dotenv.config({ path: './.env.test' });

describe('Ingredient API', () => {
    
    // Run migrations on the test database before any tests run
    beforeAll(() => {
        console.log('Applying migrations to test database...');
        execSync('npx prisma migrate deploy');
    });

    // Seed the database before each test
    beforeEach(async () => {
        await resetWithBaseSeed();
    });

    // Disconnect from the database after all tests are done
    afterAll(async () => {
        await prisma.$disconnect();
        server.close();
    });

    describe('GET Requests', () => {
        test('GET /api/ingredients should return all seeded ingredients', async () => {
            const RESPONSE = await REQUEST.get('/api/ingredients');
            
            expect(RESPONSE.status).toBe(200);
            expect(RESPONSE.body).toBeInstanceOf(Array);
            expect(RESPONSE.body.length).toBeGreaterThan(0);
        });

        test('GET /api/ingredients should return the first ingredient', async () =>{
            const Ingredient_ID = await prisma.ingredient.findFirst({
                where: { name: 'Onion'}
            });
            const ONION_ID = Ingredient_ID?.id;
            const RESPONSE = await REQUEST.get(`/api/ingredients/${ONION_ID}`);

            expect(RESPONSE.status).toBe(200);
            expect(RESPONSE.body).toBeInstanceOf(Object);
            expect(RESPONSE.body.id).toBe(ONION_ID);
            expect(RESPONSE.body.name).toBe('Onion');
        })

        test('GET /api/ingredients?search=Garlic should return the "Garlic" ingredient', async () => {
            const response = await REQUEST.get('/api/ingredients?search=Garlic');
        
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe('Garlic');
        });

        // Failure Tests
        test('GET /api/ingredients/:id should return 404 for a non-existent ID', async () => {
            const fakeId = randomUUID();
            const response = await REQUEST.get(`/api/ingredients/${fakeId}`);
            expect(response.status).toBe(404);
        });

        test('GET /api/ingredients?search=... should return an empty array for no matches', async () => {
        const response = await REQUEST.get('/api/ingredients?search=nonexistentingredient');

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(0);
        });
    });

    describe('POST Requests', () => {
        test('should create a new ingredient and return it with status 201', async () => {
            const newIngredient = {
                name: 'Potato', // If altering tests make sure it is capitalised to test if API is normalising the inputs
            };

            const response = await REQUEST.post('/api/ingredients').send(newIngredient);

            expect(response.status).toBe(201);
            expect(response.body.id).toBeDefined();
            expect(response.body.name).toBe('potato');  // Output should always be all lower case
        });

        // Failure Tests
        test('should return status 400 if name is missing', async () => {
            const response = await REQUEST.post('/api/ingredients').send({}); // Send an empty body

            expect(response.status).toBe(400);
        });
    });


    describe('PATCH Requests', () => {
        test('PATCH /api/ingredients/:id should update an ingredient name', async () => {
            const ingredientToUpdate = await prisma.ingredient.findFirst({
                where: { name: 'Onion' },
            });
            const onionId = ingredientToUpdate?.id;

            const updatedData = { name: 'yellow onion' };

            const response = await REQUEST.patch(`/api/ingredients/${onionId}`).send(updatedData);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('yellow onion');
            expect(response.body.id).toBe(onionId);
        });
    });
});
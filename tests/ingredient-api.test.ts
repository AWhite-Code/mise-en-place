import supertest from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../prisma/client.js';
import { resetWithBaseSeed, cleanDatabase } from '../prisma/utils/db-utils.js';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

const REQUEST = supertest(app);

describe('Ingredient API', () => {

    beforeAll(() => {
        console.log('Test DATABASE_URL:', process.env.DATABASE_URL);
        execSync('npx prisma migrate deploy', {
            env: { ...process.env },
        });
    });

    beforeEach(async () => {
        await resetWithBaseSeed();
    });

    afterEach(async () => {
        await cleanDatabase();
    });

    afterAll(async () => {
        await prisma.$disconnect();
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
                where: { name: 'onion'}
            });
            const ONION_ID = Ingredient_ID?.id;
            const RESPONSE = await REQUEST.get(`/api/ingredients/${ONION_ID}`);

            expect(RESPONSE.status).toBe(200);
            expect(RESPONSE.body).toBeInstanceOf(Object);
            expect(RESPONSE.body.id).toBe(ONION_ID);
            expect(RESPONSE.body.name).toBe('onion');
        })

        test('GET /api/ingredients?search=garlic should return the "garlic" ingredient', async () => {
            const response = await REQUEST.get('/api/ingredients?search=garlic');
        
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe('garlic');
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
                name: 'Potato', // Note when altering tests make sure it is capitalised to test if API is normalising the inputs
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

        test('should return 409 if an ingredient with the same name already exists', async () => {
            const response = await REQUEST.post('/api/ingredients').send({ name: 'Onion' });

            expect(response.status).toBe(409);
            expect(response.body.error).toContain('already exists');
        });
    });


    describe('PATCH Requests', () => {
        test('PATCH /api/ingredients/:id should update an ingredient name', async () => {
            const ingredientToUpdate = await prisma.ingredient.findFirst({
                where: { name: 'onion' },
            });
            const onionId = ingredientToUpdate?.id;

            const updatedData = { name: 'yellow onion' };

            const response = await REQUEST.patch(`/api/ingredients/${onionId}`).send(updatedData);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('yellow onion');
            expect(response.body.id).toBe(onionId);
        });

        // Failure Tests
        test('should return 404 if the ingredient to update does not exist', async () => {
            const fakeId = randomUUID();
            const response = await REQUEST.patch(`/api/ingredients/${fakeId}`).send({ name: 'new name' });

            expect(response.status).toBe(404);
        });

        test('should return 400 if the new name is invalid', async () => {
            const ingredient = await prisma.ingredient.findFirst({ where: { name: 'onion' } });
            const ingredientId = ingredient?.id;
            
            const response = await REQUEST.patch(`/api/ingredients/${ingredientId}`).send({ name: '' });

            expect(response.status).toBe(400);
        });
    });

    describe('DELETE /api/ingredients/:id', () => {
        test('should delete an existing ingredient and return a 200 status', async () => {
            // Create an ingredient that isn't used in any recipe
            const standalone = await prisma.ingredient.create({
                data: { name: 'standalone test ingredient' },
            });

            const response = await REQUEST.delete(`/api/ingredients/${standalone.id}`);

            expect(response.status).toBe(200);

            const deletedIngredient = await prisma.ingredient.findUnique({
                where: { id: standalone.id },
            });
            expect(deletedIngredient).toBeNull();
        });

        test('should return a 404 status if the ingredient does not exist', async () => {
            const fakeId = randomUUID();

            const response = await REQUEST.delete(`/api/ingredients/${fakeId}`);

            expect(response.status).toBe(404);
        });

        test('should return 409 when deleting an ingredient that is used in a recipe', async () => {
            // Find an ingredient that is linked to the Beef Chili recipe
            const ingredient = await prisma.ingredient.findFirst({
                where: {
                    recipeIngredients: {
                        some: {},
                    },
                },
            });

            const response = await REQUEST.delete(`/api/ingredients/${ingredient?.id}`);

            expect(response.status).toBe(409);
            expect(response.body.error).toContain('used in recipes');
        });
    });
});
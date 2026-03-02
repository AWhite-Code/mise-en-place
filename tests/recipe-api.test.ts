import supertest from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../prisma/client.js';
import { resetWithBaseSeed, cleanDatabase } from '../prisma/utils/db-utils.js';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

const REQUEST = supertest(app);

describe('Recipe API', () => {

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
        test('GET /api/recipes should return all seeded recipes', async () => {
            const response = await REQUEST.get('/api/recipes');

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBeGreaterThan(0);
        });

        test('GET /api/recipes should include recipe ingredients', async () => {
            const response = await REQUEST.get('/api/recipes');

            expect(response.status).toBe(200);
            expect(response.body[0].recipeIngredients).toBeDefined();
            expect(response.body[0].recipeIngredients).toBeInstanceOf(Array);
        });

        test('GET /api/recipes/:id should return a specific recipe with ingredients', async () => {
            const recipe = await prisma.recipe.findFirst({
                where: { name: 'Beef Chili' },
            });

            const response = await REQUEST.get(`/api/recipes/${recipe?.id}`);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Beef Chili');
            expect(response.body.recipeIngredients).toBeInstanceOf(Array);
            expect(response.body.recipeIngredients.length).toBeGreaterThan(0);
            // Verify nested ingredient data is included
            expect(response.body.recipeIngredients[0].ingredient).toBeDefined();
            expect(response.body.recipeIngredients[0].ingredient.name).toBeDefined();
        });

        test('GET /api/recipes/:id should return 404 for a non-existent ID', async () => {
            const fakeId = randomUUID();
            const response = await REQUEST.get(`/api/recipes/${fakeId}`);

            expect(response.status).toBe(404);
        });

        test('GET /api/recipes?search=beef should return matching recipes', async () => {
            const response = await REQUEST.get('/api/recipes?search=beef');

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe('Beef Chili');
        });

        test('GET /api/recipes?search=... should return an empty array for no matches', async () => {
            const response = await REQUEST.get('/api/recipes?search=nonexistentrecipe');

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBe(0);
        });
    });
    
    describe('POST Requests', () => {
        test('should create a recipe with ingredients and return 201', async () => {
            const onion = await prisma.ingredient.findFirst({ where: { name: 'onion' } });
            const garlic = await prisma.ingredient.findFirst({ where: { name: 'garlic' } });

            const newRecipe = {
                name: 'Garlic Soup',
                description: 'Simple and flavourful',
                servings: 2,
                prepTime: 10,
                cookTime: 30,
                instructions: 'Chop onions, mince garlic, simmer together.',
                ingredients: [
                    { ingredientId: onion?.id, quantity: 2, unit: 'whole' },
                    { ingredientId: garlic?.id, quantity: 6, unit: 'cloves' },
                ],
            };

            const response = await REQUEST.post('/api/recipes').send(newRecipe);

            expect(response.status).toBe(201);
            expect(response.body.name).toBe('Garlic Soup');
            expect(response.body.servings).toBe(2);
            expect(response.body.recipeIngredients).toHaveLength(2);
            expect(response.body.recipeIngredients[0].ingredient).toBeDefined();
        });

        test('should create a recipe without ingredients and return 201', async () => {
            const newRecipe = {
                name: 'Mystery Stew',
            };

            const response = await REQUEST.post('/api/recipes').send(newRecipe);

            expect(response.status).toBe(201);
            expect(response.body.name).toBe('Mystery Stew');
            expect(response.body.servings).toBe(1); // Verify default
            expect(response.body.recipeIngredients).toHaveLength(0);
        });

        test('should return 400 if recipe name is missing', async () => {
            const response = await REQUEST.post('/api/recipes').send({
                description: 'A recipe with no name',
            });

            expect(response.status).toBe(400);
        });

        test('should return 400 if an ingredient ID is invalid', async () => {
            const response = await REQUEST.post('/api/recipes').send({
                name: 'Bad Recipe',
                ingredients: [
                    { ingredientId: randomUUID(), quantity: 1, unit: 'cup' },
                ],
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('ingredient IDs');
        });
    });

    describe('PATCH Requests', () => {
        test('should update only the recipe name', async () => {
            const recipe = await prisma.recipe.findFirst({ where: { name: 'Beef Chili' } });

            const response = await REQUEST.patch(`/api/recipes/${recipe?.id}`).send({
                name: 'Spicy Beef Chili',
            });

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Spicy Beef Chili');
            // Verify other fields remain unchanged
            expect(response.body.description).toBe(recipe?.description);
        });

        test('should replace recipe ingredients when ingredients array is provided', async () => {
            const recipe = await prisma.recipe.findFirst({ where: { name: 'Beef Chili' } });
            const garlic = await prisma.ingredient.findFirst({ where: { name: 'garlic' } });

            const response = await REQUEST.patch(`/api/recipes/${recipe?.id}`).send({
                ingredients: [
                    { ingredientId: garlic?.id, quantity: 10, unit: 'cloves' },
                ],
            });

            expect(response.status).toBe(200);
            // Should now have exactly one ingredient, not the original set
            expect(response.body.recipeIngredients).toHaveLength(1);
            expect(response.body.recipeIngredients[0].ingredient.name).toBe('garlic');
            expect(response.body.recipeIngredients[0].quantity).toBe(10);
        });

        test('should return 404 for a non-existent recipe', async () => {
            const fakeId = randomUUID();
            const response = await REQUEST.patch(`/api/recipes/${fakeId}`).send({ name: 'Ghost Recipe' });

            expect(response.status).toBe(404);
        });

        test('should return 400 for an empty recipe name', async () => {
            const recipe = await prisma.recipe.findFirst({ where: { name: 'Beef Chili' } });

            const response = await REQUEST.patch(`/api/recipes/${recipe?.id}`).send({ name: '' });

            expect(response.status).toBe(400);
        });

        test('should return 400 if updated ingredient IDs are invalid', async () => {
            const recipe = await prisma.recipe.findFirst({ where: { name: 'Beef Chili' } });

            const response = await REQUEST.patch(`/api/recipes/${recipe?.id}`).send({
                ingredients: [
                    { ingredientId: randomUUID(), quantity: 1, unit: 'cup' },
                ],
            });

            expect(response.status).toBe(400);
        });
    });

    describe('DELETE Requests', () => {
        test('should delete a recipe and return 200', async () => {
            const recipe = await prisma.recipe.findFirst({ where: { name: 'Beef Chili' } });

            const response = await REQUEST.delete(`/api/recipes/${recipe?.id}`);

            expect(response.status).toBe(200);

            const deleted = await prisma.recipe.findUnique({ where: { id: recipe?.id } });
            expect(deleted).toBeNull();
        });

        test('should cascade delete recipe ingredients but preserve ingredients', async () => {
            const recipe = await prisma.recipe.findFirst({ where: { name: 'Beef Chili' } });

            // Count ingredients before deletion
            const ingredientCountBefore = await prisma.ingredient.count();

            await REQUEST.delete(`/api/recipes/${recipe?.id}`);

            // RecipeIngredient rows should be gone
            const orphanedLinks = await prisma.recipeIngredient.findMany({
                where: { recipeId: recipe?.id as string },
            });
            expect(orphanedLinks).toHaveLength(0);

            // But the actual ingredients should still exist
            const ingredientCountAfter = await prisma.ingredient.count();
            expect(ingredientCountAfter).toBe(ingredientCountBefore);
        });

        test('should return 404 for a non-existent recipe', async () => {
            const fakeId = randomUUID();
            const response = await REQUEST.delete(`/api/recipes/${fakeId}`);

            expect(response.status).toBe(404);
        });
    });
});
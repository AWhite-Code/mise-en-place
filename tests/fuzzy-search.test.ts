import supertest from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../prisma/client.js';
import { resetWithBaseSeed, cleanDatabase } from '../prisma/utils/db-utils.js';
import { execSync } from 'child_process';

const REQUEST = supertest(app);

describe('Fuzzy Search', () => {

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

    describe('Ingredient Fuzzy Search', () => {

        test('should find "onion" when searching with a typo like "onin"', async () => {
            const response = await REQUEST.get('/api/ingredients?search=onin');

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBeGreaterThanOrEqual(1);

            const names = response.body.map((i: any) => i.name);
            expect(names).toContain('onion');
        });
        
        test('should find "garlic" when searching with a misspelling like "garlc"', async () => {
            const response = await REQUEST.get('/api/ingredients?search=garlc');

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBeGreaterThanOrEqual(1);

            const names = response.body.map((i: any) => i.name);
            expect(names).toContain('garlic');
        });

        test('should still return an exact match for "garlic"', async () => {
            const response = await REQUEST.get('/api/ingredients?search=garlic');

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe('garlic');
        });

        test('should return an empty array for a completely unrelated search', async () => {
            const response = await REQUEST.get('/api/ingredients?search=xylophone');

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBe(0);
        });

        test('should rank the closest match first when multiple ingredients match', async () => {
            // Create ingredients with similar names to test ranking
            await prisma.ingredient.createMany({
                data: [
                    { name: 'red onion' },
                    { name: 'onion powder' },
                ],
            });

            const response = await REQUEST.get('/api/ingredients?search=onion');

            expect(response.status).toBe(200);
            expect(response.body.length).toBeGreaterThanOrEqual(2);

            // "onion" (exact) should rank above "red onion" and "onion powder"
            expect(response.body[0].name).toBe('onion');
        });
    });

    describe('Recipe Fuzzy Search', () => {

        test('should find "Beef Chili" when searching with a typo like "beef chilli"', async () => {
            const response = await REQUEST.get('/api/recipes?search=beef chilli');

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBeGreaterThanOrEqual(1);

            const names = response.body.map((r: any) => r.name);
            expect(names).toContain('Beef Chili');
        });

        test('should find "Beef Chili" with a partial match like "chili"', async () => {
            const response = await REQUEST.get('/api/recipes?search=chili');

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBeGreaterThanOrEqual(1);
            expect(response.body[0].name).toBe('Beef Chili');
        });

        test('should include recipeIngredients in fuzzy search results', async () => {
            const response = await REQUEST.get('/api/recipes?search=beef');

            expect(response.status).toBe(200);
            expect(response.body.length).toBeGreaterThanOrEqual(1);
            expect(response.body[0].recipeIngredients).toBeDefined();
            expect(response.body[0].recipeIngredients).toBeInstanceOf(Array);
            expect(response.body[0].recipeIngredients[0].ingredient).toBeDefined();
        });

        test('should return an empty array for a completely unrelated search', async () => {
            const response = await REQUEST.get('/api/recipes?search=xylophone');

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBe(0);
        });

        test('should rank the closest match first when multiple recipes match', async () => {
            // Create additional recipes to test ranking
            await prisma.recipe.create({
                data: { name: 'Beef Stew', description: 'Hearty beef stew' },
            });
            await prisma.recipe.create({
                data: { name: 'Corned Beef Hash', description: 'Classic breakfast' },
            });

            const response = await REQUEST.get('/api/recipes?search=beef stew');

            expect(response.status).toBe(200);
            expect(response.body.length).toBeGreaterThanOrEqual(1);

            // "Beef Stew" (exact match) should be the top result
            expect(response.body[0].name).toBe('Beef Stew');
        });

        test('should handle misspelled single-word searches like "beff"', async () => {
            const response = await REQUEST.get('/api/recipes?search=beff');

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBeGreaterThanOrEqual(1);

            const names = response.body.map((r: any) => r.name);
            expect(names).toContain('Beef Chili');
        });
    });
});
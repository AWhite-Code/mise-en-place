/**
 * @module tests/fuzzy-search.test
 * Integration tests for the hybrid fuzzy search (pg_trgm + ILIKE).
 *
 * Validates that typos, misspellings, partial matches, and exact
 * matches all return expected results, with proper similarity ranking.
 */

import supertest from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../prisma/client.js';
import { setupTestLifecycle } from './helpers/test-lifecycle.js';

const request = supertest(app);

describe('Fuzzy Search', () => {
    setupTestLifecycle();

    // ── Ingredient Search ───────────────────────────────────────────────────

    describe('Ingredient fuzzy search', () => {
        test('should find "onion" with a typo like "onin"', async () => {
            const response = await request.get('/api/ingredients?search=onin');

            expect(response.status).toBe(200);
            expect(response.body.length).toBeGreaterThanOrEqual(1);

            const names = response.body.map((i: { name: string }) => i.name);
            expect(names).toContain('onion');
        });

        test('should find "garlic" with a misspelling like "garlc"', async () => {
            const response = await request.get('/api/ingredients?search=garlc');

            expect(response.status).toBe(200);
            expect(response.body.length).toBeGreaterThanOrEqual(1);

            const names = response.body.map((i: { name: string }) => i.name);
            expect(names).toContain('garlic');
        });

        test('should return an exact match for "garlic"', async () => {
            const response = await request.get('/api/ingredients?search=garlic');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe('garlic');
        });

        test('should return an empty array for a completely unrelated term', async () => {
            const response = await request.get('/api/ingredients?search=xylophone');

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        test('should rank the closest match first among multiple results', async () => {
            await prisma.ingredient.createMany({
                data: [{ name: 'red onion' }, { name: 'onion powder' }],
            });

            const response = await request.get('/api/ingredients?search=onion');

            expect(response.status).toBe(200);
            expect(response.body.length).toBeGreaterThanOrEqual(2);
            expect(response.body[0].name).toBe('onion'); // Exact match ranks first
        });
    });

    // ── Recipe Search ───────────────────────────────────────────────────────

    describe('Recipe fuzzy search', () => {
        test('should find "Beef Chili" with a typo like "beef chilli"', async () => {
            const response = await request.get('/api/recipes?search=beef chilli');

            expect(response.status).toBe(200);
            expect(response.body.length).toBeGreaterThanOrEqual(1);

            const names = response.body.map((r: { name: string }) => r.name);
            expect(names).toContain('Beef Chili');
        });

        test('should find "Beef Chili" with a partial match like "chili"', async () => {
            const response = await request.get('/api/recipes?search=chili');

            expect(response.status).toBe(200);
            expect(response.body.length).toBeGreaterThanOrEqual(1);
            expect(response.body[0].name).toBe('Beef Chili');
        });

        test('should include recipeIngredients in search results', async () => {
            const response = await request.get('/api/recipes?search=beef');

            expect(response.status).toBe(200);
            expect(response.body.length).toBeGreaterThanOrEqual(1);
            expect(response.body[0].recipeIngredients).toBeDefined();
            expect(response.body[0].recipeIngredients).toBeInstanceOf(Array);
            expect(response.body[0].recipeIngredients[0].ingredient).toBeDefined();
        });

        test('should return an empty array for a completely unrelated term', async () => {
            const response = await request.get('/api/recipes?search=xylophone');

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });

        test('should rank the closest match first among multiple results', async () => {
            await prisma.recipe.create({
                data: { name: 'Beef Stew', description: 'Hearty beef stew' },
            });
            await prisma.recipe.create({
                data: { name: 'Corned Beef Hash', description: 'Classic breakfast' },
            });

            const response = await request.get('/api/recipes?search=beef stew');

            expect(response.status).toBe(200);
            expect(response.body.length).toBeGreaterThanOrEqual(1);
            expect(response.body[0].name).toBe('Beef Stew');
        });

        test('should handle misspelled single-word searches like "beff"', async () => {
            const response = await request.get('/api/recipes?search=beff');

            expect(response.status).toBe(200);
            expect(response.body.length).toBeGreaterThanOrEqual(1);

            const names = response.body.map((r: { name: string }) => r.name);
            expect(names).toContain('Beef Chili');
        });
    });
});

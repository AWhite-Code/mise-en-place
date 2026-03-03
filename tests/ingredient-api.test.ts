/**
 * @module tests/ingredient-api.test
 * Integration tests for the Ingredient API endpoints.
 *
 * Covers GET (list, by-id, search), POST (create with normalisation,
 * duplicate rejection), PATCH (rename), and DELETE (standalone,
 * not-found, in-use restriction).
 */

import supertest from 'supertest';
import { randomUUID } from 'crypto';
import { app } from '../src/app.js';
import { prisma } from '../prisma/client.js';
import { setupTestLifecycle } from './helpers/test-lifecycle.js';

const request = supertest(app);

describe('Ingredient API', () => {
    setupTestLifecycle();

    // ── GET ─────────────────────────────────────────────────────────────────

    describe('GET /api/ingredients', () => {
        test('should return all seeded ingredients', async () => {
            const response = await request.get('/api/ingredients');

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBeGreaterThan(0);
        });

        test('should return a single ingredient by ID', async () => {
            const onion = await prisma.ingredient.findFirst({ where: { name: 'onion' } });

            const response = await request.get(`/api/ingredients/${onion?.id}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(onion?.id);
            expect(response.body.name).toBe('onion');
        });

        test('should return matching ingredients when using ?search=', async () => {
            const response = await request.get('/api/ingredients?search=garlic');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe('garlic');
        });

        test('should return 404 for a non-existent ID', async () => {
            const response = await request.get(`/api/ingredients/${randomUUID()}`);

            expect(response.status).toBe(404);
        });

        test('should return an empty array when search has no matches', async () => {
            const response = await request.get('/api/ingredients?search=nonexistentingredient');

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });
    });

    // ── POST ────────────────────────────────────────────────────────────────

    describe('POST /api/ingredients', () => {
        test('should create a new ingredient with a normalised name', async () => {
            const response = await request.post('/api/ingredients').send({ name: 'Potato' });

            expect(response.status).toBe(201);
            expect(response.body.id).toBeDefined();
            expect(response.body.name).toBe('potato'); // Normalised to lowercase
        });

        test('should return 400 when name is missing', async () => {
            const response = await request.post('/api/ingredients').send({});

            expect(response.status).toBe(400);
        });

        test('should return 409 when a duplicate name exists', async () => {
            const response = await request.post('/api/ingredients').send({ name: 'Onion' });

            expect(response.status).toBe(409);
            expect(response.body.error).toContain('already exists');
        });
    });

    // ── PATCH ───────────────────────────────────────────────────────────────

    describe('PATCH /api/ingredients/:id', () => {
        test('should update an ingredient name', async () => {
            const onion = await prisma.ingredient.findFirst({ where: { name: 'onion' } });

            const response = await request
                .patch(`/api/ingredients/${onion?.id}`)
                .send({ name: 'yellow onion' });

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('yellow onion');
            expect(response.body.id).toBe(onion?.id);
        });

        test('should return 404 for a non-existent ingredient', async () => {
            const response = await request
                .patch(`/api/ingredients/${randomUUID()}`)
                .send({ name: 'new name' });

            expect(response.status).toBe(404);
        });

        test('should return 400 for an empty name', async () => {
            const onion = await prisma.ingredient.findFirst({ where: { name: 'onion' } });

            const response = await request
                .patch(`/api/ingredients/${onion?.id}`)
                .send({ name: '' });

            expect(response.status).toBe(400);
        });
    });

    // ── DELETE ───────────────────────────────────────────────────────────────

    describe('DELETE /api/ingredients/:id', () => {
        test('should delete a standalone ingredient', async () => {
            const standalone = await prisma.ingredient.create({
                data: { name: 'standalone test ingredient' },
            });

            const response = await request.delete(`/api/ingredients/${standalone.id}`);

            expect(response.status).toBe(200);

            const deleted = await prisma.ingredient.findUnique({ where: { id: standalone.id } });
            expect(deleted).toBeNull();
        });

        test('should return 404 for a non-existent ingredient', async () => {
            const response = await request.delete(`/api/ingredients/${randomUUID()}`);

            expect(response.status).toBe(404);
        });

        test('should return 409 when deleting an ingredient used in a recipe', async () => {
            const inUse = await prisma.ingredient.findFirst({
                where: { recipeIngredients: { some: {} } },
            });

            const response = await request.delete(`/api/ingredients/${inUse?.id}`);

            expect(response.status).toBe(409);
            expect(response.body.error).toContain('used in recipes');
        });
    });
});

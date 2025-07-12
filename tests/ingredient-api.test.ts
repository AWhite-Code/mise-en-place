import { prisma, resetWithBaseSeed} from '../prisma/utils/db-utils.js';
import supertest from 'supertest';
import app from '../src/server.js';
import { randomUUID } from 'crypto';

const REQUEST = supertest(app);

describe('Ingredient API', () => {
    // Reset database before each test to guarantee the tests receives the data it is looking for
    beforeEach(async () => {
        await resetWithBaseSeed();
    });
    
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
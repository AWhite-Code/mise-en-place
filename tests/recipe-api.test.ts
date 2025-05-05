import { prisma, resetWithBaseSeed } from '../prisma/utils/db-utils.js';

describe('Recipe API', () => {
    // Reset database before each test
    beforeEach(async () => {
        await resetWithBaseSeed();
    });
    
    test('should retrieve the Beef Chili recipe', async () => {
        const recipes = await prisma.recipe.findMany({
            where: { name: 'Beef Chili' }
        });
        //expect(recipes.status).toBe(200);
        expect(recipes).toHaveLength(1);
        expect(recipes[0].description).toContain('Chilli con Carne');
    });
});
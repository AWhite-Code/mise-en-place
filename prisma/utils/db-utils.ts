import { PrismaClient } from '@prisma/client';
import { prisma } from '../client.js';

export async function cleanDatabase() {
    console.log('>>> cleanDatabase: Starting...');
    try {
        await prisma.recipeIngredient.deleteMany({});
        console.log('>>> cleanDatabase: Deleted RecipeIngredients');
        await prisma.recipe.deleteMany({});
        console.log('>>> cleanDatabase: Deleted Recipes');
        await prisma.ingredient.deleteMany({});
        console.log('>>> cleanDatabase: Deleted Ingredients');
        console.log('>>> cleanDatabase: Finished.');
    } catch (error) {
        console.error('>>> cleanDatabase: ERROR', error);
        throw error; // Re-throw error after logging
    }
}
export async function resetWithBaseSeed() {
    console.log('>>> resetWithBaseSeed: Starting...');
    try {
         // Check count before cleaning
        const countBefore = await prisma.recipe.count();
        console.log(`>>> resetWithBaseSeed: Recipe count before clean: ${countBefore}`);

        await cleanDatabase();
        console.log('>>> resetWithBaseSeed: Database cleaned.');
        const baseSeed = await import('../seeds/base-seed.js'); //
        await baseSeed.seed(prisma);
        console.log('>>> resetWithBaseSeed: Base seed applied.');

         // Optional: Check count after seeding
        const countAfter = await prisma.recipe.count();
        console.log(`>>> resetWithBaseSeed: Recipe count after seed: ${countAfter}`);

        console.log('>>> resetWithBaseSeed: Finished.');
    } catch (error) {
         console.error('>>> resetWithBaseSeed: ERROR', error);
         throw error; // Re-throw error after logging
    }
}

// Define a type for seed modules
interface SeedModule {
    seed: (prisma: PrismaClient) => Promise<void>;
}

export async function applySeed(seedModule: SeedModule) {
    await seedModule.seed(prisma);
}

// Re-export prisma for convenience
export { prisma };
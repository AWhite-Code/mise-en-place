import { PrismaClient } from '@prisma/client';
import { prisma } from '../client';

export async function cleanDatabase() {
    // Delete all data in reverse order of dependencies
    await prisma.recipeIngredient.deleteMany({});
    await prisma.recipe.deleteMany({});
    await prisma.ingredient.deleteMany({});
}

export async function resetWithBaseSeed() {
    await cleanDatabase();
    const baseSeed = await import('../seeds/base-seed');
    await baseSeed.seed(prisma);
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
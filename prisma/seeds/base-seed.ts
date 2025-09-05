import { PrismaClient } from '@prisma/client';

export async function seed(prisma: PrismaClient) {
    console.log('Starting seed...');
    // 1. Clear out old content
    await prisma.recipeIngredient.deleteMany({});
    await prisma.recipe.deleteMany({});
    await prisma.ingredient.deleteMany({});
    console.log('Existing data deleted.');

    // 2. Seed all ingredients at once using lowercase
    const ingredientsData = [
        { name: 'onion' }, { name: 'garlic' }, { name: 'beef mince' },
        { name: 'lardons' }, { name: 'sweetcorn' }, { name: 'smoked paprika' },
        { name: 'cayenne pepper' }, { name: 'cumin' }, { name: 'red pepper' },
        { name: 'beef stock' }, { name: 'kidney beans' }, { name: 'tomato puree' }
    ];
    await prisma.ingredient.createMany({ data: ingredientsData });
    console.log('Ingredients seeded.');

    // 3. Get the newly created ingredients to build a reliable lookup map
    const ingredientsFromDb = await prisma.ingredient.findMany();
    const ingredientsMap = new Map(ingredientsFromDb.map(i => [i.name, i.id]));

    // 4. Seed the Recipe
    const newRecipe = await prisma.recipe.create({
      data: {
        name: 'Beef Chili',
        description: 'Chilli con Carne using Beef mince and bacon lardons',
        servings: 2,
        prepTime: 20,
        cookTime: 120,
        instructions: `1. Put the Beef stock pot in a jug and add the correct amount of boiling water.
2. Heat some oil in a suitable frying pan (medium heat). Add the onions and pepper and cook for 10 minutes.
3. Add the garlic and cook for 2 minutes.
4. Add the bacon/lardons and cook for 4 minutes.
5. Add the chilli con carne mix and cook for 2 minutes.
6. Add the mince and cook until browned.
7. Add the tomato puree and the beef stock. Bring to the boil and then simmer.
8. Allow to simmer for at least 20 minutes.
9. Taste and season.
10. Add ketchup for sweetness if desired.
11. Reheat gently if starting from cold.
12. Drain and add sweet corn.
13. Turn up the heat to boil off remaining liquid.
14. Stop when you have the desired consistency.`,
      }
    });
    console.log('Recipes seeded.');

    // 5. Create the data for the links
    const recipeIngredientsLinks = [
        { recipeId: newRecipe.id, ingredientId: ingredientsMap.get('beef mince'), quantity: 500, unit: 'g' },
        { recipeId: newRecipe.id, ingredientId: ingredientsMap.get('lardons'), quantity: 100, unit: 'g' },
        { recipeId: newRecipe.id, ingredientId: ingredientsMap.get('garlic'), quantity: 1, unit: 'clove - chopped' },
        { recipeId: newRecipe.id, ingredientId: ingredientsMap.get('sweetcorn'), quantity: 1, unit: 'tin' },
        { recipeId: newRecipe.id, ingredientId: ingredientsMap.get('tomato puree'), quantity: 2, unit: 'tbsp' },
        { recipeId: newRecipe.id, ingredientId: ingredientsMap.get('onion'), quantity: 1, unit: 'Diced' },
        { recipeId: newRecipe.id, ingredientId: ingredientsMap.get('red pepper'), quantity: 0.5, unit: 'Diced' },
        { recipeId: newRecipe.id, ingredientId: ingredientsMap.get('beef stock'), quantity: 1, unit: 'stock cube in 400ml of water' },
    ];

    // 6. Filter out any items where the ingredientId might be undefined
    const validRecipeIngredientsData = recipeIngredientsLinks.filter(
        (link): link is { recipeId: string; ingredientId: string; quantity: number; unit: string } =>
            link.ingredientId !== undefined
    );

    // 7. Seed the RecipeIngredient links separately
    await prisma.recipeIngredient.createMany({ data: validRecipeIngredientsData });
    console.log('Recipe-ingredient relations seeded.');
    
    console.log('Database has been seeded!');
}
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

export async function seed(prisma: PrismaClient) {
    // Clear out old content
    await prisma.recipeIngredient.deleteMany({});
    await prisma.recipe.deleteMany({});
    await prisma.ingredient.deleteMany({});

    // Seeding Ingredients Table
    const ingredientsArray = await Promise.all([
        prisma.ingredient.create({data: { name: 'Onion' }}),
        prisma.ingredient.create({data: { name: 'Garlic' }}),
        prisma.ingredient.create({data: { name: 'Beef Mince' }}),
        prisma.ingredient.create({data: { name: 'Lardons' }}),
        prisma.ingredient.create({data: { name: 'Sweetcorn' }}),
        prisma.ingredient.create({data: { name: 'Smoked Paprika' }}),
        prisma.ingredient.create({data: { name: 'Cayenne Pepper' }}),
        prisma.ingredient.create({data: { name: 'Cumin' }}),
        prisma.ingredient.create({data: { name: 'Red Pepper' }}),
        prisma.ingredient.create({data: { name: 'Beef Stock' }}),
        prisma.ingredient.create({data: { name: 'Kidney Beans' }}),
        prisma.ingredient.create({data: { name: 'Tomato Puree' }})
    ]);

    const ingredientsByName = {
        onion: ingredientsArray[0],
        garlic: ingredientsArray[1],
        beefMince: ingredientsArray[2],
        lardons: ingredientsArray[3],
        sweetCorn: ingredientsArray[4],
        redPepper: ingredientsArray[8], // Corrected index based on array order
        beefStock: ingredientsArray[9], // Corrected index based on array order
        kidneyBeans: ingredientsArray[10], // Corrected index based on array order
        tomatoPuree: ingredientsArray[11] // Corrected index based on array order
    };

    // Seeding Recipe and thus RecipeIngredient Table
    await prisma.recipe.create({
      data: {
        name: 'Beef Chili',
        description: 'Chilli con Carne using Beef mince and bacon lardons',
        servings: 2,
        prepTime: 20,
        cookTime: 120,
        instructions: 
        `1. Put the Beef stock pot in a jug and add the correct amount (see packet - probably 400 ml) of boiling water. Stir until the stock pot is dissolved. You can be doing this while cooking the onions and peppers.
        2. Heat some oil in a suitable frying pan (medium heat). Add the onions and pepper and cook for 10 minutes stirring regularly.
        3. Add the garlic and cook for 2 minutes
        4. Add the bacon/lardons. Stir and cook for 4 minutes or until cooked.
        5. Add the chilli con carne mix. Stir in and cook for 2 minutes.
        6. Add the mince. Stir regularly. Continue until all the minced is cooked.
        7. Add the tomato puree and the beef stock. Stir thoroughly. Bring to the boil and then turn down to a simmer.
        8. Allow to simmer for at least 20 minutes.
        9. Taste it.
        10. You might want to add some salt. If you want it to be sweeter add tomato ketchup.
        11. If starting from cold (i.e. the next day) start by reheating the chilli gently. Skip if you are just continuing from above.
        12. Drain the sweet corn and add it to the pan. Stir it in.
        13. Turn the heat up to high (not the highest) and boil off the remaining liquid. You will
        need to pay attention and stir regularly to stop it from burning.
        14. Stop when you have the consistency you want.`,
        
        recipeIngredients: {
          create: [
            {
              quantity: 500,
              unit: 'g',
              ingredient: { connect: { id: ingredientsByName.beefMince.id}}
            },
            {
              quantity: 100,
              unit: 'g',
              ingredient: { connect: { id: ingredientsByName.lardons.id} }
            },
            {
              quantity: 1,
              unit: 'clove - chopped',
              ingredient: { connect: { id: ingredientsByName.garlic.id} }
            },
            {
              quantity: 1,
              unit: 'tin',
              ingredient: { connect: { id: ingredientsByName.sweetCorn.id} }
            },
            {
              quantity: 2,
              unit: 'tbsp',
              ingredient: { connect: { id: ingredientsByName.tomatoPuree.id} }
            },
            {
              quantity: 1,
              unit: 'Diced',
              ingredient: { connect: { id: ingredientsByName.onion.id} }
            },
            {
              quantity: 0.5,
              unit: 'Diced',
              ingredient: { connect: { id: ingredientsByName.redPepper.id} }
            },
            {
              quantity: 1,
              unit: 'stock cube in 400ml of water',
              ingredient: { connect: { id: ingredientsByName.beefStock.id} }
            },
          ]
        }
      }
    });
    
    console.log('Database has been seeded!');
}

// Check if this module is being run directly
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
    const prismaInstance = new PrismaClient();
    seed(prismaInstance)
      .catch((e) => {
        console.error(e);
        process.exit(1);
      })
      .finally(async () => {
        await prismaInstance.$disconnect();
      });
}
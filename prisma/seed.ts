import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // Clear out old content - don't think I need it but this is good practice lol
    await prisma.recipeIngredient.deleteMany({})
    await prisma.recipe.deleteMany({})
    await prisma.ingredient.deleteMany({})

    // Adding basic ingredients
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
        prisma.ingredient.create({data: { name: 'Beef Stock' }})
    ]);

    const ingredientsByName = {
        onion: ingredientsArray[0],
        garlic: ingredientsArray[1],
        beefMince: ingredientsArray[2],
        lardons: ingredientsArray[3],
        sweetCorn: ingredientsArray[4],
        smokedPaprika: ingredientsArray[5],
        cayennePepper: ingredientsArray[6],
        cumin: ingredientsArray[7],
        redPepper: ingredientsArray[8],
        beefStock: ingredientsArray[9]
    }
}


main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
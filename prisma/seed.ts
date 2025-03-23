import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // Clear out old content - dont think I need it but this is good practice lol
    await prisma.recipeIngredient.deleteMany({})
    await prisma.recipe.deleteMany({})
    await prisma.ingredient.deleteMany({})

    // Adding basic ingredients
    const ingredients = await Promise.all([
        prisma.ingredient.create({
            data: { name: 'Onion' },
        }),

        prisma.ingredient.create({
            data: { name: 'Garlic' }
        }),

        prisma.ingredient.create({
            data: { name: 'Beef Mince' }
        }),

        prisma.ingredient.create({
            data: { name: 'Lardons' }
        }),

        prisma.ingredient.create({
            data: { name: 'Sweetcorn' }
        }),

        prisma.ingredient.create({
            data: { name: 'Smoked Paprika' }
        }),

        prisma.ingredient.create({
            data: { name: 'Cayenne Pepper' }
        }),

        prisma.ingredient.create({
            data: { name: 'Cumin' }
        }),

        prisma.ingredient.create({
            data: { name: 'Red Pepper' }
        }),

        prisma.ingredient.create({
            data: { name: 'Beef Stock' }
        })
    ])
}


main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
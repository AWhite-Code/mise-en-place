import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client.js';
import { isPrismaError } from '../utils/prisma-errors.js';

const router = Router();

// GET all recipes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search } = req.query;

        const queryOptions: any = {
            include: {
                recipeIngredients: {
                    include: { ingredient: true },
                },
            },
        };

        if (search) {
            queryOptions.where = {
                name: {
                    contains: search as string,
                    mode: 'insensitive',
                },
            };
        }

        const allRecipes = await prisma.recipe.findMany(queryOptions);
        res.status(200).json(allRecipes);
    } catch (error) {
        next(error);
    }
});

// GET recipe by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const recipe = await prisma.recipe.findUnique({
            where: { id },
            include: {
                recipeIngredients: {
                    include: { ingredient: true },
                },
            },
        });

        if (!recipe) {
            res.status(404).json({ error: 'Recipe not found' });
            return;
        }

        res.status(200).json(recipe);
    } catch (error) {
        next(error);
    }
});

// POST Recipe
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description, servings, prepTime, cookTime, instructions, ingredients } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({ error: 'Recipe name must be a non-empty string.' });
            return;
        }

        const recipe = await prisma.recipe.create({
            data: {
                name: name.trim(),
                description: description ?? null,
                servings: servings ?? 1,
                prepTime: prepTime ?? null,
                cookTime: cookTime ?? null,
                instructions: instructions ?? null,
                recipeIngredients: {
                    create: Array.isArray(ingredients)
                        ? ingredients.map((ing: { ingredientId: string; quantity: number; unit: string }) => ({
                            ingredientId: ing.ingredientId,
                            quantity: ing.quantity ?? 0,
                            unit: ing.unit,
                        }))
                        : [],
                },
            },
            include: {
                recipeIngredients: {
                    include: { ingredient: true },
                },
            },
        });

        res.status(201).json(recipe);
    } catch (error) {
        if (isPrismaError(error, 'P2003')) {
            res.status(400).json({ error: 'One or more ingredient IDs are invalid.' });
            return;
        }
        next(error);
    }
});

router.patch('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, servings, prepTime, cookTime, instructions, ingredients } = req.body;

        // Build update data only from provided fields
        const updateData: any = {};
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length === 0) {
                res.status(400).json({ error: 'Recipe name must be a non-empty string.' });
                return;
            }
            updateData.name = name.trim();
        }
        if (description !== undefined) updateData.description = description;
        if (servings !== undefined) updateData.servings = servings;
        if (prepTime !== undefined) updateData.prepTime = prepTime;
        if (cookTime !== undefined) updateData.cookTime = cookTime;
        if (instructions !== undefined) updateData.instructions = instructions;

        // If ingredients are provided, replace all associations
        if (Array.isArray(ingredients)) {
            updateData.recipeIngredients = {
                deleteMany: {},
                create: ingredients.map((ing: { ingredientId: string; quantity: number; unit: string }) => ({
                    ingredientId: ing.ingredientId,
                    quantity: ing.quantity ?? 0,
                    unit: ing.unit,
                })),
            };
        }

        const updatedRecipe = await prisma.recipe.update({
            where: { id },
            data: updateData,
            include: {
                recipeIngredients: {
                    include: { ingredient: true },
                },
            },
        });

        res.status(200).json(updatedRecipe);
    } catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ error: 'Recipe not found' });
        } else if (isPrismaError(error, 'P2003')) {
            res.status(400).json({ error: 'One or more ingredient IDs are invalid.' });
        } else {
            next(error);
        }
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.recipe.delete({
            where: { id },
        });

        res.status(200).json({ message: 'Recipe deleted successfully' });
    } catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ error: 'Recipe not found' });
        } else {
            next(error);
        }
    }
});

export default router;
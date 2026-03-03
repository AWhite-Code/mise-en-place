/**
 * @module src/routes/recipes
 * CRUD endpoints for the Recipe resource.
 *
 * Recipes are always returned with their nested recipeIngredients
 * (including the related Ingredient record) so clients get a
 * complete picture in a single request.
 *
 * Deleting a recipe cascades to its RecipeIngredient rows but
 * leaves the underlying Ingredient records intact.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client.js';
import { isPrismaError } from '../utils/prisma-errors.js';
import { fuzzySearchByName } from '../utils/fuzzy-search.js';
import { validateRequiredString } from '../utils/validation.js';

const router = Router();

/**
 * Standard Prisma `include` clause used by every recipe query.
 * Nests recipeIngredients → ingredient so the client receives
 * fully-resolved ingredient data.
 */
const RECIPE_INCLUDE = {
    recipeIngredients: {
        include: { ingredient: true },
    },
} as const;

/** Shape of an ingredient entry in POST / PATCH request bodies. */
interface IngredientInput {
    ingredientId: string;
    quantity: number;
    unit: string;
}

/**
 * Map a client-supplied ingredient array into Prisma `create` data.
 *
 * @param ingredients - Raw ingredient entries from the request body.
 * @returns Array suitable for `recipeIngredients.create`.
 */
function toRecipeIngredientCreateData(ingredients: IngredientInput[]) {
    return ingredients.map((ing) => ({
        ingredientId: ing.ingredientId,
        quantity: ing.quantity ?? 0,
        unit: ing.unit,
    }));
}

// ── GET /api/recipes ────────────────────────────────────────────────────────
/**
 * List all recipes, optionally filtered by a fuzzy search term.
 *
 * Query params:
 *  - `search` (string, optional): fuzzy-match against recipe names.
 *
 * @returns 200 with an array of Recipe objects (may be empty).
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search } = req.query;

        if (search) {
            const matches = await fuzzySearchByName('Recipe', search as string);

            if (matches.length === 0) {
                res.status(200).json([]);
                return;
            }

            const ids = matches.map((m) => m.id);
            const recipes = await prisma.recipe.findMany({
                where: { id: { in: ids } },
                include: RECIPE_INCLUDE,
            });

            // Preserve similarity ranking from the fuzzy search
            const sorted = ids.map((id) => recipes.find((r) => r.id === id)).filter(Boolean);
            res.status(200).json(sorted);
            return;
        }

        const recipes = await prisma.recipe.findMany({ include: RECIPE_INCLUDE });
        res.status(200).json(recipes);
    } catch (error) {
        next(error);
    }
});

// ── GET /api/recipes/:id ────────────────────────────────────────────────────
/**
 * Retrieve a single recipe by UUID, including its ingredients.
 *
 * @returns 200 with the Recipe, or 404 if not found.
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const recipe = await prisma.recipe.findUnique({
            where: { id: req.params.id },
            include: RECIPE_INCLUDE,
        });

        if (!recipe) {
            res.status(404).json({ error: 'Recipe not found.' });
            return;
        }

        res.status(200).json(recipe);
    } catch (error) {
        next(error);
    }
});

// ── POST /api/recipes ───────────────────────────────────────────────────────
/**
 * Create a new recipe, optionally with ingredient associations.
 *
 * Body:
 *  - `name` (string, required)
 *  - `description`, `servings`, `prepTime`, `cookTime`, `instructions` (optional)
 *  - `ingredients` (array of `{ ingredientId, quantity, unit }`, optional)
 *
 * @returns 201 with the created Recipe, or 400 on validation failure.
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { description, servings, prepTime, cookTime, instructions, ingredients } = req.body;

        const name = validateRequiredString(req.body.name, 'Recipe name', res);
        if (name === null) return;

        const recipe = await prisma.recipe.create({
            data: {
                name,
                description: description ?? null,
                servings: servings ?? 1,
                prepTime: prepTime ?? null,
                cookTime: cookTime ?? null,
                instructions: instructions ?? null,
                recipeIngredients: {
                    create: Array.isArray(ingredients)
                        ? toRecipeIngredientCreateData(ingredients)
                        : [],
                },
            },
            include: RECIPE_INCLUDE,
        });

        res.status(201).json(recipe);
    } catch (error) {
        if (isPrismaError(error, 'P2003')) {
            res.status(400).json({ error: 'One or more ingredient IDs are invalid.' });
        } else {
            next(error);
        }
    }
});

// ── PATCH /api/recipes/:id ──────────────────────────────────────────────────
/**
 * Partially update a recipe. Only supplied fields are changed.
 *
 * If an `ingredients` array is provided, the existing associations
 * are **replaced** entirely (delete-all then re-create).
 *
 * @returns 200 with the updated Recipe, or 400/404 on failure.
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description, servings, prepTime, cookTime, instructions, ingredients } = req.body;

        // Build update payload from provided fields only
        const updateData: Record<string, unknown> = {};

        if (name !== undefined) {
            const validated = validateRequiredString(name, 'Recipe name', res);
            if (validated === null) return;
            updateData.name = validated;
        }
        if (description !== undefined) updateData.description = description;
        if (servings !== undefined) updateData.servings = servings;
        if (prepTime !== undefined) updateData.prepTime = prepTime;
        if (cookTime !== undefined) updateData.cookTime = cookTime;
        if (instructions !== undefined) updateData.instructions = instructions;

        // Replace all ingredient associations when a new array is provided
        if (Array.isArray(ingredients)) {
            updateData.recipeIngredients = {
                deleteMany: {},
                create: toRecipeIngredientCreateData(ingredients),
            };
        }

        const recipe = await prisma.recipe.update({
            where: { id: req.params.id },
            data: updateData,
            include: RECIPE_INCLUDE,
        });

        res.status(200).json(recipe);
    } catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ error: 'Recipe not found.' });
        } else if (isPrismaError(error, 'P2003')) {
            res.status(400).json({ error: 'One or more ingredient IDs are invalid.' });
        } else {
            next(error);
        }
    }
});

// ── DELETE /api/recipes/:id ─────────────────────────────────────────────────
/**
 * Delete a recipe by UUID. Cascades to RecipeIngredient rows.
 *
 * @returns 200 on success, or 404 if not found.
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await prisma.recipe.delete({ where: { id: req.params.id } });
        res.status(200).json({ message: 'Recipe deleted successfully.' });
    } catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ error: 'Recipe not found.' });
        } else {
            next(error);
        }
    }
});

export default router;

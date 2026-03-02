import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client.js';
import { isPrismaError } from '../utils/prisma-errors.js';
import { fuzzySearchByName } from '../utils/fuzzy-search.js';
const router = Router();

// GET all ingredients
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search } = req.query;

        if (search) {
            const matches = await fuzzySearchByName('Ingredient', search as string);

            if (matches.length === 0) {
                res.status(200).json([]);
                return;
            }

            const ids = matches.map(m => m.id);

            const ingredients = await prisma.ingredient.findMany({
                where: { id: { in: ids } },
            });

            // Preserve similarity ranking from the fuzzy search
            const sorted = ids
                .map(id => ingredients.find(i => i.id === id))
                .filter(Boolean);

            res.status(200).json(sorted);
            return;
        }

        const ingredients = await prisma.ingredient.findMany();
        res.status(200).json(ingredients);
    } catch (error) {
        next(error);
    }
});

// GET an ingredient by its Unique ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { id } = req.params;

        const ingredient = await prisma.ingredient.findUnique({
            where: { id: id }
        });

        if (!ingredient) {
            res.status(404).json({ error: 'Ingredient not found' });
            return;
        }

        res.status(200).json(ingredient);
    } catch (error) {
        next(error);
    }
});

// POST Ingredient
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({ error: 'Ingredient name must be a non-empty string.' });
            return;
        }

        const normalizedName = name.toLowerCase().trim();

        // Check for existing ingredient with the same normalized name
        const existing = await prisma.ingredient.findFirst({
            where: { name: normalizedName },
        });

        if (existing) {
            res.status(409).json({ error: `Ingredient "${normalizedName}" already exists.` });
            return;
        }

        const createdIngredient = await prisma.ingredient.create({
            data: { name: normalizedName },
        });

        res.status(201).json(createdIngredient);
    } catch (error) {
        next(error);
    }
});

// PATCH Ingredient
router.patch('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({ error: 'Ingredient name must be a non-empty string.' });
            return;
        }

        const updatedIngredient = await prisma.ingredient.update({
            where: { id },
            data: {
                name: name.toLowerCase().trim(),
            },
        });

        res.status(200).json(updatedIngredient);
    } catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ error: 'Ingredient not found' });
        } else {
            next(error);
        }
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.ingredient.delete({
            where: { id },
        });

        res.status(200).json({ message: 'Ingredient deleted successfully' });
    } catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ error: 'Ingredient not found' });
        } else if (isPrismaError(error, 'P2003')) {
            res.status(409).json({ error: 'Cannot delete ingredient that is used in recipes.' });
        } else {
            next(error);
        }
    }
});

export default router;
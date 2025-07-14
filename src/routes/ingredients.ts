import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client.js';

const router = Router();

// GET all ingredients
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search } = req.query;

        // Build the query options in a variable 
        // Either passing 'as is' for findMany or adding a name for targeted search
        const queryOptions = {
            where: {},
        };

        // If a search term exists, add it to the 'where' clause
        if (search) {
            queryOptions.where = {
                name: {
                    contains: search as string,
                    mode: 'insensitive',
                },
            };
        }

        const ingredients = await prisma.ingredient.findMany(queryOptions);

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

        if (!name || typeof name !== 'string') {
            // This path returns a Response
            res.status(400).json({ error: 'Ingredient name must be a non-empty string.' });
        }

        const normalizedName = name.toLowerCase();

        const createdIngredient = await prisma.ingredient.create({
            data: {
                name: normalizedName,
            },
        });

        res.status(201).json(createdIngredient);

    } catch (error) {
        next(error);
    }
});

export default router;
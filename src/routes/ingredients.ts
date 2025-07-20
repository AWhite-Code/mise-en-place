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

// PATCH Ingredient
router.patch('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // Validation
        if (!name || typeof name !== 'string') {
            res.status(400).json({ error: 'Ingredient name must be a non-empty string.' });
        }

        const updatedIngredient = await prisma.ingredient.update({
            where: { id },
            data: {
                name: name.toLowerCase(), // Normalize the new name
            },
        });

        res.status(200).json(updatedIngredient);
    } 
    
    // NOTE: Turn this into a function? I've used it twice now
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            res.status(404).json({ error: 'Ingredient not found' });
            return;
        }       
        next(error);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.ingredient.delete({
            where: { id },
        });

        res.status(200).json({ message: 'Ingredient deleted successfully' });
    }   

    // See above Note (Duplicated method)
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            res.status(404).json({ error: 'Ingredient not found' });
            return;
        }       
        next(error);
    }
});

export default router;
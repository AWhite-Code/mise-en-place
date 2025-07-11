import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client.js';

const router = Router();

// GET all ingredients
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const allIngredients = await prisma.ingredient.findMany();
        res.status(200).json(allIngredients);
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

export default router;
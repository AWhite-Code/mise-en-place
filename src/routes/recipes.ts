import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client.js';

const router = Router();

// GET all recipes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const allRecipes = await prisma.recipe.findMany();
        res.status(200).json(allRecipes);
    } catch (error) {
        next(error);
    }
});

export default router;
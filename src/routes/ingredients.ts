import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client.js';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    const allIngredients = await prisma.ingredient.findMany();
    res.json(allIngredients)
});

export default router;
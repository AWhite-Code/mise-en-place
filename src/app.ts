import express, { Express, Request, Response, NextFunction } from 'express';
import ingredientsRouter from './routes/ingredients.js';
import recipesRouter from './routes/recipes.js';

const app: Express = express();

app.use(express.json());

// Health Check
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Recipe API is running!' });
});

// APIs
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/recipes', recipesRouter);

// Error Handling Middleware
// NOTE: MUST KEEP AT END OF CODE, NO MORE MIDDLEWARE BELOW THIS
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

export { app };
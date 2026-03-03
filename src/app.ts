/**
 * @module src/app
 * Express application setup for the mise-en-place API.
 *
 * Registers JSON body parsing, route modules, and the global error
 * handler. Exported separately from the server so that tests can
 * import `app` without starting a listener.
 */

import express, { Request, Response } from 'express';
import ingredientsRouter from './routes/ingredients.js';
import recipesRouter from './routes/recipes.js';
import { globalErrorHandler } from './middleware/error-handler.js';

const app = express();

// ── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json());

// ── Health Check ────────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({ message: 'Recipe API is running!' });
});

// ── Route Modules ───────────────────────────────────────────────────────────
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/recipes', recipesRouter);

// ── Error Handling (must be registered last) ────────────────────────────────
app.use(globalErrorHandler);

export { app };

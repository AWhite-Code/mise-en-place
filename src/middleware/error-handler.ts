/**
 * @module src/middleware/error-handler
 * Global Express error-handling middleware.
 *
 * This must be the LAST middleware registered on the app so that
 * `next(error)` calls from route handlers are caught here.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Catch-all error handler.
 *
 * Logs the full stack trace to the console and returns a generic
 * 500 response to the client. Individual routes should handle
 * expected errors (404, 409, etc.) before they reach this point.
 */
export function globalErrorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
}

/**
 * @module src/server
 * HTTP server bootstrap for the mise-en-place API.
 *
 * Reads the listen port from the `PORT` environment variable
 * (falling back to 3000) and starts the Express application.
 * This module is NOT imported by tests — they use `app` directly.
 */

import 'dotenv/config';
import { app } from './app.js';

const PORT = process.env.PORT ?? 3000;

const server = app.listen(PORT, () => {
    console.log(`Mise en Place API listening on port ${PORT}`);
});

export { server };

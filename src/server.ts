import 'dotenv/config';
import { app } from './app.js';

const PORT = process.env.DATABASE_PORT;

const server = app.listen(PORT, () => {
    console.log(`Mise en Place API listening on port ${PORT}`);
});

export { server };
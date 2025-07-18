import express, { Express, Request, Response, NextFunction } from 'express';
import 'dotenv/config'
import ingredientsRouter from './routes/ingredients.js';

const app: Express = express();
const PORT = process.env.DATABASE_PORT

app.use(express.json());

// Health Check to make sure its not broken lol
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Recipe API is running!' });
});

//APIs
app.use('/api/ingredients', ingredientsRouter);
  

// Error Handling Middleware
// NOTE: MUST KEEP AT END OF CODE, NO MORE MIDDLEWARE BELOW THIS
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Run the server
const server = app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

export {app, server};
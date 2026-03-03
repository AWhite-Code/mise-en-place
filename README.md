# mise-en-place

Personal recipe management API — Phase 1 (Foundation Backend).

## Prerequisites

- **Node.js** 18+
- **Docker** (for PostgreSQL)

## Quick Start

```bash
# 1. Start the database
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Copy environment template and configure
cp .env.example .env          # then edit with your credentials

# 4. Run database migrations
npx prisma migrate dev

# 5. Start the development server
npm run dev
```

## Scripts

| Command        | Description                             |
|----------------|-----------------------------------------|
| `npm run dev`  | Start the API server (default port 3000)|
| `npm test`     | Run all tests (uses `.env.test`)        |
| `npm run seed` | Re-seed the database with sample data   |

## Project Structure

```
src/
  middleware/     Error-handling middleware
  routes/         Express route handlers (recipes, ingredients)
  utils/          Shared helpers (validation, fuzzy search, Prisma errors)
  app.ts          Express app setup (imported by tests)
  server.ts       HTTP server bootstrap

prisma/
  seeds/          Seed data scripts
  utils/          Database lifecycle helpers (clean, reset, seed)
  client.ts       Singleton PrismaClient
  schema.prisma   Database schema

tests/
  helpers/        Shared test lifecycle and setup
  *.test.ts       Integration test suites
```

## API Endpoints

| Method | Endpoint                 | Description                          |
|--------|--------------------------|--------------------------------------|
| GET    | `/`                      | Health check                         |
| GET    | `/api/recipes`           | List recipes (supports `?search=`)   |
| GET    | `/api/recipes/:id`       | Get recipe with ingredients          |
| POST   | `/api/recipes`           | Create a recipe                      |
| PATCH  | `/api/recipes/:id`       | Partially update a recipe            |
| DELETE | `/api/recipes/:id`       | Delete a recipe (cascades)           |
| GET    | `/api/ingredients`       | List ingredients (supports `?search=`)|
| GET    | `/api/ingredients/:id`   | Get a single ingredient              |
| POST   | `/api/ingredients`       | Create an ingredient (normalised)    |
| PATCH  | `/api/ingredients/:id`   | Update an ingredient                 |
| DELETE | `/api/ingredients/:id`   | Delete (blocked if in use)           |

## Environment Variables

| Variable            | Description                    | Example                        |
|---------------------|--------------------------------|--------------------------------|
| `DATABASE_URL`      | PostgreSQL connection string   | `postgresql://user:pass@localhost:5432/mep` |
| `PORT`              | API listen port                | `3000`                         |
| `POSTGRES_USER`     | Docker Compose DB user         | `mep`                          |
| `POSTGRES_PASSWORD` | Docker Compose DB password     | `secret`                       |
| `POSTGRES_DB`       | Docker Compose DB name         | `mise_en_place`                |

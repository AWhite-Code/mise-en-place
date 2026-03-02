-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN indexes for fuzzy search on name fields
CREATE INDEX recipe_name_trgm_idx ON "Recipe" USING GIN (name gin_trgm_ops);
CREATE INDEX ingredient_name_trgm_idx ON "Ingredient" USING GIN (name gin_trgm_ops);
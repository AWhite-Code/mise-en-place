/**
 * @module src/utils/fuzzy-search
 * Hybrid fuzzy search combining PostgreSQL pg_trgm trigram matching
 * with ILIKE substring matching.
 *
 * Trigram matching catches typos and misspellings (e.g. "beff" → "Beef Chili").
 * ILIKE catches exact substrings that may score low on short words.
 * Results are ranked by descending similarity so the best match comes first.
 */

import { prisma } from '../../prisma/client.js';

/** A single fuzzy-match result with its computed similarity score. */
export interface FuzzyMatch {
    id: string;
    similarity: number;
}

/** Tables that support fuzzy name search. */
export type SearchableTable = 'Recipe' | 'Ingredient';

/** Default trigram similarity threshold (0 – 1). */
const DEFAULT_THRESHOLD = 0.3;

/**
 * Execute a hybrid fuzzy search against the `name` column of a table.
 *
 * Combines `word_similarity` (pg_trgm) with an `ILIKE` fallback so that
 * both misspellings and exact substrings are captured. ILIKE-only hits
 * receive a baseline similarity of 0.5 so they sort reasonably.
 *
 * @param table      - Prisma model name (`'Recipe'` or `'Ingredient'`).
 * @param searchTerm - Raw search string from the client (will be lowercased).
 * @param threshold  - Minimum trigram similarity to qualify (default 0.3).
 * @returns Matched rows ordered by descending similarity.
 */
export async function fuzzySearchByName(
    table: SearchableTable,
    searchTerm: string,
    threshold: number = DEFAULT_THRESHOLD,
): Promise<FuzzyMatch[]> {
    return prisma.$queryRawUnsafe<FuzzyMatch[]>(
        `SELECT id,
                GREATEST(
                    word_similarity($1, name),
                    CASE WHEN name ILIKE '%' || $1 || '%' THEN 0.5 ELSE 0 END
                ) AS similarity
         FROM "${table}"
         WHERE word_similarity($1, name) > $2
            OR name ILIKE '%' || $1 || '%'
         ORDER BY similarity DESC`,
        searchTerm.toLowerCase(),
        threshold,
    );
}

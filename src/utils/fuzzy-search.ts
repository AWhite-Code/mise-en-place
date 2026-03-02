import { prisma } from '../../prisma/client.js';

interface FuzzyMatch {
    id: string;
    similarity: number;
}

/**
 * Hybrid fuzzy search: combines pg_trgm word_similarity with ILIKE substring matching.
 * - Trigram catches typos and misspellings (e.g., "beff" → "Beef Chili")
 * - ILIKE catches exact substrings that may score low on short words
 * Results are ranked by similarity, with ILIKE-only matches given a baseline score.
 */
export async function fuzzySearchByName(
    table: 'Recipe' | 'Ingredient',
    searchTerm: string,
    threshold: number = 0.3
): Promise<FuzzyMatch[]> {
    return prisma.$queryRawUnsafe<FuzzyMatch[]>(
        `SELECT id, 
                GREATEST(word_similarity($1, name), 
                         CASE WHEN name ILIKE '%' || $1 || '%' THEN 0.5 ELSE 0 END
                ) AS similarity
         FROM "${table}"
         WHERE word_similarity($1, name) > $2
            OR name ILIKE '%' || $1 || '%'
         ORDER BY similarity DESC`,
        searchTerm.toLowerCase(),
        threshold
    );
}
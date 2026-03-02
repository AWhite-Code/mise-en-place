import { prisma } from '../../prisma/client.js';

interface FuzzyMatch {
    id: string;
    similarity: number;
}

/**
 * Performs a fuzzy search on the name column of a given table using pg_trgm word_similarity.
 * Returns matching IDs ordered by relevance (highest similarity first).
 *
 * word_similarity(query, target) finds the greatest similarity between the query
 * and any substring of the target, making it ideal for matching search terms
 * against multi-word names (e.g. "pasta" matches "pasta carbonara" with high confidence).
 */
export async function fuzzySearchByName(
    table: 'Recipe' | 'Ingredient',
    searchTerm: string,
    threshold: number = 0.3
): Promise<FuzzyMatch[]> {
    return prisma.$queryRawUnsafe<FuzzyMatch[]>(
        `SELECT id, word_similarity($1, name) AS similarity
         FROM "${table}"
         WHERE word_similarity($1, name) > $2
         ORDER BY similarity DESC`,
        searchTerm.toLowerCase(),
        threshold
    );
}
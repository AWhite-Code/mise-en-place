/**
 * @module src/utils/validation
 * Shared request validation helpers.
 *
 * Centralises common validation patterns so that routes stay lean
 * and error messages remain consistent across the API.
 */

import { Response } from 'express';

/**
 * Validate that a value is a non-empty string after trimming.
 *
 * If validation fails, sends a 400 JSON response on the provided `res`
 * object and returns `null`. On success, returns the trimmed string.
 *
 * @param value    - The raw value from `req.body`.
 * @param field    - Human-readable field name used in the error message.
 * @param res      - Express response object (used only on failure).
 * @returns The trimmed string, or `null` if validation failed (response already sent).
 *
 * @example
 * const name = validateRequiredString(req.body.name, 'Recipe name', res);
 * if (name === null) return;          // 400 already sent
 * // ... use `name` safely
 */
export function validateRequiredString(
    value: unknown,
    field: string,
    res: Response,
): string | null {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
        res.status(400).json({ error: `${field} must be a non-empty string.` });
        return null;
    }
    return value.trim();
}

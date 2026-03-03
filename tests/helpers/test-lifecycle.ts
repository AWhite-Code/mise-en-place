/**
 * @module tests/helpers/test-lifecycle
 * Shared test lifecycle hooks for integration tests.
 *
 * Call `setupTestLifecycle()` at the top of each `describe` block to
 * register beforeAll / beforeEach / afterEach / afterAll hooks that:
 *  1. Deploy migrations once before the suite.
 *  2. Reset the database to the base seed before every test.
 *  3. Clean the database after every test.
 *  4. Disconnect Prisma after the suite completes.
 *
 * This eliminates the copy-pasted lifecycle that was in every test file.
 */

import { execSync } from 'child_process';
import { prisma, resetWithBaseSeed, cleanDatabase } from '../../prisma/utils/db-utils.js';

/**
 * Register standard integration-test lifecycle hooks.
 * Must be called inside a Jest `describe()` block.
 */
export function setupTestLifecycle(): void {
    beforeAll(() => {
        execSync('npx prisma migrate deploy', {
            env: { ...process.env },
        });
    });

    beforeEach(async () => {
        await resetWithBaseSeed();
    });

    afterEach(async () => {
        await cleanDatabase();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });
}

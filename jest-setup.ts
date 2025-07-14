import { resetWithBaseSeed } from './prisma/utils/db-utils.js';

beforeEach(async () => {
    // Initialize test database with base seed
    await resetWithBaseSeed();
});
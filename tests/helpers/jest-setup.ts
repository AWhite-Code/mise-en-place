/**
 * @module tests/helpers/jest-setup
 * Global Jest setup file.
 *
 * Previously ran resetWithBaseSeed() in a global beforeEach, but this
 * duplicated the per-suite lifecycle. Now this file exists as a hook
 * point for any future global setup (e.g. extending expect matchers).
 */

// Increase timeout for CI environments where DB operations can be slow.
jest.setTimeout(15_000);

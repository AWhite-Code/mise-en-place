// Set the environment to test before any code runs for client.ts configuration
process.env.NODE_ENV = 'test';

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./jest-setup.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
};
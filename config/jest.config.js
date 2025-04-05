process.env.NODE_ENV = 'test';

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./config/jest-setup.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
};
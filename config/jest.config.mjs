export default {
    preset: 'ts-jest/presets/js-with-ts-esm',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./jest-setup.ts'],
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
      '^.+\\.tsx?$': ['ts-jest', {
        useESM: true,
      }]
    },
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
  };
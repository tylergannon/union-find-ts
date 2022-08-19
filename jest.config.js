export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    testMatch: ['**/test/**/*.spec.ts'],
    collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/types/**/*.ts'],
    globals: {
        'ts-jest': {
            useESM: true,
            diagnostics: false,
            isolatedModules: true
        }
    },
    // See https://kulshekhar.github.io/ts-jest/docs/guides/esm-support/#use-esm-presets
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
}

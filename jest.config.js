module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.e2e-spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/services/nestjs/src/$1',
  },
  testTimeout: 20000, 
};
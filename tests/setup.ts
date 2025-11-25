/**
 * Jest test setup file
 */

import { resetMocks } from './__mocks__/local-main';

// Reset mocks before each test
beforeEach(() => {
  resetMocks();
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(10000);

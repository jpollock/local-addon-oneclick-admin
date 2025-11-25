/**
 * Mock for @getflywheel/local/main module
 */

export interface AddonMainContext {
  hooks: {
    addAction: jest.Mock;
    addFilter: jest.Mock;
  };
}

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const mockUserData = {
  get: jest.fn((key: string, defaultValue?: unknown) => defaultValue),
  set: jest.fn(),
};

const mockSiteData = {
  getSite: jest.fn(),
  updateSite: jest.fn(),
};

const mockWpCli = {
  run: jest.fn(),
};

// Use unknown type to avoid strict type checking issues with mocks
const mockServices: unknown = {
  localLogger: mockLogger,
  userData: mockUserData,
  siteData: mockSiteData,
  wpCli: mockWpCli,
};

export const getServiceContainer = jest.fn(() => ({
  cradle: mockServices,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getMockServices = (): any => mockServices;

export const resetMocks = (): void => {
  mockLogger.info.mockClear();
  mockLogger.warn.mockClear();
  mockLogger.error.mockClear();
  mockLogger.debug.mockClear();
  mockUserData.get.mockClear();
  mockUserData.set.mockClear();
  mockSiteData.getSite.mockClear();
  mockSiteData.updateSite.mockClear();
  mockWpCli.run.mockClear();
};

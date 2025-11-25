/**
 * Mock for electron module
 */

export const ipcMain = {
  handle: jest.fn(),
  on: jest.fn(),
};

export const ipcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
};

export const BrowserWindow = {
  getAllWindows: jest.fn(() => []),
};

export type IpcMainInvokeEvent = {
  sender: unknown;
};

export type IpcMainEvent = {
  sender: unknown;
};

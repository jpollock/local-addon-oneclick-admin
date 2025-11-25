/**
 * Tests for IPC Handlers
 */

import { ipcMain } from 'electron';
import { getMockServices } from './__mocks__/local-main';
import { registerIpcHandlers } from '../src/main/ipc-handlers';
import { IPC_CHANNELS, STORAGE_KEYS } from '../src/common/constants';

describe('IPC Handlers', () => {
  const mockContext = {
    hooks: {
      addAction: jest.fn(),
      addFilter: jest.fn(),
    },
  };

  beforeEach(() => {
    (ipcMain.handle as jest.Mock).mockClear();
  });

  describe('registerIpcHandlers', () => {
    it('should register GET_SETTINGS handler', () => {
      registerIpcHandlers(mockContext as any);

      expect(ipcMain.handle).toHaveBeenCalledWith(
        IPC_CHANNELS.GET_SETTINGS,
        expect.any(Function)
      );
    });

    it('should register SAVE_SETTINGS handler', () => {
      registerIpcHandlers(mockContext as any);

      expect(ipcMain.handle).toHaveBeenCalledWith(
        IPC_CHANNELS.SAVE_SETTINGS,
        expect.any(Function)
      );
    });

    it('should log successful registration', () => {
      const services = getMockServices();
      registerIpcHandlers(mockContext as any);

      expect(services.localLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('IPC handlers registered')
      );
    });
  });

  describe('GET_SETTINGS handler', () => {
    it('should return enabled setting with success response', async () => {
      const services = getMockServices();
      (services.userData.get as jest.Mock).mockReturnValue(true);

      registerIpcHandlers(mockContext as any);

      // Get the handler that was registered
      const handler = (ipcMain.handle as jest.Mock).mock.calls.find(
        (call) => call[0] === IPC_CHANNELS.GET_SETTINGS
      )?.[1];

      const result = await handler();

      expect(result).toEqual({
        success: true,
        data: { enabled: true },
        error: undefined,
        timestamp: expect.any(Number),
      });
    });

    it('should use default value when setting not found', async () => {
      const services = getMockServices();
      (services.userData.get as jest.Mock).mockImplementation(
        (key: string, defaultValue: unknown) => defaultValue
      );

      registerIpcHandlers(mockContext as any);

      const handler = (ipcMain.handle as jest.Mock).mock.calls.find(
        (call) => call[0] === IPC_CHANNELS.GET_SETTINGS
      )?.[1];

      const result = await handler();

      expect(result.data?.enabled).toBe(true);
      expect(services.userData.get).toHaveBeenCalledWith(STORAGE_KEYS.ENABLED, true);
    });
  });

  describe('SAVE_SETTINGS handler', () => {
    it('should save valid settings', async () => {
      const services = getMockServices();

      registerIpcHandlers(mockContext as any);

      const handler = (ipcMain.handle as jest.Mock).mock.calls.find(
        (call) => call[0] === IPC_CHANNELS.SAVE_SETTINGS
      )?.[1];

      const result = await handler({}, { enabled: false });

      expect(result.success).toBe(true);
      expect(result.data?.enabled).toBe(false);
      expect(services.userData.set).toHaveBeenCalledWith(STORAGE_KEYS.ENABLED, false);
    });

    it('should reject invalid settings data', async () => {
      registerIpcHandlers(mockContext as any);

      const handler = (ipcMain.handle as jest.Mock).mock.calls.find(
        (call) => call[0] === IPC_CHANNELS.SAVE_SETTINGS
      )?.[1];

      const result = await handler({}, { enabled: 'not a boolean' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid settings');
    });

    it('should reject null settings', async () => {
      registerIpcHandlers(mockContext as any);

      const handler = (ipcMain.handle as jest.Mock).mock.calls.find(
        (call) => call[0] === IPC_CHANNELS.SAVE_SETTINGS
      )?.[1];

      const result = await handler({}, null);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid settings');
    });
  });
});

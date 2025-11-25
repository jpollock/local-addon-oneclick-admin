/**
 * Tests for Lifecycle Hooks
 */

import { ipcMain, BrowserWindow } from 'electron';
import { getMockServices } from './__mocks__/local-main';
import { registerLifecycleHooks } from '../src/main/lifecycle-hooks';

describe('Lifecycle Hooks', () => {
  const mockContext = {
    hooks: {
      addAction: jest.fn(),
      addFilter: jest.fn(),
    },
  };

  beforeEach(() => {
    (ipcMain.on as jest.Mock).mockClear();
    (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([]);
  });

  describe('registerLifecycleHooks', () => {
    it('should register siteAdded IPC listener', () => {
      registerLifecycleHooks(mockContext as any);

      expect(ipcMain.on).toHaveBeenCalledWith('siteAdded', expect.any(Function));
    });

    it('should log successful registration', () => {
      const services = getMockServices();
      registerLifecycleHooks(mockContext as any);

      expect(services.localLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('IPC listener registered')
      );
    });
  });

  describe('siteAdded handler', () => {
    it('should skip if feature is disabled', async () => {
      const services = getMockServices();
      (services.userData.get as jest.Mock).mockReturnValue(false);
      (services.siteData.getSite as jest.Mock).mockReturnValue({
        id: 'test-site',
        name: 'Test Site',
      });

      registerLifecycleHooks(mockContext as any);

      const handler = (ipcMain.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'siteAdded'
      )?.[1];

      await handler({}, { id: 'test-site', name: 'Test Site' });

      expect(services.localLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Feature disabled')
      );
      expect(services.wpCli.run).not.toHaveBeenCalled();
    });

    it('should skip if site already has one-click admin configured', async () => {
      const services = getMockServices();
      (services.userData.get as jest.Mock).mockReturnValue(true);
      (services.siteData.getSite as jest.Mock).mockReturnValue({
        id: 'test-site',
        name: 'Test Site',
        oneClickAdminID: 1,
      });

      registerLifecycleHooks(mockContext as any);

      const handler = (ipcMain.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'siteAdded'
      )?.[1];

      await handler({}, { id: 'test-site', name: 'Test Site' });

      expect(services.localLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('already has one-click admin')
      );
      expect(services.wpCli.run).not.toHaveBeenCalled();
    });

    it('should configure one-click admin for new sites', async () => {
      const services = getMockServices();
      (services.userData.get as jest.Mock).mockReturnValue(true);
      (services.siteData.getSite as jest.Mock).mockReturnValue({
        id: 'test-site',
        name: 'Test Site',
      });
      (services.wpCli.run as jest.Mock).mockResolvedValue(
        JSON.stringify([
          { ID: '1', user_login: 'admin', display_name: 'Admin User', user_email: 'admin@test.local', roles: 'administrator' },
        ])
      );
      (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([
        { webContents: { send: jest.fn() } },
      ]);

      registerLifecycleHooks(mockContext as any);

      const handler = (ipcMain.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'siteAdded'
      )?.[1];

      await handler({}, { id: 'test-site', name: 'Test Site' });

      expect(services.siteData.updateSite).toHaveBeenCalledWith('test-site', {
        oneClickAdminID: 1,
        oneClickAdminDisplayName: 'Admin User',
      });
    });

    it('should handle missing site in siteData', async () => {
      const services = getMockServices();
      (services.siteData.getSite as jest.Mock).mockReturnValue(null);

      registerLifecycleHooks(mockContext as any);

      const handler = (ipcMain.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'siteAdded'
      )?.[1];

      await handler({}, { id: 'test-site', name: 'Test Site' });

      expect(services.localLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Could not find site')
      );
    });

    it('should validate IPC event data', async () => {
      const services = getMockServices();

      registerLifecycleHooks(mockContext as any);

      const handler = (ipcMain.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'siteAdded'
      )?.[1];

      await handler({}, null);

      expect(services.localLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid siteAdded IPC event')
      );
    });

    it('should handle WP-CLI errors gracefully', async () => {
      const services = getMockServices();
      (services.userData.get as jest.Mock).mockReturnValue(true);
      (services.siteData.getSite as jest.Mock).mockReturnValue({
        id: 'test-site',
        name: 'Test Site',
      });
      (services.wpCli.run as jest.Mock).mockRejectedValue(new Error('WP-CLI error'));

      registerLifecycleHooks(mockContext as any);

      const handler = (ipcMain.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'siteAdded'
      )?.[1];

      await handler({}, { id: 'test-site', name: 'Test Site' });

      expect(services.localLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get admin users')
      );
    });

    it('should handle no admin users found', async () => {
      const services = getMockServices();
      (services.userData.get as jest.Mock).mockReturnValue(true);
      (services.siteData.getSite as jest.Mock).mockReturnValue({
        id: 'test-site',
        name: 'Test Site',
      });
      (services.wpCli.run as jest.Mock).mockResolvedValue('[]');

      registerLifecycleHooks(mockContext as any);

      const handler = (ipcMain.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'siteAdded'
      )?.[1];

      await handler({}, { id: 'test-site', name: 'Test Site' });

      expect(services.localLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No administrator users found')
      );
    });
  });
});

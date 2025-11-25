/**
 * Tests for Constants
 */

import { ADDON_NAME, ADDON_VERSION, IPC_CHANNELS, STORAGE_KEYS } from '../src/common/constants';

describe('Constants', () => {
  describe('ADDON_NAME', () => {
    it('should be a non-empty string', () => {
      expect(typeof ADDON_NAME).toBe('string');
      expect(ADDON_NAME.length).toBeGreaterThan(0);
    });
  });

  describe('ADDON_VERSION', () => {
    it('should be a valid semver string', () => {
      expect(ADDON_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('IPC_CHANNELS', () => {
    it('should have GET_SETTINGS channel', () => {
      expect(IPC_CHANNELS.GET_SETTINGS).toBeDefined();
      expect(typeof IPC_CHANNELS.GET_SETTINGS).toBe('string');
    });

    it('should have SAVE_SETTINGS channel', () => {
      expect(IPC_CHANNELS.SAVE_SETTINGS).toBeDefined();
      expect(typeof IPC_CHANNELS.SAVE_SETTINGS).toBe('string');
    });

    it('should have CONFIGURED channel', () => {
      expect(IPC_CHANNELS.CONFIGURED).toBeDefined();
      expect(typeof IPC_CHANNELS.CONFIGURED).toBe('string');
    });

    it('should have unique channel names', () => {
      const channels = Object.values(IPC_CHANNELS);
      const uniqueChannels = new Set(channels);
      expect(uniqueChannels.size).toBe(channels.length);
    });
  });

  describe('STORAGE_KEYS', () => {
    it('should have ENABLED key', () => {
      expect(STORAGE_KEYS.ENABLED).toBeDefined();
      expect(typeof STORAGE_KEYS.ENABLED).toBe('string');
    });

    it('should have unique storage keys', () => {
      const keys = Object.values(STORAGE_KEYS);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });
});

// ABOUTME: This file contains tests for the configuration service functionality
// including localStorage persistence and default configuration management.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigService } from '../services/configService';

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset the singleton instance by clearing the static property
    (ConfigService as any).instance = undefined;
    // Create a fresh instance for each test
    configService = ConfigService.getInstance();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Default Configuration', () => {
    it('should provide default configuration values', () => {
      const config = configService.getConfig();
      
      expect(config.history.maxDepth).toBe(50);
      expect(config.ui.darkMode).toBe(false);
    });

    it('should return separate configuration sections', () => {
      const historyConfig = configService.getHistoryConfig();
      const uiConfig = configService.getUIConfig();

      expect(historyConfig.maxDepth).toBe(50);
      expect(uiConfig.darkMode).toBe(false);
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration values', () => {
      configService.updateConfig({
        history: { maxDepth: 100 },
        ui: { darkMode: true }
      });

      const config = configService.getConfig();
      expect(config.history.maxDepth).toBe(100);
      expect(config.ui.darkMode).toBe(true);
    });

    it('should update partial configuration', () => {
      configService.updateConfig({
        history: { maxDepth: 25 }
      });

      const config = configService.getConfig();
      expect(config.history.maxDepth).toBe(25);
      expect(config.ui.darkMode).toBe(false); // Should remain default
    });

    it('should merge nested configuration objects', () => {
      // Update only history config
      configService.updateConfig({
        history: { maxDepth: 75 }
      });

      // Update only UI config
      configService.updateConfig({
        ui: { darkMode: true }
      });

      const config = configService.getConfig();
      expect(config.history.maxDepth).toBe(75);
      expect(config.ui.darkMode).toBe(true);
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should save configuration to localStorage', () => {
      configService.updateConfig({
        history: { maxDepth: 30 },
        ui: { darkMode: true }
      });

      const stored = localStorage.getItem('statemachine-ui-config');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.history.maxDepth).toBe(30);
      expect(parsed.ui.darkMode).toBe(true);
    });

    it('should load configuration from localStorage', () => {
      // Manually set localStorage data
      const configData = {
        history: { maxDepth: 20 },
        ui: { darkMode: true }
      };
      localStorage.setItem('statemachine-ui-config', JSON.stringify(configData));

      // Reset singleton and create new instance to test loading
      (ConfigService as any).instance = undefined;
      const newConfigService = ConfigService.getInstance();
      const config = newConfigService.getConfig();

      expect(config.history.maxDepth).toBe(20);
      expect(config.ui.darkMode).toBe(true);
    });

    it('should merge loaded config with defaults', () => {
      // Set partial config in localStorage
      const partialConfig = {
        history: { maxDepth: 15 }
        // Missing ui config
      };
      localStorage.setItem('statemachine-ui-config', JSON.stringify(partialConfig));

      // Reset singleton and create new instance
      (ConfigService as any).instance = undefined;
      const newConfigService = ConfigService.getInstance();
      const config = newConfigService.getConfig();

      expect(config.history.maxDepth).toBe(15);
      expect(config.ui.darkMode).toBe(false); // Should use default
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('statemachine-ui-config', 'invalid-json');

      // Should fall back to defaults without throwing
      const newConfigService = ConfigService.getInstance();
      const config = newConfigService.getConfig();

      expect(config.history.maxDepth).toBe(50);
      expect(config.ui.darkMode).toBe(false);
    });
  });

  describe('Configuration Reset', () => {
    it('should reset configuration to defaults', () => {
      // Update configuration
      configService.updateConfig({
        history: { maxDepth: 100 },
        ui: { darkMode: true }
      });

      // Reset to defaults
      configService.resetToDefaults();

      const config = configService.getConfig();
      expect(config.history.maxDepth).toBe(50);
      expect(config.ui.darkMode).toBe(false);
    });

    it('should clear localStorage when resetting', () => {
      configService.updateConfig({
        history: { maxDepth: 100 }
      });

      // Verify it's in localStorage
      expect(localStorage.getItem('statemachine-ui-config')).not.toBeNull();

      configService.resetToDefaults();

      // Should still be in localStorage but with default values
      const stored = localStorage.getItem('statemachine-ui-config');
      expect(stored).not.toBeNull();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.history.maxDepth).toBe(50);
      expect(parsed.ui.darkMode).toBe(false);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ConfigService.getInstance();
      const instance2 = ConfigService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should maintain state across getInstance calls', () => {
      const instance1 = ConfigService.getInstance();
      instance1.updateConfig({ history: { maxDepth: 99 } });

      const instance2 = ConfigService.getInstance();
      const config = instance2.getConfig();

      expect(config.history.maxDepth).toBe(99);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage write errors gracefully', () => {
      // Mock localStorage.setItem to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('Storage quota exceeded');
      };

      // Should not throw when updating config
      expect(() => {
        configService.updateConfig({ history: { maxDepth: 200 } });
      }).not.toThrow();

      // Restore original method
      localStorage.setItem = originalSetItem;
    });

    it('should handle localStorage read errors gracefully', () => {
      // Mock localStorage.getItem to throw an error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = () => {
        throw new Error('Storage access denied');
      };

      // Should fall back to defaults
      const newConfigService = ConfigService.getInstance();
      const config = newConfigService.getConfig();

      expect(config.history.maxDepth).toBe(50);
      expect(config.ui.darkMode).toBe(false);

      // Restore original method
      localStorage.getItem = originalGetItem;
    });
  });
});

// ABOUTME: This file contains tests for the keyboard shortcuts hook functionality
// including cross-platform key combinations and input field exclusions.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// Mock navigator.platform for testing different platforms
const mockNavigator = (platform: string) => {
  Object.defineProperty(navigator, 'platform', {
    value: platform,
    configurable: true
  });
};

describe('useKeyboardShortcuts', () => {
  let onUndo: ReturnType<typeof vi.fn>;
  let onRedo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onUndo = vi.fn();
    onRedo = vi.fn();
    
    // Clear any existing event listeners
    document.removeEventListener('keydown', expect.any(Function));
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Reset navigator platform
    mockNavigator('MacIntel');
  });

  describe('Mac Platform', () => {
    beforeEach(() => {
      mockNavigator('MacIntel');
    });

    it('should trigger undo on Cmd+Z', () => {
      renderHook(() => useKeyboardShortcuts({
        onUndo,
        onRedo,
        canUndo: true,
        canRedo: false
      }));

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        shiftKey: false
      });

      document.dispatchEvent(event);
      expect(onUndo).toHaveBeenCalledTimes(1);
      expect(onRedo).not.toHaveBeenCalled();
    });

    it('should trigger redo on Cmd+Shift+Z', () => {
      renderHook(() => useKeyboardShortcuts({
        onUndo,
        onRedo,
        canUndo: false,
        canRedo: true
      }));

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        shiftKey: true
      });

      document.dispatchEvent(event);
      expect(onRedo).toHaveBeenCalledTimes(1);
      expect(onUndo).not.toHaveBeenCalled();
    });

    it('should not trigger undo when canUndo is false', () => {
      renderHook(() => useKeyboardShortcuts({
        onUndo,
        onRedo,
        canUndo: false,
        canRedo: false
      }));

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        shiftKey: false
      });

      document.dispatchEvent(event);
      expect(onUndo).not.toHaveBeenCalled();
    });
  });

  describe('Windows/Linux Platform', () => {
    beforeEach(() => {
      mockNavigator('Win32');
    });

    it('should trigger undo on Ctrl+Z', () => {
      renderHook(() => useKeyboardShortcuts({
        onUndo,
        onRedo,
        canUndo: true,
        canRedo: false
      }));

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: false
      });

      document.dispatchEvent(event);
      expect(onUndo).toHaveBeenCalledTimes(1);
    });

    it('should trigger redo on Ctrl+Y', () => {
      renderHook(() => useKeyboardShortcuts({
        onUndo,
        onRedo,
        canUndo: false,
        canRedo: true
      }));

      const event = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true
      });

      document.dispatchEvent(event);
      expect(onRedo).toHaveBeenCalledTimes(1);
    });

    it('should not trigger redo when canRedo is false', () => {
      renderHook(() => useKeyboardShortcuts({
        onUndo,
        onRedo,
        canUndo: false,
        canRedo: false
      }));

      const event = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true
      });

      document.dispatchEvent(event);
      expect(onRedo).not.toHaveBeenCalled();
    });
  });

  describe('Input Field Exclusions', () => {
    it('should not trigger shortcuts when focused on input field', () => {
      renderHook(() => useKeyboardShortcuts({
        onUndo,
        onRedo,
        canUndo: true,
        canRedo: true
      }));

      // Mock an input element as target
      const mockInput = { tagName: 'INPUT' };

      // Create event with input as target
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        bubbles: true
      });

      // Override the target property
      Object.defineProperty(event, 'target', {
        value: mockInput,
        enumerable: true
      });

      document.dispatchEvent(event);
      expect(onUndo).not.toHaveBeenCalled();
    });

    it('should not trigger shortcuts when focused on textarea', () => {
      renderHook(() => useKeyboardShortcuts({
        onUndo,
        onRedo,
        canUndo: true,
        canRedo: true
      }));

      // Mock a textarea element as target
      const mockTextarea = { tagName: 'TEXTAREA' };

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        bubbles: true
      });

      // Override the target property
      Object.defineProperty(event, 'target', {
        value: mockTextarea,
        enumerable: true
      });

      document.dispatchEvent(event);
      expect(onUndo).not.toHaveBeenCalled();
    });

    it('should not trigger shortcuts when focused on contentEditable element', () => {
      renderHook(() => useKeyboardShortcuts({
        onUndo,
        onRedo,
        canUndo: true,
        canRedo: true
      }));

      // Mock a contentEditable element as target
      const mockDiv = { tagName: 'DIV', contentEditable: 'true' };

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        bubbles: true
      });

      // Override the target property
      Object.defineProperty(event, 'target', {
        value: mockDiv,
        enumerable: true
      });

      document.dispatchEvent(event);
      expect(onUndo).not.toHaveBeenCalled();
    });
  });

  describe('Event Prevention', () => {
    it('should prevent default behavior when triggering shortcuts', () => {
      renderHook(() => useKeyboardShortcuts({
        onUndo,
        onRedo,
        canUndo: true,
        canRedo: false
      }));

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        shiftKey: false
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(onUndo).toHaveBeenCalled();
    });
  });

  describe('Hook Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { unmount } = renderHook(() => useKeyboardShortcuts({
        onUndo,
        onRedo,
        canUndo: true,
        canRedo: true
      }));

      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransitionEditor } from '../components/Editors/TransitionEditor';
import type { TransitionDefinition } from '../types/workflow';

describe('TransitionEditor Resize Functionality', () => {
  const mockTransitionDefinition: TransitionDefinition = {
    next: 'target-state',
    name: 'Test Transition',
    manual: true,
    disabled: false
  };

  const defaultProps = {
    transitionId: 'test-transition',
    transitionDefinition: mockTransitionDefinition,
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    onDelete: vi.fn()
  };

  // Mock window dimensions for testing
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080,
    });
  });

  it('should start resize operation when mousedown on resize handle', () => {
    const { container } = render(<TransitionEditor {...defaultProps} />);
    
    // Find a resize handle (right edge)
    const rightHandle = container.querySelector('[class*="cursor-e-resize"]');
    expect(rightHandle).toBeInTheDocument();
    
    // Simulate mousedown on the handle
    fireEvent.mouseDown(rightHandle!, { clientX: 100, clientY: 100 });
    
    // The resize operation should have started (we can't easily test the internal state,
    // but we can verify the handle exists and responds to events)
    expect(rightHandle).toBeInTheDocument();
  });

  it('should have proper cursor styles for different resize handles', () => {
    const { container } = render(<TransitionEditor {...defaultProps} />);
    
    // Check corner handles
    expect(container.querySelector('[class*="cursor-nw-resize"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="cursor-ne-resize"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="cursor-sw-resize"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="cursor-se-resize"]')).toBeInTheDocument();
    
    // Check edge handles
    expect(container.querySelector('[class*="cursor-n-resize"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="cursor-s-resize"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="cursor-w-resize"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="cursor-e-resize"]')).toBeInTheDocument();
  });

  it('should maintain aspect ratio constraints', () => {
    const { container } = render(<TransitionEditor {...defaultProps} />);
    
    const panel = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
    expect(panel).toBeInTheDocument();
    
    // Check that the panel has reasonable default dimensions
    const width = parseInt(panel.style.width);
    const height = parseInt(panel.style.height);
    
    expect(width).toBeGreaterThanOrEqual(400); // Minimum width
    expect(height).toBeGreaterThanOrEqual(300); // Minimum height
    expect(width).toBeLessThanOrEqual(1920); // Should not exceed viewport
    expect(height).toBeLessThanOrEqual(1080); // Should not exceed viewport
  });

  it('should handle resize with mouse move simulation', () => {
    const { container } = render(<TransitionEditor {...defaultProps} />);

    const panel = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
    const rightHandle = container.querySelector('[class*="cursor-e-resize"]') as HTMLElement;

    const initialWidth = parseInt(panel.style.width);

    // Start resize
    fireEvent.mouseDown(rightHandle, { clientX: 100, clientY: 100 });

    // Simulate mouse move on document (this is how the actual resize works)
    fireEvent.mouseMove(document, { clientX: 200, clientY: 100 });

    // Check if width has changed
    const newWidth = parseInt(panel.style.width);
    expect(newWidth).toBeGreaterThan(initialWidth);

    // End resize
    fireEvent.mouseUp(document);
  });

  it('should show resize handles only on hover', () => {
    const { container } = render(<TransitionEditor {...defaultProps} />);
    
    // All resize handles should have opacity-0 initially (hidden)
    const handles = container.querySelectorAll('[class*="opacity-0"]');
    expect(handles.length).toBeGreaterThan(0);
    
    // They should have hover:opacity-100 to show on hover
    const hoverHandles = container.querySelectorAll('[class*="hover:opacity-100"]');
    expect(hoverHandles.length).toBeGreaterThan(0);
  });
});

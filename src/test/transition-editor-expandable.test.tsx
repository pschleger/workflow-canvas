import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransitionEditor } from '../components/Editors/TransitionEditor';
import type { TransitionDefinition } from '../types/workflow';

describe('TransitionEditor Resizable Functionality', () => {
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

  it('should render with default panel size', () => {
    const { container } = render(<TransitionEditor {...defaultProps} />);

    // Get the panel element by its distinctive classes
    const panel = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
    expect(panel).toBeInTheDocument();

    // Should have default size (896px width, 600px height)
    expect(panel.style.width).toBe('896px');
    expect(panel.style.height).toBe('600px');
  });

  it('should maintain panel state during editing', () => {
    const { container } = render(<TransitionEditor {...defaultProps} />);

    const panel = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
    const initialWidth = panel.style.width;
    const initialHeight = panel.style.height;

    // Edit the JSON content
    const textarea = screen.getByPlaceholderText('Enter JSON configuration...');
    fireEvent.change(textarea, {
      target: { value: JSON.stringify({ ...mockTransitionDefinition, name: 'Updated Name' }, null, 2) }
    });

    // Panel size should remain the same
    expect(panel.style.width).toBe(initialWidth);
    expect(panel.style.height).toBe(initialHeight);
  });

  it('should not render anything when panel is closed', () => {
    const { container } = render(<TransitionEditor {...defaultProps} isOpen={false} />);

    // Should not render the panel when closed
    const panel = container.querySelector('.bg-white.rounded-lg.shadow-xl');
    expect(panel).not.toBeInTheDocument();
  });

  it('should render resize handles for dragging', () => {
    const { container } = render(<TransitionEditor {...defaultProps} />);

    // Check for corner resize handles
    const cornerHandles = container.querySelectorAll('[class*="cursor-nw-resize"], [class*="cursor-ne-resize"], [class*="cursor-sw-resize"], [class*="cursor-se-resize"]');
    expect(cornerHandles.length).toBe(4);

    // Check for edge resize handles
    const edgeHandles = container.querySelectorAll('[class*="cursor-n-resize"], [class*="cursor-s-resize"], [class*="cursor-w-resize"], [class*="cursor-e-resize"]');
    expect(edgeHandles.length).toBe(4);
  });

  it('should have minimum and maximum size constraints', () => {
    const { container } = render(<TransitionEditor {...defaultProps} />);

    const panel = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
    expect(panel).toBeInTheDocument();

    // Check minimum size constraints
    expect(panel.style.minWidth).toBe('400px');
    expect(panel.style.minHeight).toBe('300px');

    // Check maximum size constraints
    expect(panel.style.maxWidth).toBe('95vw');
    expect(panel.style.maxHeight).toBe('95vh');
  });
});

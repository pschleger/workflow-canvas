import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowCanvas } from '../components/Canvas/WorkflowCanvas';
import type { UIWorkflowData } from '../types/workflow';

// ABOUTME: This file contains tests for the Quick Help toggle functionality
// to ensure the help panel can be shown/hidden via the '?' button.

describe('Quick Help Toggle', () => {
  const mockWorkflow: UIWorkflowData = {
    id: 'test-workflow',
    entityId: 'test-entity',
    configuration: {
      name: 'Test Workflow',
      initialState: 'state1',
      states: {
        state1: {
          name: 'State 1',
          transitions: []
        }
      }
    },
    layout: {
      states: [
        { id: 'state1', x: 100, y: 100 }
      ],
      transitions: []
    },
    updatedAt: new Date().toISOString()
  };

  const defaultProps = {
    workflow: mockWorkflow,
    onWorkflowUpdate: vi.fn(),
    onStateEdit: vi.fn(),
    onTransitionEdit: vi.fn(),
    darkMode: false
  };

  it('should render the Quick Help toggle button', () => {
    render(<WorkflowCanvas {...defaultProps} />);

    const helpButton = screen.getByTitle('Toggle Quick Help');
    expect(helpButton).toBeInTheDocument();
    expect(helpButton).toHaveAttribute('title', 'Toggle Quick Help');
  });

  it('should not show Quick Help panel by default', () => {
    render(<WorkflowCanvas {...defaultProps} />);
    
    // Quick Help panel should not be visible initially
    expect(screen.queryByText('Quick Help')).not.toBeInTheDocument();
    expect(screen.queryByText('• Double-click canvas to add state')).not.toBeInTheDocument();
  });

  it('should show Quick Help panel when help button is clicked', () => {
    render(<WorkflowCanvas {...defaultProps} />);

    const helpButton = screen.getByTitle('Toggle Quick Help');
    fireEvent.click(helpButton);
    
    // Quick Help panel should now be visible
    expect(screen.getByText('Quick Help')).toBeInTheDocument();
    expect(screen.getByText('• Double-click canvas to add state')).toBeInTheDocument();
    expect(screen.getByText('• Double-click transitions to edit')).toBeInTheDocument();
    expect(screen.getByText('• Drag from state handles to connect')).toBeInTheDocument();
    expect(screen.getByText('• Drag transition labels to reposition')).toBeInTheDocument();
    expect(screen.getByText('• Click edit icons to modify')).toBeInTheDocument();
    expect(screen.getByText('• Drag states to rearrange')).toBeInTheDocument();
    expect(screen.getByText('• Use layout button to auto-arrange states')).toBeInTheDocument();
  });

  it('should hide Quick Help panel when help button is clicked again', () => {
    render(<WorkflowCanvas {...defaultProps} />);

    const helpButton = screen.getByTitle('Toggle Quick Help');
    
    // Show the panel
    fireEvent.click(helpButton);
    expect(screen.getByText('Quick Help')).toBeInTheDocument();
    
    // Hide the panel
    fireEvent.click(helpButton);
    expect(screen.queryByText('Quick Help')).not.toBeInTheDocument();
  });

  it('should toggle Quick Help panel visibility correctly', () => {
    render(<WorkflowCanvas {...defaultProps} />);

    const helpButton = screen.getByTitle('Toggle Quick Help');

    // Initially panel should not be visible
    expect(screen.queryByText('• Double-click canvas to add state')).not.toBeInTheDocument();

    // Click to show help
    fireEvent.click(helpButton);

    // Panel should now be visible
    expect(screen.getByText('• Double-click canvas to add state')).toBeInTheDocument();

    // Click again to hide help
    fireEvent.click(helpButton);

    // Panel should be hidden again
    expect(screen.queryByText('• Double-click canvas to add state')).not.toBeInTheDocument();
  });

  it('should display all Quick Help content when shown', () => {
    render(<WorkflowCanvas {...defaultProps} />);

    const helpButton = screen.getByTitle('Toggle Quick Help');
    fireEvent.click(helpButton);

    // Verify all help content is displayed
    expect(screen.getByText('Quick Help')).toBeInTheDocument();
    expect(screen.getByText('• Double-click canvas to add state')).toBeInTheDocument();
    expect(screen.getByText('• Double-click transitions to edit')).toBeInTheDocument();
    expect(screen.getByText('• Drag from state handles to connect')).toBeInTheDocument();
    expect(screen.getByText('• Drag transition labels to reposition')).toBeInTheDocument();
    expect(screen.getByText('• Click edit icons to modify')).toBeInTheDocument();
    expect(screen.getByText('• Drag states to rearrange')).toBeInTheDocument();
    expect(screen.getByText('• Use layout button to auto-arrange states')).toBeInTheDocument();
  });

  it('should work correctly with both auto-layout and help buttons present', () => {
    render(<WorkflowCanvas {...defaultProps} />);

    // Both buttons should be present
    const autoLayoutButton = screen.getByTitle('Auto-arrange states using hierarchical layout');
    const helpButton = screen.getByTitle('Toggle Quick Help');
    
    expect(autoLayoutButton).toBeInTheDocument();
    expect(helpButton).toBeInTheDocument();
    
    // Help button should work independently
    fireEvent.click(helpButton);
    expect(screen.getByText('Quick Help')).toBeInTheDocument();
    
    // Auto-layout button should still be functional
    expect(autoLayoutButton).toHaveAttribute('title', 'Auto-arrange states using hierarchical layout');
  });
});

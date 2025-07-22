// ABOUTME: This file contains integration tests for the complete undo/redo functionality
// including workflow updates, history tracking, and UI state management.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import App from '../App';
import { historyService } from '../services/historyService';
import { configService } from '../services/configService';

// Mock the API service to avoid network calls
vi.mock('../services/mockApi', () => ({
  MockApiService: {
    getEntities: vi.fn().mockResolvedValue({
      success: true,
      data: [{ id: 'test-entity', name: 'Test Entity', description: 'Test entity for undo/redo tests' }]
    }),
    getWorkflows: vi.fn().mockResolvedValue({
      success: true,
      data: [{ 
        id: 'test-workflow', 
        name: 'Test Workflow', 
        stateCount: 2, 
        transitionCount: 1, 
        updatedAt: new Date().toISOString() 
      }]
    }),
    getWorkflowConfiguration: vi.fn().mockResolvedValue({
      success: true,
      data: {
        version: '1.0',
        name: 'Test Workflow',
        initialState: 'pending',
        states: {
          'pending': { transitions: [{ name: 'Complete', next: 'completed' }] },
          'completed': { transitions: [] }
        }
      }
    }),
    getCanvasLayout: vi.fn().mockResolvedValue({
      success: true,
      data: {
        workflowId: 'test-workflow',
        version: 1,
        updatedAt: new Date().toISOString(),
        states: [
          { id: 'pending', position: { x: 100, y: 100 } },
          { id: 'completed', position: { x: 300, y: 100 } }
        ],
        transitions: []
      }
    }),
    updateWorkflowConfiguration: vi.fn().mockResolvedValue({ success: true }),
    updateCanvasLayout: vi.fn().mockResolvedValue({ success: true })
  }
}));

describe('Undo/Redo Integration Tests', () => {
  beforeEach(() => {
    // Clear all storage and history before each test
    localStorage.clear();
    sessionStorage.clear();
    historyService.clearAllHistory();
    
    // Reset configuration to defaults
    configService.resetToDefaults();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  const renderApp = () => {
    return render(
      <ReactFlowProvider>
        <App />
      </ReactFlowProvider>
    );
  };

  describe('UI Integration', () => {
    it('should show undo/redo buttons in header', async () => {
      renderApp();
      
      // Wait for the app to load
      await waitFor(() => {
        expect(screen.getByText('Undo')).toBeInTheDocument();
        expect(screen.getByText('Redo')).toBeInTheDocument();
      });
    });

    it('should initially disable undo/redo buttons', async () => {
      renderApp();
      
      await waitFor(() => {
        const undoButton = screen.getByText('Undo').closest('button');
        const redoButton = screen.getByText('Redo').closest('button');
        
        expect(undoButton).toBeDisabled();
        expect(redoButton).toBeDisabled();
      });
    });

    it('should enable undo button after workflow changes', async () => {
      renderApp();
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Test Entity')).toBeInTheDocument();
      });

      // Select entity and workflow
      fireEvent.click(screen.getByText('Test Entity'));
      
      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test Workflow'));

      // Wait for workflow to load and simulate a change
      await waitFor(() => {
        const canvas = screen.getByTestId('react-flow-wrapper');
        expect(canvas).toBeInTheDocument();
      }, { timeout: 5000 });

      // Simulate double-click to add a state (this should create history)
      const canvas = screen.getByTestId('react-flow-wrapper');
      fireEvent.doubleClick(canvas, { clientX: 200, clientY: 200 });

      // Check that undo button becomes enabled
      await waitFor(() => {
        const undoButton = screen.getByText('Undo').closest('button');
        expect(undoButton).not.toBeDisabled();
      });
    });
  });

  describe('Keyboard Shortcuts Integration', () => {
    it('should trigger undo on Cmd+Z/Ctrl+Z', async () => {
      renderApp();
      
      // Load workflow
      await waitFor(() => {
        expect(screen.getByText('Test Entity')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Test Entity'));
      
      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test Workflow'));

      await waitFor(() => {
        const canvas = screen.getByTestId('react-flow-wrapper');
        expect(canvas).toBeInTheDocument();
      }, { timeout: 5000 });

      // Make a change to create history
      const canvas = screen.getByTestId('react-flow-wrapper');
      fireEvent.doubleClick(canvas, { clientX: 200, clientY: 200 });

      await waitFor(() => {
        const undoButton = screen.getByText('Undo').closest('button');
        expect(undoButton).not.toBeDisabled();
      });

      // Test keyboard shortcut
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      fireEvent.keyDown(document, {
        key: 'z',
        [isMac ? 'metaKey' : 'ctrlKey']: true
      });

      // Verify undo was triggered (button should be disabled again)
      await waitFor(() => {
        const undoButton = screen.getByText('Undo').closest('button');
        expect(undoButton).toBeDisabled();
      });
    });
  });

  describe('History Persistence', () => {
    it('should persist history across component re-renders', async () => {
      const { rerender } = renderApp();
      
      // Load workflow and make changes
      await waitFor(() => {
        expect(screen.getByText('Test Entity')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Test Entity'));
      
      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test Workflow'));

      await waitFor(() => {
        const canvas = screen.getByTestId('react-flow-wrapper');
        expect(canvas).toBeInTheDocument();
      }, { timeout: 5000 });

      // Make a change
      const canvas = screen.getByTestId('react-flow-wrapper');
      fireEvent.doubleClick(canvas, { clientX: 200, clientY: 200 });

      await waitFor(() => {
        const undoButton = screen.getByText('Undo').closest('button');
        expect(undoButton).not.toBeDisabled();
      });

      // Re-render the component
      rerender(
        <ReactFlowProvider>
          <App />
        </ReactFlowProvider>
      );

      // History should still be available
      await waitFor(() => {
        const undoButton = screen.getByText('Undo').closest('button');
        expect(undoButton).not.toBeDisabled();
      });
    });
  });

  describe('Configuration Integration', () => {
    it('should respect history depth configuration', () => {
      const config = configService.getConfig();
      expect(config.history.maxDepth).toBe(50); // Default value

      // Update configuration
      configService.updateConfig({
        history: { maxDepth: 10 }
      });

      const updatedConfig = configService.getConfig();
      expect(updatedConfig.history.maxDepth).toBe(10);
    });
  });
});

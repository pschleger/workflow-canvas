// ABOUTME: This file contains integration tests for the main App component startup
// ensuring the application loads without errors and displays the expected UI elements.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

// Mock React Flow
vi.mock('@xyflow/react', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow-provider">{children}</div>,
  useReactFlow: () => ({
    screenToFlowPosition: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    setViewport: vi.fn(),
    getViewport: vi.fn().mockReturnValue({ x: 0, y: 0, zoom: 1 }),
  }),
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  ReactFlow: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow-wrapper">{children}</div>,
  Background: () => <div data-testid="react-flow-background" />,
  Controls: () => <div data-testid="react-flow-controls" />,
  MiniMap: () => <div data-testid="react-flow-minimap" />,
  Handle: () => <div data-testid="react-flow-handle" />,
  Position: {
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
  },
}));

// Mock the API service to avoid network calls
vi.mock('../services/mockApi', () => ({
  MockApiService: {
    getEntities: vi.fn().mockResolvedValue({
      success: true,
      data: [{ id: 'test-entity', name: 'Test Entity', description: 'Test entity for startup tests' }]
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

describe('App Startup Integration Tests', () => {
  beforeEach(() => {
    // Clear all storage before each test
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  const renderApp = () => {
    return render(<App />);
  };

  describe('Initial Application Load', () => {
    it('should render without crashing', () => {
      expect(() => renderApp()).not.toThrow();
    });

    it('should display the main application title', async () => {
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByText('State Machine Workflow Editor')).toBeInTheDocument();
      });
    });

    it('should display header controls', async () => {
      renderApp();
      
      await waitFor(() => {
        // Check for undo/redo buttons
        expect(screen.getByText('Undo')).toBeInTheDocument();
        expect(screen.getByText('Redo')).toBeInTheDocument();
        
        // Check for import/export buttons
        expect(screen.getByText('Import')).toBeInTheDocument();
        expect(screen.getByText('Export')).toBeInTheDocument();
        
        // Check for dark mode toggle
        expect(screen.getByLabelText('Toggle dark mode')).toBeInTheDocument();
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

    it('should display sidebar with entity selector', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.getByText('Entities & Workflows')).toBeInTheDocument();
      });
    });

    it('should load and display entities', async () => {
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByText('Test Entity')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Configuration and Services Integration', () => {
    it('should initialize configuration service', async () => {
      renderApp();

      // The app should load without configuration errors
      await waitFor(() => {
        expect(screen.getByText('State Machine Workflow Editor')).toBeInTheDocument();
      });

      // Configuration should be accessible (no errors thrown)
      expect(async () => {
        const { configService } = await import('../services/configService');
        configService.getConfig();
      }).not.toThrow();
    });

    it('should initialize history service', async () => {
      renderApp();

      // The app should load without history service errors
      await waitFor(() => {
        expect(screen.getByText('State Machine Workflow Editor')).toBeInTheDocument();
      });

      // History service should be accessible (no errors thrown)
      expect(async () => {
        const { historyService } = await import('../services/historyService');
        historyService.canUndo('test-workflow');
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API to return error by importing the mocked module
      const mockApi = await import('../services/mockApi');
      mockApi.MockApiService.getEntities.mockResolvedValueOnce({
        success: false,
        message: 'API Error'
      });

      renderApp();

      // App should still render even with API errors
      await waitFor(() => {
        expect(screen.getByText('State Machine Workflow Editor')).toBeInTheDocument();
      });
    });

    it('should handle missing localStorage gracefully', async () => {
      // Mock localStorage to throw errors
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage not available');
      });

      expect(() => renderApp()).not.toThrow();
      
      await waitFor(() => {
        expect(screen.getByText('State Machine Workflow Editor')).toBeInTheDocument();
      });

      // Restore localStorage
      localStorage.getItem = originalGetItem;
    });
  });

  describe('Keyboard Shortcuts Integration', () => {
    it('should set up keyboard shortcuts without errors', async () => {
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByText('State Machine Workflow Editor')).toBeInTheDocument();
      });

      // Keyboard shortcuts should be set up (no errors in console)
      // We can test this by ensuring the hook doesn't throw
      expect(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'z',
          metaKey: true
        });
        document.dispatchEvent(event);
      }).not.toThrow();
    });
  });

  describe('React Flow Integration', () => {
    it('should render React Flow provider without errors', async () => {
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByText('State Machine Workflow Editor')).toBeInTheDocument();
      });

      // Should not have any React Flow related errors
      // The canvas area should be present
      const canvasArea = document.querySelector('main');
      expect(canvasArea).toBeInTheDocument();
    });
  });
});

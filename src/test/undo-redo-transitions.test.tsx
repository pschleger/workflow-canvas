// ABOUTME: This file contains tests to reproduce and verify the fix for the issue where
// undo/redo operations lose transitions and only recover states.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { historyService } from '../services/historyService';
import { configService } from '../services/configService';
import type { UIWorkflowData } from '../types/workflow';

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

// Mock the API service
vi.mock('../services/mockApi', () => ({
  MockApiService: {
    getEntities: vi.fn().mockResolvedValue({
      success: true,
      data: [{ id: 'test-entity', name: 'Test Entity', description: 'Test entity' }]
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
        transitions: [
          { id: 'pending-completed', sourceStateId: 'pending', targetStateId: 'completed', position: { x: 200, y: 100 } }
        ]
      }
    }),
    updateWorkflowConfiguration: vi.fn().mockResolvedValue({ success: true }),
    updateCanvasLayout: vi.fn().mockResolvedValue({ success: true })
  }
}));

describe('Undo/Redo Transitions Bug Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    historyService.clearAllHistory();
    configService.resetToDefaults();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  const createMockWorkflow = (
    states: Record<string, any> = {},
    transitions: any[] = [],
    layoutStates: any[] = [],
    layoutTransitions: any[] = []
  ): UIWorkflowData => ({
    id: 'test-workflow',
    entityId: 'test-entity',
    configuration: {
      version: '1.0',
      name: 'Test Workflow',
      initialState: 'state1',
      states
    },
    layout: {
      workflowId: 'test-workflow',
      version: 1,
      updatedAt: new Date().toISOString(),
      states: layoutStates,
      transitions: layoutTransitions
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  describe('History Service Transition Preservation', () => {
    it('should preserve both states and transitions in history entries', () => {
      const initialStates = {
        'state1': { transitions: [{ name: 'Go to State 2', next: 'state2' }] },
        'state2': { transitions: [] }
      };
      const initialLayoutStates = [
        { id: 'state1', position: { x: 100, y: 100 } },
        { id: 'state2', position: { x: 300, y: 100 } }
      ];
      const initialLayoutTransitions = [
        { id: 'state1-state2', sourceStateId: 'state1', targetStateId: 'state2', position: { x: 200, y: 100 } }
      ];

      const workflow1 = createMockWorkflow(
        initialStates,
        [],
        initialLayoutStates,
        initialLayoutTransitions
      );

      // Add initial workflow to history
      historyService.addEntry('test-workflow', workflow1, 'Initial workflow with transition');

      // Modify workflow - add a new state and transition
      const modifiedStates = {
        ...initialStates,
        'state3': { transitions: [] }
      };
      const modifiedLayoutStates = [
        ...initialLayoutStates,
        { id: 'state3', position: { x: 500, y: 100 } }
      ];
      const modifiedLayoutTransitions = [
        ...initialLayoutTransitions,
        { id: 'state2-state3', sourceStateId: 'state2', targetStateId: 'state3', position: { x: 400, y: 100 } }
      ];

      const workflow2 = createMockWorkflow(
        modifiedStates,
        [],
        modifiedLayoutStates,
        modifiedLayoutTransitions
      );

      historyService.addEntry('test-workflow', workflow2, 'Added state3 and transition');

      // Undo should restore the original workflow with its transitions
      const undoResult = historyService.undo('test-workflow');
      
      expect(undoResult).not.toBeNull();
      expect(undoResult!.configuration.states).toEqual(initialStates);
      expect(undoResult!.layout.states).toEqual(initialLayoutStates);
      expect(undoResult!.layout.transitions).toEqual(initialLayoutTransitions);
      expect(undoResult!.layout.transitions).toHaveLength(1);
      expect(undoResult!.layout.transitions[0].sourceStateId).toBe('state1');
      expect(undoResult!.layout.transitions[0].targetStateId).toBe('state2');
    });

    it('should preserve transitions when undoing state deletions', () => {
      // Create workflow with 3 states and 2 transitions
      const initialStates = {
        'state1': { transitions: [{ name: 'To State 2', next: 'state2' }] },
        'state2': { transitions: [{ name: 'To State 3', next: 'state3' }] },
        'state3': { transitions: [] }
      };
      const initialLayoutStates = [
        { id: 'state1', position: { x: 100, y: 100 } },
        { id: 'state2', position: { x: 300, y: 100 } },
        { id: 'state3', position: { x: 500, y: 100 } }
      ];
      const initialLayoutTransitions = [
        { id: 'state1-state2', sourceStateId: 'state1', targetStateId: 'state2', position: { x: 200, y: 100 } },
        { id: 'state2-state3', sourceStateId: 'state2', targetStateId: 'state3', position: { x: 400, y: 100 } }
      ];

      const workflow1 = createMockWorkflow(
        initialStates,
        [],
        initialLayoutStates,
        initialLayoutTransitions
      );

      historyService.addEntry('test-workflow', workflow1, 'Initial workflow with 3 states and 2 transitions');

      // Delete state2 (which should also remove related transitions)
      const modifiedStates = {
        'state1': { transitions: [] }, // Remove transition to deleted state
        'state3': { transitions: [] }
      };
      const modifiedLayoutStates = [
        { id: 'state1', position: { x: 100, y: 100 } },
        { id: 'state3', position: { x: 500, y: 100 } }
      ];
      const modifiedLayoutTransitions: any[] = []; // All transitions removed

      const workflow2 = createMockWorkflow(
        modifiedStates,
        [],
        modifiedLayoutStates,
        modifiedLayoutTransitions
      );

      historyService.addEntry('test-workflow', workflow2, 'Deleted state2 and its transitions');

      // Undo should restore all states and transitions
      const undoResult = historyService.undo('test-workflow');
      
      expect(undoResult).not.toBeNull();
      expect(undoResult!.configuration.states).toEqual(initialStates);
      expect(undoResult!.layout.states).toHaveLength(3);
      expect(undoResult!.layout.transitions).toHaveLength(2);
      expect(undoResult!.layout.transitions).toEqual(initialLayoutTransitions);
    });

    it('should preserve transitions when undoing transition modifications', () => {
      const initialStates = {
        'state1': { transitions: [{ name: 'Original Transition', next: 'state2' }] },
        'state2': { transitions: [] }
      };
      const initialLayoutStates = [
        { id: 'state1', position: { x: 100, y: 100 } },
        { id: 'state2', position: { x: 300, y: 100 } }
      ];
      const initialLayoutTransitions = [
        { id: 'state1-state2', sourceStateId: 'state1', targetStateId: 'state2', position: { x: 200, y: 100 } }
      ];

      const workflow1 = createMockWorkflow(
        initialStates,
        [],
        initialLayoutStates,
        initialLayoutTransitions
      );

      historyService.addEntry('test-workflow', workflow1, 'Initial workflow');

      // Modify the transition name
      const modifiedStates = {
        'state1': { transitions: [{ name: 'Modified Transition', next: 'state2' }] },
        'state2': { transitions: [] }
      };

      const workflow2 = createMockWorkflow(
        modifiedStates,
        [],
        initialLayoutStates,
        initialLayoutTransitions
      );

      historyService.addEntry('test-workflow', workflow2, 'Modified transition name');

      // Undo should restore original transition name
      const undoResult = historyService.undo('test-workflow');
      
      expect(undoResult).not.toBeNull();
      expect(undoResult!.configuration.states['state1'].transitions[0].name).toBe('Original Transition');
      expect(undoResult!.layout.transitions).toEqual(initialLayoutTransitions);
    });
  });

  describe('Integration Tests with App Component', () => {
    it('should preserve transitions when using undo in the full app', async () => {
      // This test would require more complex setup to simulate user interactions
      // For now, we'll test the core functionality through direct service calls

      const workflowWithTransitions = createMockWorkflow(
        {
          'pending': { transitions: [{ name: 'Complete', next: 'completed' }] },
          'completed': { transitions: [] }
        },
        [],
        [
          { id: 'pending', position: { x: 100, y: 100 } },
          { id: 'completed', position: { x: 300, y: 100 } }
        ],
        [
          { id: 'pending-completed', sourceStateId: 'pending', targetStateId: 'completed', position: { x: 200, y: 100 } }
        ]
      );

      // Simulate the app's workflow update process
      historyService.addEntry('test-workflow', workflowWithTransitions, 'Initial state');

      // Simulate adding a new state (which should preserve existing transitions)
      const workflowWithNewState = createMockWorkflow(
        {
          'pending': { transitions: [{ name: 'Complete', next: 'completed' }] },
          'completed': { transitions: [{ name: 'Reset', next: 'pending' }] },
          'cancelled': { transitions: [] }
        },
        [],
        [
          { id: 'pending', position: { x: 100, y: 100 } },
          { id: 'completed', position: { x: 300, y: 100 } },
          { id: 'cancelled', position: { x: 200, y: 200 } }
        ],
        [
          { id: 'pending-completed', sourceStateId: 'pending', targetStateId: 'completed', position: { x: 200, y: 100 } },
          { id: 'completed-pending', sourceStateId: 'completed', targetStateId: 'pending', position: { x: 200, y: 80 } }
        ]
      );

      historyService.addEntry('test-workflow', workflowWithNewState, 'Added cancelled state and reset transition');

      // Undo should restore the original workflow with its transition intact
      const undoResult = historyService.undo('test-workflow');

      expect(undoResult).not.toBeNull();
      expect(undoResult!.layout.transitions).toHaveLength(1);
      expect(undoResult!.layout.transitions[0].sourceStateId).toBe('pending');
      expect(undoResult!.layout.transitions[0].targetStateId).toBe('completed');
      expect(undoResult!.configuration.states['pending'].transitions[0].name).toBe('Complete');
    });

    it('should reproduce the transition loss bug in WorkflowCanvas cleanup function', async () => {
      // This test reproduces the actual bug in the cleanupWorkflowState function

      // Create workflow with realistic transition IDs like the mock API uses
      const workflowWithRealisticTransitions = createMockWorkflow(
        {
          'pending': { transitions: [{ name: 'Complete', next: 'completed' }] },
          'completed': { transitions: [] }
        },
        [],
        [
          { id: 'pending', position: { x: 100, y: 100 } },
          { id: 'completed', position: { x: 300, y: 100 } }
        ],
        [
          // This is the realistic format from mock API
          { id: 'pending-to-completed' }
        ]
      );

      // Test the cleanupWorkflowState function directly
      // Import the function (we'll need to export it for testing)
      const { cleanupWorkflowState } = await import('../components/Canvas/WorkflowCanvas');

      // This should NOT remove the transition, but the bug causes it to be removed
      const cleanedWorkflow = cleanupWorkflowState(workflowWithRealisticTransitions);

      // The bug: transitions get filtered out because the parsing logic is wrong
      expect(cleanedWorkflow.layout.transitions).toHaveLength(1);
      expect(cleanedWorkflow.layout.transitions[0].id).toBe('pending-to-completed');
    });

    it('should reproduce the transition loss bug with complex state names', async () => {
      // Test with state names that contain hyphens (which breaks the parsing)
      const workflowWithComplexNames = createMockWorkflow(
        {
          'email-sent': { transitions: [{ name: 'Verify', next: 'email-verified' }] },
          'email-verified': { transitions: [] }
        },
        [],
        [
          { id: 'email-sent', position: { x: 100, y: 100 } },
          { id: 'email-verified', position: { x: 300, y: 100 } }
        ],
        [
          // This ID format will break the current parsing logic
          { id: 'email-sent-to-email-verified' }
        ]
      );

      const { cleanupWorkflowState } = await import('../components/Canvas/WorkflowCanvas');
      const cleanedWorkflow = cleanupWorkflowState(workflowWithComplexNames);

      // The bug: this transition will be incorrectly filtered out
      expect(cleanedWorkflow.layout.transitions).toHaveLength(1);
      expect(cleanedWorkflow.layout.transitions[0].id).toBe('email-sent-to-email-verified');
    });

    it('should verify the fix works with realistic workflow data', async () => {
      // Test with data that matches the actual mock API structure
      const realisticWorkflow = createMockWorkflow(
        {
          'pending': { transitions: [{ name: 'Send Verification Email', next: 'email-sent' }] },
          'email-sent': { transitions: [{ name: 'Email Verified', next: 'verified' }] },
          'verified': { transitions: [] }
        },
        [],
        [
          { id: 'pending', position: { x: 100, y: 100 } },
          { id: 'email-sent', position: { x: 300, y: 100 } },
          { id: 'verified', position: { x: 500, y: 100 } }
        ],
        [
          { id: 'pending-to-email-sent' },
          { id: 'email-sent-to-verified' }
        ]
      );

      const { cleanupWorkflowState } = await import('../components/Canvas/WorkflowCanvas');
      const cleanedWorkflow = cleanupWorkflowState(realisticWorkflow);

      // After the fix, both transitions should be preserved
      expect(cleanedWorkflow.layout.transitions).toHaveLength(2);
      expect(cleanedWorkflow.layout.transitions[0].id).toBe('pending-to-email-sent');
      expect(cleanedWorkflow.layout.transitions[1].id).toBe('email-sent-to-verified');

      // Configuration should be unchanged
      expect(cleanedWorkflow.configuration.states).toEqual(realisticWorkflow.configuration.states);
    });

    it('should handle edge cases in transition ID parsing', async () => {
      // Test various edge cases that could break the parsing
      const edgeCaseWorkflow = createMockWorkflow(
        {
          'state1': { transitions: [{ name: 'Go', next: 'state2' }] },
          'state2': { transitions: [] }
        },
        [],
        [
          { id: 'state1', position: { x: 100, y: 100 } },
          { id: 'state2', position: { x: 300, y: 100 } }
        ],
        [
          // Valid transition
          { id: 'state1-to-state2' },
          // Invalid format (should be kept due to fallback)
          { id: 'invalid-format' },
          // Empty ID (should be kept due to fallback)
          { id: '' },
          // ID with multiple '-to-' patterns (should use first one)
          { id: 'state1-to-state2-to-state3' }
        ]
      );

      const { cleanupWorkflowState } = await import('../components/Canvas/WorkflowCanvas');
      const cleanedWorkflow = cleanupWorkflowState(edgeCaseWorkflow);

      // Should only keep valid transitions (invalid ones are correctly filtered out)
      expect(cleanedWorkflow.layout.transitions).toHaveLength(1); // Only the valid one

      // The valid transition should be preserved
      const validTransition = cleanedWorkflow.layout.transitions.find(t => t.id === 'state1-to-state2');
      expect(validTransition).toBeDefined();
      expect(cleanedWorkflow.layout.transitions[0].id).toBe('state1-to-state2');
    });
  });
});

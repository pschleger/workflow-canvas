// ABOUTME: This file contains comprehensive tests for the history service functionality
// including undo/redo operations, workflow switching, and session storage persistence.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { historyService } from '../services/historyService';
import { configService } from '../services/configService';
import type { UIWorkflowData } from '../types/workflow';

// Mock workflow data for testing
const createMockWorkflow = (id: string, name: string, stateCount: number = 2): UIWorkflowData => ({
  id,
  entityId: 'test-entity',
  configuration: {
    version: '1.0',
    name,
    initialState: 'state1',
    states: Object.fromEntries(
      Array.from({ length: stateCount }, (_, i) => [
        `state${i + 1}`,
        { transitions: [] }
      ])
    )
  },
  layout: {
    workflowId: id,
    version: 1,
    updatedAt: new Date().toISOString(),
    states: Array.from({ length: stateCount }, (_, i) => ({
      id: `state${i + 1}`,
      position: { x: i * 100, y: 100 }
    })),
    transitions: []
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

describe('HistoryService', () => {
  beforeEach(() => {
    // Clear session storage before each test
    sessionStorage.clear();
    historyService.clearAllHistory();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Basic History Operations', () => {
    it('should start with no history', () => {
      expect(historyService.canUndo('workflow1')).toBe(false);
      expect(historyService.canRedo('workflow1')).toBe(false);
      expect(historyService.getUndoCount('workflow1')).toBe(0);
      expect(historyService.getRedoCount('workflow1')).toBe(0);
    });

    it('should add entries to history', () => {
      const workflow1 = createMockWorkflow('workflow1', 'Test Workflow 1');
      const workflow2 = createMockWorkflow('workflow1', 'Test Workflow 1 Updated');

      historyService.addEntry('workflow1', workflow1, 'Initial state');
      expect(historyService.canUndo('workflow1')).toBe(false); // Only one entry, can't undo
      expect(historyService.getUndoCount('workflow1')).toBe(0);

      historyService.addEntry('workflow1', workflow2, 'Updated workflow');
      expect(historyService.canUndo('workflow1')).toBe(true); // Now we can undo to previous state
      expect(historyService.getUndoCount('workflow1')).toBe(1);
    });

    it('should perform undo operations', () => {
      const workflow1 = createMockWorkflow('workflow1', 'Test Workflow 1');
      const workflow2 = createMockWorkflow('workflow1', 'Test Workflow 1 Updated');

      historyService.addEntry('workflow1', workflow1, 'Initial state');
      historyService.addEntry('workflow1', workflow2, 'Updated workflow');

      const undoResult = historyService.undo('workflow1');
      expect(undoResult).not.toBeNull();
      expect(undoResult?.configuration.name).toBe('Test Workflow 1');
      expect(historyService.canRedo('workflow1')).toBe(true);
    });

    it('should perform redo operations', () => {
      const workflow1 = createMockWorkflow('workflow1', 'Test Workflow 1');
      const workflow2 = createMockWorkflow('workflow1', 'Test Workflow 1 Updated');
      const workflow3 = createMockWorkflow('workflow1', 'Test Workflow 1 Final');

      historyService.addEntry('workflow1', workflow1, 'Initial state');
      historyService.addEntry('workflow1', workflow2, 'Updated workflow');
      historyService.addEntry('workflow1', workflow3, 'Final workflow');

      // Undo twice, then redo once
      historyService.undo('workflow1'); // Go to workflow2
      historyService.undo('workflow1'); // Go to workflow1

      const redoResult = historyService.redo('workflow1'); // Should go back to workflow2
      expect(redoResult?.configuration.name).toBe('Test Workflow 1 Updated');
      expect(historyService.canRedo('workflow1')).toBe(true); // Can still redo to workflow3
    });
  });

  describe('History Limits', () => {
    it('should respect maximum history depth', () => {
      const maxDepth = configService.getHistoryConfig().maxDepth;
      const workflowId = 'test-workflow';

      // Add more entries than the max depth
      for (let i = 0; i < maxDepth + 5; i++) {
        const workflow = createMockWorkflow(workflowId, `Workflow ${i}`);
        historyService.addEntry(workflowId, workflow, `Entry ${i}`);
      }

      expect(historyService.getUndoCount(workflowId)).toBe(maxDepth - 1); // Can undo to previous states
    });
  });

  describe('Multiple Workflows', () => {
    it('should maintain separate history for different workflows', () => {
      const workflow1 = createMockWorkflow('workflow1', 'Workflow 1');
      const workflow2 = createMockWorkflow('workflow2', 'Workflow 2');

      historyService.addEntry('workflow1', workflow1, 'Workflow 1 entry');
      historyService.addEntry('workflow2', workflow2, 'Workflow 2 entry');

      expect(historyService.getUndoCount('workflow1')).toBe(0); // Only one entry each
      expect(historyService.getUndoCount('workflow2')).toBe(0);

      // Undo workflow1 should not affect workflow2
      historyService.undo('workflow1');
      expect(historyService.canUndo('workflow1')).toBe(false);
      expect(historyService.canUndo('workflow2')).toBe(false); // Only one entry each, can't undo
    });
  });

  describe('Redo Stack Management', () => {
    it('should clear redo stack when new entry is added after undo', () => {
      const workflow1 = createMockWorkflow('workflow1', 'Version 1');
      const workflow2 = createMockWorkflow('workflow1', 'Version 2');
      const workflow3 = createMockWorkflow('workflow1', 'Version 3');

      historyService.addEntry('workflow1', workflow1, 'Version 1');
      historyService.addEntry('workflow1', workflow2, 'Version 2');

      // Undo to create redo stack
      historyService.undo('workflow1');
      expect(historyService.canRedo('workflow1')).toBe(true);

      // Add new entry should clear redo stack
      historyService.addEntry('workflow1', workflow3, 'Version 3');
      expect(historyService.canRedo('workflow1')).toBe(false);
    });
  });

  describe('Session Storage Persistence', () => {
    it('should persist history to session storage', () => {
      const workflow = createMockWorkflow('workflow1', 'Test Workflow');
      historyService.addEntry('workflow1', workflow, 'Test entry');

      // Check that data is in session storage
      const stored = sessionStorage.getItem('statemachine-ui-history');
      expect(stored).not.toBeNull();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.workflow1).toBeDefined();
      expect(parsed.workflow1.entries).toHaveLength(1);
    });

    it('should load history from session storage', () => {
      // Manually add data to session storage
      const historyData = {
        workflow1: {
          entries: [{
            timestamp: Date.now(),
            workflow: createMockWorkflow('workflow1', 'Persisted Workflow'),
            description: 'Persisted entry'
          }],
          currentIndex: -1
        }
      };
      sessionStorage.setItem('statemachine-ui-history', JSON.stringify(historyData));

      // Reload from session storage
      historyService.reloadFromSession();
      expect(historyService.canUndo('workflow1')).toBe(false); // Only one entry, can't undo
      expect(historyService.getUndoCount('workflow1')).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undo when no history exists', () => {
      const result = historyService.undo('nonexistent-workflow');
      expect(result).toBeNull();
    });

    it('should handle redo when no redo stack exists', () => {
      const result = historyService.redo('nonexistent-workflow');
      expect(result).toBeNull();
    });

    it('should handle multiple undos to the beginning', () => {
      const workflow1 = createMockWorkflow('workflow1', 'Version 1');
      const workflow2 = createMockWorkflow('workflow1', 'Version 2');

      historyService.addEntry('workflow1', workflow1, 'Version 1');
      historyService.addEntry('workflow1', workflow2, 'Version 2');

      // Undo twice
      historyService.undo('workflow1');
      const secondUndo = historyService.undo('workflow1');
      expect(secondUndo).toBeNull(); // Should return null when at beginning
      expect(historyService.canUndo('workflow1')).toBe(false);
    });
  });
});

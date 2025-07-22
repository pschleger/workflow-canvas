// ABOUTME: This file reproduces the specific bug with the User Registration workflow
// where transitions to "failed" state vanish after repositioning and undoing.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { historyService } from '../services/historyService';
import { configService } from '../services/configService';
import type { UIWorkflowData } from '../types/workflow';

describe('User Registration Workflow Bug', () => {
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

  const createUserRegistrationWorkflow = (): UIWorkflowData => ({
    id: 'user-registration',
    entityId: 'user-entity',
    configuration: {
      version: '1.0',
      name: 'User Registration',
      initialState: 'pending',
      states: {
        'pending': {
          transitions: [
            {
              name: 'Send Verification Email',
              next: 'email-sent',
              criterion: {
                type: 'simple',
                field: 'email',
                operator: 'contains',
                value: '@'
              }
            },
            {
              name: 'Invalid Email',
              next: 'failed',
              criterion: {
                type: 'simple',
                field: 'email',
                operator: 'not_contains',
                value: '@'
              }
            }
          ]
        },
        'email-sent': {
          transitions: [
            {
              name: 'Email Verified',
              next: 'verified',
              criterion: {
                type: 'simple',
                field: 'verification_status',
                operator: 'equals',
                value: 'valid'
              }
            },
            {
              name: 'Verification Timeout',
              next: 'failed',
              criterion: {
                type: 'simple',
                field: 'timeout',
                operator: 'greater_than',
                value: 3600
              }
            }
          ]
        },
        'verified': {
          transitions: []
        },
        'failed': {
          transitions: []
        }
      }
    },
    layout: {
      workflowId: 'user-registration',
      version: 1,
      updatedAt: new Date().toISOString(),
      states: [
        { id: 'pending', position: { x: 100, y: 100 } },
        { id: 'email-sent', position: { x: 300, y: 100 } },
        { id: 'verified', position: { x: 500, y: 100 } },
        { id: 'failed', position: { x: 300, y: 250 } }
      ],
      transitions: [
        { id: 'pending-to-email-sent' },
        { id: 'email-sent-to-verified' },
        { id: 'pending-to-failed' },      // This transition should be preserved
        { id: 'email-sent-to-failed' }    // This transition should be preserved
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  describe('Automatic History Creation Bug', () => {
    it('should not create history entries when workflow is loaded', async () => {
      const workflow = createUserRegistrationWorkflow();

      // Simulate loading the workflow (this should NOT create history)
      const { cleanupWorkflowState } = await import('../components/Canvas/WorkflowCanvas');
      const cleanedWorkflow = cleanupWorkflowState(workflow);

      // Check if cleanup modified the workflow (this might be the source of automatic history)
      const originalJson = JSON.stringify(workflow, null, 2);
      const cleanedJson = JSON.stringify(cleanedWorkflow, null, 2);
      const workflowWasModified = originalJson !== cleanedJson;

      if (workflowWasModified) {
        console.log('🐛 FOUND THE BUG: cleanupWorkflowState modified the workflow!');
        console.log('Original transitions:', workflow.layout.transitions.map(t => t.id));
        console.log('Cleaned transitions:', cleanedWorkflow.layout.transitions.map(t => t.id));

        // Find what changed
        const originalTransitionIds = new Set(workflow.layout.transitions.map(t => t.id));
        const cleanedTransitionIds = new Set(cleanedWorkflow.layout.transitions.map(t => t.id));

        const removedTransitions = [...originalTransitionIds].filter(id => !cleanedTransitionIds.has(id));
        const addedTransitions = [...cleanedTransitionIds].filter(id => !originalTransitionIds.has(id));

        if (removedTransitions.length > 0) {
          console.log('❌ Removed transitions:', removedTransitions);
        }
        if (addedTransitions.length > 0) {
          console.log('➕ Added transitions:', addedTransitions);
        }
      }

      // Verify no automatic history was created
      expect(historyService.canUndo('user-registration')).toBe(false);
      expect(historyService.getUndoCount('user-registration')).toBe(0);

      // Verify transitions are preserved during cleanup
      expect(cleanedWorkflow.layout.transitions).toHaveLength(4);
      expect(cleanedWorkflow.layout.transitions.find(t => t.id === 'pending-to-failed')).toBeDefined();
      expect(cleanedWorkflow.layout.transitions.find(t => t.id === 'email-sent-to-failed')).toBeDefined();

      // The workflow should NOT be modified by cleanup
      expect(workflowWasModified).toBe(false);
    });

    it('should preserve transitions to failed state during workflow operations', async () => {
      const workflow = createUserRegistrationWorkflow();
      
      // Add initial workflow to history (simulating first load)
      historyService.addEntry('user-registration', workflow, 'Initial load');
      
      // Simulate repositioning a state (this creates a new history entry)
      const repositionedWorkflow = {
        ...workflow,
        layout: {
          ...workflow.layout,
          states: workflow.layout.states.map(state => 
            state.id === 'pending' 
              ? { ...state, position: { x: 150, y: 100 } } // Moved position
              : state
          ),
          updatedAt: new Date().toISOString()
        }
      };
      
      historyService.addEntry('user-registration', repositionedWorkflow, 'Repositioned pending state');
      
      // Now undo - this should restore the original workflow with all transitions
      const undoResult = historyService.undo('user-registration');
      
      expect(undoResult).not.toBeNull();
      expect(undoResult!.layout.transitions).toHaveLength(4);
      
      // Specifically check that transitions to "failed" are preserved
      const pendingToFailed = undoResult!.layout.transitions.find(t => t.id === 'pending-to-failed');
      const emailSentToFailed = undoResult!.layout.transitions.find(t => t.id === 'email-sent-to-failed');
      
      expect(pendingToFailed).toBeDefined();
      expect(emailSentToFailed).toBeDefined();
      
      // Check configuration transitions too
      expect(undoResult!.configuration.states['pending'].transitions).toHaveLength(2);
      expect(undoResult!.configuration.states['email-sent'].transitions).toHaveLength(2);
      
      const pendingFailedTransition = undoResult!.configuration.states['pending'].transitions.find(t => t.next === 'failed');
      const emailSentFailedTransition = undoResult!.configuration.states['email-sent'].transitions.find(t => t.next === 'failed');
      
      expect(pendingFailedTransition).toBeDefined();
      expect(pendingFailedTransition!.name).toBe('Invalid Email');
      expect(emailSentFailedTransition).toBeDefined();
      expect(emailSentFailedTransition!.name).toBe('Verification Timeout');
    });

    it('should handle the complete user workflow: load -> reposition -> undo', async () => {
      // Step 1: Load workflow (this might be creating unwanted history)
      const initialWorkflow = createUserRegistrationWorkflow();
      
      // Step 2: Simulate what happens when the app loads the workflow
      // This might be where the automatic history entry is created
      const { cleanupWorkflowState } = await import('../components/Canvas/WorkflowCanvas');
      const cleanedWorkflow = cleanupWorkflowState(initialWorkflow);
      
      // If cleanup modifies the workflow, it might trigger history tracking
      const workflowChanged = JSON.stringify(cleanedWorkflow) !== JSON.stringify(initialWorkflow);
      
      if (workflowChanged) {
        console.log('Workflow was modified during cleanup - this might be the source of automatic history');
        console.log('Original transitions:', initialWorkflow.layout.transitions.length);
        console.log('Cleaned transitions:', cleanedWorkflow.layout.transitions.length);
      }
      
      // Step 3: Add to history (simulating what the app does)
      historyService.addEntry('user-registration', cleanedWorkflow, 'Initial workflow load');
      
      // Step 4: User repositions a state
      const repositionedWorkflow = {
        ...cleanedWorkflow,
        layout: {
          ...cleanedWorkflow.layout,
          states: cleanedWorkflow.layout.states.map(state => 
            state.id === 'failed' 
              ? { ...state, position: { x: 350, y: 250 } } // Moved failed state
              : state
          ),
          updatedAt: new Date().toISOString()
        }
      };
      
      historyService.addEntry('user-registration', repositionedWorkflow, 'Repositioned failed state');
      
      // Step 5: User presses undo
      const undoResult = historyService.undo('user-registration');
      
      expect(undoResult).not.toBeNull();
      
      // The bug: transitions to "failed" disappear after undo
      expect(undoResult!.layout.transitions).toHaveLength(4);
      expect(undoResult!.layout.transitions.find(t => t.id === 'pending-to-failed')).toBeDefined();
      expect(undoResult!.layout.transitions.find(t => t.id === 'email-sent-to-failed')).toBeDefined();
    });
  });

  describe('Transition ID Parsing with Failed State', () => {
    it('should correctly parse transition IDs involving failed state', async () => {
      const { parseTransitionId, validateTransitionStates } = await import('../utils/transitionUtils');
      
      const stateIds = new Set(['pending', 'email-sent', 'verified', 'failed']);
      
      // Test parsing of transitions to failed state
      const pendingToFailed = parseTransitionId('pending-to-failed');
      expect(pendingToFailed).not.toBeNull();
      expect(pendingToFailed!.sourceStateId).toBe('pending');
      expect(pendingToFailed!.targetStateId).toBe('failed');
      
      const emailSentToFailed = parseTransitionId('email-sent-to-failed');
      expect(emailSentToFailed).not.toBeNull();
      expect(emailSentToFailed!.sourceStateId).toBe('email-sent');
      expect(emailSentToFailed!.targetStateId).toBe('failed');
      
      // Test validation
      expect(validateTransitionStates('pending-to-failed', stateIds)).toBe(true);
      expect(validateTransitionStates('email-sent-to-failed', stateIds)).toBe(true);
    });
  });

  describe('Real Mock API Data Test', () => {
    it('should test with actual mock API data to reproduce the bug', async () => {
      // Use the exact data from mockApi.ts
      const { MockApiService } = await import('../services/mockApi');

      // Get the actual data that the app loads
      const [configResponse, layoutResponse] = await Promise.all([
        MockApiService.getWorkflowConfiguration('user-entity', 'user-registration'),
        MockApiService.getCanvasLayout('user-entity', 'user-registration')
      ]);

      expect(configResponse.success).toBe(true);
      expect(layoutResponse.success).toBe(true);

      // Combine the data the same way the app does
      const combinedWorkflow = {
        id: 'user-registration',
        entityId: 'user-entity',
        configuration: configResponse.data,
        layout: layoutResponse.data,
        createdAt: new Date().toISOString(),
        updatedAt: layoutResponse.data.updatedAt
      };

      console.log('🔍 Real API data:');
      console.log('Configuration states:', Object.keys(combinedWorkflow.configuration.states));
      console.log('Layout transitions:', combinedWorkflow.layout.transitions.map(t => t.id));

      // Now test cleanup with real data
      const { cleanupWorkflowState } = await import('../components/Canvas/WorkflowCanvas');
      const cleanedWorkflow = cleanupWorkflowState(combinedWorkflow);

      // Check if cleanup modified the real data
      const originalTransitionCount = combinedWorkflow.layout.transitions.length;
      const cleanedTransitionCount = cleanedWorkflow.layout.transitions.length;

      console.log('🧹 After cleanup:');
      console.log('Original transition count:', originalTransitionCount);
      console.log('Cleaned transition count:', cleanedTransitionCount);
      console.log('Cleaned transitions:', cleanedWorkflow.layout.transitions.map(t => t.id));

      if (originalTransitionCount !== cleanedTransitionCount) {
        console.log('🐛 BUG FOUND: Cleanup removed transitions!');
        const originalIds = new Set(combinedWorkflow.layout.transitions.map(t => t.id));
        const cleanedIds = new Set(cleanedWorkflow.layout.transitions.map(t => t.id));
        const removedIds = [...originalIds].filter(id => !cleanedIds.has(id));
        console.log('❌ Removed transition IDs:', removedIds);

        // Test each removed transition to see why it was filtered out
        const { parseTransitionId, validateTransitionStates } = await import('../utils/transitionUtils');
        const configStateIds = new Set(Object.keys(cleanedWorkflow.configuration.states));

        for (const removedId of removedIds) {
          console.log(`🔍 Analyzing removed transition: ${removedId}`);
          const parsed = parseTransitionId(removedId);
          if (parsed) {
            console.log(`  Source: ${parsed.sourceStateId}, Target: ${parsed.targetStateId}`);
            console.log(`  Source exists: ${configStateIds.has(parsed.sourceStateId)}`);
            console.log(`  Target exists: ${configStateIds.has(parsed.targetStateId)}`);
          } else {
            console.log(`  Failed to parse transition ID`);
          }
          console.log(`  Validation result: ${validateTransitionStates(removedId, configStateIds)}`);
        }
      }

      // The test should fail if transitions are being removed
      expect(cleanedTransitionCount).toBe(originalTransitionCount);
      expect(cleanedWorkflow.layout.transitions.find(t => t.id === 'pending-to-failed')).toBeDefined();
      expect(cleanedWorkflow.layout.transitions.find(t => t.id === 'email-sent-to-failed')).toBeDefined();
    });
  });

  describe('History Tracking Investigation', () => {
    it('should monitor when history entries are created during workflow loading', async () => {
      // Spy on historyService.addEntry to see when it's called
      const addEntrySpy = vi.spyOn(historyService, 'addEntry');

      // Get the real API data
      const { MockApiService } = await import('../services/mockApi');
      const [configResponse, layoutResponse] = await Promise.all([
        MockApiService.getWorkflowConfiguration('user-entity', 'user-registration'),
        MockApiService.getCanvasLayout('user-entity', 'user-registration')
      ]);

      const combinedWorkflow = {
        id: 'user-registration',
        entityId: 'user-entity',
        configuration: configResponse.data,
        layout: layoutResponse.data,
        createdAt: new Date().toISOString(),
        updatedAt: layoutResponse.data.updatedAt
      };

      console.log('📊 Initial state:');
      console.log('History entries before any operations:', historyService.getUndoCount('user-registration'));
      console.log('addEntry call count:', addEntrySpy.mock.calls.length);

      // Simulate what happens when the workflow is loaded and processed
      const { cleanupWorkflowState } = await import('../components/Canvas/WorkflowCanvas');
      const cleanedWorkflow = cleanupWorkflowState(combinedWorkflow);

      console.log('📊 After cleanup:');
      console.log('History entries after cleanup:', historyService.getUndoCount('user-registration'));
      console.log('addEntry call count:', addEntrySpy.mock.calls.length);

      // Check if cleanup triggered any history entries
      expect(addEntrySpy.mock.calls.length).toBe(0);
      expect(historyService.getUndoCount('user-registration')).toBe(0);

      // Now simulate what the App.tsx does - it might call handleWorkflowUpdate
      // Let's manually add the workflow to history (simulating initial load)
      historyService.addEntry('user-registration', cleanedWorkflow, 'Initial load');

      console.log('📊 After manual history add:');
      console.log('History entries after manual add:', historyService.getUndoCount('user-registration'));

      // Now simulate repositioning a state
      const repositionedWorkflow = {
        ...cleanedWorkflow,
        layout: {
          ...cleanedWorkflow.layout,
          states: cleanedWorkflow.layout.states.map(state =>
            state.id === 'failed'
              ? { ...state, position: { x: 350, y: 250 } }
              : state
          ),
          updatedAt: new Date().toISOString()
        }
      };

      // Add repositioned workflow to history (simulating what happens when user repositions)
      historyService.addEntry('user-registration', repositionedWorkflow, 'Repositioned failed state');

      console.log('📊 After reposition:');
      console.log('History entries after reposition:', historyService.getUndoCount('user-registration'));

      // Now undo - this should restore the original workflow
      const undoResult = historyService.undo('user-registration');

      console.log('📊 After undo:');
      console.log('History entries after undo:', historyService.getUndoCount('user-registration'));
      console.log('Undo result transitions:', undoResult?.layout.transitions.map(t => t.id));

      // The bug: check if transitions to "failed" are preserved
      expect(undoResult).not.toBeNull();
      expect(undoResult!.layout.transitions).toHaveLength(4);

      const pendingToFailed = undoResult!.layout.transitions.find(t => t.id === 'pending-to-failed');
      const emailSentToFailed = undoResult!.layout.transitions.find(t => t.id === 'email-sent-to-failed');

      expect(pendingToFailed).toBeDefined();
      expect(emailSentToFailed).toBeDefined();

      addEntrySpy.mockRestore();
    });

    it('should identify the transition ID mismatch bug', async () => {
      // Get real API data
      const { MockApiService } = await import('../services/mockApi');
      const [configResponse, layoutResponse] = await Promise.all([
        MockApiService.getWorkflowConfiguration('user-entity', 'user-registration'),
        MockApiService.getCanvasLayout('user-entity', 'user-registration')
      ]);

      const combinedWorkflow = {
        id: 'user-registration',
        entityId: 'user-entity',
        configuration: configResponse.data,
        layout: layoutResponse.data,
        createdAt: new Date().toISOString(),
        updatedAt: layoutResponse.data.updatedAt
      };

      console.log('🔍 Investigating transition ID mismatch:');

      // Check what transition IDs the configuration would generate
      const configBasedTransitionIds: string[] = [];
      Object.entries(combinedWorkflow.configuration.states).forEach(([sourceStateId, stateDefinition]) => {
        stateDefinition.transitions.forEach((transitionDef, index) => {
          const transitionId = `${sourceStateId}-${index}`;
          configBasedTransitionIds.push(transitionId);
          console.log(`Config transition: ${transitionId} (${sourceStateId} -> ${transitionDef.next})`);
        });
      });

      // Check what transition IDs are in the layout
      const layoutTransitionIds = combinedWorkflow.layout.transitions.map(t => t.id);
      console.log('Layout transition IDs:', layoutTransitionIds);

      // Check for mismatches
      const configSet = new Set(configBasedTransitionIds);
      const layoutSet = new Set(layoutTransitionIds);

      const missingInLayout = configBasedTransitionIds.filter(id => !layoutSet.has(id));
      const missingInConfig = layoutTransitionIds.filter(id => !configSet.has(id));

      console.log('❌ Config transitions missing in layout:', missingInLayout);
      console.log('❌ Layout transitions missing in config:', missingInConfig);

      // This is the bug! The IDs don't match
      expect(missingInLayout.length).toBeGreaterThan(0);
      expect(missingInConfig.length).toBeGreaterThan(0);

      // The createUITransitionData function will fail to find layout for config-based IDs
      // This causes transitions to lose their layout information
      const { cleanupWorkflowState } = await import('../components/Canvas/WorkflowCanvas');
      const cleanedWorkflow = cleanupWorkflowState(combinedWorkflow);

      // The cleaned workflow should still have the layout transitions
      expect(cleanedWorkflow.layout.transitions).toHaveLength(4);

      console.log('🐛 This mismatch explains why transitions disappear during undo operations!');
    });
  });
});

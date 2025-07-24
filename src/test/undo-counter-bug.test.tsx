// ABOUTME: Test to reproduce and debug the undo counter bug where User Registration shows 49 undos
// while other workflows show 0 undos when first opened.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { historyService } from '../services/historyService';
import { MockApiService } from '../services/mockApi';

describe('Undo Counter Bug Investigation', () => {
  beforeEach(() => {
    // Clear session storage and history before each test
    sessionStorage.clear();
    historyService.clearAllHistory();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should start with 0 undo count for all workflows when fresh', async () => {
    // Test all four workflows
    const workflowIds = ['user-registration', 'user-verification', 'order-fulfillment', 'payment-processing'];
    
    for (const workflowId of workflowIds) {
      expect(historyService.getUndoCount(workflowId)).toBe(0);
      expect(historyService.canUndo(workflowId)).toBe(false);
    }
  });

  it('should check if sessionStorage contains pre-existing data for user-registration', () => {
    // Check if there's any existing data in sessionStorage
    const historyData = sessionStorage.getItem('statemachine-ui-history');
    console.log('Initial sessionStorage history data:', historyData);
    
    // Reload from session to see if there's persistent data
    historyService.reloadFromSession();
    
    const userRegCount = historyService.getUndoCount('user-registration');
    const userVerCount = historyService.getUndoCount('user-verification');
    const orderCount = historyService.getUndoCount('order-fulfillment');
    const paymentCount = historyService.getUndoCount('payment-processing');
    
    console.log('Undo counts after reload:');
    console.log('- User Registration:', userRegCount);
    console.log('- User Verification:', userVerCount);
    console.log('- Order Fulfillment:', orderCount);
    console.log('- Payment Processing:', paymentCount);
    
    // This test will help us see if the issue is in sessionStorage persistence
    expect(userRegCount).toBe(0); // This might fail if there's persistent data
  });

  it('should simulate loading workflows and check for differences', async () => {
    // Load each workflow configuration and layout to see if there are differences
    const workflowIds = ['user-registration', 'user-verification', 'order-fulfillment', 'payment-processing'];
    
    for (const workflowId of workflowIds) {
      // Get the entity ID for this workflow
      let entityId = '';
      if (workflowId.startsWith('user-')) entityId = 'user-entity';
      else if (workflowId.startsWith('order-')) entityId = 'order-entity';
      else if (workflowId.startsWith('payment-')) entityId = 'payment-entity';
      
      const configResponse = await MockApiService.getWorkflowConfiguration(entityId, workflowId);
      const layoutResponse = await MockApiService.getCanvasLayout(entityId, workflowId);
      
      console.log(`${workflowId} config success:`, configResponse.success);
      console.log(`${workflowId} layout success:`, layoutResponse.success);
      
      if (configResponse.success && layoutResponse.success) {
        console.log(`${workflowId} states count:`, Object.keys(configResponse.data.states).length);
        console.log(`${workflowId} layout states count:`, layoutResponse.data.states.length);
      }
      
      // Check undo count after loading
      const undoCount = historyService.getUndoCount(workflowId);
      console.log(`${workflowId} undo count after loading:`, undoCount);
    }
  });

  it('should check if the issue is in the mock data structure', () => {
    // Let's examine the mock data for user-registration vs others
    const userRegConfig = MockApiService.getWorkflowConfiguration('user-entity', 'user-registration');
    const userVerConfig = MockApiService.getWorkflowConfiguration('user-entity', 'user-verification');
    
    userRegConfig.then(config => {
      console.log('User Registration config states:', Object.keys(config.data.states));
      console.log('User Registration transitions in pending:', config.data.states.pending?.transitions?.length || 0);
    });
    
    userVerConfig.then(config => {
      console.log('User Verification config states:', Object.keys(config.data.states));
      console.log('User Verification transitions in unverified:', config.data.states.unverified?.transitions?.length || 0);
    });
  });

  it('should manually add entries to history and verify counts', () => {
    // Create a mock workflow data structure
    const mockWorkflow = {
      id: 'test-workflow',
      entityModel: { modelName: 'test-entity', modelVersion: 1 },
      configuration: {
        version: '1.0',
        name: 'Test Workflow',
        desc: 'Test description',
        initialState: 'start',
        active: true,
        states: {
          start: { transitions: [] }
        }
      },
      layout: {
        workflowId: 'test-workflow',
        version: 1,
        updatedAt: new Date().toISOString(),
        states: [{ id: 'start', position: { x: 0, y: 0 }, properties: {} }],
        transitions: []
      }
    };

    // Add multiple entries to simulate the bug
    for (let i = 0; i < 50; i++) {
      historyService.addEntry('test-workflow', mockWorkflow, `Entry ${i}`);
    }

    const undoCount = historyService.getUndoCount('test-workflow');
    console.log('Undo count after adding 50 entries:', undoCount);
    expect(undoCount).toBe(49); // Should be 49 (can undo to 49 previous states)
  });

  it('should reproduce the exact bug scenario with user-registration', () => {
    // Simulate the exact scenario where user-registration has 50 entries in sessionStorage
    const mockUserRegWorkflow = {
      id: 'user-registration',
      entityModel: { modelName: 'user-entity', modelVersion: 1 },
      configuration: {
        version: '1.0',
        name: 'User Registration',
        desc: 'New user account creation process',
        initialState: 'pending',
        active: true,
        states: {
          pending: { transitions: [] },
          'email-sent': { transitions: [] },
          verified: { transitions: [] },
          failed: { transitions: [] }
        }
      },
      layout: {
        workflowId: 'user-registration',
        version: 1,
        updatedAt: new Date().toISOString(),
        states: [
          { id: 'pending', position: { x: 100, y: 100 }, properties: {} },
          { id: 'email-sent', position: { x: 300, y: 100 }, properties: {} },
          { id: 'verified', position: { x: 500, y: 100 }, properties: {} },
          { id: 'failed', position: { x: 300, y: 250 }, properties: {} }
        ],
        transitions: []
      }
    };

    // Add 50 entries to simulate persistent sessionStorage data
    for (let i = 0; i < 50; i++) {
      historyService.addEntry('user-registration', mockUserRegWorkflow, `Auto-generated entry ${i}`);
    }

    // Verify the bug condition
    expect(historyService.getUndoCount('user-registration')).toBe(49);
    expect(historyService.canUndo('user-registration')).toBe(true);

    // Verify other workflows are still at 0
    expect(historyService.getUndoCount('user-verification')).toBe(0);
    expect(historyService.getUndoCount('order-fulfillment')).toBe(0);
    expect(historyService.getUndoCount('payment-processing')).toBe(0);

    console.log('Bug reproduced: user-registration has 49 undo count while others have 0');
  });

  it('should provide a fix by clearing specific workflow history', () => {
    // First reproduce the bug
    const mockWorkflow = {
      id: 'user-registration',
      entityModel: { modelName: 'user-entity', modelVersion: 1 },
      configuration: {
        version: '1.0',
        name: 'User Registration',
        desc: 'Test',
        initialState: 'pending',
        active: true,
        states: { pending: { transitions: [] } }
      },
      layout: {
        workflowId: 'user-registration',
        version: 1,
        updatedAt: new Date().toISOString(),
        states: [],
        transitions: []
      }
    };

    // Add entries to simulate the bug
    for (let i = 0; i < 50; i++) {
      historyService.addEntry('user-registration', mockWorkflow, `Entry ${i}`);
    }

    // Verify bug exists
    expect(historyService.getUndoCount('user-registration')).toBe(49);

    // Apply the fix: clear history for the specific workflow
    historyService.clearWorkflowHistory('user-registration');

    // Verify the fix
    expect(historyService.getUndoCount('user-registration')).toBe(0);
    expect(historyService.canUndo('user-registration')).toBe(false);

    console.log('Fix applied: user-registration undo count reset to 0');
  });

  it('should show debug information for troubleshooting', () => {
    // Add some test data
    const mockWorkflow = {
      id: 'test-workflow',
      entityModel: { modelName: 'test-entity', modelVersion: 1 },
      configuration: {
        version: '1.0',
        name: 'Test',
        desc: 'Test',
        initialState: 'start',
        active: true,
        states: { start: { transitions: [] } }
      },
      layout: {
        workflowId: 'test-workflow',
        version: 1,
        updatedAt: new Date().toISOString(),
        states: [],
        transitions: []
      }
    };

    historyService.addEntry('test-workflow', mockWorkflow, 'Test entry 1');
    historyService.addEntry('test-workflow', mockWorkflow, 'Test entry 2');
    historyService.addEntry('test-workflow', mockWorkflow, 'Test entry 3');

    const debugInfo = historyService.getDebugInfo();
    console.log('Debug info:', debugInfo);

    expect(debugInfo['test-workflow']).toEqual({
      entries: 3,
      currentIndex: -1,
      undoCount: 2,
      redoCount: 0
    });
  });
});

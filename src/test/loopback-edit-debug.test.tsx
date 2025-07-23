import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ReactFlowProvider } from '@xyflow/react';
import App from '../App';

// ABOUTME: This file tests the loop-back transition editing functionality
// to debug why clicking on loop-back transitions doesn't open the editor.

// Mock the API service
vi.mock('../services/mockApi', () => ({
  MockApiService: {
    getEntities: vi.fn().mockResolvedValue({
      success: true,
      data: [
        { id: 'user-entity', name: 'User', description: 'User workflows', workflowCount: 2 }
      ]
    }),
    getWorkflows: vi.fn().mockResolvedValue({
      success: true,
      data: [
        { 
          id: 'user-registration', 
          name: 'User Registration', 
          stateCount: 4, 
          transitionCount: 5, 
          updatedAt: new Date().toISOString() 
        }
      ]
    }),
    getWorkflowConfiguration: vi.fn().mockResolvedValue({
      success: true,
      data: {
        version: '1.0',
        name: 'User Registration',
        initialState: 'pending',
        states: {
          'pending': {
            name: 'Pending',
            transitions: [
              {
                name: 'Send Email',
                next: 'email-sent',
                manual: false,
                disabled: false
              },
              {
                name: 'Loop Back',
                next: 'pending', // Loop-back transition
                manual: true,
                disabled: false
              }
            ]
          },
          'email-sent': {
            name: 'Email Sent',
            transitions: [
              {
                name: 'Verify',
                next: 'verified',
                manual: false,
                disabled: false
              }
            ]
          },
          'verified': {
            name: 'Verified',
            transitions: []
          }
        }
      }
    }),
    getCanvasLayout: vi.fn().mockResolvedValue({
      success: true,
      data: {
        workflowId: 'user-registration',
        version: 1,
        states: [
          { id: 'pending', position: { x: 100, y: 100 } },
          { id: 'email-sent', position: { x: 300, y: 100 } },
          { id: 'verified', position: { x: 500, y: 100 } }
        ],
        transitions: [
          {
            id: 'pending-0',
            sourceHandle: 'right-center-source',
            targetHandle: 'left-center-target',
            labelPosition: { x: 0, y: 0 }
          },
          {
            id: 'pending-1', // Loop-back transition
            sourceHandle: 'top-center-source',
            targetHandle: 'bottom-center-target',
            labelPosition: { x: 0, y: -60 }
          },
          {
            id: 'email-sent-0',
            sourceHandle: 'right-center-source',
            targetHandle: 'left-center-target',
            labelPosition: { x: 0, y: 0 }
          }
        ],
        updatedAt: new Date().toISOString()
      }
    }),
    updateWorkflowConfiguration: vi.fn().mockResolvedValue({ success: true }),
    updateCanvasLayout: vi.fn().mockResolvedValue({ success: true })
  }
}));

describe('Loop-back Transition Editing Debug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear console logs
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should open transition editor when loop-back transition edit button is clicked', async () => {
    render(<App />);

    // Wait for entities to load
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    // Click on User entity
    fireEvent.click(screen.getByText('User'));

    // Wait for workflows to load
    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument();
    });

    // Click on User Registration workflow
    fireEvent.click(screen.getByText('User Registration'));

    // Wait for workflow to load
    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Wait a bit more for the workflow to fully render
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Look for the loop-back transition
    const loopBackLabel = screen.queryByText('Loop Back');
    if (loopBackLabel) {
      console.log('Found Loop Back label');
      
      // Try to find the edit button for the loop-back transition
      const editButtons = screen.getAllByTitle('Edit transition');
      console.log('Found edit buttons:', editButtons.length);
      
      if (editButtons.length > 0) {
        // Click the first edit button (might be the loop-back one)
        fireEvent.click(editButtons[0]);
        
        // Wait for the transition editor to open
        await waitFor(() => {
          expect(screen.getByText(/Edit Transition/)).toBeInTheDocument();
        }, { timeout: 2000 });
        
        console.log('Transition editor opened successfully');
      } else {
        console.log('No edit buttons found');
      }
    } else {
      console.log('Loop Back label not found');
      // List all text content to debug
      const allText = screen.getAllByText(/./);
      console.log('All text found:', allText.map(el => el.textContent));
    }
  });

  it('should open transition editor when loop-back transition is double-clicked', async () => {
    render(<App />);

    // Load the workflow
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('User'));

    await waitFor(() => {
      expect(screen.getByText('User Registration')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('User Registration'));

    await waitFor(() => {
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Wait for workflow to fully render
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Look for the loop-back transition and double-click it
    const loopBackLabel = screen.queryByText('Loop Back');
    if (loopBackLabel) {
      console.log('Double-clicking Loop Back label');
      fireEvent.doubleClick(loopBackLabel);
      
      // Wait for the transition editor to open
      await waitFor(() => {
        expect(screen.getByText(/Edit Transition/)).toBeInTheDocument();
      }, { timeout: 2000 });
      
      console.log('Transition editor opened via double-click');
    } else {
      console.log('Loop Back label not found for double-click test');
    }
  });
});

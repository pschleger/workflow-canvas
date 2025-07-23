// ABOUTME: This file provides automatic layout functionality using Dagre algorithm
// to arrange workflow states in a hierarchical, visually organized manner.

import dagre from '@dagrejs/dagre';
import type { UIWorkflowData, UIStateData, UITransitionData } from '../types/workflow';

export interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  rankSeparation?: number;
  nodeSeparation?: number;
  edgeSeparation?: number;
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
}

export interface LayoutResult {
  states: Array<{
    id: string;
    position: { x: number; y: number };
  }>;
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  nodeWidth: 200,
  nodeHeight: 80,
  rankSeparation: 100,
  nodeSeparation: 50,
  edgeSeparation: 20,
  direction: 'TB', // Top to Bottom
};

/**
 * Calculates optimal positions for workflow states using Dagre hierarchical layout algorithm.
 * 
 * @param workflow - The workflow data containing states and transitions
 * @param options - Layout configuration options
 * @returns Layout result with new positions for each state
 */
export function calculateAutoLayout(
  workflow: UIWorkflowData,
  options: LayoutOptions = {}
): LayoutResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create a new directed graph
  const graph = new dagre.graphlib.Graph();
  
  // Set graph properties
  graph.setGraph({
    rankdir: opts.direction,
    ranksep: opts.rankSeparation,
    nodesep: opts.nodeSeparation,
    edgesep: opts.edgeSeparation,
  });
  
  // Set default edge label
  graph.setDefaultEdgeLabel(() => ({}));
  
  // Add nodes (states) to the graph
  const stateIds = Object.keys(workflow.configuration.states);
  stateIds.forEach(stateId => {
    graph.setNode(stateId, {
      width: opts.nodeWidth,
      height: opts.nodeHeight,
    });
  });
  
  // Add edges (transitions) to the graph
  const transitions = workflow.configuration.transitions || [];
  transitions.forEach(transition => {
    // Ensure both source and target states exist
    if (workflow.configuration.states[transition.from] && 
        workflow.configuration.states[transition.to]) {
      graph.setEdge(transition.from, transition.to);
    }
  });
  
  // Run the layout algorithm
  dagre.layout(graph);
  
  // Extract the calculated positions
  const states = stateIds.map(stateId => {
    const node = graph.node(stateId);
    return {
      id: stateId,
      position: {
        // Dagre returns center positions, but React Flow expects top-left positions
        x: node.x - opts.nodeWidth / 2,
        y: node.y - opts.nodeHeight / 2,
      },
    };
  });
  
  return { states };
}

/**
 * Applies the calculated layout to a workflow by updating state positions.
 * 
 * @param workflow - The workflow to update
 * @param layoutResult - The layout result from calculateAutoLayout
 * @returns Updated workflow with new state positions
 */
export function applyLayoutToWorkflow(
  workflow: UIWorkflowData,
  layoutResult: LayoutResult
): UIWorkflowData {
  const updatedLayout = { ...workflow.layout };

  // Update positions for each state
  const updatedStates = updatedLayout.states.map(layoutState => {
    const newPosition = layoutResult.states.find(s => s.id === layoutState.id);
    if (newPosition) {
      return {
        ...layoutState,
        position: newPosition.position,
      };
    }
    return layoutState;
  });

  const now = new Date().toISOString();

  return {
    ...workflow,
    layout: {
      ...updatedLayout,
      states: updatedStates,
      updatedAt: now, // Update layout timestamp to trigger useEffect
    },
    updatedAt: now,
  };
}

/**
 * Convenience function that calculates and applies auto-layout in one step.
 * 
 * @param workflow - The workflow to layout
 * @param options - Layout configuration options
 * @returns Updated workflow with auto-layout applied
 */
export function autoLayoutWorkflow(
  workflow: UIWorkflowData,
  options: LayoutOptions = {}
): UIWorkflowData {
  const layoutResult = calculateAutoLayout(workflow, options);
  return applyLayoutToWorkflow(workflow, layoutResult);
}

/**
 * Validates that a workflow has the necessary structure for auto-layout.
 * 
 * @param workflow - The workflow to validate
 * @returns True if the workflow can be auto-laid out
 */
export function canAutoLayout(workflow: UIWorkflowData | null): boolean {
  if (!workflow) return false;

  const stateIds = Object.keys(workflow.configuration.states);
  if (stateIds.length === 0) return false;

  // Check that layout data exists for all states
  return stateIds.every(stateId =>
    workflow.layout.states.some(layoutState => layoutState.id === stateId)
  );
}

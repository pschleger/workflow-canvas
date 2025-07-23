import React, { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import type { Node, Edge, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { UIWorkflowData, UIStateData, UITransitionData, StateDefinition, TransitionDefinition } from '../../types/workflow';
import { StateNode } from './StateNode';
import { TransitionEdge } from './TransitionEdge';
import { generateTransitionId, generateLayoutTransitionId, migrateLayoutTransitionId } from '../../utils/transitionUtils';

interface WorkflowCanvasProps {
  workflow: UIWorkflowData | null;
  onWorkflowUpdate: (workflow: UIWorkflowData, description?: string) => void;
  onStateEdit: (stateId: string) => void;
  onTransitionEdit: (transitionId: string) => void;
  darkMode: boolean;
}

const nodeTypes = {
  stateNode: StateNode,
};

const edgeTypes = {
  transitionEdge: TransitionEdge,
};

// Helper function to ensure workflow layout and configuration are in sync
export function cleanupWorkflowState(workflow: UIWorkflowData): UIWorkflowData {
  try {
    if (!workflow || !workflow.configuration || !workflow.layout) {
      return workflow;
    }

    const configStateIds = new Set(Object.keys(workflow.configuration.states || {}));

    // Remove layout states that don't have corresponding configuration states
    const cleanedLayoutStates = (workflow.layout.states || []).filter(layoutState =>
      configStateIds.has(layoutState.id)
    );

    // Remove layout transitions that reference non-existent states
    const cleanedLayoutTransitions = (workflow.layout.transitions || []).filter(layoutTransition => {
      // Use the new transition utilities to validate transitions
      // This handles both old format and new escaped format
      return validateTransitionStates(layoutTransition.id, configStateIds);
    });

    return {
      ...workflow,
      layout: {
        ...workflow.layout,
        states: cleanedLayoutStates,
        transitions: cleanedLayoutTransitions
      }
    };
  } catch (error) {
    console.error('Error cleaning up workflow state:', error);
    return workflow; // Return original workflow if cleanup fails
  }
}

// Helper function to convert schema workflow to UI state data
function createUIStateData(workflow: UIWorkflowData): UIStateData[] {
  const stateLayoutMap = new Map(workflow.layout.states.map(s => [s.id, s]));

  return Object.entries(workflow.configuration.states).map(([stateId, definition]) => {
    const layout = stateLayoutMap.get(stateId);
    const isInitial = workflow.configuration.initialState === stateId;
    const isFinal = definition.transitions.length === 0;

    return {
      id: stateId,
      name: definition.name || stateId, // Use state name from definition if available, otherwise use state ID
      definition,
      position: layout?.position || { x: 100, y: 100 },
      properties: layout?.properties,
      isInitial,
      isFinal
    };
  });
}

// Helper function to create UI transition data
function createUITransitionData(workflow: UIWorkflowData): UITransitionData[] {
  const transitionLayoutMap = new Map(workflow.layout.transitions.map(t => [t.id, t]));
  const transitions: UITransitionData[] = [];

  Object.entries(workflow.configuration.states).forEach(([sourceStateId, stateDefinition]) => {
    stateDefinition.transitions.forEach((transitionDef, index) => {
      // Use centralized transition ID generation
      const transitionId = generateTransitionId(sourceStateId, index);

      // Try to find layout data using both new and old formats for backward compatibility
      const layoutId = generateLayoutTransitionId(sourceStateId, transitionDef.next);
      const layout = transitionLayoutMap.get(transitionId) || transitionLayoutMap.get(layoutId);

      transitions.push({
        id: transitionId,
        sourceStateId,
        targetStateId: transitionDef.next,
        definition: transitionDef,
        labelPosition: layout?.labelPosition
      });
    });
  });

  return transitions;
}

// Inner component that uses useReactFlow hook
const WorkflowCanvasInner: React.FC<WorkflowCanvasProps> = ({
  workflow,
  onWorkflowUpdate,
  onStateEdit,
  onTransitionEdit,
  darkMode
}) => {
  const { screenToFlowPosition } = useReactFlow();

  // Use ref to always get current workflow value (fixes closure issue)
  // Re-enable cleanup now that the white screen issue is resolved
  const cleanedWorkflow = workflow ? cleanupWorkflowState(workflow) : null;
  const workflowRef = useRef(cleanedWorkflow);
  workflowRef.current = cleanedWorkflow;


  // Convert schema workflow to UI data
  const uiStates = useMemo(() => {
    return cleanedWorkflow ? createUIStateData(cleanedWorkflow) : [];
  }, [cleanedWorkflow]);

  const uiTransitions = useMemo(() => {
    return cleanedWorkflow ? createUITransitionData(cleanedWorkflow) : [];
  }, [cleanedWorkflow]);

  // Use refs to access current values in useEffect without causing dependency issues
  const uiStatesRef = useRef(uiStates);
  const uiTransitionsRef = useRef(uiTransitions);
  const onStateEditRef = useRef(onStateEdit);
  const onTransitionEditRef = useRef(onTransitionEdit);

  uiStatesRef.current = uiStates;
  uiTransitionsRef.current = uiTransitions;
  onStateEditRef.current = onStateEdit;
  onTransitionEditRef.current = onTransitionEdit;



  const handleTransitionUpdate = useCallback((updatedTransition: UITransitionData) => {
    if (!cleanedWorkflow) return;

    // Find existing layout transition or create new one
    const existingLayoutTransitions = cleanedWorkflow.layout.transitions;
    const existingIndex = existingLayoutTransitions.findIndex(t => t.id === updatedTransition.id);

    let updatedLayoutTransitions;
    if (existingIndex >= 0) {
      // Update existing layout transition
      updatedLayoutTransitions = existingLayoutTransitions.map(t =>
        t.id === updatedTransition.id
          ? { ...t, labelPosition: updatedTransition.labelPosition }
          : t
      );
    } else {
      // Create new layout transition
      const newLayoutTransition = {
        id: updatedTransition.id,
        labelPosition: updatedTransition.labelPosition
      };
      updatedLayoutTransitions = [...existingLayoutTransitions, newLayoutTransition];
    }

    const updatedWorkflow: UIWorkflowData = {
      ...cleanedWorkflow,
      layout: {
        ...cleanedWorkflow.layout,
        transitions: updatedLayoutTransitions,
        updatedAt: new Date().toISOString()
      }
    };

    onWorkflowUpdate(updatedWorkflow, 'Created transition connection');
  }, [cleanedWorkflow, onWorkflowUpdate]);

  // Create ref for handleTransitionUpdate to avoid dependency issues
  const handleTransitionUpdateRef = useRef(handleTransitionUpdate);
  handleTransitionUpdateRef.current = handleTransitionUpdate;



  const [nodes, setNodes, defaultOnNodesChange] = useNodesState([]);
  const [edges, setEdges, defaultOnEdgesChange] = useEdgesState([]);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Custom onNodesChange handler that updates workflow configuration when nodes are deleted
  const onNodesChange = useCallback((changes: any[]) => {
    // First apply the changes to React Flow's internal state
    defaultOnNodesChange(changes);

    // Check if any nodes were removed
    const removedNodes = changes.filter(change => change.type === 'remove');

    if (removedNodes.length > 0 && cleanedWorkflow) {
      // Update workflow configuration to remove deleted states
      const removedNodeIds = removedNodes.map(change => change.id);
      console.log('Nodes removed via keyboard:', removedNodeIds);

      const updatedStates = { ...cleanedWorkflow.configuration.states };
      removedNodeIds.forEach(nodeId => {
        delete updatedStates[nodeId];
      });

      // Remove transitions that reference deleted states
      Object.keys(updatedStates).forEach(sourceStateId => {
        const state = updatedStates[sourceStateId];
        state.transitions = state.transitions.filter(t => !removedNodeIds.includes(t.next));
      });

      // Handle initial state deletion
      let updatedInitialState = cleanedWorkflow.configuration.initialState;
      if (removedNodeIds.includes(updatedInitialState)) {
        const remainingStates = Object.keys(updatedStates);
        updatedInitialState = remainingStates.length > 0 ? remainingStates[0] : '';
      }

      // Remove from layout
      const updatedLayoutStates = cleanedWorkflow.layout.states.filter(
        s => !removedNodeIds.includes(s.id)
      );

      const updatedWorkflow: UIWorkflowData = {
        ...cleanedWorkflow,
        configuration: {
          ...cleanedWorkflow.configuration,
          initialState: updatedInitialState,
          states: updatedStates
        },
        layout: {
          ...cleanedWorkflow.layout,
          states: updatedLayoutStates,
          transitions: cleanedWorkflow.layout.transitions, // Explicitly preserve transitions
          updatedAt: new Date().toISOString()
        }
      };

      onWorkflowUpdate(updatedWorkflow, 'Deleted states');
    }
  }, [defaultOnNodesChange, cleanedWorkflow, onWorkflowUpdate]);

  // Custom onEdgesChange handler (for completeness, though edges are handled differently)
  const onEdgesChange = useCallback((changes: any[]) => {
    defaultOnEdgesChange(changes);
    // Edge deletion is handled through transition removal in configuration
    // No additional workflow update needed here since edges are derived from transitions
  }, [defaultOnEdgesChange]);

  // Update nodes and edges when workflow changes - use workflow ID as dependency to avoid infinite loops
  React.useEffect(() => {
    if (cleanedWorkflow) {
      // Create nodes and edges inside useEffect to avoid dependency issues
      const currentUiStates = uiStatesRef.current;
      const currentUiTransitions = uiTransitionsRef.current;
      const currentOnStateEdit = onStateEditRef.current;
      const currentOnTransitionEdit = onTransitionEditRef.current;
      const currentHandleTransitionUpdate = handleTransitionUpdateRef.current;

      const newNodes = currentUiStates.map((state) => ({
        id: state.id,
        type: 'stateNode',
        position: state.position,
        data: {
          label: state.name,
          state: state,
          onEdit: currentOnStateEdit,
        },
      }));

      const newEdges = currentUiTransitions.map((transition) => ({
        id: transition.id,
        type: 'transitionEdge',
        source: transition.sourceStateId,
        target: transition.targetStateId,
        data: {
          transition: transition,
          onEdit: currentOnTransitionEdit,
          onUpdate: currentHandleTransitionUpdate,
        },
        label: transition.definition.name || '',
        animated: true,
      }));

      setNodes(newNodes);
      setEdges(newEdges);
      if (newNodes.length > 0) {
        setIsInitialized(true);
      }
    } else {
      setNodes([]);
      setEdges([]);
      setIsInitialized(false);
    }
  }, [
    cleanedWorkflow?.id,
    cleanedWorkflow?.layout?.updatedAt,
    Object.keys(cleanedWorkflow?.configuration?.states || {}).length,
    cleanedWorkflow?.layout?.states?.length
  ]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!cleanedWorkflow || !params.source || !params.target) return;

      // Create new transition definition
      const newTransitionDef: TransitionDefinition = {
        name: 'New Transition',
        next: params.target,
        manual: false,
        disabled: false
      };

      // Add transition to source state
      const updatedStates = { ...cleanedWorkflow.configuration.states };
      const sourceState = updatedStates[params.source];
      if (sourceState) {
        updatedStates[params.source] = {
          ...sourceState,
          transitions: [...sourceState.transitions, newTransitionDef]
        };
      }

      const updatedWorkflow: UIWorkflowData = {
        ...cleanedWorkflow,
        configuration: {
          ...cleanedWorkflow.configuration,
          states: updatedStates
        }
      };

      onWorkflowUpdate(updatedWorkflow, `Connected ${params.source} to ${params.target}`);
    },
    [cleanedWorkflow, onWorkflowUpdate]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!cleanedWorkflow) return;

      // Update state position in layout
      const updatedLayoutStates = cleanedWorkflow.layout.states.map((state) =>
        state.id === node.id
          ? { ...state, position: node.position }
          : state
      );

      const updatedWorkflow: UIWorkflowData = {
        ...cleanedWorkflow,
        layout: {
          ...cleanedWorkflow.layout,
          states: updatedLayoutStates,
          transitions: cleanedWorkflow.layout.transitions, // Explicitly preserve transitions
          updatedAt: new Date().toISOString()
        }
      };

      onWorkflowUpdate(updatedWorkflow, `Moved state: ${node.id}`);
    },
    [cleanedWorkflow, onWorkflowUpdate]
  );

  // Handle double-click detection on pane
  const lastClickTimeRef = useRef<number>(0);
  const lastClickPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      const now = Date.now();
      const timeDiff = now - lastClickTimeRef.current;
      const positionDiff = Math.abs(event.clientX - lastClickPositionRef.current.x) +
                          Math.abs(event.clientY - lastClickPositionRef.current.y);

      // Double-click detection: within 500ms and within 5px of previous click
      if (timeDiff < 500 && positionDiff < 5) {
        const currentWorkflow = workflowRef.current;
        if (!currentWorkflow) return;

        // Convert screen coordinates to flow coordinates (accounts for zoom/pan)
        const screenPosition = { x: event.clientX, y: event.clientY };
        const flowPosition = screenToFlowPosition(screenPosition);

        // Center the node (typical state node is ~150x50px)
        const position = {
          x: flowPosition.x - 75, // Center horizontally
          y: flowPosition.y - 25  // Center vertically
        };



      // Generate a unique state ID
      const existingStateIds = Object.keys(currentWorkflow.configuration.states);

      // Also check layout states to ensure we don't have any orphaned layout entries
      const existingLayoutIds = currentWorkflow.layout.states.map(s => s.id);
      const allExistingIds = new Set([...existingStateIds, ...existingLayoutIds]);

      let newStateId = 'new-state';
      let counter = 1;
      while (allExistingIds.has(newStateId)) {
        newStateId = `new-state-${counter}`;
        counter++;
      }



      // Create new state definition
      const newStateDefinition: StateDefinition = {
        transitions: []
      };

      // First, clean up layout states to remove any orphaned entries
      // (states that exist in layout but not in current configuration)
      const currentConfigStateIds = Object.keys(currentWorkflow.configuration.states);
      const cleanLayoutStates = currentWorkflow.layout.states.filter(layoutState =>
        currentConfigStateIds.includes(layoutState.id)
      );

      // Add to configuration
      const updatedStates = {
        ...currentWorkflow.configuration.states,
        [newStateId]: newStateDefinition
      };

      // Add to layout
      const newLayoutState = {
        id: newStateId,
        position,
        properties: {}
      };

      const updatedLayoutStates = [...cleanLayoutStates, newLayoutState];

      const updatedWorkflow: UIWorkflowData = {
        ...currentWorkflow,
        configuration: {
          ...currentWorkflow.configuration,
          states: updatedStates
        },
        layout: {
          ...currentWorkflow.layout,
          states: updatedLayoutStates,
          transitions: currentWorkflow.layout.transitions, // Explicitly preserve transitions
          updatedAt: new Date().toISOString()
        }
      };


        onWorkflowUpdate(updatedWorkflow, `Added new state: ${newStateId}`);

        // Reset click tracking after successful double-click
        lastClickTimeRef.current = 0;
      } else {
        // Single click - update tracking
        lastClickTimeRef.current = now;
        lastClickPositionRef.current = { x: event.clientX, y: event.clientY };
      }
    },
    [onWorkflowUpdate]
  );



  if (!cleanedWorkflow) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="text-6xl mb-4">🔄</div>
          <h3 className="text-xl font-medium mb-2">No Workflow Selected</h3>
          <p>Select an entity and workflow from the sidebar to start editing</p>
        </div>
      </div>
    );
  }

  // Don't render ReactFlow until we have the workflow data loaded and initialized
  if (cleanedWorkflow && uiStates.length > 0 && !isInitialized) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}

        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className={darkMode ? 'dark' : ''}
        colorMode={darkMode ? 'dark' : 'light'}

        // Disable default double-click zoom behavior
        zoomOnDoubleClick={false}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const state = node.data?.state as UIStateData;
            if (state?.isInitial) return '#10b981'; // green
            if (state?.isFinal) return '#ef4444'; // red
            return '#6b7280'; // gray
          }}
          className={darkMode ? 'dark' : ''}
        />

        <Panel position="top-left" className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              {workflow.configuration.name}
            </h4>
            <div className="text-gray-600 dark:text-gray-400 space-y-1">
              <div>{Object.keys(workflow.configuration.states).length} states</div>
              <div>{uiTransitions.length} transitions</div>
              <div className="text-xs">
                Updated: {new Date(workflow.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </Panel>

        <Panel position="top-right" className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div className="font-medium text-gray-900 dark:text-white mb-2">Quick Help</div>
            <div>• Double-click canvas to add state</div>
            <div>• Double-click transitions to edit</div>
            <div>• Drag from state handles to connect</div>
            <div>• Drag transition labels to reposition</div>
            <div>• Click edit icons to modify</div>
            <div>• Drag states to rearrange</div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

// Outer component that provides ReactFlow context
export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
};

import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel
} from '@xyflow/react';
import type { Node, Edge, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { UIWorkflowData, UIStateData, UITransitionData, StateDefinition, TransitionDefinition } from '../../types/workflow';
import { StateNode } from './StateNode';
import { TransitionEdge } from './TransitionEdge';

interface WorkflowCanvasProps {
  workflow: UIWorkflowData | null;
  onWorkflowUpdate: (workflow: UIWorkflowData) => void;
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

// Helper function to convert schema workflow to UI state data
function createUIStateData(workflow: UIWorkflowData): UIStateData[] {
  const stateLayoutMap = new Map(workflow.layout.states.map(s => [s.id, s]));

  return Object.entries(workflow.configuration.states).map(([stateId, definition]) => {
    const layout = stateLayoutMap.get(stateId);
    const isInitial = workflow.configuration.initialState === stateId;
    const isFinal = definition.transitions.length === 0;

    return {
      id: stateId,
      name: stateId, // Use state ID as name since schema doesn't have separate names
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
      const transitionId = `${sourceStateId}-${index}`;
      const layout = transitionLayoutMap.get(transitionId);

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

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow,
  onWorkflowUpdate,
  onStateEdit,
  onTransitionEdit,
  darkMode
}) => {
  // Convert schema workflow to UI data
  const uiStates = useMemo(() => {
    return workflow ? createUIStateData(workflow) : [];
  }, [workflow]);

  const uiTransitions = useMemo(() => {
    return workflow ? createUITransitionData(workflow) : [];
  }, [workflow]);

  // Convert UI data to React Flow format
  const initialNodes: Node[] = useMemo(() => {
    return uiStates.map((state) => ({
      id: state.id,
      type: 'stateNode',
      position: state.position,
      data: {
        label: state.name,
        state: state,
        onEdit: onStateEdit,
      },
    }));
  }, [uiStates, onStateEdit]);

  const handleTransitionUpdate = useCallback((updatedTransition: UITransitionData) => {
    if (!workflow) return;

    console.log('WorkflowCanvas: Handling transition update', {
      transitionId: updatedTransition.id,
      labelPosition: updatedTransition.labelPosition,
      existingLayoutTransitions: workflow.layout.transitions
    });

    // Find existing layout transition or create new one
    const existingLayoutTransitions = workflow.layout.transitions;
    const existingIndex = existingLayoutTransitions.findIndex(t => t.id === updatedTransition.id);

    let updatedLayoutTransitions;
    if (existingIndex >= 0) {
      // Update existing layout transition
      console.log('WorkflowCanvas: Updating existing layout transition');
      updatedLayoutTransitions = existingLayoutTransitions.map(t =>
        t.id === updatedTransition.id
          ? { ...t, labelPosition: updatedTransition.labelPosition }
          : t
      );
    } else {
      // Create new layout transition
      console.log('WorkflowCanvas: Creating new layout transition');
      const newLayoutTransition = {
        id: updatedTransition.id,
        labelPosition: updatedTransition.labelPosition
      };
      updatedLayoutTransitions = [...existingLayoutTransitions, newLayoutTransition];
    }

    const updatedWorkflow: UIWorkflowData = {
      ...workflow,
      layout: {
        ...workflow.layout,
        transitions: updatedLayoutTransitions,
        updatedAt: new Date().toISOString()
      }
    };

    onWorkflowUpdate(updatedWorkflow);
  }, [workflow, onWorkflowUpdate]);

  const initialEdges: Edge[] = useMemo(() => {
    return uiTransitions.map((transition) => ({
      id: transition.id,
      type: 'transitionEdge',
      source: transition.sourceStateId,
      target: transition.targetStateId,
      data: {
        transition: transition,
        onEdit: onTransitionEdit,
        onUpdate: handleTransitionUpdate,
      },
      label: transition.definition.name || '',
      animated: true,
    }));
  }, [uiTransitions, onTransitionEdit, handleTransitionUpdate]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when workflow changes
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!workflow || !params.source || !params.target) return;

      // Create new transition definition
      const newTransitionDef: TransitionDefinition = {
        name: 'New Transition',
        next: params.target,
        manual: false,
        disabled: false
      };

      // Add transition to source state
      const updatedStates = { ...workflow.configuration.states };
      const sourceState = updatedStates[params.source];
      if (sourceState) {
        updatedStates[params.source] = {
          ...sourceState,
          transitions: [...sourceState.transitions, newTransitionDef]
        };
      }

      const updatedWorkflow: UIWorkflowData = {
        ...workflow,
        configuration: {
          ...workflow.configuration,
          states: updatedStates
        }
      };

      onWorkflowUpdate(updatedWorkflow);
    },
    [workflow, onWorkflowUpdate]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!workflow) return;

      // Update state position in layout
      const updatedLayoutStates = workflow.layout.states.map((state) =>
        state.id === node.id
          ? { ...state, position: node.position }
          : state
      );

      const updatedWorkflow: UIWorkflowData = {
        ...workflow,
        layout: {
          ...workflow.layout,
          states: updatedLayoutStates,
          updatedAt: new Date().toISOString()
        }
      };

      onWorkflowUpdate(updatedWorkflow);
    },
    [workflow, onWorkflowUpdate]
  );



  if (!workflow) {
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

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}

        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className={darkMode ? 'dark' : ''}
        colorMode={darkMode ? 'dark' : 'light'}
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

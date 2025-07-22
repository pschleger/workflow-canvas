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

import type { Workflow, WorkflowState, WorkflowTransition } from '../../types/workflow';
import { StateNode } from './StateNode';
import { TransitionEdge } from './TransitionEdge';

interface WorkflowCanvasProps {
  workflow: Workflow | null;
  onWorkflowUpdate: (workflow: Workflow) => void;
  onStateEdit: (state: WorkflowState) => void;
  onTransitionEdit: (transition: WorkflowTransition) => void;
  darkMode: boolean;
}

const nodeTypes = {
  stateNode: StateNode,
};

const edgeTypes = {
  transitionEdge: TransitionEdge,
};

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow,
  onWorkflowUpdate,
  onStateEdit,
  onTransitionEdit,
  darkMode
}) => {
  // Convert workflow data to React Flow format
  const initialNodes: Node[] = useMemo(() => {
    if (!workflow) return [];
    
    return workflow.states.map((state) => ({
      id: state.id,
      type: 'stateNode',
      position: state.position,
      data: {
        label: state.name,
        state: state,
        onEdit: onStateEdit,
        isInitial: state.isInitial,
        isFinal: state.isFinal,
      },
    }));
  }, [workflow, onStateEdit]);

  const handleTransitionUpdate = useCallback((updatedTransition: WorkflowTransition) => {
    if (!workflow) return;

    const updatedTransitions = workflow.transitions.map(t =>
      t.id === updatedTransition.id ? updatedTransition : t
    );

    const updatedWorkflow: Workflow = {
      ...workflow,
      transitions: updatedTransitions,
      updatedAt: new Date().toISOString(),
    };

    onWorkflowUpdate(updatedWorkflow);
  }, [workflow, onWorkflowUpdate]);

  const initialEdges: Edge[] = useMemo(() => {
    if (!workflow) return [];

    return workflow.transitions.map((transition) => ({
      id: transition.id,
      type: 'transitionEdge',
      source: transition.sourceStateId,
      target: transition.targetStateId,
      data: {
        transition: transition,
        onEdit: onTransitionEdit,
        onUpdate: handleTransitionUpdate,
      },
      label: transition.name || '',
      animated: true,
    }));
  }, [workflow, onTransitionEdit, handleTransitionUpdate]);

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

      // Create new transition
      const newTransition: WorkflowTransition = {
        id: `transition-${Date.now()}`,
        sourceStateId: params.source,
        targetStateId: params.target,
        name: 'New Transition',
        conditions: [],
        actions: [],
      };

      // Update workflow with new transition
      const updatedWorkflow: Workflow = {
        ...workflow,
        transitions: [...workflow.transitions, newTransition],
        updatedAt: new Date().toISOString(),
      };

      onWorkflowUpdate(updatedWorkflow);
    },
    [workflow, onWorkflowUpdate]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!workflow) return;

      // Update state position in workflow
      const updatedStates = workflow.states.map((state) =>
        state.id === node.id
          ? { ...state, position: node.position }
          : state
      );

      const updatedWorkflow: Workflow = {
        ...workflow,
        states: updatedStates,
        updatedAt: new Date().toISOString(),
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
            const state = node.data?.state as WorkflowState;
            if (state?.isInitial) return '#10b981'; // green
            if (state?.isFinal) return '#ef4444'; // red
            return '#6b7280'; // gray
          }}
          className={darkMode ? 'dark' : ''}
        />
        
        <Panel position="top-left" className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              {workflow.name}
            </h4>
            <div className="text-gray-600 dark:text-gray-400 space-y-1">
              <div>{workflow.states.length} states</div>
              <div>{workflow.transitions.length} transitions</div>
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

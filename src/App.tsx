import { useState, useCallback } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { EntityWorkflowSelector } from './components/Sidebar/EntityWorkflowSelector';
import { WorkflowCanvas } from './components/Canvas/WorkflowCanvas';
import { StateEditor } from './components/Editors/StateEditor';
import { TransitionEditor } from './components/Editors/TransitionEditor';
import { MockApiService } from './services/mockApi';
import type { WorkflowConfiguration, CanvasLayout, WorkflowState, WorkflowTransition } from './types/workflow';

// Helper function to combine configuration and layout into a legacy Workflow format for UI compatibility
function combineWorkflowData(config: WorkflowConfiguration, layout: CanvasLayout) {
  const stateLayoutMap = new Map(layout.states.map(s => [s.id, s]));
  const transitionLayoutMap = new Map(layout.transitions.map(t => [t.id, t]));

  return {
    ...config,
    states: config.states.map(state => {
      const layoutInfo = stateLayoutMap.get(state.id);
      return {
        ...state,
        position: layoutInfo?.position || { x: 0, y: 0 },
        properties: layoutInfo?.properties
      };
    }),
    transitions: config.transitions.map(transition => {
      const layoutInfo = transitionLayoutMap.get(transition.id);
      return {
        ...transition,
        labelPosition: layoutInfo?.labelPosition
      };
    })
  };
}

function App() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [currentWorkflow, setCurrentWorkflow] = useState<any | null>(null); // Combined workflow data for UI
  const [darkMode, setDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [loading, setLoading] = useState(false);

  // Editor states
  const [editingState, setEditingState] = useState<WorkflowState | null>(null);
  const [editingTransition, setEditingTransition] = useState<WorkflowTransition | null>(null);
  const [stateEditorOpen, setStateEditorOpen] = useState(false);
  const [transitionEditorOpen, setTransitionEditorOpen] = useState(false);

  const handleEntitySelect = useCallback((entityId: string) => {
    setSelectedEntityId(entityId);
  }, []);

  const handleWorkflowSelect = useCallback(async (entityId: string, workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setLoading(true);

    try {
      // Get both configuration and layout using the new segregated API
      const [configResponse, layoutResponse] = await Promise.all([
        MockApiService.getWorkflowConfiguration(entityId, workflowId),
        MockApiService.getCanvasLayout(entityId, workflowId)
      ]);

      if (configResponse.success && layoutResponse.success) {
        // Combine the segregated data for UI compatibility
        const combinedWorkflow = combineWorkflowData(configResponse.data, layoutResponse.data);
        setCurrentWorkflow(combinedWorkflow);
      } else {
        console.error('Failed to load workflow:', configResponse.message || layoutResponse.message);
        setCurrentWorkflow(null);
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
      setCurrentWorkflow(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleWorkflowUpdate = useCallback(async (workflow: any) => {
    setCurrentWorkflow(workflow);

    // Split the combined workflow back into configuration and layout for saving
    try {
      const configuration: WorkflowConfiguration = {
        id: workflow.id,
        entityId: workflow.entityId,
        name: workflow.name,
        description: workflow.description,
        version: workflow.version,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        states: workflow.states.map((state: any) => ({
          id: state.id,
          name: state.name,
          description: state.description,
          isInitial: state.isInitial,
          isFinal: state.isFinal
        })),
        transitions: workflow.transitions.map((transition: any) => ({
          id: transition.id,
          name: transition.name,
          sourceStateId: transition.sourceStateId,
          targetStateId: transition.targetStateId,
          conditions: transition.conditions,
          actions: transition.actions,
          description: transition.description
        }))
      };

      const layout: CanvasLayout = {
        workflowId: workflow.id,
        version: workflow.version,
        updatedAt: workflow.updatedAt,
        states: workflow.states.map((state: any) => ({
          id: state.id,
          position: state.position,
          properties: state.properties
        })),
        transitions: workflow.transitions.map((transition: any) => ({
          id: transition.id,
          labelPosition: transition.labelPosition
        }))
      };

      // Save both configuration and layout
      await Promise.all([
        MockApiService.updateWorkflowConfiguration(workflow.entityId, configuration),
        MockApiService.updateCanvasLayout(workflow.entityId, layout)
      ]);
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  }, []);

  const handleStateEdit = useCallback((state: WorkflowState) => {
    setEditingState(state);
    setStateEditorOpen(true);
  }, []);

  const handleTransitionEdit = useCallback((transition: WorkflowTransition) => {
    setEditingTransition(transition);
    setTransitionEditorOpen(true);
  }, []);

  const handleStateSave = useCallback((state: WorkflowState) => {
    if (!currentWorkflow) return;

    const updatedStates = currentWorkflow.states.some(s => s.id === state.id)
      ? currentWorkflow.states.map(s => s.id === state.id ? state : s)
      : [...currentWorkflow.states, state];

    const updatedWorkflow: Workflow = {
      ...currentWorkflow,
      states: updatedStates,
      updatedAt: new Date().toISOString(),
    };

    handleWorkflowUpdate(updatedWorkflow);
  }, [currentWorkflow, handleWorkflowUpdate]);

  const handleTransitionSave = useCallback((transition: WorkflowTransition) => {
    if (!currentWorkflow) return;

    const updatedTransitions = currentWorkflow.transitions.some(t => t.id === transition.id)
      ? currentWorkflow.transitions.map(t => t.id === transition.id ? transition : t)
      : [...currentWorkflow.transitions, transition];

    const updatedWorkflow: Workflow = {
      ...currentWorkflow,
      transitions: updatedTransitions,
      updatedAt: new Date().toISOString(),
    };

    handleWorkflowUpdate(updatedWorkflow);
  }, [currentWorkflow, handleWorkflowUpdate]);

  const handleStateDelete = useCallback((stateId: string) => {
    if (!currentWorkflow) return;

    const updatedStates = currentWorkflow.states.filter(s => s.id !== stateId);
    const updatedTransitions = currentWorkflow.transitions.filter(
      t => t.sourceStateId !== stateId && t.targetStateId !== stateId
    );

    const updatedWorkflow: Workflow = {
      ...currentWorkflow,
      states: updatedStates,
      transitions: updatedTransitions,
      updatedAt: new Date().toISOString(),
    };

    handleWorkflowUpdate(updatedWorkflow);
  }, [currentWorkflow, handleWorkflowUpdate]);

  const handleTransitionDelete = useCallback((transitionId: string) => {
    if (!currentWorkflow) return;

    const updatedTransitions = currentWorkflow.transitions.filter(t => t.id !== transitionId);

    const updatedWorkflow: Workflow = {
      ...currentWorkflow,
      transitions: updatedTransitions,
      updatedAt: new Date().toISOString(),
    };

    handleWorkflowUpdate(updatedWorkflow);
  }, [currentWorkflow, handleWorkflowUpdate]);

  const handleToggleDarkMode = useCallback(() => {
    setDarkMode((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workflowData = JSON.parse(e.target?.result as string);

            // Validate the imported data structure
            if (workflowData.id && workflowData.states && workflowData.transitions) {
              setCurrentWorkflow(workflowData);
              setSelectedEntityId(workflowData.entityId);
              setSelectedWorkflowId(workflowData.id);

              // Save to mock backend using the new segregated structure
              handleWorkflowUpdate(workflowData);

              alert('Workflow imported successfully!');
            } else {
              alert('Invalid workflow file format');
            }
          } catch (error) {
            alert('Error parsing workflow file: ' + error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  const handleExport = useCallback(() => {
    // TODO: Implement export functionality
    if (currentWorkflow) {
      const dataStr = JSON.stringify(currentWorkflow, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

      const exportFileDefaultName = `${currentWorkflow.name.replace(/\s+/g, '-').toLowerCase()}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  }, [currentWorkflow]);

  const sidebar = (
    <EntityWorkflowSelector
      selectedEntityId={selectedEntityId}
      selectedWorkflowId={selectedWorkflowId}
      onEntitySelect={handleEntitySelect}
      onWorkflowSelect={handleWorkflowSelect}
    />
  );

  const canvas = loading ? (
    <div className="h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  ) : (
    <WorkflowCanvas
      workflow={currentWorkflow}
      onWorkflowUpdate={handleWorkflowUpdate}
      onStateEdit={handleStateEdit}
      onTransitionEdit={handleTransitionEdit}
      darkMode={darkMode}
    />
  );

  return (
    <div className={darkMode ? 'dark' : ''}>
      <MainLayout
        sidebar={sidebar}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onImport={handleImport}
        onExport={handleExport}
      >
        {canvas}
      </MainLayout>

      {/* Editors */}
      <StateEditor
        state={editingState}
        isOpen={stateEditorOpen}
        onClose={() => {
          setStateEditorOpen(false);
          setEditingState(null);
        }}
        onSave={handleStateSave}
        onDelete={handleStateDelete}
      />

      <TransitionEditor
        transition={editingTransition}
        isOpen={transitionEditorOpen}
        onClose={() => {
          setTransitionEditorOpen(false);
          setEditingTransition(null);
        }}
        onSave={handleTransitionSave}
        onDelete={handleTransitionDelete}
      />
    </div>
  );
}

export default App

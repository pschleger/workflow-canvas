import { useState, useCallback } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { EntityWorkflowSelector } from './components/Sidebar/EntityWorkflowSelector';
import { WorkflowCanvas } from './components/Canvas/WorkflowCanvas';
import { StateEditor } from './components/Editors/StateEditor';
import { TransitionEditor } from './components/Editors/TransitionEditor';
import { MockApiService } from './services/mockApi';
import type { Workflow, WorkflowState, WorkflowTransition } from './types/workflow';

function App() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
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
      const response = await MockApiService.getWorkflow(entityId, workflowId);
      if (response.success) {
        setCurrentWorkflow(response.data);
      } else {
        console.error('Failed to load workflow:', response.message);
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleWorkflowUpdate = useCallback(async (workflow: Workflow) => {
    setCurrentWorkflow(workflow);

    // Save to backend
    try {
      await MockApiService.updateWorkflow(workflow.entityId, workflow);
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

              // Save to mock backend
              MockApiService.updateWorkflow(workflowData.entityId, workflowData);

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

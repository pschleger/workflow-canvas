import { useState, useCallback, useEffect } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { EntityWorkflowSelector } from './components/Sidebar/EntityWorkflowSelector';
import { WorkflowCanvas } from './components/Canvas/WorkflowCanvas';
import { StateEditor } from './components/Editors/StateEditor';
import { TransitionEditor } from './components/Editors/TransitionEditor';
import { MockApiService } from './services/mockApi';
import { configService } from './services/configService';
import { historyService } from './services/historyService';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import type { WorkflowConfiguration, CanvasLayout, UIWorkflowData, StateDefinition, TransitionDefinition, AppConfiguration } from './types/workflow';
import { parseTransitionId, getTransitionDefinition } from './utils/transitionUtils';

// Helper function to combine configuration and layout into UI workflow data
function combineWorkflowData(workflowId: string, entityId: string, config: WorkflowConfiguration, layout: CanvasLayout): UIWorkflowData {
  return {
    id: workflowId,
    entityId: entityId,
    configuration: config,
    layout: layout,
    createdAt: new Date().toISOString(), // Mock creation time
    updatedAt: layout.updatedAt
  };
}

function App() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [currentWorkflow, setCurrentWorkflow] = useState<UIWorkflowData | null>(null);
  const [configuration, setConfiguration] = useState<AppConfiguration>(() => configService.getConfig());
  const [darkMode, setDarkMode] = useState(() => configuration.ui.darkMode);

  // History state for UI updates
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Update history state when workflow changes
  const updateHistoryState = useCallback(() => {
    if (selectedWorkflowId) {
      setCanUndo(historyService.canUndo(selectedWorkflowId));
      setCanRedo(historyService.canRedo(selectedWorkflowId));
      setUndoCount(historyService.getUndoCount(selectedWorkflowId));
      setRedoCount(historyService.getRedoCount(selectedWorkflowId));
    } else {
      setCanUndo(false);
      setCanRedo(false);
      setUndoCount(0);
      setRedoCount(0);
    }
  }, [selectedWorkflowId]);

  // Update history state when workflow selection changes
  useEffect(() => {
    updateHistoryState();
  }, [selectedWorkflowId, updateHistoryState]);

  // Editor states
  const [editingStateId, setEditingStateId] = useState<string | null>(null);
  const [editingStateDefinition, setEditingStateDefinition] = useState<StateDefinition | null>(null);
  const [editingTransitionId, setEditingTransitionId] = useState<string | null>(null);
  const [editingTransitionDefinition, setEditingTransitionDefinition] = useState<TransitionDefinition | null>(null);
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
        // Combine the segregated data for UI
        const combinedWorkflow = combineWorkflowData(workflowId, entityId, configResponse.data, layoutResponse.data);
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

  const handleWorkflowUpdate = useCallback(async (workflow: UIWorkflowData, description: string = 'Workflow updated', trackHistory: boolean = true) => {
    // Track history before updating (if not an undo/redo operation)
    if (trackHistory && currentWorkflow && selectedWorkflowId) {
      historyService.addEntry(selectedWorkflowId, currentWorkflow, description);
    }

    setCurrentWorkflow(workflow);

    // Update history state
    updateHistoryState();

    // Save both configuration and layout
    try {
      await Promise.all([
        MockApiService.updateWorkflowConfiguration(workflow.entityId, workflow.id, workflow.configuration),
        MockApiService.updateCanvasLayout(workflow.entityId, workflow.layout)
      ]);
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  }, [currentWorkflow, selectedWorkflowId, updateHistoryState]);

  // Handle undo operation
  const handleUndo = useCallback(() => {
    if (selectedWorkflowId && canUndo) {
      const previousWorkflow = historyService.undo(selectedWorkflowId);
      if (previousWorkflow) {
        // Don't track history for undo operations
        handleWorkflowUpdate(previousWorkflow, 'Undo operation', false);
      }
    }
  }, [selectedWorkflowId, canUndo, handleWorkflowUpdate]);

  // Handle redo operation
  const handleRedo = useCallback(() => {
    if (selectedWorkflowId && canRedo) {
      const nextWorkflow = historyService.redo(selectedWorkflowId);
      if (nextWorkflow) {
        // Don't track history for redo operations
        handleWorkflowUpdate(nextWorkflow, 'Redo operation', false);
      }
    }
  }, [selectedWorkflowId, canRedo, handleWorkflowUpdate]);

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    canUndo,
    canRedo
  });

  const handleStateEdit = useCallback((stateId: string) => {
    if (!currentWorkflow) return;

    const stateDefinition = currentWorkflow.configuration.states[stateId];
    if (stateDefinition) {
      setEditingStateId(stateId);
      setEditingStateDefinition(stateDefinition);
      setStateEditorOpen(true);
    }
  }, [currentWorkflow]);

  const handleTransitionEdit = useCallback((transitionId: string) => {
    if (!currentWorkflow) return;

    // Use centralized transition utilities
    const transitionDef = getTransitionDefinition(transitionId, currentWorkflow.configuration.states);

    if (transitionDef) {
      setEditingTransitionId(transitionId);
      setEditingTransitionDefinition(transitionDef);
      setTransitionEditorOpen(true);
    }
  }, [currentWorkflow]);

  const handleStateSave = useCallback((stateId: string, definition: StateDefinition) => {
    if (!currentWorkflow) return;

    const updatedStates = {
      ...currentWorkflow.configuration.states,
      [stateId]: definition
    };

    const updatedWorkflow: UIWorkflowData = {
      ...currentWorkflow,
      configuration: {
        ...currentWorkflow.configuration,
        states: updatedStates
      }
    };

    handleWorkflowUpdate(updatedWorkflow, `Updated state: ${stateId}`);
  }, [currentWorkflow, handleWorkflowUpdate]);

  const handleTransitionSave = useCallback((transitionId: string, definition: TransitionDefinition) => {
    if (!currentWorkflow) return;

    // Use centralized transition utilities
    const parsed = parseTransitionId(transitionId);

    if (!parsed) {
      console.error('Invalid transition ID format:', transitionId);
      return;
    }

    const { sourceStateId, transitionIndex } = parsed;
    const sourceState = currentWorkflow.configuration.states[sourceStateId];

    if (sourceState) {
      const updatedTransitions = [...sourceState.transitions];
      updatedTransitions[transitionIndex] = definition;

      const updatedStates = {
        ...currentWorkflow.configuration.states,
        [sourceStateId]: {
          ...sourceState,
          transitions: updatedTransitions
        }
      };

      const updatedWorkflow: UIWorkflowData = {
        ...currentWorkflow,
        configuration: {
          ...currentWorkflow.configuration,
          states: updatedStates
        }
      };

      handleWorkflowUpdate(updatedWorkflow, `Updated transition: ${transitionId}`);
    }
  }, [currentWorkflow, handleWorkflowUpdate]);

  const handleStateDelete = useCallback((stateId: string) => {
    if (!currentWorkflow) return;



    // Remove the state from configuration
    const updatedStates = { ...currentWorkflow.configuration.states };
    delete updatedStates[stateId];



    // Remove transitions that reference this state
    Object.keys(updatedStates).forEach(sourceStateId => {
      const state = updatedStates[sourceStateId];
      state.transitions = state.transitions.filter(t => t.next !== stateId);
    });

    // Handle initial state deletion - set to first remaining state or empty
    let updatedInitialState = currentWorkflow.configuration.initialState;
    if (updatedInitialState === stateId) {
      const remainingStates = Object.keys(updatedStates);
      updatedInitialState = remainingStates.length > 0 ? remainingStates[0] : '';

    }

    // Remove from layout
    const updatedLayoutStates = currentWorkflow.layout.states.filter(s => s.id !== stateId);

    const updatedWorkflow: UIWorkflowData = {
      ...currentWorkflow,
      configuration: {
        ...currentWorkflow.configuration,
        initialState: updatedInitialState,
        states: updatedStates
      },
      layout: {
        ...currentWorkflow.layout,
        states: updatedLayoutStates
      }
    };



    handleWorkflowUpdate(updatedWorkflow, `Deleted state: ${stateId}`);
  }, [currentWorkflow, handleWorkflowUpdate]);

  const handleTransitionDelete = useCallback((transitionId: string) => {
    if (!currentWorkflow) return;

    // Parse transition ID to remove the correct transition
    const [sourceStateId, transitionIndex] = transitionId.split('-');
    const sourceState = currentWorkflow.configuration.states[sourceStateId];

    if (sourceState) {
      const updatedTransitions = sourceState.transitions.filter((_, index) => index !== parseInt(transitionIndex));

      const updatedStates = {
        ...currentWorkflow.configuration.states,
        [sourceStateId]: {
          ...sourceState,
          transitions: updatedTransitions
        }
      };

      const updatedWorkflow: UIWorkflowData = {
        ...currentWorkflow,
        configuration: {
          ...currentWorkflow.configuration,
          states: updatedStates
        }
      };

      handleWorkflowUpdate(updatedWorkflow, `Deleted transition: ${transitionId}`);
    }
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
              handleWorkflowUpdate(workflowData, 'Imported workflow');

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
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        undoCount={undoCount}
        redoCount={redoCount}
      >
        {canvas}
      </MainLayout>

      {/* Editors */}
      <StateEditor
        stateId={editingStateId}
        stateDefinition={editingStateDefinition}
        isOpen={stateEditorOpen}
        onClose={() => {
          setStateEditorOpen(false);
          setEditingStateId(null);
          setEditingStateDefinition(null);
        }}
        onSave={handleStateSave}
        onDelete={handleStateDelete}
      />

      <TransitionEditor
        transitionId={editingTransitionId}
        transitionDefinition={editingTransitionDefinition}
        isOpen={transitionEditorOpen}
        onClose={() => {
          setTransitionEditorOpen(false);
          setEditingTransitionId(null);
          setEditingTransitionDefinition(null);
        }}
        onSave={handleTransitionSave}
        onDelete={handleTransitionDelete}
      />
    </div>
  );
}

export default App

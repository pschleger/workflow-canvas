import { useState, useCallback, useEffect } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { EntityWorkflowSelector } from './components/Sidebar/EntityWorkflowSelector';
import { WorkflowCanvas } from './components/Canvas/WorkflowCanvas';
import { StateEditor } from './components/Editors/StateEditor';
import { TransitionEditor } from './components/Editors/TransitionEditor';
import { WorkflowImportDialog } from './components/Dialogs/WorkflowImportDialog';
import { MockApiService } from './services/mockApi';
import { configService } from './services/configService';
import { historyService } from './services/historyService';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import type { WorkflowConfiguration, CanvasLayout, UIWorkflowData, StateDefinition, TransitionDefinition, AppConfiguration, WorkflowImportMetadata, EntityModelIdentifier } from './types/workflow';
import { generateWorkflowId } from './types/workflow';
import { autoLayoutWorkflow } from './utils/autoLayout';
import { parseTransitionId, getTransitionDefinition } from './utils/transitionUtils';

// Helper function to combine configuration and layout into UI workflow data
function combineWorkflowData(workflowId: string, entityModel: EntityModelIdentifier, config: WorkflowConfiguration, layout: CanvasLayout): UIWorkflowData {
  return {
    id: workflowId,
    entityModel: entityModel,
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

  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);

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
        // Create entity model from entityId (temporary for existing workflows)
        const entityModel: EntityModelIdentifier = {
          modelName: entityId,
          modelVersion: 1
        };

        // Combine the segregated data for UI
        const combinedWorkflow = combineWorkflowData(workflowId, entityModel, configResponse.data, layoutResponse.data);
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

    // Save both configuration and layout (use modelName as entityId for compatibility)
    try {
      await Promise.all([
        MockApiService.updateWorkflowConfiguration(workflow.entityModel.modelName, workflow.id, workflow.configuration),
        MockApiService.updateCanvasLayout(workflow.entityModel.modelName, workflow.layout)
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
    setImportDialogOpen(true);
  }, []);

  const handleWorkflowImport = useCallback((config: WorkflowConfiguration, metadata: WorkflowImportMetadata) => {
    try {
      const entityModel: EntityModelIdentifier = {
        modelName: metadata.modelName,
        modelVersion: metadata.modelVersion
      };

      // Generate workflow ID from configuration and entity model
      const workflowId = generateWorkflowId(config.name, entityModel);

      // Create initial layout with default positions (will be auto-laid out)
      const now = new Date().toISOString();
      const initialLayout: CanvasLayout = {
        workflowId,
        version: 1,
        updatedAt: now,
        states: Object.keys(config.states).map(stateId => ({
          id: stateId,
          position: { x: 0, y: 0 } // Default position - will be auto-laid out
        })),
        transitions: [] // Will be populated by canvas
      };

      // Create UIWorkflowData
      const uiWorkflow = combineWorkflowData(workflowId, entityModel, config, initialLayout);

      // Apply auto-layout for proper positioning
      const layoutedWorkflow = autoLayoutWorkflow(uiWorkflow);

      // Set as current workflow
      setCurrentWorkflow(layoutedWorkflow);
      setSelectedEntityId(entityModel.modelName); // Use modelName as entity selection
      setSelectedWorkflowId(workflowId);

      // Save to mock backend
      handleWorkflowUpdate(layoutedWorkflow, 'Imported workflow');

      alert(`Workflow "${config.name}" imported successfully!`);
    } catch (error) {
      console.error('Error importing workflow:', error);
      alert(`Error importing workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [handleWorkflowUpdate]);

  const handleExport = useCallback(() => {
    if (currentWorkflow) {
      // Create export data with the new structure including timestamps
      const exportData = {
        ...currentWorkflow,
        createdAt: currentWorkflow.createdAt,
        updatedAt: new Date().toISOString() // Update timestamp on export
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

      // Generate filename from workflow name and entity model
      const workflowName = currentWorkflow.configuration.name || 'workflow';
      const modelName = currentWorkflow.entityModel.modelName;
      const modelVersion = currentWorkflow.entityModel.modelVersion;
      const exportFileDefaultName = `${workflowName.replace(/\s+/g, '-').toLowerCase()}-${modelName.replace(/\s+/g, '-').toLowerCase()}-v${modelVersion}.json`;

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

      {/* Import Dialog */}
      <WorkflowImportDialog
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleWorkflowImport}
      />
    </div>
  );
}

export default App

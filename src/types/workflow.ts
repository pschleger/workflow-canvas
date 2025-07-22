// Core workflow and state machine types

export interface Entity {
  id: string;
  name: string;
  description?: string;
  workflowCount: number;
}

// Schema-compliant types based on JSON schemas

// Query condition type (from QueryCondition.json)
export interface QueryCondition {
  type: string;
  [key: string]: any; // Additional properties based on condition type
}

// Externalized function configuration (from ExternalizedFunctionConfig.json)
export interface ExternalizedFunctionConfig {
  attachEntity?: boolean;
  calculationNodesTags?: string;
  responseTimeoutMs?: number;
  retryPolicy?: string;
  context?: string;
  [key: string]: any; // Additional properties allowed
}

// Externalized processor definition (from ExternalizedProcessorDefinition.json)
export interface ExternalizedProcessorDefinition {
  name: string;
  executionMode?: 'SYNC' | 'ASYNC_SAME_TX' | 'ASYNC_NEW_TX';
  config?: ExternalizedFunctionConfig;
}

// Transition definition (from TransitionDefinition.json)
export interface TransitionDefinition {
  name?: string;
  next: string; // Target state code
  manual?: boolean;
  disabled?: boolean;
  processors?: ExternalizedProcessorDefinition[];
  criterion?: QueryCondition;
}

// State definition (from StateDefinition.json)
export interface StateDefinition {
  transitions: TransitionDefinition[];
}

// Workflow configuration (from WorkflowConfiguration.json)
export interface WorkflowConfiguration {
  version: string;
  name: string;
  desc?: string;
  initialState: string;
  active?: boolean;
  criterion?: QueryCondition;
  states: Record<string, StateDefinition>; // Map of state codes to state definitions
}

// Visual/positional data for canvas layout
export interface StateLayout {
  id: string;
  position: {
    x: number;
    y: number;
  };
  properties?: Record<string, any>; // colors, styling, etc.
}

// Visual/positional data for transition layout
export interface TransitionLayout {
  id: string;
  labelPosition?: {
    x: number;
    y: number;
  };
}

// Canvas layout information (visual/positional data only)
export interface CanvasLayout {
  workflowId: string;
  states: StateLayout[];
  transitions: TransitionLayout[];
  version: number;
  updatedAt: string;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  description?: string;
  stateCount: number;
  transitionCount: number;
  updatedAt: string;
}

// Combined workflow data for UI rendering (merges schema config with layout)
export interface UIWorkflowData {
  id: string;
  entityId: string;
  configuration: WorkflowConfiguration;
  layout: CanvasLayout;
  createdAt: string;
  updatedAt: string;
}

// UI-specific state representation (combines schema state with layout)
export interface UIStateData {
  id: string; // state code from schema
  name: string;
  definition: StateDefinition;
  position: { x: number; y: number };
  properties?: Record<string, any>;
  isInitial: boolean;
  isFinal: boolean; // computed based on transitions
}

// UI-specific transition representation (flattened from schema structure)
export interface UITransitionData {
  id: string; // generated unique ID
  sourceStateId: string;
  targetStateId: string;
  definition: TransitionDefinition;
  labelPosition?: { x: number; y: number };
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface EntitiesResponse extends ApiResponse<Entity[]> {}
export interface WorkflowsResponse extends ApiResponse<WorkflowSummary[]> {}

// API response types for segregated structure
export interface WorkflowConfigurationResponse extends ApiResponse<WorkflowConfiguration> {}
export interface CanvasLayoutResponse extends ApiResponse<CanvasLayout> {}
export interface WorkflowWithLayoutResponse extends ApiResponse<{
  configuration: WorkflowConfiguration;
  layout: CanvasLayout;
}> {}

// UI State types
export interface AppState {
  selectedEntityId: string | null;
  selectedWorkflowId: string | null;
  currentWorkflow: UIWorkflowData | null;
  entities: Entity[];
  workflows: WorkflowSummary[];
  isLoading: boolean;
  error: string | null;
  darkMode: boolean;
}

// React Flow specific types - combines state config with layout for rendering
export interface FlowNode {
  id: string;
  type: 'stateNode';
  position: { x: number; y: number };
  data: {
    label: string;
    state: UIStateData;
    onEdit: (stateId: string, definition: StateDefinition) => void;
  };
}

export interface FlowEdge {
  id: string;
  type: 'transitionEdge';
  source: string;
  target: string;
  data: {
    transition: UITransitionData;
    onEdit: (transitionId: string, definition: TransitionDefinition) => void;
  };
}



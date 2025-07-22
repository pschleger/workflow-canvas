// Core workflow and state machine types

export interface Entity {
  id: string;
  name: string;
  description?: string;
  workflowCount: number;
}

// Functional workflow state (no visual/positional data)
export interface WorkflowState {
  id: string;
  name: string;
  description?: string;
  isInitial?: boolean;
  isFinal?: boolean;
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

export interface TransitionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface TransitionAction {
  type: 'set_field' | 'call_api' | 'send_notification';
  parameters: Record<string, any>;
}

// Functional transition (no visual/positional data)
export interface WorkflowTransition {
  id: string;
  name?: string;
  sourceStateId: string;
  targetStateId: string;
  conditions?: TransitionCondition[];
  actions?: TransitionAction[];
  description?: string;
}

// Visual/positional data for transition layout
export interface TransitionLayout {
  id: string;
  labelPosition?: {
    x: number;
    y: number;
  };
}

// Workflow configuration (functional specification only)
export interface WorkflowConfiguration {
  id: string;
  entityId: string;
  name: string;
  description?: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  version: number;
  createdAt: string;
  updatedAt: string;
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
  currentWorkflow: Workflow | null;
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
    state: WorkflowState;
    layout: StateLayout;
    onEdit: (state: WorkflowState) => void;
  };
}

export interface FlowEdge {
  id: string;
  type: 'transitionEdge';
  source: string;
  target: string;
  data: {
    transition: WorkflowTransition;
    layout: TransitionLayout;
    onEdit: (transition: WorkflowTransition) => void;
  };
}



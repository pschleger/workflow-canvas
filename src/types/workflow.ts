// Core workflow and state machine types

export interface Entity {
  id: string;
  name: string;
  description?: string;
  workflowCount: number;
}

export interface WorkflowState {
  id: string;
  name: string;
  description?: string;
  properties?: Record<string, any>;
  position: {
    x: number;
    y: number;
  };
  isInitial?: boolean;
  isFinal?: boolean;
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

export interface WorkflowTransition {
  id: string;
  name?: string;
  sourceStateId: string;
  targetStateId: string;
  conditions?: TransitionCondition[];
  actions?: TransitionAction[];
  description?: string;
  labelPosition?: {
    x: number;
    y: number;
  };
}

export interface Workflow {
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
export interface WorkflowResponse extends ApiResponse<Workflow> {}
export interface WorkflowsResponse extends ApiResponse<WorkflowSummary[]> {}

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

// React Flow specific types
export interface FlowNode extends WorkflowState {
  type: 'stateNode';
  data: {
    label: string;
    state: WorkflowState;
    onEdit: (state: WorkflowState) => void;
  };
}

export interface FlowEdge extends WorkflowTransition {
  type: 'transitionEdge';
  source: string;
  target: string;
  data: {
    transition: WorkflowTransition;
    onEdit: (transition: WorkflowTransition) => void;
  };
}

import type {
  Entity,
  WorkflowConfiguration,
  CanvasLayout,
  WorkflowSummary,
  EntitiesResponse,
  WorkflowsResponse,
  WorkflowConfigurationResponse,
  CanvasLayoutResponse,
  WorkflowWithLayoutResponse
} from '../types/workflow';

// Mock data
const mockEntities: Entity[] = [
  {
    id: 'user-entity',
    name: 'User',
    description: 'User account management workflows',
    workflowCount: 2
  },
  {
    id: 'order-entity',
    name: 'Order',
    description: 'Order processing and fulfillment workflows',
    workflowCount: 1
  },
  {
    id: 'payment-entity',
    name: 'Payment',
    description: 'Payment processing workflows',
    workflowCount: 1
  }
];

const mockWorkflows: Record<string, WorkflowSummary[]> = {
  'user-entity': [
    {
      id: 'user-registration',
      name: 'User Registration',
      description: 'New user account creation process',
      stateCount: 4,
      transitionCount: 5,
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'user-verification',
      name: 'User Verification',
      description: 'Email and identity verification process',
      stateCount: 3,
      transitionCount: 4,
      updatedAt: '2024-01-14T15:45:00Z'
    }
  ],
  'order-entity': [
    {
      id: 'order-fulfillment',
      name: 'Order Fulfillment',
      description: 'Complete order processing workflow',
      stateCount: 6,
      transitionCount: 8,
      updatedAt: '2024-01-16T09:15:00Z'
    }
  ],
  'payment-entity': [
    {
      id: 'payment-processing',
      name: 'Payment Processing',
      description: 'Payment authorization and settlement',
      stateCount: 5,
      transitionCount: 6,
      updatedAt: '2024-01-13T14:20:00Z'
    }
  ]
};

// Segregated mock data - workflow configurations (functional specification)
const mockWorkflowConfigurations: Record<string, WorkflowConfiguration> = {
  'user-registration': {
    id: 'user-registration',
    entityId: 'user-entity',
    name: 'User Registration',
    description: 'New user account creation process',
    version: 1,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    states: [
      {
        id: 'pending',
        name: 'Pending',
        description: 'User has started registration',
        isInitial: true
      },
      {
        id: 'email-sent',
        name: 'Email Sent',
        description: 'Verification email has been sent'
      },
      {
        id: 'verified',
        name: 'Verified',
        description: 'Email has been verified'
      },
      {
        id: 'failed',
        name: 'Failed',
        description: 'Registration failed',
        isFinal: true
      }
    ],
    transitions: [
      {
        id: 'pending-to-email-sent',
        sourceStateId: 'pending',
        targetStateId: 'email-sent',
        name: 'Send Verification Email',
        conditions: [
          { field: 'email', operator: 'contains', value: '@' }
        ],
        actions: [
          { type: 'send_notification', parameters: { template: 'verification_email' } }
        ]
      },
      {
        id: 'email-sent-to-verified',
        sourceStateId: 'email-sent',
        targetStateId: 'verified',
        name: 'Email Verified',
        conditions: [
          { field: 'verification_token', operator: 'equals', value: 'valid' }
        ]
      },
      {
        id: 'pending-to-failed',
        sourceStateId: 'pending',
        targetStateId: 'failed',
        name: 'Invalid Email',
        conditions: [
          { field: 'email', operator: 'not_equals', value: '@' }
        ]
      },
      {
        id: 'email-sent-to-failed',
        sourceStateId: 'email-sent',
        targetStateId: 'failed',
        name: 'Verification Timeout',
        conditions: [
          { field: 'timeout', operator: 'greater_than', value: 3600 }
        ]
      }
    ]
  },
  'user-verification': {
    id: 'user-verification',
    entityId: 'user-entity',
    name: 'User Verification',
    description: 'Email and identity verification process',
    version: 1,
    createdAt: '2024-01-12T08:00:00Z',
    updatedAt: '2024-01-14T15:45:00Z',
    states: [
      {
        id: 'unverified',
        name: 'Unverified',
        description: 'User account created but not verified',
        isInitial: true
      },
      {
        id: 'verification-sent',
        name: 'Verification Sent',
        description: 'Verification email has been sent'
      },
      {
        id: 'verified',
        name: 'Verified',
        description: 'User account is verified',
        isFinal: true
      }
    ],
    transitions: [
      {
        id: 'unverified-to-verification-sent',
        sourceStateId: 'unverified',
        targetStateId: 'verification-sent',
        name: 'Send Verification',
        conditions: [
          { field: 'email_valid', operator: 'equals', value: true }
        ],
        actions: [
          { type: 'send_notification', parameters: { template: 'verification_email' } }
        ]
      },
      {
        id: 'verification-sent-to-verified',
        sourceStateId: 'verification-sent',
        targetStateId: 'verified',
        name: 'Verify Email',
        conditions: [
          { field: 'verification_code', operator: 'equals', value: 'valid' }
        ],
        actions: [
          { type: 'set_field', parameters: { field: 'verified_at', value: 'now()' } }
        ]
      },
      {
        id: 'verification-sent-to-unverified',
        sourceStateId: 'verification-sent',
        targetStateId: 'unverified',
        name: 'Resend Verification',
        conditions: [
          { field: 'resend_requested', operator: 'equals', value: true }
        ]
      }
    ]
  },
  'order-fulfillment': {
    id: 'order-fulfillment',
    entityId: 'order-entity',
    name: 'Order Fulfillment',
    description: 'Complete order processing workflow',
    version: 1,
    createdAt: '2024-01-14T08:00:00Z',
    updatedAt: '2024-01-16T09:15:00Z',
    states: [
      {
        id: 'pending',
        name: 'Pending',
        description: 'Order received and pending processing',
        isInitial: true
      },
      {
        id: 'processing',
        name: 'Processing',
        description: 'Order is being processed'
      },
      {
        id: 'shipped',
        name: 'Shipped',
        description: 'Order has been shipped'
      },
      {
        id: 'delivered',
        name: 'Delivered',
        description: 'Order has been delivered',
        isFinal: true
      },
      {
        id: 'cancelled',
        name: 'Cancelled',
        description: 'Order was cancelled',
        isFinal: true
      }
    ],
    transitions: [
      {
        id: 'pending-to-processing',
        sourceStateId: 'pending',
        targetStateId: 'processing',
        name: 'Start Processing',
        conditions: [
          { field: 'payment_confirmed', operator: 'equals', value: true }
        ]
      },
      {
        id: 'processing-to-shipped',
        sourceStateId: 'processing',
        targetStateId: 'shipped',
        name: 'Ship Order',
        conditions: [
          { field: 'items_packed', operator: 'equals', value: true }
        ]
      },
      {
        id: 'shipped-to-delivered',
        sourceStateId: 'shipped',
        targetStateId: 'delivered',
        name: 'Confirm Delivery',
        conditions: [
          { field: 'delivery_confirmed', operator: 'equals', value: true }
        ]
      },
      {
        id: 'pending-to-cancelled',
        sourceStateId: 'pending',
        targetStateId: 'cancelled',
        name: 'Cancel Order',
        conditions: [
          { field: 'cancellation_requested', operator: 'equals', value: true }
        ]
      }
    ]
  },
  'payment-processing': {
    id: 'payment-processing',
    entityId: 'payment-entity',
    name: 'Payment Processing',
    description: 'Payment authorization and settlement',
    version: 1,
    createdAt: '2024-01-11T08:00:00Z',
    updatedAt: '2024-01-13T14:20:00Z',
    states: [
      {
        id: 'initiated',
        name: 'Initiated',
        description: 'Payment has been initiated',
        isInitial: true
      },
      {
        id: 'authorized',
        name: 'Authorized',
        description: 'Payment has been authorized'
      },
      {
        id: 'captured',
        name: 'Captured',
        description: 'Payment has been captured',
        isFinal: true
      },
      {
        id: 'failed',
        name: 'Failed',
        description: 'Payment failed',
        isFinal: true
      },
      {
        id: 'refunded',
        name: 'Refunded',
        description: 'Payment has been refunded',
        isFinal: true
      }
    ],
    transitions: [
      {
        id: 'initiated-to-authorized',
        sourceStateId: 'initiated',
        targetStateId: 'authorized',
        name: 'Authorize Payment',
        conditions: [
          { field: 'card_valid', operator: 'equals', value: true }
        ]
      },
      {
        id: 'authorized-to-captured',
        sourceStateId: 'authorized',
        targetStateId: 'captured',
        name: 'Capture Payment',
        conditions: [
          { field: 'capture_requested', operator: 'equals', value: true }
        ]
      },
      {
        id: 'initiated-to-failed',
        sourceStateId: 'initiated',
        targetStateId: 'failed',
        name: 'Payment Failed',
        conditions: [
          { field: 'authorization_failed', operator: 'equals', value: true }
        ]
      },
      {
        id: 'captured-to-refunded',
        sourceStateId: 'captured',
        targetStateId: 'refunded',
        name: 'Refund Payment',
        conditions: [
          { field: 'refund_requested', operator: 'equals', value: true }
        ]
      }
    ]
  }
};

// Canvas layouts (visual/positional data)
const mockCanvasLayouts: Record<string, CanvasLayout> = {
  'user-registration': {
    workflowId: 'user-registration',
    version: 1,
    updatedAt: '2024-01-15T10:30:00Z',
    states: [
      {
        id: 'pending',
        position: { x: 100, y: 100 },
        properties: { color: '#fbbf24' }
      },
      {
        id: 'email-sent',
        position: { x: 300, y: 100 },
        properties: { color: '#60a5fa' }
      },
      {
        id: 'verified',
        position: { x: 500, y: 100 },
        properties: { color: '#34d399' }
      },
      {
        id: 'failed',
        position: { x: 300, y: 250 },
        properties: { color: '#f87171' }
      }
    ],
    transitions: [
      { id: 'pending-to-email-sent' },
      { id: 'email-sent-to-verified' },
      { id: 'pending-to-failed' },
      { id: 'email-sent-to-failed' }
    ]
  },
  'user-verification': {
    workflowId: 'user-verification',
    version: 1,
    updatedAt: '2024-01-14T15:45:00Z',
    states: [
      {
        id: 'unverified',
        position: { x: 100, y: 100 },
        properties: { color: '#f59e0b' }
      },
      {
        id: 'verification-sent',
        position: { x: 350, y: 100 },
        properties: { color: '#3b82f6' }
      },
      {
        id: 'verified',
        position: { x: 600, y: 100 },
        properties: { color: '#10b981' }
      }
    ],
    transitions: [
      { id: 'unverified-to-verification-sent' },
      { id: 'verification-sent-to-verified' },
      { id: 'verification-sent-to-unverified' }
    ]
  },
  'order-fulfillment': {
    workflowId: 'order-fulfillment',
    version: 1,
    updatedAt: '2024-01-16T09:15:00Z',
    states: [
      {
        id: 'pending',
        position: { x: 100, y: 100 },
        properties: { color: '#f59e0b' }
      },
      {
        id: 'processing',
        position: { x: 300, y: 100 },
        properties: { color: '#3b82f6' }
      },
      {
        id: 'shipped',
        position: { x: 500, y: 100 },
        properties: { color: '#8b5cf6' }
      },
      {
        id: 'delivered',
        position: { x: 700, y: 100 },
        properties: { color: '#10b981' }
      },
      {
        id: 'cancelled',
        position: { x: 300, y: 250 },
        properties: { color: '#ef4444' }
      }
    ],
    transitions: [
      { id: 'pending-to-processing' },
      { id: 'processing-to-shipped' },
      { id: 'shipped-to-delivered' },
      { id: 'pending-to-cancelled' }
    ]
  },
  'payment-processing': {
    workflowId: 'payment-processing',
    version: 1,
    updatedAt: '2024-01-13T14:20:00Z',
    states: [
      {
        id: 'initiated',
        position: { x: 100, y: 100 },
        properties: { color: '#f59e0b' }
      },
      {
        id: 'authorized',
        position: { x: 300, y: 100 },
        properties: { color: '#3b82f6' }
      },
      {
        id: 'captured',
        position: { x: 500, y: 100 },
        properties: { color: '#10b981' }
      },
      {
        id: 'failed',
        position: { x: 300, y: 250 },
        properties: { color: '#ef4444' }
      },
      {
        id: 'refunded',
        position: { x: 500, y: 250 },
        properties: { color: '#6b7280' }
      }
    ],
    transitions: [
      { id: 'initiated-to-authorized' },
      { id: 'authorized-to-captured' },
      { id: 'initiated-to-failed' },
      { id: 'captured-to-refunded' }
    ]
  }
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockApiService {
  static async getEntities(): Promise<EntitiesResponse> {
    await delay(500);
    return {
      data: mockEntities,
      success: true,
      message: 'Entities retrieved successfully'
    };
  }

  static async getWorkflows(entityId: string): Promise<WorkflowsResponse> {
    await delay(300);
    const workflows = mockWorkflows[entityId] || [];
    return {
      data: workflows,
      success: true,
      message: `Workflows for entity ${entityId} retrieved successfully`
    };
  }

  // Get workflow configuration (functional specification)
  static async getWorkflowConfiguration(_entityId: string, workflowId: string): Promise<WorkflowConfigurationResponse> {
    await delay(400);
    const configuration = mockWorkflowConfigurations[workflowId];

    if (!configuration) {
      return {
        data: {} as WorkflowConfiguration,
        success: false,
        message: `Workflow configuration ${workflowId} not found`
      };
    }

    return {
      data: configuration,
      success: true,
      message: `Workflow configuration ${workflowId} retrieved successfully`
    };
  }

  // Get canvas layout (visual/positional data)
  static async getCanvasLayout(_entityId: string, workflowId: string): Promise<CanvasLayoutResponse> {
    await delay(300);
    const layout = mockCanvasLayouts[workflowId];

    if (!layout) {
      return {
        data: {} as CanvasLayout,
        success: false,
        message: `Canvas layout ${workflowId} not found`
      };
    }

    return {
      data: layout,
      success: true,
      message: `Canvas layout ${workflowId} retrieved successfully`
    };
  }

  // Get both workflow configuration and canvas layout together
  static async getWorkflowWithLayout(_entityId: string, workflowId: string): Promise<WorkflowWithLayoutResponse> {
    await delay(500);
    const configuration = mockWorkflowConfigurations[workflowId];
    const layout = mockCanvasLayouts[workflowId];

    if (!configuration || !layout) {
      return {
        data: { configuration: {} as WorkflowConfiguration, layout: {} as CanvasLayout },
        success: false,
        message: `Workflow ${workflowId} not found`
      };
    }

    return {
      data: { configuration, layout },
      success: true,
      message: `Workflow ${workflowId} retrieved successfully`
    };
  }

  // Update workflow configuration
  static async updateWorkflowConfiguration(_entityId: string, configuration: WorkflowConfiguration): Promise<WorkflowConfigurationResponse> {
    await delay(600);

    // Update the mock data
    mockWorkflowConfigurations[configuration.id] = {
      ...configuration,
      updatedAt: new Date().toISOString()
    };

    return {
      data: mockWorkflowConfigurations[configuration.id],
      success: true,
      message: `Workflow configuration ${configuration.id} updated successfully`
    };
  }

  // Update canvas layout
  static async updateCanvasLayout(_entityId: string, layout: CanvasLayout): Promise<CanvasLayoutResponse> {
    await delay(400);

    // Update the mock data
    mockCanvasLayouts[layout.workflowId] = {
      ...layout,
      updatedAt: new Date().toISOString()
    };

    return {
      data: mockCanvasLayouts[layout.workflowId],
      success: true,
      message: `Canvas layout ${layout.workflowId} updated successfully`
    };
  }
}

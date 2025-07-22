import type {
  Entity,
  Workflow,
  WorkflowSummary,
  EntitiesResponse,
  WorkflowResponse,
  WorkflowsResponse
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

const mockWorkflowDetails: Record<string, Workflow> = {
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
        position: { x: 100, y: 100 },
        isInitial: true,
        properties: { color: '#fbbf24' }
      },
      {
        id: 'email-sent',
        name: 'Email Sent',
        description: 'Verification email has been sent',
        position: { x: 300, y: 100 },
        properties: { color: '#60a5fa' }
      },
      {
        id: 'verified',
        name: 'Verified',
        description: 'Email has been verified',
        position: { x: 500, y: 100 },
        properties: { color: '#34d399' }
      },
      {
        id: 'failed',
        name: 'Failed',
        description: 'Registration failed',
        position: { x: 300, y: 250 },
        isFinal: true,
        properties: { color: '#f87171' }
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
        position: { x: 100, y: 100 },
        isInitial: true,
        properties: { color: '#f59e0b' }
      },
      {
        id: 'verification-sent',
        name: 'Verification Sent',
        description: 'Verification email has been sent',
        position: { x: 350, y: 100 },
        properties: { color: '#3b82f6' }
      },
      {
        id: 'verified',
        name: 'Verified',
        description: 'User account is verified',
        position: { x: 600, y: 100 },
        isFinal: true,
        properties: { color: '#10b981' }
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
        position: { x: 100, y: 100 },
        isInitial: true,
        properties: { color: '#f59e0b' }
      },
      {
        id: 'processing',
        name: 'Processing',
        description: 'Order is being processed',
        position: { x: 300, y: 100 },
        properties: { color: '#3b82f6' }
      },
      {
        id: 'shipped',
        name: 'Shipped',
        description: 'Order has been shipped',
        position: { x: 500, y: 100 },
        properties: { color: '#8b5cf6' }
      },
      {
        id: 'delivered',
        name: 'Delivered',
        description: 'Order has been delivered',
        position: { x: 700, y: 100 },
        isFinal: true,
        properties: { color: '#10b981' }
      },
      {
        id: 'cancelled',
        name: 'Cancelled',
        description: 'Order was cancelled',
        position: { x: 300, y: 250 },
        isFinal: true,
        properties: { color: '#ef4444' }
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
        position: { x: 100, y: 100 },
        isInitial: true,
        properties: { color: '#f59e0b' }
      },
      {
        id: 'authorized',
        name: 'Authorized',
        description: 'Payment has been authorized',
        position: { x: 300, y: 100 },
        properties: { color: '#3b82f6' }
      },
      {
        id: 'captured',
        name: 'Captured',
        description: 'Payment has been captured',
        position: { x: 500, y: 100 },
        isFinal: true,
        properties: { color: '#10b981' }
      },
      {
        id: 'failed',
        name: 'Failed',
        description: 'Payment failed',
        position: { x: 300, y: 250 },
        isFinal: true,
        properties: { color: '#ef4444' }
      },
      {
        id: 'refunded',
        name: 'Refunded',
        description: 'Payment has been refunded',
        position: { x: 500, y: 250 },
        isFinal: true,
        properties: { color: '#6b7280' }
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

  static async getWorkflow(_entityId: string, workflowId: string): Promise<WorkflowResponse> {
    await delay(400);
    const workflow = mockWorkflowDetails[workflowId];
    
    if (!workflow) {
      return {
        data: {} as Workflow,
        success: false,
        message: `Workflow ${workflowId} not found`
      };
    }

    return {
      data: workflow,
      success: true,
      message: `Workflow ${workflowId} retrieved successfully`
    };
  }

  static async updateWorkflow(_entityId: string, workflow: Workflow): Promise<WorkflowResponse> {
    await delay(600);
    
    // Update the mock data
    mockWorkflowDetails[workflow.id] = {
      ...workflow,
      updatedAt: new Date().toISOString()
    };

    return {
      data: mockWorkflowDetails[workflow.id],
      success: true,
      message: `Workflow ${workflow.id} updated successfully`
    };
  }
}

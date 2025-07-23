import '@testing-library/jest-dom'
import React from 'react'

// Mock React Flow
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'react-flow' }, children),
  Background: () => React.createElement('div', { 'data-testid': 'react-flow-background' }),
  Controls: ({ children }: { children?: React.ReactNode }) => React.createElement('div', { 'data-testid': 'react-flow-controls' }, children),
  ControlButton: ({ children, onClick, disabled, title }: any) => React.createElement('button', {
    onClick,
    disabled,
    title,
    'data-testid': 'control-button'
  }, children),
  MiniMap: () => React.createElement('div', { 'data-testid': 'react-flow-minimap' }),
  Panel: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'react-flow-panel' }, children),
  Handle: () => React.createElement('div', { 'data-testid': 'react-flow-handle' }),
  Position: {
    Left: 'left',
    Right: 'right',
    Top: 'top',
    Bottom: 'bottom',
  },
  ConnectionMode: {
    Loose: 'loose',
  },
  useNodesState: () => [[], () => {}, () => {}],
  useEdgesState: () => [[], () => {}, () => {}],
  getBezierPath: () => ['M 0 0 L 100 100', 50, 50],
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'edge-label-renderer' }, children),
  BaseEdge: () => React.createElement('path', { 'data-testid': 'base-edge' }),
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'react-flow-provider' }, children),
  useReactFlow: () => ({
    screenToFlowPosition: vi.fn((pos) => ({ x: pos.x - 100, y: pos.y - 50 }))
  }),
}))

// Mock file operations
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mocked-url'),
    revokeObjectURL: vi.fn(),
  },
})

// Mock document.createElement for file operations
const originalCreateElement = document.createElement
document.createElement = vi.fn((tagName: string) => {
  if (tagName === 'a') {
    return {
      ...originalCreateElement.call(document, tagName),
      click: vi.fn(),
      setAttribute: vi.fn(),
    }
  }
  if (tagName === 'input') {
    return {
      ...originalCreateElement.call(document, tagName),
      click: vi.fn(),
    }
  }
  return originalCreateElement.call(document, tagName)
})

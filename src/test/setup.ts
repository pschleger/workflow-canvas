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
  Handle: ({ type, position, id }: any) => React.createElement('div', {
    'data-testid': 'react-flow-handle',
    'data-type': type,
    'data-position': position,
    'data-id': id
  }),
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
  getSmoothStepPath: () => ['M 0 0 L 100 100', 50, 50],
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'edge-label-renderer' }, children),
  BaseEdge: ({ path }: any) => React.createElement('path', { 'data-testid': 'base-edge', d: path }),
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'react-flow-provider' }, children),
  useReactFlow: () => ({
    screenToFlowPosition: vi.fn((pos) => ({ x: pos.x - 100, y: pos.y - 50 })),
    getNodes: vi.fn(() => []),
    getEdges: vi.fn(() => []),
    setNodes: vi.fn(),
    setEdges: vi.fn(),
    addNodes: vi.fn(),
    addEdges: vi.fn(),
    deleteElements: vi.fn(),
    fitView: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    zoomTo: vi.fn(),
    getZoom: vi.fn(() => 1),
    setCenter: vi.fn(),
    getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
    setViewport: vi.fn(),
    project: vi.fn((pos) => pos),
    flowToScreenPosition: vi.fn((pos) => pos)
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

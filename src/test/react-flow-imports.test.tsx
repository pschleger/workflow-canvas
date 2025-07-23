// ABOUTME: Test to verify React Flow imports are working correctly
// and identify any missing exports that might cause blank screen issues.

import { describe, it, expect } from 'vitest'

describe('React Flow Imports', () => {
  it('should be able to import all required React Flow components', async () => {
    // Test importing React Flow components one by one to identify which one fails
    try {
      const { ReactFlow } = await import('@xyflow/react')
      expect(ReactFlow).toBeDefined()
      console.log('✓ ReactFlow imported successfully')
    } catch (error) {
      console.error('✗ ReactFlow import failed:', error)
      throw error
    }

    try {
      const { Background } = await import('@xyflow/react')
      expect(Background).toBeDefined()
      console.log('✓ Background imported successfully')
    } catch (error) {
      console.error('✗ Background import failed:', error)
      throw error
    }

    try {
      const { Controls } = await import('@xyflow/react')
      expect(Controls).toBeDefined()
      console.log('✓ Controls imported successfully')
    } catch (error) {
      console.error('✗ Controls import failed:', error)
      throw error
    }

    try {
      const { ControlButton } = await import('@xyflow/react')
      expect(ControlButton).toBeDefined()
      console.log('✓ ControlButton imported successfully')
    } catch (error) {
      console.error('✗ ControlButton import failed:', error)
      console.log('This is likely the cause of the blank screen issue!')
      throw error
    }

    try {
      const { MiniMap } = await import('@xyflow/react')
      expect(MiniMap).toBeDefined()
      console.log('✓ MiniMap imported successfully')
    } catch (error) {
      console.error('✗ MiniMap import failed:', error)
      throw error
    }

    try {
      const { useNodesState, useEdgesState } = await import('@xyflow/react')
      expect(useNodesState).toBeDefined()
      expect(useEdgesState).toBeDefined()
      console.log('✓ useNodesState and useEdgesState imported successfully')
    } catch (error) {
      console.error('✗ useNodesState/useEdgesState import failed:', error)
      throw error
    }

    try {
      const { ConnectionMode } = await import('@xyflow/react')
      expect(ConnectionMode).toBeDefined()
      console.log('✓ ConnectionMode imported successfully')
    } catch (error) {
      console.error('✗ ConnectionMode import failed:', error)
      throw error
    }

    try {
      const { Panel } = await import('@xyflow/react')
      expect(Panel).toBeDefined()
      console.log('✓ Panel imported successfully')
    } catch (error) {
      console.error('✗ Panel import failed:', error)
      throw error
    }

    try {
      const { useReactFlow } = await import('@xyflow/react')
      expect(useReactFlow).toBeDefined()
      console.log('✓ useReactFlow imported successfully')
    } catch (error) {
      console.error('✗ useReactFlow import failed:', error)
      throw error
    }

    try {
      const { ReactFlowProvider } = await import('@xyflow/react')
      expect(ReactFlowProvider).toBeDefined()
      console.log('✓ ReactFlowProvider imported successfully')
    } catch (error) {
      console.error('✗ ReactFlowProvider import failed:', error)
      throw error
    }

    // useStore is not available in @xyflow/react v12.8.1, so we skip this test
    console.log('ℹ useStore is not available in this version of @xyflow/react (skipped)')
  })

  it('should list all available exports from @xyflow/react', async () => {
    const reactFlowModule = await import('@xyflow/react')
    const exports = Object.keys(reactFlowModule)
    
    console.log('Available exports from @xyflow/react:')
    exports.sort().forEach(exportName => {
      console.log(`  - ${exportName}`)
    })

    // Check if ControlButton is in the exports
    const hasControlButton = exports.includes('ControlButton')
    console.log(`ControlButton available: ${hasControlButton}`)
    
    if (!hasControlButton) {
      console.log('❌ ControlButton is NOT available in @xyflow/react exports!')
      console.log('This is the root cause of the blank screen issue.')
    }
  })
})

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Edit, Play, Square } from 'lucide-react';
import type { UIStateData } from '../../types/workflow';
import { InlineNameEditor } from '../Editors/InlineNameEditor';

// ABOUTME: This file contains the StateNode component that renders individual workflow states
// with 8 anchor points for flexible connection routing and support for loop-back transitions.

interface StateNodeData {
  label: string;
  state: UIStateData;
  onNameChange: (stateId: string, newName: string) => void;
}

// Define anchor point identifiers for the 8-point system
type AnchorPoint =
  | 'top-left' | 'top-center' | 'top-right'
  | 'left-center' | 'right-center'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

// Anchor point configuration with positions and CSS styles
const ANCHOR_POINTS: Record<AnchorPoint, {
  position: Position;
  style: React.CSSProperties;
  className: string;
}> = {
  'top-left': {
    position: Position.Top,
    style: { left: '25%', top: '-6px' },
    className: 'transform -translate-x-1/2'
  },
  'top-center': {
    position: Position.Top,
    style: { left: '50%', top: '-6px' },
    className: 'transform -translate-x-1/2'
  },
  'top-right': {
    position: Position.Top,
    style: { left: '75%', top: '-6px' },
    className: 'transform -translate-x-1/2'
  },
  'left-center': {
    position: Position.Left,
    style: { left: '-6px', top: '50%' },
    className: 'transform -translate-y-1/2'
  },
  'right-center': {
    position: Position.Right,
    style: { right: '-6px', top: '50%' },
    className: 'transform -translate-y-1/2'
  },
  'bottom-left': {
    position: Position.Bottom,
    style: { left: '25%', bottom: '-6px' },
    className: 'transform -translate-x-1/2'
  },
  'bottom-center': {
    position: Position.Bottom,
    style: { left: '50%', bottom: '-6px' },
    className: 'transform -translate-x-1/2'
  },
  'bottom-right': {
    position: Position.Bottom,
    style: { left: '75%', bottom: '-6px' },
    className: 'transform -translate-x-1/2'
  }
};

export const StateNode: React.FC<NodeProps> = ({ data, selected }) => {
  const { state, onNameChange } = data as unknown as StateNodeData;

  const handleNameChange = (newName: string) => {
    onNameChange(state.id, newName);
  };

  // Render anchor point handles with logical directional types
  const renderAnchorPoint = (anchorId: AnchorPoint) => {
    const config = ANCHOR_POINTS[anchorId];

    // Determine handle types based on position:
    // Top and Left = Target handles (incoming connections)
    // Bottom and Right = Source handles (outgoing connections)
    const isSourcePosition = config.position === Position.Bottom || config.position === Position.Right;
    const isTargetPosition = config.position === Position.Top || config.position === Position.Left;

    return (
      <React.Fragment key={anchorId}>
        {/* Render source handle for bottom and right positions */}
        {isSourcePosition && (
          <Handle
            type="source"
            position={config.position}
            id={`${anchorId}-source`}
            style={config.style}
            className={`w-3 h-3 !bg-blue-500 !border-2 !border-white dark:!border-gray-800 opacity-60 hover:opacity-100 hover:scale-110 transition-all duration-200 ${config.className}`}
          />
        )}

        {/* Render target handle for top and left positions */}
        {isTargetPosition && (
          <Handle
            type="target"
            position={config.position}
            id={`${anchorId}-target`}
            style={config.style}
            className={`w-3 h-3 !bg-green-500 !border-2 !border-white dark:!border-gray-800 opacity-60 hover:opacity-100 hover:scale-110 transition-all duration-200 ${config.className}`}
          />
        )}
      </React.Fragment>
    );
  };

  const getNodeStyle = () => {
    let baseClasses = "px-3 py-2 rounded-lg border-2 bg-white dark:bg-gray-800 shadow-md transition-all duration-200 min-w-[100px] relative";

    if (selected) {
      baseClasses += " ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-800";
    }

    if (state.isInitial) {
      baseClasses += " border-green-500 bg-green-50 dark:bg-green-900/20";
    } else if (state.isFinal) {
      baseClasses += " border-red-500 bg-red-50 dark:bg-red-900/20";
    } else {
      baseClasses += " border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500";
    }

    return baseClasses;
  };

  const getIconColor = () => {
    if (state.isInitial) return "text-green-600 dark:text-green-400";
    if (state.isFinal) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className={getNodeStyle()}>
      {/* Render all 8 anchor points */}
      {(Object.keys(ANCHOR_POINTS) as AnchorPoint[]).map(renderAnchorPoint)}

      {/* Node Content */}
      <div className="flex items-center space-x-2">
        {/* State Type Icon */}
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          {state.isInitial ? (
            <Play size={14} fill="currentColor" />
          ) : state.isFinal ? (
            <Square size={14} fill="currentColor" />
          ) : (
            <div className="w-3 h-3 rounded-full border-2 border-current" />
          )}
        </div>

        {/* State Name with Inline Editing */}
        <div className="flex-1 min-w-0">
          <InlineNameEditor
            value={state.name}
            onSave={handleNameChange}
            className="min-w-0"
            inputClassName="text-sm font-medium"
          />
        </div>
      </div>
    </div>
  );
};

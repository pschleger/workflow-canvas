import React, { useState } from 'react';
import {
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { Edit, Move, RotateCcw } from 'lucide-react';
import type { UITransitionData } from '../../types/workflow';

// ABOUTME: This file contains the LoopbackEdge component that renders self-connecting transitions
// with curved paths that loop around the state node for clear visual distinction.

interface LoopbackEdgeData {
  transition: UITransitionData;
  onEdit: (transitionId: string) => void;
  onUpdate: (transition: UITransitionData) => void;
  isLoopback: boolean;
}

export const LoopbackEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}) => {
  const { transition, onEdit, onUpdate } = (data as unknown as LoopbackEdgeData) || {};
  const [isDragging, setIsDragging] = useState(false);

  // Initialize drag offset from stored label position
  const [dragOffset, setDragOffset] = useState(() => {
    return transition?.labelPosition || { x: 0, y: -60 }; // Default position above the node
  });

  // Update drag offset when transition changes
  React.useEffect(() => {
    if (transition?.labelPosition) {
      setDragOffset(transition.labelPosition);
    } else {
      setDragOffset({ x: 0, y: -60 });
    }
  }, [transition?.id, transition?.labelPosition]);

  // Calculate actual handle positions based on handle IDs
  const getHandlePosition = (handleId: string | null, centerX: number, centerY: number) => {
    if (!handleId) return { x: centerX, y: centerY };

    const nodeWidth = 120; // StateNode width
    const nodeHeight = 60; // StateNode height
    const handleOffset = 12; // Distance from node edge

    if (handleId.includes('top-left')) return { x: centerX - nodeWidth/2, y: centerY - nodeHeight/2 - handleOffset };
    if (handleId.includes('top-center')) return { x: centerX, y: centerY - nodeHeight/2 - handleOffset };
    if (handleId.includes('top-right')) return { x: centerX + nodeWidth/2, y: centerY - nodeHeight/2 - handleOffset };
    if (handleId.includes('left-center')) return { x: centerX - nodeWidth/2 - handleOffset, y: centerY };
    if (handleId.includes('right-center')) return { x: centerX + nodeWidth/2 + handleOffset, y: centerY };
    if (handleId.includes('bottom-left')) return { x: centerX - nodeWidth/2, y: centerY + nodeHeight/2 + handleOffset };
    if (handleId.includes('bottom-center')) return { x: centerX, y: centerY + nodeHeight/2 + handleOffset };
    if (handleId.includes('bottom-right')) return { x: centerX + nodeWidth/2, y: centerY + nodeHeight/2 + handleOffset };

    return { x: centerX, y: centerY };
  };

  // Create a curved loop path for self-connections
  const createLoopPath = () => {
    // Calculate actual handle positions
    const sourceHandlePos = getHandlePosition(transition?.sourceHandle, sourceX, sourceY);
    const targetHandlePos = getHandlePosition(transition?.targetHandle, sourceX, sourceY);

    // Calculate loop parameters
    const loopSize = 40; // Size of the loop
    const offsetX = dragOffset.x;
    const offsetY = dragOffset.y;

    // Use actual handle positions as start and end points
    const startX = sourceHandlePos.x;
    const startY = sourceHandlePos.y;
    const endX = targetHandlePos.x;
    const endY = targetHandlePos.y;

    // Calculate control points for a smooth loop between the handles
    const midX = (startX + endX) / 2 + offsetX;
    const midY = (startY + endY) / 2 + offsetY;

    // Create control points that form a nice loop
    const controlPoint1X = midX + loopSize;
    const controlPoint1Y = midY - loopSize;
    const controlPoint2X = midX + loopSize;
    const controlPoint2Y = midY + loopSize;

    // Create the loop path using cubic bezier curves
    const path = `M ${startX},${startY}
                  C ${controlPoint1X},${controlPoint1Y}
                    ${controlPoint2X},${controlPoint2Y}
                    ${endX},${endY}`;

    return {
      path,
      labelX: midX + offsetX,
      labelY: midY + offsetY - 20 // Offset label above the loop
    };
  };

  const { path: edgePath, labelX, labelY } = createLoopPath();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (transition && onEdit) {
      onEdit(transition.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleEdit(e);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only handle click if we're not dragging and it's not on a button
    if (!isDragging && !(e.target as HTMLElement).closest('button')) {
      e.stopPropagation();
      // Single click could also trigger edit for better UX
      // handleEdit(e);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start dragging on double-click
    if (e.detail === 2) {
      return;
    }

    e.stopPropagation();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startOffset = { ...dragOffset };
    let hasMoved = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Only consider it a drag if moved more than a few pixels
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        hasMoved = true;
      }

      const newOffset = {
        x: startOffset.x + deltaX,
        y: startOffset.y + deltaY
      };

      setDragOffset(newOffset);
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      // Only update if there was actual movement
      if (hasMoved && transition && onUpdate) {
        // Only update the label position, preserve the user's chosen handles
        const updatedTransition = {
          ...transition,
          labelPosition: dragOffset
        };
        onUpdate(updatedTransition);
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };



  const resetLabelPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultOffset = { x: 0, y: -60 };
    setDragOffset(defaultOffset);
    
    if (transition && onUpdate) {
      const updatedTransition = {
        ...transition,
        labelPosition: defaultOffset
      };
      onUpdate(updatedTransition);
    }
  };

  return (
    <>
      <BaseEdge
        id={id as string}
        path={edgePath}
        className={`transition-all duration-200 ${
          selected 
            ? 'stroke-purple-500 stroke-2' 
            : 'stroke-purple-400 dark:stroke-purple-500 hover:stroke-purple-600'
        }`}
        markerEnd="url(#arrow)"
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          className="nodrag nopan"
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          <div
            className={`bg-purple-50 dark:bg-purple-900/20 border rounded-full shadow-md px-3 py-1.5 text-sm transition-all duration-200 ${
              selected
                ? 'border-purple-500 ring-2 ring-purple-500 ring-opacity-20 bg-purple-100 dark:bg-purple-800/30'
                : 'border-purple-200 dark:border-purple-700 hover:border-purple-400 hover:bg-purple-100 dark:hover:bg-purple-800/30'
            } ${isDragging ? 'shadow-xl scale-105' : ''}`}
          >
            <div className="flex items-center space-x-2">
              {/* Drag Handle */}
              <div className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Move size={10} />
              </div>
              
              {/* Loop Icon */}
              <div className="flex-shrink-0 text-purple-600 dark:text-purple-400">
                <RotateCcw size={12} />
              </div>
              
              {/* Transition Name */}
              <span className="text-gray-700 dark:text-gray-200 font-medium">
                {transition?.definition?.name || 'Loop-back'}
              </span>
              
              {/* Edit Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleEdit(e);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation(); // Prevent drag from starting
                }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                title="Edit transition"
              >
                <Edit size={10} />
              </button>
              
              {/* Reset Position Button */}
              <button
                onClick={resetLabelPosition}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Reset label position"
              >
                <RotateCcw size={10} />
              </button>
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

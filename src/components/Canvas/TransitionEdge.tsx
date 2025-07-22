import React, { useState } from 'react';
import {
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { Edit, Filter, Zap, Move, RotateCcw } from 'lucide-react';
import type { UITransitionData } from '../../types/workflow';

interface TransitionEdgeData {
  transition: UITransitionData;
  onEdit: (transitionId: string) => void;
  onUpdate: (transition: UITransitionData) => void;
}

export const TransitionEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) => {
  const { transition, onEdit, onUpdate } = (data as unknown as TransitionEdgeData) || {};
  const [isDragging, setIsDragging] = useState(false);



  // Initialize drag offset from stored label position
  const [dragOffset, setDragOffset] = useState(() => {
    return transition?.labelPosition || { x: 0, y: 0 };
  });

  // Update drag offset when transition changes (e.g., switching workflows)
  React.useEffect(() => {
    if (transition?.labelPosition) {
      setDragOffset(transition.labelPosition);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  }, [transition?.id, transition?.labelPosition]);

  // Calculate edge path - if label is significantly moved, create a custom path
  const shouldUseBentPath = Math.abs(dragOffset.x) > 50 || Math.abs(dragOffset.y) > 50;

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (shouldUseBentPath) {
    // Create a custom bezier path that goes through the label position
    const midX = (sourceX + targetX) / 2 + dragOffset.x;
    const midY = (sourceY + targetY) / 2 + dragOffset.y;

    // Create a path that bends toward the label position
    const controlPoint1X = sourceX + (midX - sourceX) * 0.5;
    const controlPoint1Y = sourceY + (midY - sourceY) * 0.5;
    const controlPoint2X = targetX + (midX - targetX) * 0.5;
    const controlPoint2Y = targetY + (midY - targetY) * 0.5;

    edgePath = `M ${sourceX},${sourceY} C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${targetX},${targetY}`;
    labelX = midX;
    labelY = midY;
  } else {
    // Use standard bezier path
    const [standardPath, standardLabelX, standardLabelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    edgePath = standardPath;
    labelX = standardLabelX + dragOffset.x;
    labelY = standardLabelY + dragOffset.y;
  }

  // Final label position
  const finalLabelX = labelX;
  const finalLabelY = labelY;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (transition && onEdit) {
      onEdit(transition.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (transition && onEdit) {
      onEdit(transition.id);
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
    const startOffsetX = dragOffset.x;
    const startOffsetY = dragOffset.y;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      setDragOffset({
        x: startOffsetX + deltaX,
        y: startOffsetY + deltaY,
      });
    };

    const handleMouseUp = (finalEvent: MouseEvent) => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Calculate final position
      const finalOffset = {
        x: startOffsetX + (finalEvent.clientX - startX),
        y: startOffsetY + (finalEvent.clientY - startY),
      };

      // Update local state immediately to prevent spring-back
      setDragOffset(finalOffset);

      // Save the new label position to the transition
      if (transition && onUpdate) {
        const updatedTransition = {
          ...transition,
          labelPosition: finalOffset,
        };
        onUpdate(updatedTransition);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Reset to default position
    setDragOffset({ x: 0, y: 0 });

    // Update the transition to remove custom label position
    if (transition && onUpdate) {
      const updatedTransition = {
        ...transition,
        labelPosition: undefined,
      };
      onUpdate(updatedTransition);
    }
  };

  if (!transition) {
    return <BaseEdge id={id as string} path={edgePath} />;
  }

  const hasCriterion = transition.definition.criterion !== undefined;
  const hasProcessors = transition.definition.processors && transition.definition.processors.length > 0;

  return (
    <>
      <BaseEdge
        id={id as string}
        path={edgePath}
        className={`transition-all duration-200 ${
          selected 
            ? 'stroke-blue-500 stroke-2' 
            : 'stroke-gray-400 dark:stroke-gray-500 hover:stroke-blue-400'
        }`}
        markerEnd="url(#arrow)"
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${finalLabelX}px,${finalLabelY}px)`,
            pointerEvents: 'all',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          className="nodrag nopan"
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        >
          <div
            className={`bg-white dark:bg-gray-800 border rounded-lg shadow-lg px-3 py-2 text-sm transition-all duration-200 ${
              selected
                ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20'
                : 'border-gray-200 dark:border-gray-600 hover:border-blue-400'
            } ${isDragging ? 'shadow-xl scale-105' : ''} ${
              shouldUseBentPath ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' : ''
            }`}
          >
            <div className="flex items-center space-x-2">
              {/* Drag Handle */}
              <div className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Move size={12} />
              </div>

              {/* Transition Name */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {transition.definition.name || 'Unnamed Transition'}
                </div>

                {/* Indicators */}
                <div className="flex items-center space-x-2 mt-1">
                  {hasCriterion && (
                    <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                      <Filter size={12} />
                      <span>Criterion</span>
                    </div>
                  )}

                  {hasProcessors && (
                    <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                      <Zap size={12} />
                      <span>{transition.definition.processors!.length}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reset Button (only show if label is moved) */}
              {shouldUseBentPath && (
                <button
                  onClick={handleReset}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Reset label position"
                >
                  <RotateCcw size={12} />
                </button>
              )}

              {/* Edit Button */}
              <button
                onClick={handleEdit}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Edit transition"
              >
                <Edit size={12} />
              </button>
            </div>

            {/* Criterion Preview */}
            {hasCriterion && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="truncate">
                  Criterion: {transition.definition.criterion!.type}
                </div>
              </div>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>

      {/* Custom arrow marker */}
      <defs>
        <marker
          id="arrow"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill={selected ? '#3b82f6' : '#9ca3af'}
            className="transition-colors duration-200"
          />
        </marker>
      </defs>
    </>
  );
};

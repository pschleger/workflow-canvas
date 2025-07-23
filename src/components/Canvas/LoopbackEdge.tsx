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
    return transition?.labelPosition || { x: 30, y: -30 }; // Default position to the right and above
  });

  // Update drag offset when transition changes
  React.useEffect(() => {
    if (transition?.labelPosition) {
      setDragOffset(transition.labelPosition);
    } else {
      setDragOffset({ x: 30, y: -30 });
    }
  }, [transition?.id, transition?.labelPosition]);

  // Helper function to get handle direction based on handle ID
  const getHandleDirection = (handleId: string | null): { x: number; y: number } => {
    if (!handleId) return { x: 0, y: 0 };

    // Extract position from handle ID (remove -source/-target suffix)
    const position = handleId.replace(/-source$|-target$/, '');

    // Map handle positions to tangent directions
    switch (position) {
      case 'top-left':
      case 'top-center':
      case 'top-right':
        return { x: 0, y: -1 }; // Upward direction
      case 'bottom-left':
      case 'bottom-center':
      case 'bottom-right':
        return { x: 0, y: 1 }; // Downward direction
      case 'left-center':
        return { x: -1, y: 0 }; // Leftward direction
      case 'right-center':
        return { x: 1, y: 0 }; // Rightward direction
      default:
        return { x: 0, y: 0 };
    }
  };

  // Create a curved loop path for self-connections
  const createLoopPath = () => {
    // React Flow provides the actual handle coordinates directly
    const startX = sourceX;
    const startY = sourceY;
    const endX = targetX;
    const endY = targetY;

    // Get handle directions for proper tangent angles
    const sourceDirection = getHandleDirection(transition?.sourceHandle);
    const targetDirection = getHandleDirection(transition?.targetHandle);

    // Calculate the base position for the loop (midpoint between handles)
    const baseMidX = (startX + endX) / 2;
    const baseMidY = (startY + endY) / 2;

    // Apply user's drag offset to the loop position
    const loopCenterX = baseMidX + dragOffset.x;
    const loopCenterY = baseMidY + dragOffset.y;

    // Calculate loop size based on distance between handles and drag offset
    const handleDistance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const baseLoopSize = Math.max(60, handleDistance * 1.5); // Ensure minimum size for visibility
    const dragDistance = Math.sqrt(dragOffset.x * dragOffset.x + dragOffset.y * dragOffset.y);
    const loopSize = baseLoopSize + dragDistance * 0.5;

    // Create control points that respect handle directions
    // Control point 1: extends from source handle in its natural direction
    const controlPoint1Distance = loopSize * 0.8;
    const controlPoint1X = startX + sourceDirection.x * controlPoint1Distance;
    const controlPoint1Y = startY + sourceDirection.y * controlPoint1Distance;

    // Control point 2: approaches target handle from its natural direction
    const controlPoint2Distance = loopSize * 0.8;
    const controlPoint2X = endX + targetDirection.x * controlPoint2Distance;
    const controlPoint2Y = endY + targetDirection.y * controlPoint2Distance;

    // Adjust control points to create a proper loop that goes through the drag position
    // Blend the natural directions with the loop center position
    const blendFactor = 0.6;
    const finalControlPoint1X = controlPoint1X * (1 - blendFactor) + loopCenterX * blendFactor;
    const finalControlPoint1Y = controlPoint1Y * (1 - blendFactor) + loopCenterY * blendFactor;
    const finalControlPoint2X = controlPoint2X * (1 - blendFactor) + loopCenterX * blendFactor;
    const finalControlPoint2Y = controlPoint2Y * (1 - blendFactor) + loopCenterY * blendFactor;

    // Create the loop path using cubic bezier curves with proper tangent directions
    const path = `M ${startX},${startY}
                  C ${finalControlPoint1X},${finalControlPoint1Y}
                    ${finalControlPoint2X},${finalControlPoint2Y}
                    ${endX},${endY}`;

    return {
      path,
      labelX: loopCenterX,
      labelY: loopCenterY
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
    let hasMoved = false;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      // Only consider it a drag if moved more than a few pixels
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        hasMoved = true;
      }

      setDragOffset({
        x: startOffsetX + deltaX,
        y: startOffsetY + deltaY,
      });
    };

    const handleMouseUp = (finalEvent: MouseEvent) => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Only update if there was actual movement
      if (hasMoved) {
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
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };



  const resetLabelPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultOffset = { x: 30, y: -30 };
    setDragOffset(defaultOffset);

    if (transition && onUpdate) {
      const updatedTransition = {
        ...transition,
        labelPosition: defaultOffset
      };
      onUpdate(updatedTransition);
    }
  };

  // Determine if transition is manual or automated
  // If manual is undefined, treat as automated (false)
  const isManual = transition?.definition.manual === true;

  // Define colors and thickness based on manual/automated state
  const getLoopbackStyles = () => {
    const baseStrokeWidth = 1;
    const automatedStrokeWidth = baseStrokeWidth * 2; // 2x thicker for automated

    if (selected) {
      return {
        className: isManual
          ? 'stroke-gray-600 dark:stroke-gray-400'
          : 'stroke-green-500 dark:stroke-green-400',
        style: { strokeWidth: isManual ? baseStrokeWidth : automatedStrokeWidth }
      };
    }

    if (isManual) {
      // Manual transitions: thin, dark grey
      return {
        className: 'stroke-gray-600 dark:stroke-gray-400',
        style: { strokeWidth: baseStrokeWidth }
      };
    } else {
      // Automated transitions: thick, green
      return {
        className: 'stroke-green-500 dark:stroke-green-400',
        style: { strokeWidth: automatedStrokeWidth }
      };
    }
  };

  // Create unique marker ID for this loopback transition
  const markerId = `arrow-loopback-${id}`;
  const styles = getLoopbackStyles();

  return (
    <>
      <BaseEdge
        id={id as string}
        path={edgePath}
        className={`transition-all duration-200 ${styles.className}`}
        style={styles.style}
        markerEnd={`url(#${markerId})`}
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
          onDoubleClick={handleDoubleClick}
        >
          <div
            className={`${
              isManual
                ? 'bg-purple-50 dark:bg-purple-900/20' // Manual: keep purple for loopbacks
                : 'bg-green-50 dark:bg-green-900/20' // Automated: green
            } border rounded-full shadow-md px-3 py-1.5 text-sm transition-all duration-200 ${
              selected
                ? isManual
                  ? 'border-purple-500 ring-2 ring-purple-500 ring-opacity-20 bg-purple-100 dark:bg-purple-800/30'
                  : 'border-green-500 ring-2 ring-green-500 ring-opacity-20 bg-green-100 dark:bg-green-800/30'
                : isManual
                  ? 'border-purple-200 dark:border-purple-700 hover:border-purple-400 hover:bg-purple-100 dark:hover:bg-purple-800/30'
                  : 'border-green-200 dark:border-green-700 hover:border-green-400 hover:bg-green-100 dark:hover:bg-green-800/30'
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

      {/* Custom arrow marker with unique ID */}
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill={
              selected
                ? (isManual ? '#4b5563' : '#10b981') // match line colors when selected
                : isManual
                  ? '#4b5563' // dark grey for manual (gray-600)
                  : '#10b981' // green for automated (green-500)
            }
            className="transition-colors duration-200"
          />
        </marker>
      </defs>
    </>
  );
};

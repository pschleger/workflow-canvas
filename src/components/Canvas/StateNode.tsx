import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Edit, Play, Square } from 'lucide-react';
import type { WorkflowState } from '../../types/workflow';

interface StateNodeData {
  label: string;
  state: WorkflowState;
  onEdit: (state: WorkflowState) => void;
  isInitial?: boolean;
  isFinal?: boolean;
}

export const StateNode: React.FC<NodeProps> = ({ data, selected }) => {
  const { state, onEdit, isInitial, isFinal } = data as unknown as StateNodeData;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(state);
  };

  const getNodeStyle = () => {
    let baseClasses = "px-4 py-3 rounded-lg border-2 bg-white dark:bg-gray-800 shadow-lg transition-all duration-200 min-w-[120px]";
    
    if (selected) {
      baseClasses += " ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800";
    }

    if (isInitial) {
      baseClasses += " border-green-500 bg-green-50 dark:bg-green-900/20";
    } else if (isFinal) {
      baseClasses += " border-red-500 bg-red-50 dark:bg-red-900/20";
    } else {
      baseClasses += " border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500";
    }

    return baseClasses;
  };

  const getIconColor = () => {
    if (isInitial) return "text-green-600 dark:text-green-400";
    if (isFinal) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className={getNodeStyle()}>
      {/* Input Handle */}
      {!isInitial && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-blue-500 !border-2 !border-white dark:!border-gray-800"
        />
      )}

      {/* Node Content */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1">
          {/* State Type Icon */}
          <div className={`flex-shrink-0 ${getIconColor()}`}>
            {isInitial ? (
              <Play size={16} fill="currentColor" />
            ) : isFinal ? (
              <Square size={16} fill="currentColor" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-current" />
            )}
          </div>

          {/* State Name */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {state.name}
            </div>
            {state.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {state.description}
              </div>
            )}
          </div>
        </div>

        {/* Edit Button */}
        <button
          onClick={handleEdit}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Edit state"
        >
          <Edit size={14} />
        </button>
      </div>

      {/* State Properties Indicator */}
      {state.properties && Object.keys(state.properties).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(state.properties).slice(0, 3).map(([key, value]) => (
            <span
              key={key}
              className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
              title={`${key}: ${value}`}
            >
              {key}
            </span>
          ))}
          {Object.keys(state.properties).length > 3 && (
            <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
              +{Object.keys(state.properties).length - 3}
            </span>
          )}
        </div>
      )}

      {/* Output Handle */}
      {!isFinal && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-blue-500 !border-2 !border-white dark:!border-gray-800"
        />
      )}
    </div>
  );
};

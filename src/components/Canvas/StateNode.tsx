import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Edit, Play, Square } from 'lucide-react';
import type { UIStateData } from '../../types/workflow';

interface StateNodeData {
  label: string;
  state: UIStateData;
  onEdit: (stateId: string) => void;
}

export const StateNode: React.FC<NodeProps> = ({ data, selected }) => {
  const { state, onEdit } = data as unknown as StateNodeData;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(state.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(state.id);
  };

  const getNodeStyle = () => {
    let baseClasses = "px-3 py-2 rounded-lg border-2 bg-white dark:bg-gray-800 shadow-md transition-all duration-200 min-w-[100px]";

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
    <div className={getNodeStyle()} onDoubleClick={handleDoubleClick}>
      {/* Input Handle */}
      {!state.isInitial && (
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
            {state.isInitial ? (
              <Play size={14} fill="currentColor" />
            ) : state.isFinal ? (
              <Square size={14} fill="currentColor" />
            ) : (
              <div className="w-3 h-3 rounded-full border-2 border-current" />
            )}
          </div>

          {/* State Name */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
              {state.name}
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <button
          onClick={handleEdit}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Edit state"
        >
          <Edit size={12} />
        </button>
      </div>



      {/* Output Handle */}
      {!state.isFinal && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-blue-500 !border-2 !border-white dark:!border-gray-800"
        />
      )}
    </div>
  );
};

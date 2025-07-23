import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Check, AlertCircle } from 'lucide-react';
import { InlineNameEditor } from './InlineNameEditor';
import type { StateDefinition } from '../../types/workflow';

interface StateEditorProps {
  stateId: string | null;
  stateDefinition: StateDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (stateId: string, definition: StateDefinition) => void;
  onDelete?: (stateId: string) => void;
}

export const StateEditor: React.FC<StateEditorProps> = ({
  stateId,
  stateDefinition,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [stateName, setStateName] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  // Default state definition for new states
  const defaultDefinition: StateDefinition = {
    name: stateId || '',
    transitions: []
  };

  useEffect(() => {
    if (isOpen) {
      const definition = stateDefinition || defaultDefinition;
      setStateName(definition.name || stateId || '');

      try {
        setJsonText(JSON.stringify(definition, null, 2));
        setError(null);
        setIsValid(true);
      } catch (err) {
        setJsonText('{}');
        setError('Invalid data provided');
        setIsValid(false);
      }
    }
  }, [isOpen, stateDefinition, stateId]);

  const validateJson = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      setError(null);
      setIsValid(true);
      return parsed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid JSON format';
      setError(errorMessage);
      setIsValid(false);
      return null;
    }
  };

  const handleTextChange = (value: string) => {
    setJsonText(value);
    validateJson(value);
  };

  const handleSave = () => {
    const parsed = validateJson(jsonText);
    if (parsed !== null && isValid && stateId) {
      // Update the parsed definition with the name from the form field
      const updatedDefinition: StateDefinition = {
        ...parsed,
        name: stateName.trim() || stateId
      };
      onSave(stateId, updatedDefinition);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete && stateId && confirm('Are you sure you want to delete this state?')) {
      onDelete(stateId);
      onClose();
    }
  };

  if (!isOpen) return null;

  const title = stateId ? `Edit State: ${stateId}` : 'Create State';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header with Inline Name Editor */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3 flex-1">
            <span className="text-lg font-medium text-gray-900 dark:text-white">Edit State:</span>
            <InlineNameEditor
              value={stateName}
              placeholder={`State name (defaults to "${stateId}")`}
              onSave={setStateName}
              className="flex-1"
            />
            {isValid ? (
              <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                <Check size={16} />
                <span className="text-sm">Valid JSON</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                <AlertCircle size={16} />
                <span className="text-sm">Invalid JSON</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* JSON Editor */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full flex flex-col">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              State Configuration (JSON)
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              className={`flex-1 w-full p-3 border rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                error
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter JSON configuration..."
              spellCheck={false}
            />

            {error && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isValid}
              className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-md transition-colors ${
                isValid
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save size={16} />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

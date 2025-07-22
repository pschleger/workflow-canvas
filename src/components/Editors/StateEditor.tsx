import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import type { WorkflowState } from '../../types/workflow';

interface StateEditorProps {
  state: WorkflowState | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (state: WorkflowState) => void;
  onDelete?: (stateId: string) => void;
}

export const StateEditor: React.FC<StateEditorProps> = ({
  state,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState<Partial<WorkflowState>>({});
  const [propertiesJson, setPropertiesJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (state) {
      setFormData(state);
      setPropertiesJson(JSON.stringify(state.properties || {}, null, 2));
    } else {
      setFormData({
        name: '',
        description: '',
        isInitial: false,
        isFinal: false,
        properties: {}
      });
      setPropertiesJson('{}');
    }
  }, [state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      alert('State name is required');
      return;
    }

    try {
      const properties = JSON.parse(propertiesJson);
      const updatedState: WorkflowState = {
        id: state?.id || `state-${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description,
        position: state?.position || { x: 100, y: 100 },
        isInitial: formData.isInitial,
        isFinal: formData.isFinal,
        properties
      };

      onSave(updatedState);
      onClose();
      setJsonError(null);
    } catch (error) {
      setJsonError('Invalid JSON in properties field');
    }
  };

  const handlePropertiesChange = (value: string) => {
    setPropertiesJson(value);
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (error) {
      setJsonError('Invalid JSON format');
    }
  };

  const handleDelete = () => {
    if (state && onDelete && confirm('Are you sure you want to delete this state?')) {
      onDelete(state.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {state ? 'Edit State' : 'Create State'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* State Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              State Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isInitial || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, isInitial: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Initial State</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isFinal || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, isFinal: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Final State</span>
              </label>
            </div>
          </div>

          {/* Properties */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Properties (JSON)
            </label>
            <textarea
              value={propertiesJson}
              onChange={(e) => handlePropertiesChange(e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                jsonError ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder='{"color": "#blue", "priority": 1}'
            />
            {jsonError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{jsonError}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <div>
              {state && onDelete && (
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
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
              >
                <Save size={16} />
                <span>Save</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

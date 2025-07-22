import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Minus } from 'lucide-react';
import type { WorkflowTransition, TransitionCondition, TransitionAction } from '../../types/workflow';

interface TransitionEditorProps {
  transition: WorkflowTransition | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (transition: WorkflowTransition) => void;
  onDelete?: (transitionId: string) => void;
}

export const TransitionEditor: React.FC<TransitionEditorProps> = ({
  transition,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState<Partial<WorkflowTransition>>({});
  const [conditions, setConditions] = useState<TransitionCondition[]>([]);
  const [actions, setActions] = useState<TransitionAction[]>([]);

  useEffect(() => {
    if (transition) {
      setFormData(transition);
      setConditions(transition.conditions || []);
      setActions(transition.actions || []);
    } else {
      setFormData({
        name: '',
        description: ''
      });
      setConditions([]);
      setActions([]);
    }
  }, [transition]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedTransition: WorkflowTransition = {
      id: transition?.id || `transition-${Date.now()}`,
      sourceStateId: transition?.sourceStateId || '',
      targetStateId: transition?.targetStateId || '',
      name: formData.name || 'Unnamed Transition',
      description: formData.description,
      conditions: conditions.length > 0 ? conditions : undefined,
      actions: actions.length > 0 ? actions : undefined
    };
    
    onSave(updatedTransition);
    onClose();
  };

  const handleDelete = () => {
    if (transition && onDelete && confirm('Are you sure you want to delete this transition?')) {
      onDelete(transition.id);
      onClose();
    }
  };

  const addCondition = () => {
    setConditions(prev => [...prev, {
      field: '',
      operator: 'equals',
      value: ''
    }]);
  };

  const removeCondition = (index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: keyof TransitionCondition, value: any) => {
    setConditions(prev => prev.map((condition, i) => 
      i === index ? { ...condition, [field]: value } : condition
    ));
  };

  const addAction = () => {
    setActions(prev => [...prev, {
      type: 'set_field',
      parameters: {}
    }]);
  };

  const removeAction = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: keyof TransitionAction, value: any) => {
    setActions(prev => prev.map((action, i) => 
      i === index ? { ...action, [field]: value } : action
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {transition ? 'Edit Transition' : 'Create Transition'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
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
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Conditions
              </h4>
              <button
                type="button"
                onClick={addCondition}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              >
                <Plus size={12} />
                <span>Add</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <input
                    type="text"
                    placeholder="Field"
                    value={condition.field}
                    onChange={(e) => updateCondition(index, 'field', e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="equals">equals</option>
                    <option value="not_equals">not equals</option>
                    <option value="greater_than">greater than</option>
                    <option value="less_than">less than</option>
                    <option value="contains">contains</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Value"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeCondition(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Minus size={14} />
                  </button>
                </div>
              ))}
              {conditions.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  No conditions defined
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Actions
              </h4>
              <button
                type="button"
                onClick={addAction}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
              >
                <Plus size={12} />
                <span>Add</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {actions.map((action, index) => (
                <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center space-x-2 mb-2">
                    <select
                      value={action.type}
                      onChange={(e) => updateAction(index, 'type', e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="set_field">Set Field</option>
                      <option value="call_api">Call API</option>
                      <option value="send_notification">Send Notification</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeAction(index)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                  <textarea
                    placeholder="Parameters (JSON)"
                    value={JSON.stringify(action.parameters, null, 2)}
                    onChange={(e) => {
                      try {
                        const params = JSON.parse(e.target.value);
                        updateAction(index, 'parameters', params);
                      } catch {
                        // Invalid JSON, ignore for now
                      }
                    }}
                    rows={2}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                  />
                </div>
              ))}
              {actions.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  No actions defined
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              {transition && onDelete && (
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

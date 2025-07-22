import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Workflow, Database, Clock } from 'lucide-react';
import type { Entity, WorkflowSummary } from '../../types/workflow';
import { MockApiService } from '../../services/mockApi';

interface EntityWorkflowSelectorProps {
  selectedEntityId: string | null;
  selectedWorkflowId: string | null;
  onEntitySelect: (entityId: string) => void;
  onWorkflowSelect: (entityId: string, workflowId: string) => void;
}

export const EntityWorkflowSelector: React.FC<EntityWorkflowSelectorProps> = ({
  selectedEntityId,
  selectedWorkflowId,
  onEntitySelect,
  onWorkflowSelect
}) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [workflows, setWorkflows] = useState<Record<string, WorkflowSummary[]>>({});
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingWorkflows, setLoadingWorkflows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    try {
      const response = await MockApiService.getEntities();
      if (response.success) {
        setEntities(response.data);
      }
    } catch (error) {
      console.error('Failed to load entities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async (entityId: string) => {
    if (workflows[entityId]) return; // Already loaded

    setLoadingWorkflows(prev => new Set(prev).add(entityId));
    try {
      const response = await MockApiService.getWorkflows(entityId);
      if (response.success) {
        setWorkflows(prev => ({
          ...prev,
          [entityId]: response.data
        }));
      }
    } catch (error) {
      console.error(`Failed to load workflows for entity ${entityId}:`, error);
    } finally {
      setLoadingWorkflows(prev => {
        const newSet = new Set(prev);
        newSet.delete(entityId);
        return newSet;
      });
    }
  };

  const toggleEntity = async (entityId: string) => {
    const newExpanded = new Set(expandedEntities);
    
    if (newExpanded.has(entityId)) {
      newExpanded.delete(entityId);
    } else {
      newExpanded.add(entityId);
      await loadWorkflows(entityId);
    }
    
    setExpandedEntities(newExpanded);
    onEntitySelect(entityId);
  };

  const handleWorkflowSelect = (entityId: string, workflowId: string) => {
    onWorkflowSelect(entityId, workflowId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Database size={20} className="mr-2" />
        Entities & Workflows
      </h2>

      <div className="space-y-2">
        {entities.map((entity) => {
          const isExpanded = expandedEntities.has(entity.id);
          const isSelected = selectedEntityId === entity.id;
          const entityWorkflows = workflows[entity.id] || [];
          const isLoadingWorkflows = loadingWorkflows.has(entity.id);

          return (
            <div key={entity.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
              {/* Entity Header */}
              <button
                onClick={() => toggleEntity(entity.id)}
                className={`w-full p-3 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${
                  isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {entity.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {entity.workflowCount} workflow{entity.workflowCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </button>

              {/* Workflows List */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {isLoadingWorkflows ? (
                    <div className="p-3">
                      <div className="animate-pulse space-y-2">
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                      </div>
                    </div>
                  ) : entityWorkflows.length > 0 ? (
                    <div className="space-y-1 p-2">
                      {entityWorkflows.map((workflow) => (
                        <button
                          key={workflow.id}
                          onClick={() => handleWorkflowSelect(entity.id, workflow.id)}
                          className={`w-full p-2 text-left rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                            selectedWorkflowId === workflow.id
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            <Workflow size={16} className="mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{workflow.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-3">
                                <span>{workflow.stateCount} states</span>
                                <span>{workflow.transitionCount} transitions</span>
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1">
                                <Clock size={12} className="mr-1" />
                                {formatDate(workflow.updatedAt)}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No workflows found
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

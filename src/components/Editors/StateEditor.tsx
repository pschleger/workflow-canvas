import React from 'react';
import { JsonEditor } from './JsonEditor';
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
  const handleSave = (definition: StateDefinition) => {
    if (stateId) {
      onSave(stateId, definition);
    }
  };

  const handleDelete = () => {
    if (stateId && onDelete) {
      onDelete(stateId);
    }
  };

  const title = stateId ? `Edit State: ${stateId}` : 'Create State';

  // Default state definition for new states
  const defaultDefinition: StateDefinition = {
    transitions: []
  };

  return (
    <JsonEditor
      title={title}
      data={stateDefinition || defaultDefinition}
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      onDelete={onDelete ? handleDelete : undefined}
    />
  );
};

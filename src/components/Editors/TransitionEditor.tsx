import React from 'react';
import { JsonEditor } from './JsonEditor';
import type { TransitionDefinition } from '../../types/workflow';

interface TransitionEditorProps {
  transitionId: string | null;
  transitionDefinition: TransitionDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (transitionId: string, definition: TransitionDefinition) => void;
  onDelete?: (transitionId: string) => void;
}

export const TransitionEditor: React.FC<TransitionEditorProps> = ({
  transitionId,
  transitionDefinition,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const handleSave = (definition: TransitionDefinition) => {
    if (transitionId) {
      onSave(transitionId, definition);
    }
  };

  const handleDelete = () => {
    if (transitionId && onDelete) {
      onDelete(transitionId);
    }
  };

  const title = transitionId ? `Edit Transition: ${transitionId}` : 'Create Transition';

  // Default transition definition for new transitions
  const defaultDefinition: TransitionDefinition = {
    next: '',
    name: '',
    manual: false,
    disabled: false
  };

  return (
    <JsonEditor
      title={title}
      data={transitionDefinition || defaultDefinition}
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      onDelete={onDelete ? handleDelete : undefined}
    />
  );
};

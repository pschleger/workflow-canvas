// ABOUTME: This file provides utilities for generating and parsing transition IDs with proper
// escaping to handle state names that contain hyphens, preventing parsing ambiguity.

/**
 * Escapes hyphens in state names to prevent parsing conflicts
 * @param stateName The state name to escape
 * @returns The escaped state name
 */
function escapeStateName(stateName: string): string {
  return stateName.replace(/-/g, '\\-');
}

/**
 * Unescapes hyphens in state names
 * @param escapedStateName The escaped state name
 * @returns The original state name
 */
function unescapeStateName(escapedStateName: string): string {
  return escapedStateName.replace(/\\-/g, '-');
}

/**
 * Generates a transition ID with proper escaping for state names containing hyphens
 * Format: "escapedSourceState-to-escapedTargetState"
 * @param sourceStateId The source state ID
 * @param targetStateId The target state ID
 * @returns The generated transition ID
 */
export function generateTransitionId(sourceStateId: string, targetStateId: string): string {
  const escapedSource = escapeStateName(sourceStateId);
  const escapedTarget = escapeStateName(targetStateId);
  return `${escapedSource}-to-${escapedTarget}`;
}

/**
 * Parses a transition ID to extract source and target state IDs
 * Handles both old format (for backward compatibility) and new escaped format
 * @param transitionId The transition ID to parse
 * @returns Object containing sourceStateId and targetStateId, or null if parsing fails
 */
export function parseTransitionId(transitionId: string): { sourceStateId: string; targetStateId: string } | null {
  // First, try to parse the new escaped format
  const toIndex = transitionId.indexOf('-to-');
  if (toIndex !== -1) {
    const escapedSource = transitionId.substring(0, toIndex);
    const escapedTarget = transitionId.substring(toIndex + 4); // +4 for '-to-'
    
    // Unescape the state names
    const sourceStateId = unescapeStateName(escapedSource);
    const targetStateId = unescapeStateName(escapedTarget);
    
    return { sourceStateId, targetStateId };
  }
  
  return null;
}

/**
 * Validates that both states exist in the configuration
 * @param transitionId The transition ID to validate
 * @param configStateIds Set of valid state IDs from configuration
 * @returns true if both source and target states exist
 */
export function validateTransitionStates(transitionId: string, configStateIds: Set<string>): boolean {
  const parsed = parseTransitionId(transitionId);
  if (!parsed) {
    return false;
  }
  
  return configStateIds.has(parsed.sourceStateId) && configStateIds.has(parsed.targetStateId);
}

/**
 * Migrates old transition IDs to the new escaped format
 * This is useful for backward compatibility when updating existing workflows
 * @param oldTransitionId The old format transition ID
 * @param configStateIds Set of valid state IDs to help with parsing
 * @returns The new escaped format ID, or the original ID if migration fails
 */
export function migrateTransitionId(oldTransitionId: string, configStateIds: Set<string>): string {
  // If it's already in the new format, return as-is
  if (parseTransitionId(oldTransitionId)) {
    return oldTransitionId;
  }
  
  // Try to parse the old format by checking all possible combinations
  // This is more complex but handles edge cases better
  const toIndex = oldTransitionId.indexOf('-to-');
  if (toIndex !== -1) {
    const potentialSource = oldTransitionId.substring(0, toIndex);
    const potentialTarget = oldTransitionId.substring(toIndex + 4);
    
    // Check if these states exist in the configuration
    if (configStateIds.has(potentialSource) && configStateIds.has(potentialTarget)) {
      return generateTransitionId(potentialSource, potentialTarget);
    }
  }
  
  // Fallback: try to find the best match by testing different split points
  for (const stateId of configStateIds) {
    if (oldTransitionId.startsWith(stateId + '-')) {
      const remainder = oldTransitionId.substring(stateId.length + 1);
      for (const targetStateId of configStateIds) {
        if (remainder === targetStateId || remainder === `to-${targetStateId}`) {
          return generateTransitionId(stateId, targetStateId);
        }
      }
    }
  }
  
  // If we can't migrate, return the original ID
  return oldTransitionId;
}

/**
 * Checks if a transition ID is in the old format
 * @param transitionId The transition ID to check
 * @returns true if it's in the old format
 */
export function isOldFormatTransitionId(transitionId: string): boolean {
  // If parseTransitionId returns null, it's likely old format or invalid
  return parseTransitionId(transitionId) === null && transitionId.includes('-');
}

/**
 * Batch migrates multiple transition IDs
 * @param transitionIds Array of transition IDs to migrate
 * @param configStateIds Set of valid state IDs
 * @returns Array of migrated transition IDs
 */
export function batchMigrateTransitionIds(transitionIds: string[], configStateIds: Set<string>): string[] {
  return transitionIds.map(id => migrateTransitionId(id, configStateIds));
}

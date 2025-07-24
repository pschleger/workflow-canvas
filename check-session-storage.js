// Simple script to check sessionStorage in the browser console
// Run this in the browser console at http://localhost:5174

console.log('=== Session Storage Debug ===');

// Check if there's any existing history data
const historyData = sessionStorage.getItem('statemachine-ui-history');
console.log('History data:', historyData);

if (historyData) {
  try {
    const parsed = JSON.parse(historyData);
    console.log('Parsed history data:', parsed);
    
    // Check each workflow's history
    Object.keys(parsed).forEach(workflowId => {
      const history = parsed[workflowId];
      console.log(`${workflowId}:`, {
        entries: history.entries.length,
        currentIndex: history.currentIndex,
        undoCount: history.currentIndex === -1 ? Math.max(0, history.entries.length - 1) : history.currentIndex
      });
    });
  } catch (e) {
    console.error('Error parsing history data:', e);
  }
} else {
  console.log('No history data found in sessionStorage');
}

// Check all sessionStorage keys
console.log('All sessionStorage keys:', Object.keys(sessionStorage));

// === FIX FUNCTIONS ===

// Function to clear all history
function clearAllHistory() {
  sessionStorage.removeItem('statemachine-ui-history');
  console.log('✅ All history cleared');
  location.reload(); // Reload to see the changes
}

// Function to clear history for a specific workflow
function clearWorkflowHistory(workflowId) {
  const historyData = sessionStorage.getItem('statemachine-ui-history');
  if (historyData) {
    try {
      const parsed = JSON.parse(historyData);
      delete parsed[workflowId];
      sessionStorage.setItem('statemachine-ui-history', JSON.stringify(parsed));
      console.log(`✅ History cleared for workflow: ${workflowId}`);
      location.reload(); // Reload to see the changes
    } catch (e) {
      console.error('Error clearing workflow history:', e);
    }
  } else {
    console.log('No history data found');
  }
}

// === QUICK FIXES ===
console.log('\n=== Quick Fix Commands ===');
console.log('To fix the User Registration undo counter issue, run:');
console.log('clearWorkflowHistory("user-registration")');
console.log('\nTo clear all history:');
console.log('clearAllHistory()');

// Make functions available globally
window.clearAllHistory = clearAllHistory;
window.clearWorkflowHistory = clearWorkflowHistory;

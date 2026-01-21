// Background service worker for PyTutor Focus Mode extension

// Listen for keyboard command
chrome.commands.onCommand.addListener((command) => {
  console.log('[PyTutor Focus] Keyboard command received:', command);
  if (command === 'toggle-focus-mode') {
    // Query for the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];

      if (!activeTab || !activeTab.id) {
        console.error('[PyTutor Focus] No active tab found');
        return;
      }

      // Check if we're on pythontutor.com
      if (activeTab.url && activeTab.url.includes('pythontutor.com')) {
        // Send message to content script
        chrome.tabs.sendMessage(
          activeTab.id,
          { action: 'toggle-focus-mode' },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error('[PyTutor Focus] Error:', chrome.runtime.lastError.message);
            } else if (response) {
              console.log('[PyTutor Focus] Toggle successful:', response);
            }
          }
        );
      } else {
        console.log('[PyTutor Focus] Not on pythontutor.com, ignoring command');
      }
    });
  }
});

// Log when extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[PyTutor Focus] Extension installed');
  } else if (details.reason === 'update') {
    console.log('[PyTutor Focus] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

console.log('[PyTutor Focus] Background service worker initialized');

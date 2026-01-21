// Popup script to show current status and toggle focus mode
const STORAGE_KEY = 'focusModeEnabled';

let currentTab: chrome.tabs.Tab | null = null;

document.addEventListener('DOMContentLoaded', async () => {
  const statusValue = document.getElementById('statusValue');
  const toggleButton = document.getElementById('toggleButton') as HTMLButtonElement;
  const buttonText = document.getElementById('buttonText');

  if (!statusValue || !toggleButton || !buttonText) return;

  try {
    // Check if we're on pythontutor.com
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    if (tab && tab.url && tab.url.includes('pythontutor.com')) {
      toggleButton.disabled = false;

      // Get current focus mode state
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const isEnabled = result[STORAGE_KEY] || false;
        updateStatus(isEnabled, statusValue, buttonText);
      });

      // Add click handler for toggle button
      toggleButton.addEventListener('click', async () => {
        if (!currentTab || !currentTab.id) return;

        toggleButton.disabled = true;
        buttonText.textContent = 'Toggling...';

        try {
          // Send message to content script
          const response = await chrome.tabs.sendMessage(currentTab.id, {
            action: 'toggle-focus-mode'
          });

          if (response && response.success) {
            updateStatus(response.enabled, statusValue, buttonText);
          } else {
            buttonText.textContent = 'Error - Try reloading page';
            statusValue.textContent = '❌ Failed to toggle';
            statusValue.style.color = '#ef4444';
          }
        } catch (error) {
          console.error('[PyTutor Focus] Error toggling:', error);
          buttonText.textContent = 'Fix: Refresh PythonTutor Page';
          statusValue.textContent = '❌ Script not active (needs refresh)';
          statusValue.style.color = '#ef4444';
        } finally {
          setTimeout(() => {
            toggleButton.disabled = false;
          }, 300);
        }
      });
    } else {
      statusValue.textContent = '⚠️ Not on pythontutor.com';
      statusValue.style.color = '#f59e0b';
      toggleButton.disabled = true;
      buttonText.textContent = 'Only works on pythontutor.com';
    }
  } catch (error) {
    statusValue.textContent = '❌ Error checking status';
    statusValue.style.color = '#ef4444';
    console.error('[PyTutor Focus] Error:', error);
  }
});

function updateStatus(isEnabled: boolean, statusElement: HTMLElement, buttonElement: HTMLElement) {
  if (isEnabled) {
    statusElement.textContent = '✅ Focus Mode Active';
    statusElement.style.color = '#10b981';
    buttonElement.textContent = '🔓 Disable Focus Mode';
  } else {
    statusElement.textContent = '⭕ Focus Mode Inactive';
    statusElement.style.color = '#6b7280';
    buttonElement.textContent = '🎯 Enable Focus Mode';
  }
}


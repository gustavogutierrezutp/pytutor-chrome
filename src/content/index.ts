// Content script for pythontutor.com focus mode
import './styles.css';

const FOCUS_MODE_CLASS = 'pytutor-focus-mode';
const STORAGE_KEY = 'focusModeEnabled';

// Initialize focus mode state
let isFocusModeEnabled = false;

// Initialize focus mode
const initFocusMode = () => {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    isFocusModeEnabled = result[STORAGE_KEY] || false;

    // If enabled, we need to wait for body to exist
    if (isFocusModeEnabled) {
      if (document.body) {
        enableFocusMode();
      } else {
        const observer = new MutationObserver(() => {
          if (document.body) {
            enableFocusMode();
            observer.disconnect();
          }
        });
        observer.observe(document.documentElement, { childList: true });
      }
    }
    console.log('[PyTutor Focus] Content script initialized. Mode:', isFocusModeEnabled ? 'Enabled' : 'Disabled');
  });
};

initFocusMode();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'toggle-focus-mode') {
    toggleFocusMode();
    sendResponse({ success: true, enabled: isFocusModeEnabled });
  }
  return true;
});

function toggleFocusMode() {
  isFocusModeEnabled = !isFocusModeEnabled;

  if (isFocusModeEnabled) {
    enableFocusMode();
  } else {
    disableFocusMode();
  }

  // Save state to storage
  chrome.storage.local.set({ [STORAGE_KEY]: isFocusModeEnabled });
}

function enableFocusMode() {
  document.body.classList.add(FOCUS_MODE_CLASS);
  createFocusUI();
  console.log('[PyTutor Focus] Focus mode enabled - showing only #pyOutputPane');
}

function disableFocusMode() {
  document.body.classList.remove(FOCUS_MODE_CLASS);
  removeFocusUI();
  console.log('[PyTutor Focus] Focus mode disabled - showing all elements');
}

function createFocusUI() {
  removeFocusUI(); // Clean up existing if any

  const container = document.createElement('div');
  container.id = 'pytutor-focus-ui';
  container.className = 'pytutor-focus-ui';

  // Button to toggle #langDisplayDiv
  const toggleDetailsBtn = document.createElement('button');
  toggleDetailsBtn.className = 'pytutor-focus-btn';
  toggleDetailsBtn.innerHTML = '<span>👁️ Toggle Details</span>';
  toggleDetailsBtn.addEventListener('click', () => {
    const langDiv = document.getElementById('langDisplayDiv');
    const editLinkDiv = document.getElementById('editCodeLinkDiv');

    const isHidden = langDiv?.classList.toggle('pytutor-hidden-extra');
    editLinkDiv?.classList.toggle('pytutor-hidden-extra');

    toggleDetailsBtn.innerHTML = isHidden ? '<span>🙈 Show Details</span>' : '<span>👁️ Hide Details</span>';
  });

  // Button to exit focus mode
  const exitBtn = document.createElement('button');
  exitBtn.className = 'pytutor-focus-btn exit';
  exitBtn.innerHTML = '<span>🚪 Exit Focus</span>';
  exitBtn.addEventListener('click', () => {
    toggleFocusMode();
  });

  container.appendChild(toggleDetailsBtn);
  container.appendChild(exitBtn);
  document.body.appendChild(container);
}

function removeFocusUI() {
  const existing = document.getElementById('pytutor-focus-ui');
  if (existing) {
    existing.remove();
  }
}

// Export for potential use
export { toggleFocusMode };

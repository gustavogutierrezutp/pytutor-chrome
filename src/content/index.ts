import './styles.css';
import html2canvas from 'html2canvas';

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

  // Button to capture screenshot of #pyCodeOutput
  const captureBtn = document.createElement('button');
  captureBtn.className = 'pytutor-focus-btn capture';
  captureBtn.innerHTML = '<span>📸 Capture Trace</span>';
  captureBtn.title = 'Screenshot of the code panel';
  captureBtn.addEventListener('click', captureTrace);

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

  container.appendChild(captureBtn);
  container.appendChild(toggleDetailsBtn);
  container.appendChild(exitBtn);
  document.body.appendChild(container);
}

async function captureTrace() {
  const codeDisplay = document.getElementById('codeDisplayDiv');
  const dataViz = document.getElementById('dataViz');

  if (!codeDisplay || !dataViz) {
    alert('Could not find visualization elements to capture.');
    return;
  }

  // Find the closest common parent that contains both
  const target = codeDisplay.closest('tr') || codeDisplay.closest('table') || codeDisplay;

  const btn = document.querySelector('.pytutor-focus-btn.capture') as HTMLButtonElement;
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span>⏳ Capturing...</span>';

  // Noise elements to hide for a minimal clean screenshot
  const noiseSelectors = [
    '#navControlsDiv', '#executionSlider', '.executionSlider', '#editCodeLinkDiv',
    '#langDisplayDiv', '#jmpStepFwd', '#jmpPrevInstr',
    '#jmpFirstInstr', '#jmpLastInstr', '#curInstr', '#editBtn',
    '.ui-button', '#aiQuestionSelector', '#progOutputs',
    '#teacher-mode-signup', '#uiControlsPane', '#cppDetailPane',
    '#legendDiv', '#aiTutorGreetings'
  ];
  const noiseElements: { el: HTMLElement, originalDisplay: string }[] = [];

  noiseSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const htmlEl = el as HTMLElement;
      if (htmlEl) {
        // Record and hide everything matching, regardless of target nesting
        // to ensure layout collapse across the board during the capture frame.
        noiseElements.push({ el: htmlEl, originalDisplay: htmlEl.style.display });
        htmlEl.style.setProperty('display', 'none', 'important');
      }
    });
  });

  try {
    const canvas = await html2canvas(target as HTMLElement, {
      backgroundColor: '#ffffff',
      scale: 2, // High DPI
      logging: false,
      useCORS: true
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.download = `pytutor-combined-trace-${timestamp}.png`;
    link.href = dataUrl;
    link.click();

    // --- NEW: Copy to Clipboard ---
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          btn.innerHTML = '<span>✅ Captured & Copied!</span>';
        } catch (clipboardError) {
          console.error('[PyTutor Focus] Clipboard copy failed:', clipboardError);
          btn.innerHTML = '<span>✅ Captured (DL only)</span>';
        }
      }
    }, 'image/png');
  } catch (error) {
    console.error('[PyTutor Focus] Capture failed:', error);
    btn.innerHTML = '<span>❌ Failed</span>';
  } finally {
    // Restore display of noise elements
    noiseElements.forEach(({ el, originalDisplay }) => {
      if (originalDisplay) {
        el.style.setProperty('display', originalDisplay);
      } else {
        el.style.removeProperty('display');
      }
    });

    setTimeout(() => {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }, 2000);
  }
}

function removeFocusUI() {
  const existing = document.getElementById('pytutor-focus-ui');
  if (existing) {
    existing.remove();
  }
}

// Export for potential use
export { toggleFocusMode };

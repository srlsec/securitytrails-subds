// UI Elements
const statusEl = document.getElementById('status');
const warningEl = document.getElementById('warning');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const startPageInput = document.getElementById('startPage');

// Update status display
function updateStatus(message, state = 'ready') {
  statusEl.textContent = message;
  statusEl.className = `status ${state}`;
  
  if (state === 'active') {
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } else {
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

// Toggle settings panel
settingsBtn.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

// Start button handler
startBtn.addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({active: true, currentWindow: true});
  if (!tabs.length) return;
  
  const activeTab = tabs[0];
  if (!activeTab.url.includes('securitytrails.com')) {
    updateStatus('Error: Not on securitytrails.com', 'warning');
    setTimeout(() => updateStatus('Ready to start'), 2000);
    return;
  }
  
  updateStatus(`Starting from page ${startPageInput.value}...`, 'active');
  
  await chrome.runtime.sendMessage({
    action: "start",
    tabId: activeTab.id,
    url: activeTab.url,
    startPage: parseInt(startPageInput.value) || 1
  });
});

// Stop button handler
stopBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({action: "stop"});
  updateStatus('Stopped manually');
});

// Listen for messages from background
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "showCaptchaWarning") {
    warningEl.classList.remove('hidden');
    updateStatus('Paused - Cloudflare detected', 'warning');
  }
});

// Initialize
updateStatus('Ready to start');
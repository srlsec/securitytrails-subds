// UI Elements
const statusEl = document.getElementById('status');
const warningEl = document.getElementById('warning');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const extractBtn = document.getElementById('extractBtn');
const settingsBtn = document.getElementById('settingsBtn');
const saveButton = document.getElementById('saveButton');
const copyButton = document.getElementById('copyButton');
const clearButton = document.getElementById('clearButton');
const domainInput = document.getElementById('domainInput');
const startPageInput = document.getElementById('startPage');
const settingsPanel = document.getElementById('settingsPanel');
const subdomainList = document.getElementById('subdomainList');
const subdomainCount = document.getElementById('subdomainCount');

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

// Update subdomain list
function updateSubdomainUI() {
  chrome.storage.local.get("subdomains", (data) => {
    const subdomains = data.subdomains || [];
    subdomainList.innerHTML = "";
    subdomains.forEach(sub => {
      const li = document.createElement("li");
      li.textContent = sub;
      subdomainList.appendChild(li);
    });
    subdomainCount.textContent = subdomains.length;
  });
}

// Initialize
chrome.storage.local.get(["domain", "subdomains"], (data) => {
  if (data.domain) domainInput.value = data.domain;
  updateSubdomainUI();
  updateStatus('Ready to start');
});

// Event Listeners
startBtn.addEventListener('click', async () => {
  const domain = domainInput.value.trim();
  if (!domain) {
    updateStatus('Error: Domain is required', 'warning');
    return;
  }

  const tabs = await chrome.tabs.query({active: true, currentWindow: true});
  if (!tabs.length) return;
  
  const activeTab = tabs[0];
  updateStatus(`Starting extraction...`, 'active');
  
  await chrome.storage.local.set({ domain });
  await chrome.runtime.sendMessage({
    action: "start",
    tabId: activeTab.id,
    url: activeTab.url,
    domain,
    startPage: parseInt(startPageInput.value) || 1
  });
});

extractBtn.addEventListener('click', async () => {
  const domain = domainInput.value.trim();
  if (!domain) {
    updateStatus('Error: Domain is required', 'warning');
    return;
  }

  const tabs = await chrome.tabs.query({active: true, currentWindow: true});
  if (!tabs.length) return;
  
  updateStatus(`Extracting subdomains...`, 'active');
  await chrome.storage.local.set({ domain });
  await chrome.runtime.sendMessage({
    action: "extract",
    domain
  });
  updateStatus('Extraction complete');
});

stopBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({action: "stop"});
  updateStatus('Stopped manually');
});

settingsBtn.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

saveButton.addEventListener('click', () => {
  chrome.storage.local.get(["subdomains", "domain"], (data) => {
    const domainName = data.domain || "subdomains";
    const filename = `${domainName}-subdomains.txt`;
    const blob = new Blob([(data.subdomains || []).join("\n")], {type: "text/plain"});
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({url, filename});
  });
});

copyButton.addEventListener('click', () => {
  chrome.storage.local.get("subdomains", (data) => {
    navigator.clipboard.writeText((data.subdomains || []).join("\n"));
  });
});

clearButton.addEventListener('click', () => {
  chrome.storage.local.set({subdomains: []}, updateSubdomainUI);
});

// Message handling
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "showCaptchaWarning") {
    warningEl.classList.remove('hidden');
    updateStatus('Paused - Cloudflare detected', 'warning');
  } else if (request.action === "updateCount") {
    subdomainCount.textContent = request.count;
    updateSubdomainUI();
  }
});
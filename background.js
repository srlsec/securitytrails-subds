let isActive = false;
let currentTabId = null;
let currentPage = 1;
const minDelay = 15000;
const maxDelay = 30000;
let lastRequestTime = 0;

// Combined functionality
async function handleNavigation(tabId, url, domain) {
  if (!isActive) return;

  // Add delay between requests
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  const requiredDelay = getRandomDelay();

  if (timeSinceLastRequest < requiredDelay) {
    await new Promise(resolve => setTimeout(resolve, requiredDelay - timeSinceLastRequest));
  }

  // Update URL with current page if it's securitytrails.com
  let targetUrl = url;
  if (url.includes('securitytrails.com')) {
    const urlObj = new URL(url);
    urlObj.searchParams.set('page', currentPage);
    targetUrl = urlObj.toString();
  }

  // Navigate to the page
  lastRequestTime = Date.now();
  await chrome.tabs.update(tabId, {url: targetUrl});

  // Wait for navigation to complete
  await new Promise(resolve => {
    const listener = (details) => {
      if (details.tabId === tabId && details.frameId === 0) {
        chrome.webNavigation.onCompleted.removeListener(listener);
        resolve();
      }
    };
    chrome.webNavigation.onCompleted.addListener(listener);
  });

  // Check for Cloudflare challenge
  const hasChallenge = await checkForCloudflare(tabId);
  if (hasChallenge) {
    await chrome.runtime.sendMessage({action: "showCaptchaWarning"});
    isActive = false;
    return;
  }

  // Extract subdomains if domain is specified
  if (domain) {
    await extractSubdomains(tabId, domain);
  }

  // If on securitytrails.com, increment page and continue
  if (url.includes('securitytrails.com')) {
    currentPage++;
    handleNavigation(tabId, url, domain);
  }
}

// Extract subdomains from page
async function extractSubdomains(tabId, domain) {
  try {
    const results = await chrome.scripting.executeScript({
      target: {tabId},
      func: (domain) => {
        const regex = new RegExp(`(?:[a-zA-Z0-9-]+\\.)+${domain.replace(/\./g, "\\.")}`, "gi");
        return [...new Set([...document.documentElement.innerHTML.matchAll(regex)].map(m => m[0].replace(/^\/\//, "")))];
      },
      args: [domain]
    });

    if (results && results[0] && results[0].result) {
      const data = await chrome.storage.local.get(["subdomains"]);
      let storedSubdomains = new Set(data.subdomains || []);
      results[0].result.forEach(sub => storedSubdomains.add(sub));
      await chrome.storage.local.set({ subdomains: [...storedSubdomains] });
      await chrome.runtime.sendMessage({
        action: "updateCount",
        count: storedSubdomains.size
      });
    }
  } catch (error) {
    console.error("Subdomain extraction error:", error);
  }
}

// Cloudflare check (unchanged)
function checkForCloudflare(tabId) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript({
      target: {tabId},
      func: () => !!document.querySelector('#challenge-form, .cf-challenge, .ray_id')
    }, (results) => resolve(results && results[0] && results[0].result));
  });
}

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "start":
      isActive = true;
      currentTabId = request.tabId;
      currentPage = request.startPage || 1;
      handleNavigation(request.tabId, request.url, request.domain);
      break;
    case "stop":
      isActive = false;
      currentTabId = null;
      break;
    case "extract":
      if (currentTabId) {
        extractSubdomains(currentTabId, request.domain);
      }
      break;
  }
  sendResponse({success: true});
});

// Random delay function (unchanged)
function getRandomDelay() {
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
}
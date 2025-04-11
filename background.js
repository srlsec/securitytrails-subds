let isActive = false;
let currentTabId = null;
let currentPage = 1;
const minDelay = 15000; // 15 seconds minimum between requests
const maxDelay = 30000; // 30 seconds maximum
let lastRequestTime = 0;

// Random delay to mimic human behavior
function getRandomDelay() {
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
}

// Check for Cloudflare challenges
function checkForCloudflare(tabId) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript({
      target: {tabId: tabId},
      func: () => {
        // Check for Cloudflare challenge elements
        return !!document.querySelector('#challenge-form, .cf-challenge, .ray_id');
      }
    }, (results) => {
      resolve(results && results[0] && results[0].result);
    });
  });
}

// Main navigation handler
async function handleNavigation(tabId, url) {
  if (!isActive) return;

  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  const requiredDelay = getRandomDelay();

  // Wait if needed to space out requests
  if (timeSinceLastRequest < requiredDelay) {
    const remainingDelay = requiredDelay - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, remainingDelay));
  }

  // Update URL with current page
  const urlObj = new URL(url);
  urlObj.searchParams.set('page', currentPage);
  const targetUrl = urlObj.toString();

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
    await chrome.tabs.sendMessage(tabId, {action: "showCaptchaWarning"});
    isActive = false;
    return;
  }

  // If everything is okay, increment page
  currentPage++;
  handleNavigation(tabId, url);
}

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start") {
    isActive = true;
    currentTabId = request.tabId;
    currentPage = request.startPage || 1;
    handleNavigation(request.tabId, request.url);
  }
  else if (request.action === "stop") {
    isActive = false;
    currentTabId = null;
  }
  sendResponse({success: true});
});
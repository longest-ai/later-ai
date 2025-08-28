// Background service worker for Later AI Chrome Extension

// Configuration
const API_BASE_URL = 'http://localhost:3000'; // Will be updated with production URL
const DASHBOARD_URL = 'http://localhost:5173'; // Will be updated with production URL

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for saving selected text
  chrome.contextMenus.create({
    id: 'save-to-later-ai',
    title: 'Later AI에 저장',
    contexts: ['selection', 'link', 'image', 'page']
  });
  
  // Set default storage values
  chrome.storage.local.set({
    apiUrl: API_BASE_URL,
    dashboardUrl: DASHBOARD_URL
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-to-later-ai') {
    let contentToSave = {};
    
    // Determine what to save based on context
    if (info.selectionText) {
      contentToSave = {
        type: 'text',
        content: info.selectionText,
        sourceUrl: tab.url,
        sourceTitle: tab.title
      };
    } else if (info.linkUrl) {
      contentToSave = {
        type: 'url',
        url: info.linkUrl,
        sourceUrl: tab.url,
        sourceTitle: tab.title
      };
    } else if (info.srcUrl && info.mediaType === 'image') {
      contentToSave = {
        type: 'image',
        imageUrl: info.srcUrl,
        sourceUrl: tab.url,
        sourceTitle: tab.title
      };
    } else {
      contentToSave = {
        type: 'page',
        url: tab.url,
        title: tab.title
      };
    }
    
    // Save the content
    await saveContent(contentToSave);
  }
});

// Save content to Later AI
async function saveContent(content) {
  try {
    // Check if user is logged in
    const { authToken } = await chrome.storage.local.get('authToken');
    
    if (!authToken) {
      // Show notification to login
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: 'Later AI - 로그인 필요',
        message: '콘텐츠를 저장하려면 먼저 로그인해주세요.',
        buttons: [{ title: '로그인' }]
      });
      return;
    }
    
    // Show saving notification
    chrome.notifications.create('saving', {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'Later AI',
      message: '콘텐츠를 저장하는 중...'
    });
    
    // Simulate API call (replace with actual API call in production)
    await simulateSaveToAPI(content, authToken);
    
    // Show success notification
    chrome.notifications.update('saving', {
      title: 'Later AI - 저장 완료',
      message: 'AI가 콘텐츠를 분류하여 저장했습니다!'
    });
    
    // Clear notification after 3 seconds
    setTimeout(() => {
      chrome.notifications.clear('saving');
    }, 3000);
    
  } catch (error) {
    console.error('Error saving content:', error);
    
    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'Later AI - 오류',
      message: '저장 중 오류가 발생했습니다. 다시 시도해주세요.'
    });
  }
}

// Simulate API call (replace with real implementation)
async function simulateSaveToAPI(content, authToken) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // In production, this would be:
  // const response = await fetch(`${API_BASE_URL}/api/save`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${authToken}`
  //   },
  //   body: JSON.stringify(content)
  // });
  // 
  // if (!response.ok) {
  //   throw new Error('Failed to save content');
  // }
  // 
  // return await response.json();
  
  return {
    success: true,
    category: '기술',
    tags: ['웹개발', 'Chrome Extension']
  };
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // Login button
    chrome.tabs.create({ url: `${DASHBOARD_URL}/login` });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveContent') {
    saveContent(request.content).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getAuthStatus') {
    chrome.storage.local.get('authToken').then(({ authToken }) => {
      sendResponse({ isLoggedIn: !!authToken });
    });
    return true;
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick-save') {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Save current page
    await saveContent({
      type: 'page',
      url: tab.url,
      title: tab.title
    });
  }
});

// Update auth token when user logs in from web app
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateAuthToken') {
    chrome.storage.local.set({ authToken: request.token }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'logout') {
    chrome.storage.local.remove('authToken').then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});
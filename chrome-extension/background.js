// Background service worker for Later AI Chrome Extension
// Seamless save experience with automatic authentication sync

const CONFIG = {
  API_BASE_URL: 'https://later-ai-backend-d2f9.onrender.com',
  DASHBOARD_URL: 'https://later-ai-swart.vercel.app',
  SUPABASE_URL: 'https://zsjlalcpnwbuqxrdryyi.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzamxhbGNwbndidXF4cmRyeXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzODgxNDksImV4cCI6MjA0Njk2NDE0OX0.VcZ1ctdDgBW6Ej_9qJe_9fKjaqAwRjE4f9F_7gvP4h0'
};

// Session management
let currentSession = null;
let isCheckingAuth = false;

// Initialize extension on installation
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu
  chrome.contextMenus.create({
    id: 'save-to-later-ai',
    title: 'Save to Later AI',
    contexts: ['selection', 'link', 'image', 'page']
  });
  
  // Set initial badge
  updateBadge('', '#6b7280'); // Gray - not logged in
  
  // Check for existing session
  checkAuthStatus();
});

// Check authentication status
async function checkAuthStatus() {
  if (isCheckingAuth) return;
  isCheckingAuth = true;
  
  try {
    // Get stored session from chrome.storage
    const result = await chrome.storage.local.get(['sb-zsjlalcpnwbuqxrdryyi-auth-token']);
    const sessionKey = Object.keys(result).find(key => key.includes('auth-token'));
    
    if (sessionKey && result[sessionKey]) {
      currentSession = result[sessionKey];
      console.log('Found session:', currentSession);
      
      // Check if we have access token
      if (currentSession.access_token) {
        // Check if session is expired
        if (currentSession.expires_at) {
          const expiresAt = typeof currentSession.expires_at === 'number' 
            ? new Date(currentSession.expires_at * 1000) 
            : new Date(currentSession.expires_at);
          
          if (expiresAt > new Date()) {
            updateBadge('', '#10b981'); // Green - logged in
            return true;
          } else {
            // Session expired, try to refresh
            console.log('Session expired, refreshing...');
            const refreshed = await refreshSession();
            return refreshed;
          }
        } else {
          // No expiry info, assume valid
          updateBadge('', '#10b981'); // Green - logged in
          return true;
        }
      }
    } else {
      updateBadge('', '#6b7280'); // Gray - not logged in
      currentSession = null;
      return false;
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    currentSession = null;
    updateBadge('', '#6b7280');
    return false;
  } finally {
    isCheckingAuth = false;
  }
}

// Refresh session token
async function refreshSession() {
  if (!currentSession || !currentSession.refresh_token) {
    currentSession = null;
    updateBadge('', '#6b7280');
    return false;
  }
  
  try {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        refresh_token: currentSession.refresh_token
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      currentSession = data;
      
      // Store refreshed session
      await chrome.storage.local.set({
        [`sb-zsjlalcpnwbuqxrdryyi-auth-token`]: data
      });
      
      updateBadge('', '#10b981'); // Green - logged in
      return true;
    } else {
      currentSession = null;
      updateBadge('', '#6b7280'); // Gray - not logged in
      return false;
    }
  } catch (error) {
    console.error('Error refreshing session:', error);
    currentSession = null;
    updateBadge('', '#6b7280');
    return false;
  }
}

// Update extension badge
function updateBadge(text, color) {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

// Main click handler - Seamless save or login
chrome.action.onClicked.addListener(async (tab) => {
  // Check auth status first
  const isAuthenticated = await checkAuthStatus();
  
  if (!isAuthenticated) {
    // Not logged in - open login page
    chrome.tabs.create({ url: CONFIG.DASHBOARD_URL });
    
    // Show notification (without icon to avoid error)
    console.log('Showing login required notification');
  } else {
    // Logged in - save current page immediately
    updateBadge('...', '#f59e0b'); // Orange - saving
    
    try {
      const result = await saveContent({
        type: 'page',
        url: tab.url,
        title: tab.title
      });
      
      // Success
      updateBadge('✓', '#10b981'); // Green checkmark
      console.log('Save successful!');
      
      // Reset badge after 3 seconds
      setTimeout(() => {
        updateBadge('', '#10b981');
      }, 3000);
      
    } catch (error) {
      // Error
      updateBadge('!', '#ef4444'); // Red error
      console.error('Save failed:', error.message);
      
      // Reset badge after 3 seconds
      setTimeout(() => {
        updateBadge('', '#10b981');
      }, 3000);
    }
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-to-later-ai') {
    const isAuthenticated = await checkAuthStatus();
    
    if (!isAuthenticated) {
      chrome.tabs.create({ url: CONFIG.DASHBOARD_URL });
      return;
    }
    
    let contentToSave = {};
    
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
    
    updateBadge('...', '#f59e0b'); // Orange - saving
    
    try {
      await saveContent(contentToSave);
      updateBadge('✓', '#10b981');
      setTimeout(() => updateBadge('', '#10b981'), 3000);
    } catch (error) {
      updateBadge('!', '#ef4444');
      setTimeout(() => updateBadge('', '#10b981'), 3000);
    }
  }
});

// Save content with real API
async function saveContent(content) {
  if (!currentSession || !currentSession.access_token) {
    throw new Error('Not authenticated');
  }
  
  try {
    const url = content.url || content.sourceUrl || '';
    const title = content.title || content.sourceTitle || 'Untitled';
    const text = content.content || content.text || '';
    
    // Fetch metadata
    console.log('Fetching metadata for:', url);
    const metadataResponse = await fetch(`${CONFIG.API_BASE_URL}/api/fetch-metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    if (!metadataResponse.ok) {
      console.error('Metadata fetch failed:', metadataResponse.status, metadataResponse.statusText);
      const text = await metadataResponse.text();
      console.error('Response:', text.substring(0, 200));
      throw new Error(`Metadata fetch failed: ${metadataResponse.status}`);
    }
    
    const metadata = await metadataResponse.json();
    console.log('Metadata:', metadata);
    
    // Classify content
    console.log('Classifying content...');
    const classifyResponse = await fetch(`${CONFIG.API_BASE_URL}/api/classify-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: metadata.title || title,
        content: text,
        url
      })
    });
    
    if (!classifyResponse.ok) {
      console.error('Classification failed:', classifyResponse.status);
      const text = await classifyResponse.text();
      console.error('Response:', text.substring(0, 200));
      throw new Error(`Classification failed: ${classifyResponse.status}`);
    }
    
    const classification = await classifyResponse.json();
    console.log('Classification:', classification);
    
    // Instead of saving directly to Supabase, use our backend API
    console.log('Saving via backend API...');
    
    const saveResponse = await fetch(`${CONFIG.API_BASE_URL}/api/save-item`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSession.access_token}`
      },
      body: JSON.stringify({
        url,
        title: metadata.title || title,
        content: text,
        description: metadata.description || '',
        image: metadata.image || '',
        category: classification.category || '기타',
        tags: classification.tags || []
      })
    });
    
    if (!saveResponse.ok) {
      console.error('Save failed:', saveResponse.status);
      const errorText = await saveResponse.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to save item: ${saveResponse.status}`);
    }
    
    console.log('Item saved successfully!');
    
    return { success: true, category: classification.category, tags: classification.tags };
  } catch (error) {
    console.error('Error in saveContent:', error);
    throw error;
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSupabaseSession') {
    // Update session from web app
    currentSession = request.session;
    chrome.storage.local.set({
      [`sb-zsjlalcpnwbuqxrdryyi-auth-token`]: request.session
    }).then(() => {
      updateBadge('', '#10b981'); // Green - logged in
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'logout') {
    // Clear session
    currentSession = null;
    chrome.storage.local.remove(['sb-zsjlalcpnwbuqxrdryyi-auth-token']).then(() => {
      updateBadge('', '#6b7280'); // Gray - not logged in
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'getAuthStatus') {
    sendResponse({ isLoggedIn: !!currentSession && !!currentSession.access_token });
    return true;
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // View in Dashboard button
    chrome.tabs.create({ url: CONFIG.DASHBOARD_URL });
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick-save') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Perform same action as clicking the extension icon
    const isAuthenticated = await checkAuthStatus();
    
    if (!isAuthenticated) {
      chrome.tabs.create({ url: CONFIG.DASHBOARD_URL });
    } else {
      updateBadge('...', '#f59e0b');
      try {
        await saveContent({
          type: 'page',
          url: tab.url,
          title: tab.title
        });
        updateBadge('✓', '#10b981');
        console.log('Save successful via keyboard shortcut!');
        setTimeout(() => updateBadge('', '#10b981'), 3000);
      } catch (error) {
        updateBadge('!', '#ef4444');
        console.error('Save failed via keyboard shortcut:', error.message);
        setTimeout(() => updateBadge('', '#10b981'), 3000);
      }
    }
  }
});

// Check auth status periodically when active
chrome.alarms.create('checkAuth', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkAuth') {
    checkAuthStatus();
  }
});

// Check auth on startup
checkAuthStatus();
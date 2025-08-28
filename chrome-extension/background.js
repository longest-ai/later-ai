// Background service worker for Later AI Chrome Extension

// Configuration
const CONFIG = {
  API_BASE_URL: 'https://later-ai-backend-d2f9.onrender.com',
  DASHBOARD_URL: 'https://later-ai-swart.vercel.app',
  SUPABASE_URL: 'https://zsjlalcpnwbuqxrdryyi.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzamxhbGNwbndidXF4cmRyeXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzODgxNDksImV4cCI6MjA0Njk2NDE0OX0.VcZ1ctdDgBW6Ej_9qJe_9fKjaqAwRjE4f9F_7gvP4h0'
};

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for saving selected text
  chrome.contextMenus.create({
    id: 'save-to-later-ai',
    title: 'Save to Later AI',
    contexts: ['selection', 'link', 'image', 'page']
  });
  
  // Set default storage values
  chrome.storage.local.set({
    apiUrl: CONFIG.API_BASE_URL,
    dashboardUrl: CONFIG.DASHBOARD_URL
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
    const { supabaseSession } = await chrome.storage.local.get('supabaseSession');
    
    if (!supabaseSession || !supabaseSession.access_token) {
      // Show notification to login
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: 'Later AI - Login Required',
        message: 'Please login to save content.',
        buttons: [{ title: 'Login' }]
      });
      return;
    }
    
    // Show saving notification
    chrome.notifications.create('saving', {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'Later AI',
      message: 'Saving content...'
    });
    
    // Save content with real API
    await saveToAPI(content, supabaseSession);
    
    // Show success notification
    chrome.notifications.update('saving', {
      title: 'Later AI - Saved',
      message: 'Content saved and classified by AI!'
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
      title: 'Later AI - Error',
      message: 'Failed to save. Please try again.'
    });
  }
}

// Save content with real API
async function saveToAPI(content, session) {
  try {
    // Determine URL and title
    const url = content.url || content.sourceUrl || '';
    const title = content.title || content.sourceTitle || 'Untitled';
    const text = content.content || content.text || '';
    
    // Fetch metadata
    const metadataResponse = await fetch(`${CONFIG.API_BASE_URL}/api/fetch-metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const metadata = await metadataResponse.json();
    
    // Classify content
    const classifyResponse = await fetch(`${CONFIG.API_BASE_URL}/api/classify-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: metadata.title || title,
        content: text,
        url
      })
    });
    const classification = await classifyResponse.json();
    
    // Save to Supabase
    const saveResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/saved_items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        user_id: session.user.id,
        url,
        title: metadata.title || title,
        content: text,
        description: metadata.description || '',
        image: metadata.image || '',
        category: classification.category || '기타',
        tags: classification.tags || [],
        is_read: false,
        is_favorite: false
      })
    });
    
    if (!saveResponse.ok) {
      throw new Error('Failed to save item');
    }
    
    return { success: true, category: classification.category, tags: classification.tags };
  } catch (error) {
    console.error('Error in saveToAPI:', error);
    throw error;
  }
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // Login button
    chrome.tabs.create({ url: CONFIG.DASHBOARD_URL });
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
    chrome.storage.local.get('supabaseSession').then(({ supabaseSession }) => {
      sendResponse({ isLoggedIn: !!supabaseSession && !!supabaseSession.access_token });
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

// Update auth session when user logs in from web app
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSupabaseSession') {
    chrome.storage.local.set({ supabaseSession: request.session }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'logout') {
    chrome.storage.local.remove('supabaseSession').then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});
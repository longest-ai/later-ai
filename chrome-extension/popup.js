// Popup script for Later AI Chrome Extension

// Load configuration
const script = document.createElement('script');
script.src = chrome.runtime.getURL('config.js');
document.head.appendChild(script);

// Wait for config to load
let CONFIG = null;
setTimeout(() => {
  CONFIG = window.CONFIG || {
    API_BASE_URL: 'https://later-ai-backend-d2f9.onrender.com',
    DASHBOARD_URL: 'https://later-ai.vercel.app',
    SUPABASE_URL: 'https://zsjlalcpnwbuqxrdryyi.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzamxhbGNwbndidXF4cmRyeXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzODgxNDksImV4cCI6MjA0Njk2NDE0OX0.VcZ1ctdDgBW6Ej_9qJe_9fKjaqAwRjE4f9F_7gvP4h0'
  };
}, 100)

// State
let currentTab = null;
let selectedText = '';
let isLoggedIn = false;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  
  // Display page info
  document.getElementById('page-title').textContent = tab.title || 'Untitled';
  document.getElementById('page-url').textContent = tab.url || '';
  
  // Check login status
  checkLoginStatus();
  
  // Check for selected text
  checkSelectedText();
  
  // Set up event listeners
  setupEventListeners();
});

// Check if user is logged in
async function checkLoginStatus() {
  try {
    const { supabaseSession } = await chrome.storage.local.get('supabaseSession');
    isLoggedIn = !!supabaseSession && supabaseSession.access_token;
    
    if (isLoggedIn) {
      document.getElementById('login-section').classList.add('hidden');
      document.getElementById('main-section').classList.remove('hidden');
    } else {
      document.getElementById('login-section').classList.remove('hidden');
      document.getElementById('main-section').classList.add('hidden');
    }
  } catch (error) {
    console.error('Error checking login status:', error);
  }
}

// Check for selected text on the page
async function checkSelectedText() {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      function: () => window.getSelection().toString()
    });
    
    selectedText = result.result || '';
    const saveSelectionBtn = document.getElementById('save-selection');
    
    if (selectedText.trim()) {
      saveSelectionBtn.disabled = false;
      saveSelectionBtn.innerHTML = `
        <span class="icon">✂️</span>
        Save Selection (${selectedText.length} chars)
      `;
    }
  } catch (error) {
    console.error('Error checking selected text:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Login button
  document.getElementById('login-btn').addEventListener('click', () => {
    const dashboardUrl = CONFIG ? CONFIG.DASHBOARD_URL : 'https://later-ai.vercel.app';
    chrome.tabs.create({ url: dashboardUrl });
  });
  
  // Save page button
  document.getElementById('save-page').addEventListener('click', saveCurrentPage);
  
  // Save selection button
  document.getElementById('save-selection').addEventListener('click', saveSelectedText);
  
  // Open dashboard link
  document.getElementById('open-dashboard').addEventListener('click', (e) => {
    e.preventDefault();
    const dashboardUrl = CONFIG ? CONFIG.DASHBOARD_URL : 'https://later-ai.vercel.app';
    chrome.tabs.create({ url: dashboardUrl });
  });
  
  // Settings link
  document.getElementById('settings').addEventListener('click', (e) => {
    e.preventDefault();
    const dashboardUrl = CONFIG ? CONFIG.DASHBOARD_URL : 'https://later-ai.vercel.app';
    chrome.tabs.create({ url: `${dashboardUrl}/settings` });
  });
}

// Save current page
async function saveCurrentPage() {
  if (!currentTab) return;
  
  const note = document.getElementById('note-input').value;
  
  showStatus('loading', 'Saving...');
  document.getElementById('save-page').disabled = true;
  
  try {
    // Save with AI classification
    await simulateAIClassification({
      url: currentTab.url,
      title: currentTab.title,
      note: note
    });
    
    showStatus('success', '✅ Saved successfully!');
    
    // Clear note after successful save
    document.getElementById('note-input').value = '';
    
    // Re-enable button after delay
    setTimeout(() => {
      document.getElementById('save-page').disabled = false;
      hideStatus();
    }, 2000);
    
  } catch (error) {
    showStatus('error', 'Save failed: ' + error.message);
    document.getElementById('save-page').disabled = false;
  }
}

// Save selected text
async function saveSelectedText() {
  if (!selectedText.trim()) return;
  
  const note = document.getElementById('note-input').value;
  
  showStatus('loading', 'Saving...');
  document.getElementById('save-selection').disabled = true;
  
  try {
    // Save with AI classification
    await simulateAIClassification({
      text: selectedText,
      sourceUrl: currentTab.url,
      sourceTitle: currentTab.title,
      note: note
    });
    
    showStatus('success', '✅ Text saved successfully!');
    
    // Clear selection and note
    selectedText = '';
    document.getElementById('note-input').value = '';
    document.getElementById('save-selection').disabled = true;
    document.getElementById('save-selection').innerHTML = `
      <span class="icon">✂️</span>
      Save Selection
    `;
    
    // Hide status after delay
    setTimeout(() => {
      hideStatus();
    }, 2000);
    
  } catch (error) {
    showStatus('error', 'Save failed: ' + error.message);
    document.getElementById('save-selection').disabled = false;
  }
}

// Save content with real API call
async function simulateAIClassification(data) {
  const aiResult = document.getElementById('ai-result');
  const categoryBadge = document.getElementById('category-badge');
  const tagsContainer = document.getElementById('tags-container');
  
  try {
    // Get session for authentication
    const { supabaseSession } = await chrome.storage.local.get('supabaseSession');
    if (!supabaseSession || !supabaseSession.access_token) {
      throw new Error('Not logged in');
    }
    
    const apiUrl = CONFIG ? CONFIG.API_BASE_URL : 'https://later-ai-backend-d2f9.onrender.com';
    
    // Prepare content data
    const contentData = {
      url: data.url || data.sourceUrl || currentTab.url,
      title: data.title || data.sourceTitle || currentTab.title,
      content: data.text || data.note || '',
      user_id: supabaseSession.user.id
    };
    
    // First fetch metadata
    const metadataResponse = await fetch(`${apiUrl}/api/fetch-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: contentData.url })
    });
    
    const metadata = await metadataResponse.json();
    
    // Then classify content
    const classifyResponse = await fetch(`${apiUrl}/api/classify-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: metadata.title || contentData.title,
        content: contentData.content,
        url: contentData.url
      })
    });
    
    const classification = await classifyResponse.json();
    
    // Save to Supabase
    const supabaseUrl = CONFIG ? CONFIG.SUPABASE_URL : 'https://zsjlalcpnwbuqxrdryyi.supabase.co';
    const supabaseKey = CONFIG ? CONFIG.SUPABASE_ANON_KEY : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzamxhbGNwbndidXF4cmRyeXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzODgxNDksImV4cCI6MjA0Njk2NDE0OX0.VcZ1ctdDgBW6Ej_9qJe_9fKjaqAwRjE4f9F_7gvP4h0';
    
    const saveResponse = await fetch(`${supabaseUrl}/rest/v1/saved_items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseSession.access_token}`
      },
      body: JSON.stringify({
        user_id: supabaseSession.user.id,
        url: contentData.url,
        title: metadata.title || contentData.title,
        content: contentData.content,
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
    
    // Show AI classification result
    const translateCategory = (category) => {
      const translations = {
        '기술': 'Technology',
        '비즈니스': 'Business',
        '디자인': 'Design',
        '교육': 'Education',
        '정치': 'Politics',
        '경제': 'Economy',
        '사회': 'Society',
        '문화': 'Culture',
        '건강': 'Health',
        '기타': 'Other'
      };
      return translations[category] || category;
    };
    
    categoryBadge.textContent = translateCategory(classification.category);
    tagsContainer.innerHTML = (classification.tags || []).map(tag => `<span class="tag">#${tag}</span>`).join('');
    
    aiResult.classList.remove('hidden');
    
    return { category: classification.category, tags: classification.tags };
    
  } catch (error) {
    console.error('Error saving content:', error);
    throw error;
  }
}

// Show status message
function showStatus(type, message) {
  const status = document.getElementById('status');
  status.className = `status ${type}`;
  status.textContent = message;
  status.classList.remove('hidden');
}

// Hide status message
function hideStatus() {
  const status = document.getElementById('status');
  status.classList.add('hidden');
  document.getElementById('ai-result').classList.add('hidden');
}

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'quick-save') {
    saveCurrentPage();
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'textSelected') {
    selectedText = request.text;
    checkSelectedText();
  }
});
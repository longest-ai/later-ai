// Popup script for Later AI Chrome Extension

// Configuration
const API_BASE_URL = 'http://localhost:3000'; // Will be updated with production URL
const DASHBOARD_URL = 'http://localhost:5173'; // Will be updated with production URL

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
    const { authToken } = await chrome.storage.local.get('authToken');
    isLoggedIn = !!authToken;
    
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
        선택 텍스트 저장 (${selectedText.length}자)
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
    chrome.tabs.create({ url: `${DASHBOARD_URL}/login` });
  });
  
  // Save page button
  document.getElementById('save-page').addEventListener('click', saveCurrentPage);
  
  // Save selection button
  document.getElementById('save-selection').addEventListener('click', saveSelectedText);
  
  // Open dashboard link
  document.getElementById('open-dashboard').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: DASHBOARD_URL });
  });
  
  // Settings link
  document.getElementById('settings').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: `${DASHBOARD_URL}/settings` });
  });
}

// Save current page
async function saveCurrentPage() {
  if (!currentTab) return;
  
  const note = document.getElementById('note-input').value;
  
  showStatus('loading', '저장 중...');
  document.getElementById('save-page').disabled = true;
  
  try {
    // Simulate AI classification
    await simulateAIClassification({
      url: currentTab.url,
      title: currentTab.title,
      note: note
    });
    
    showStatus('success', '✅ 저장되었습니다!');
    
    // Clear note after successful save
    document.getElementById('note-input').value = '';
    
    // Re-enable button after delay
    setTimeout(() => {
      document.getElementById('save-page').disabled = false;
      hideStatus();
    }, 2000);
    
  } catch (error) {
    showStatus('error', '저장 실패: ' + error.message);
    document.getElementById('save-page').disabled = false;
  }
}

// Save selected text
async function saveSelectedText() {
  if (!selectedText.trim()) return;
  
  const note = document.getElementById('note-input').value;
  
  showStatus('loading', '저장 중...');
  document.getElementById('save-selection').disabled = true;
  
  try {
    // Simulate AI classification
    await simulateAIClassification({
      text: selectedText,
      sourceUrl: currentTab.url,
      sourceTitle: currentTab.title,
      note: note
    });
    
    showStatus('success', '✅ 텍스트가 저장되었습니다!');
    
    // Clear selection and note
    selectedText = '';
    document.getElementById('note-input').value = '';
    document.getElementById('save-selection').disabled = true;
    document.getElementById('save-selection').innerHTML = `
      <span class="icon">✂️</span>
      선택 텍스트 저장
    `;
    
    // Hide status after delay
    setTimeout(() => {
      hideStatus();
    }, 2000);
    
  } catch (error) {
    showStatus('error', '저장 실패: ' + error.message);
    document.getElementById('save-selection').disabled = false;
  }
}

// Simulate AI classification (will be replaced with real API call)
async function simulateAIClassification(data) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Show AI classification result
  const aiResult = document.getElementById('ai-result');
  const categoryBadge = document.getElementById('category-badge');
  const tagsContainer = document.getElementById('tags-container');
  
  // Simulate classification
  const categories = ['기술', '비즈니스', '교육', '디자인', '기타'];
  const allTags = ['프로그래밍', 'JavaScript', 'React', 'AI', '스타트업', '마케팅', '개발', 'UX'];
  
  const category = categories[Math.floor(Math.random() * categories.length)];
  const tags = allTags.sort(() => 0.5 - Math.random()).slice(0, 3);
  
  categoryBadge.textContent = category;
  tagsContainer.innerHTML = tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
  
  aiResult.classList.remove('hidden');
  
  // In production, this would make an actual API call:
  // const response = await fetch(`${API_BASE_URL}/api/save`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${authToken}`
  //   },
  //   body: JSON.stringify(data)
  // });
  
  return { category, tags };
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
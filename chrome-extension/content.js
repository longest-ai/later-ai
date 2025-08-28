// Content script for Later AI Chrome Extension

// Check if we're on the Later AI website and sync authentication
if (window.location.origin === 'https://later-ai-swart.vercel.app' || 
    window.location.origin === 'http://localhost:5173') {
  
  // Function to get Supabase session from localStorage
  function getSupabaseSession() {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('sb-') && key.includes('-auth-token')) {
        const sessionData = localStorage.getItem(key);
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData);
            return parsed;
          } catch (e) {
            console.error('Failed to parse session:', e);
          }
        }
      }
    }
    return null;
  }
  
  // Send session to extension
  function syncSession() {
    const session = getSupabaseSession();
    if (session) {
      chrome.runtime.sendMessage({
        action: 'updateSupabaseSession',
        session: session
      }, (response) => {
        if (response && response.success) {
          console.log('Session synced with extension');
        }
      });
    }
  }
  
  // Sync on page load
  setTimeout(syncSession, 1000);
  
  // Listen for storage changes (login/logout)
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.includes('auth-token')) {
      syncSession();
    }
  });
}

// Track text selection
document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection().toString().trim();
  
  if (selectedText) {
    // Notify popup about selected text
    chrome.runtime.sendMessage({
      action: 'textSelected',
      text: selectedText
    });
  }
});

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    const selectedText = window.getSelection().toString().trim();
    sendResponse({ text: selectedText });
  }
  
  if (request.action === 'getPageContent') {
    // Extract main content from page
    const content = extractPageContent();
    sendResponse({ content });
  }
});

// Extract main content from the page
function extractPageContent() {
  const content = {
    title: document.title,
    url: window.location.href,
    description: '',
    mainText: '',
    images: []
  };
  
  // Try to get meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    content.description = metaDescription.content;
  }
  
  // Try to get Open Graph description as fallback
  if (!content.description) {
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      content.description = ogDescription.content;
    }
  }
  
  // Extract main text content (simplified version)
  // In production, use a proper content extraction library
  const article = document.querySelector('article') || 
                  document.querySelector('main') || 
                  document.querySelector('[role="main"]') ||
                  document.body;
  
  if (article) {
    // Get text content, limiting to first 5000 characters
    content.mainText = article.innerText.substring(0, 5000);
  }
  
  // Extract main images
  const images = document.querySelectorAll('img');
  for (let i = 0; i < Math.min(images.length, 5); i++) {
    const img = images[i];
    if (img.src && img.width > 100 && img.height > 100) {
      content.images.push({
        src: img.src,
        alt: img.alt || '',
        width: img.width,
        height: img.height
      });
    }
  }
  
  return content;
}

// Add floating save button for selected text (optional feature)
let floatingButton = null;

document.addEventListener('mouseup', (e) => {
  const selectedText = window.getSelection().toString().trim();
  
  // Remove existing button
  if (floatingButton) {
    floatingButton.remove();
    floatingButton = null;
  }
  
  // Show button if text is selected
  if (selectedText && selectedText.length > 10) {
    showFloatingButton(e.pageX, e.pageY, selectedText);
  }
});

function showFloatingButton(x, y, text) {
  floatingButton = document.createElement('div');
  floatingButton.className = 'later-ai-floating-button';
  floatingButton.innerHTML = '💾 Later AI';
  floatingButton.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y - 40}px;
    background: #3b82f6;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-family: -apple-system, sans-serif;
    cursor: pointer;
    z-index: 999999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: all 0.2s;
  `;
  
  floatingButton.addEventListener('click', () => {
    // Save selected text
    chrome.runtime.sendMessage({
      action: 'saveContent',
      content: {
        type: 'text',
        content: text,
        sourceUrl: window.location.href,
        sourceTitle: document.title
      }
    });
    
    // Remove button
    floatingButton.remove();
    floatingButton = null;
  });
  
  document.body.appendChild(floatingButton);
  
  // Remove button when clicking elsewhere
  setTimeout(() => {
    document.addEventListener('mousedown', () => {
      if (floatingButton) {
        floatingButton.remove();
        floatingButton = null;
      }
    }, { once: true });
  }, 100);
}
// Supabase client for Chrome Extension with custom storage adapter

const SUPABASE_URL = 'https://hqxfsonpjxnfafhwygwv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxeGZzb25wanhuZmFmaHd5Z3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTY1MDQsImV4cCI6MjA3MTkzMjUwNH0.eBMel__WsYsStL1_949eVRM2lei-91F2yfnWfWKDswI';

// Chrome storage adapter for Supabase
const chromeStorageAdapter = {
  getItem: async (name) => {
    return new Promise((resolve) => {
      chrome.storage.local.get(name, (result) => {
        resolve(result[name] || null);
      });
    });
  },
  setItem: async (name, value) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [name]: value }, () => {
        resolve();
      });
    });
  },
  removeItem: async (name) => {
    return new Promise((resolve) => {
      chrome.storage.local.remove(name, () => {
        resolve();
      });
    });
  }
};

// Check if we have createClient available (will be imported in background.js)
let supabaseClient = null;

// This function will be called from background.js after importing Supabase
function initializeSupabaseClient(createClientFunction) {
  supabaseClient = createClientFunction(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        storage: chromeStorageAdapter,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    }
  );
  return supabaseClient;
}

// Export for use in background.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    chromeStorageAdapter,
    initializeSupabaseClient
  };
}
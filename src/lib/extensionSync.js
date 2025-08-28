// Extension Authentication Sync
// This module handles syncing authentication between the web app and Chrome Extension

import { supabase } from './supabase';

// Chrome Extension ID (update this with your actual extension ID)
const EXTENSION_ID = 'YOUR_EXTENSION_ID_HERE'; // e.g., 'abcdefghijklmnopqrstuvwx'

// Check if extension is installed
export const isExtensionInstalled = () => {
  return new Promise((resolve) => {
    if (!chrome?.runtime?.sendMessage) {
      resolve(false);
      return;
    }
    
    try {
      chrome.runtime.sendMessage(EXTENSION_ID, { action: 'ping' }, (response) => {
        resolve(!!response);
      });
    } catch {
      resolve(false);
    }
  });
};

// Sync session with extension
export const syncSessionWithExtension = async (session) => {
  if (!chrome?.runtime?.sendMessage) {
    console.log('Chrome extension API not available');
    return false;
  }
  
  try {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { 
          action: 'updateSupabaseSession',
          session: session
        },
        (response) => {
          resolve(response?.success || false);
        }
      );
    });
  } catch (error) {
    console.error('Failed to sync with extension:', error);
    return false;
  }
};

// Logout from extension
export const logoutFromExtension = async () => {
  if (!chrome?.runtime?.sendMessage) {
    return false;
  }
  
  try {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { action: 'logout' },
        (response) => {
          resolve(response?.success || false);
        }
      );
    });
  } catch (error) {
    console.error('Failed to logout from extension:', error);
    return false;
  }
};

// Auto-sync on auth state change
export const setupAuthSync = () => {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      await syncSessionWithExtension(session);
    } else if (event === 'SIGNED_OUT') {
      await logoutFromExtension();
    }
  });
};

// Initialize extension sync
export const initExtensionSync = async () => {
  const installed = await isExtensionInstalled();
  
  if (installed) {
    console.log('Later AI Chrome Extension detected');
    
    // Get current session and sync
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await syncSessionWithExtension(session);
    }
    
    // Setup auto-sync
    setupAuthSync();
  }
  
  return installed;
};
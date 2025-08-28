import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Browser } from '@capacitor/browser'
import { StatusBar } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

// Check if running on native platform
export const isNative = Capacitor.isNativePlatform()

// Initialize native plugins
export const initializeApp = async () => {
  if (isNative) {
    // Hide splash screen
    await SplashScreen.hide()
    
    // Configure status bar
    if (Capacitor.getPlatform() === 'ios') {
      await StatusBar.setStyle({ style: 'LIGHT' })
    }
  }
}

// Share functionality
export const shareContent = async (title, text, url) => {
  if (isNative && Share) {
    try {
      await Share.share({
        title,
        text,
        url,
        dialogTitle: 'Share with'
      })
      return true
    } catch (error) {
      console.error('Share failed:', error)
      return false
    }
  } else {
    // Web fallback - use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return true
      } catch (error) {
        console.error('Web share failed:', error)
        return false
      }
    }
    return false
  }
}

// Open external URL
export const openUrl = async (url) => {
  if (isNative && Browser) {
    await Browser.open({ url })
  } else {
    window.open(url, '_blank')
  }
}

// Handle incoming share from native Share Sheet/Intent
export const handleIncomingShare = () => {
  // This will be expanded when we implement the Share Extension
  // For now, we'll handle basic URL scheme
  if (isNative) {
    // Check if app was opened with shared content
    const url = new URL(window.location.href)
    const sharedUrl = url.searchParams.get('url')
    const sharedText = url.searchParams.get('text')
    
    if (sharedUrl || sharedText) {
      return {
        type: sharedUrl ? 'url' : 'text',
        content: sharedUrl || sharedText
      }
    }
  }
  return null
}
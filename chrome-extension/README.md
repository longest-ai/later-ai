# Later AI Chrome Extension

Save any content for later with AI-powered automatic categorization.

## Features

- **Quick Save**: Save current page with one click or keyboard shortcut (Cmd+Shift+S)
- **Save Selection**: Save highlighted text from any webpage
- **Context Menu**: Right-click to save links, images, or selected text
- **AI Classification**: Automatic categorization and tagging using GPT-3.5
- **Authentication Sync**: Seamless integration with Later AI web app
- **Note Addition**: Add personal notes to saved items

## Installation

### For Development/Testing

1. **Load Extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the `chrome-extension` directory from this project
   - The extension should now appear in your Chrome toolbar

2. **Get Extension ID**:
   - After loading, copy the Extension ID from the extensions page
   - Update `src/lib/extensionSync.js` with your extension ID:
   ```javascript
   const EXTENSION_ID = 'your-extension-id-here';
   ```

3. **Configuration**:
   The extension is pre-configured with production endpoints:
   - Backend API: https://later-ai-backend-d2f9.onrender.com
   - Web Dashboard: https://later-ai-swart.vercel.app
   - Supabase: Production instance

## Project Structure

```
chrome-extension/
├── manifest.json       # Extension configuration
├── popup.html         # Popup UI
├── popup.css          # Popup styles
├── popup.js           # Popup logic
├── background.js      # Service worker
├── content.js         # Content script
└── icons/            # Extension icons
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    └── icon-128.png
```

## API Integration

The extension communicates with the Later AI backend through:

1. **Authentication**: Stores auth token in Chrome storage
2. **Save Content**: POST to `/api/save` endpoint
3. **AI Classification**: Automatic categorization on save

## Production Deployment

1. **Update URLs**:
   - Replace `localhost` URLs with production URLs
   - Update `host_permissions` in manifest.json

2. **Create Icons**:
   - Generate icon files (16x16, 32x32, 48x48, 128x128)
   - Place in `icons/` folder

3. **Package Extension**:
   - Remove development code/comments
   - Create ZIP file of the extension folder

4. **Publish to Chrome Web Store**:
   - Create developer account
   - Upload ZIP file
   - Add store listing details
   - Submit for review

## Usage

### First Time Setup
1. Click the Later AI icon in Chrome toolbar
2. Click "Login" to authenticate via the web app
3. Once logged in, you can start saving content

### Saving Content

#### Option 1: Popup
1. Click the extension icon
2. Optionally add a note
3. Click "Save Page"

#### Option 2: Keyboard Shortcut
- Press `Cmd+Shift+S` (Mac) or `Ctrl+Shift+S` (Windows/Linux)

#### Option 3: Context Menu
1. Right-click on any page, link, image, or selected text
2. Select "Save to Later AI"

#### Option 4: Save Selection
1. Highlight any text on a webpage
2. Click the extension icon
3. Click "Save Selection"

## Testing Checklist

- [x] Extension loads in Chrome
- [x] Production API endpoints configured
- [x] Authentication with Supabase
- [x] Metadata fetching from URLs
- [x] AI classification (Korean categories, English tags)
- [x] Save to Supabase database
- [ ] Extension ID configured in web app
- [ ] Login flow from extension
- [ ] Context menu functionality
- [ ] Keyboard shortcut
- [ ] Notifications

## Future Enhancements

- [ ] Offline mode support
- [ ] Bulk save multiple tabs
- [ ] Advanced content extraction
- [ ] Custom keyboard shortcuts
- [ ] Sync settings across devices
- [ ] Support for Firefox/Edge
# Later AI Chrome Extension

Save any content for later with AI-powered automatic categorization.

## Features

- **Quick Save**: Save current page with one click or keyboard shortcut (Ctrl/Cmd+Shift+S)
- **Text Selection**: Save selected text from any webpage
- **Context Menu**: Right-click to save links, images, or selected text
- **AI Classification**: Automatic categorization and tagging of saved content
- **Note Addition**: Add personal notes to saved items
- **Floating Button**: Quick save button appears when text is selected

## Development Setup

1. **Load Extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" 
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

2. **Connect to Backend**:
   - Update `API_BASE_URL` in `background.js` and `popup.js`
   - Update `DASHBOARD_URL` with your web app URL

3. **Test the Extension**:
   - Click the extension icon to open popup
   - Try saving a page or selected text
   - Check context menu (right-click)
   - Test keyboard shortcut (Ctrl/Cmd+Shift+S)

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

## Testing Checklist

- [ ] Popup opens correctly
- [ ] Login/logout flow works
- [ ] Page saving works
- [ ] Text selection saving works
- [ ] Context menu works
- [ ] Keyboard shortcut works
- [ ] AI classification displays
- [ ] Notes can be added
- [ ] Dashboard link opens
- [ ] Notifications appear

## Future Enhancements

- [ ] Offline mode support
- [ ] Bulk save multiple tabs
- [ ] Advanced content extraction
- [ ] Custom keyboard shortcuts
- [ ] Sync settings across devices
- [ ] Support for Firefox/Edge
# iOS Share Extension Setup Guide

## Steps to Add Share Extension in Xcode

1. Open the iOS project in Xcode:
   ```bash
   npx cap open ios
   ```

2. In Xcode:
   - Select your project in the navigator
   - Click the "+" button at the bottom of the targets list
   - Choose "Share Extension" from the iOS templates
   - Name it "LaterAIShareExtension"
   - Set the bundle identifier to: `com.laterai.app.share-extension`

3. Configure the Share Extension Info.plist:
   - Add supported content types (URLs, Text, Images)
   - Set activation rules for the extension

4. Implement the Share Extension:
   - The extension will receive shared content
   - Process and save to app group container
   - Open the main app with the shared data

## App Groups Configuration

1. Enable App Groups capability in both:
   - Main app target
   - Share Extension target

2. Create app group: `group.com.laterai.app`

3. Use shared container for data exchange between extension and main app

## Communication Between Extension and Main App

The Share Extension will:
1. Receive shared content (URL, text, or image)
2. Save it to the shared container using App Groups
3. Open the main app using URL scheme: `laterai://share?content=...`

The main app will:
1. Check for shared content on launch
2. Open the SaveContentModal with the shared data
3. Process and save the content with AI classification

## Testing

1. Build and run the app on a simulator or device
2. Open Safari or any app with sharing capability
3. Share a URL or text
4. Select "Later AI" from the share sheet
5. The app should open with the SaveContentModal pre-filled

## Note

The actual implementation requires Xcode configuration which cannot be done programmatically. Follow the steps above in Xcode after running:
```bash
npx cap open ios
```
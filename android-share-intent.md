# Android Share Intent Setup Guide

## Steps to Configure Share Intent

1. Open Android project:
   ```bash
   npx cap open android
   ```

2. Update AndroidManifest.xml to handle share intents:

### Add to MainActivity in AndroidManifest.xml:

```xml
<activity
    android:name=".MainActivity"
    ...>
    
    <!-- Existing intent filters -->
    
    <!-- Share Intent Filter for Text -->
    <intent-filter>
        <action android:name="android.intent.action.SEND" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="text/plain" />
    </intent-filter>
    
    <!-- Share Intent Filter for URLs -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="http" />
        <data android:scheme="https" />
    </intent-filter>
    
    <!-- Share Intent Filter for Images -->
    <intent-filter>
        <action android:name="android.intent.action.SEND" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="image/*" />
    </intent-filter>
</activity>
```

3. Handle incoming intents in MainActivity.java:

The Capacitor framework will automatically handle the intent and pass it to the JavaScript layer through the App plugin.

4. Update the app to handle the shared content:
   - The handleIncomingShare function in capacitor.js will process the shared data
   - The SaveContentModal will be opened with the shared content

## Testing

1. Build and run the app on an emulator or device:
   ```bash
   npx cap run android
   ```

2. Open any app with sharing capability (Chrome, Twitter, etc.)
3. Share a URL, text, or image
4. Select "Later AI" from the share menu
5. The app should open with the SaveContentModal pre-filled

## Note

After adding the intent filters, rebuild the app:
```bash
npx cap sync android
npx cap run android
```
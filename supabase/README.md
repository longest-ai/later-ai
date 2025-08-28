# Supabase Setup Instructions

## 1. Database Setup

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/hqxfsonpjxnfafhwygwv
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy and paste the entire contents of `schema.sql`
5. Click **Run** to execute the SQL

This will create:
- `saved_items` table for storing user content
- `user_preferences` table for user settings
- Row Level Security policies
- Automatic triggers for timestamps
- Indexes for performance

## 2. Authentication Setup

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Enable **Google** provider:
   - You'll need to set up OAuth credentials in Google Cloud Console
   - Add the redirect URL from Supabase to Google OAuth
   - Add your Google Client ID and Secret to Supabase

## 3. Storage Setup (Optional for images)

1. Go to **Storage** in the sidebar
2. Create a new bucket called `content-images`
3. Set it to **Public** if you want images to be publicly accessible

## 4. Edge Functions Setup (for AI Classification)

Create a new Edge Function for OpenAI integration:

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Initialize in your project:
```bash
supabase init
```

4. Create the edge function:
```bash
supabase functions new classify-content
```

5. Add the function code (see `supabase/functions/classify-content/index.ts`)

6. Deploy the function:
```bash
supabase functions deploy classify-content
```

7. Set the OpenAI API key secret:
```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

## 5. Environment Variables

Make sure your `.env.local` file has:
```
VITE_SUPABASE_URL=https://hqxfsonpjxnfafhwygwv.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 6. Testing

1. Create a test account through the app
2. Check the **Authentication** → **Users** tab to see if the user was created
3. Check the **Table Editor** to see if user_preferences was created automatically
4. Try saving some content and check the saved_items table

## Common Issues

- **RLS Policy Error**: Make sure you're logged in when trying to access data
- **CORS Error**: Check that your app URL is in the allowed list in Supabase settings
- **Auth Error**: Check that email confirmation is disabled for testing (Authentication → Settings)
# Later AI Metadata Server

Backend server for Later AI that handles URL metadata fetching and content classification.

## Features

- Fetches webpage metadata (title, description, image) from any URL
- No CORS issues - server-side fetching
- AI content classification (coming soon with OpenAI integration)
- Supports Open Graph and Twitter meta tags

## Railway Deployment

1. Push this server folder to a GitHub repository
2. Connect the repository to Railway
3. Set environment variables in Railway:
   - `CLIENT_URL`: Your frontend URL (e.g., https://later-ai.vercel.app)
   - `OPENAI_API_KEY`: Your OpenAI API key (optional, for AI features)
4. Deploy!

Railway will automatically:
- Detect Node.js project
- Install dependencies
- Start the server on the assigned PORT

## Local Development

```bash
# Install dependencies
npm install

# Start server
npm start

# Start with watch mode (auto-restart on changes)
npm run dev
```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `CLIENT_URL`: Frontend URL for CORS
- `OPENAI_API_KEY`: OpenAI API key for content classification

## API Endpoints

### GET /
Health check endpoint

### POST /api/fetch-metadata
Fetches metadata from a URL

Request body:
```json
{
  "url": "https://example.com"
}
```

Response:
```json
{
  "title": "Page Title",
  "description": "Page description",
  "image": "https://example.com/image.jpg",
  "url": "https://example.com"
}
```

### POST /api/classify-content
Classifies content using AI (mock for now)

Request body:
```json
{
  "title": "Content Title",
  "content": "Content text",
  "url": "https://example.com"
}
```

Response:
```json
{
  "category": "기술",
  "tags": ["AI", "머신러닝"],
  "summary": "Content summary",
  "ai_processed": true
}
```# Trigger rebuild

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS with appropriate origins
app.use(cors({
  origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Later AI Metadata Server' });
});

// Endpoint to fetch metadata from a URL
app.post('/api/fetch-metadata', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    console.log('Fetching metadata for:', url);

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract metadata
    let title = '';
    let description = '';
    let image = '';

    // Try Open Graph title
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    if (ogTitle) {
      title = ogTitle;
    } else {
      // Try Twitter title
      const twitterTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
      if (twitterTitle) {
        title = twitterTitle;
      } else {
        // Fall back to regular title tag
        const titleTag = document.querySelector('title')?.textContent;
        if (titleTag) {
          title = titleTag.trim();
        }
      }
    }

    // Extract description
    const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
    if (ogDescription) {
      description = ogDescription;
    } else {
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content');
      if (metaDescription) {
        description = metaDescription;
      }
    }

    // Extract image
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
    if (ogImage) {
      image = ogImage;
    } else {
      const twitterImage = document.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
      if (twitterImage) {
        image = twitterImage;
      }
    }

    // Make relative image URLs absolute
    if (image && !image.startsWith('http')) {
      const urlObj = new URL(url);
      image = new URL(image, urlObj.origin).href;
    }

    console.log('Extracted metadata:', { title, description: description?.substring(0, 100) });

    res.json({
      title: title || 'Untitled',
      description: description || '',
      image: image || '',
      url: url,
    });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(200).json({
      title: 'Unable to fetch title',
      description: '',
      image: '',
      error: error.message,
    });
  }
});

// Endpoint to classify content using OpenAI
app.post('/api/classify-content', async (req, res) => {
  console.log('🎯 [AI Classification] Request received');
  try {
    const { title, content, url } = req.body;
    console.log('📝 [AI Classification] Input data:', {
      hasTitle: !!title,
      title: title,
      hasContent: !!content,
      contentLength: content?.length,
      hasUrl: !!url,
      url: url
    });
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ [AI Classification] OpenAI API key not configured, returning default classification');
      return res.json({
        category: '기타',
        tags: [],
        summary: title || content?.substring(0, 100) || '',
        ai_processed: false,
      });
    }
    
    console.log('🔑 [AI Classification] OpenAI API key is configured');
    
    // Prepare the content for classification
    const textToClassify = `
      Title: ${title || 'Untitled'}
      URL: ${url || ''}
      Content: ${content ? content.substring(0, 500) : ''}
    `;
    
    console.log('📤 [AI Classification] Calling OpenAI API with text length:', textToClassify.length);
    console.log('📋 [AI Classification] Text to classify:', textToClassify.substring(0, 200) + '...');
    
    // Call OpenAI API for classification
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that classifies content and generates tags. Always respond with JSON format only. IMPORTANT: Categories must be in KOREAN (기술, 비즈니스, 디자인, 교육, 정치, 경제, 사회, 문화, 건강, 기타) but tags must be in ENGLISH regardless of the content language. Summary should be in the same language as the content.'
        },
        {
          role: 'user',
          content: `Analyze the following content:

${textToClassify}

Respond in JSON format:
{
  "category": "기술|비즈니스|디자인|교육|정치|경제|사회|문화|건강|기타 (choose one, MUST BE IN KOREAN)",
  "tags": ["tag1", "tag2", "tag3"] (maximum 5 tags, key keywords related to content, MUST BE IN ENGLISH),
  "summary": "Brief summary (50 chars max, in the same language as the content)"
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: "json_object" }
    });
    
    console.log('✅ [AI Classification] OpenAI API response received');
    console.log('🤖 [AI Classification] Raw response:', completion.choices[0].message.content);
    
    const result = JSON.parse(completion.choices[0].message.content);
    
    console.log('📊 [AI Classification] Parsed result:', JSON.stringify(result, null, 2));
    
    const response = {
      category: result.category || '기타',
      tags: result.tags || [],
      summary: result.summary || '',
      ai_processed: true,
    };
    
    console.log('✨ [AI Classification] Sending response to client:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('❌ [AI Classification] Error classifying content:', error);
    console.error('🔍 [AI Classification] Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });
    res.status(200).json({
      category: '기타',
      tags: [],
      summary: '',
      ai_processed: false,
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Metadata server running on port ${PORT}`);
});
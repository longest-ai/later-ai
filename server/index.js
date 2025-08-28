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
      title: '제목을 가져올 수 없습니다',
      description: '',
      image: '',
      error: error.message,
    });
  }
});

// Endpoint to classify content using OpenAI
app.post('/api/classify-content', async (req, res) => {
  try {
    const { title, content, url } = req.body;
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not configured, returning default classification');
      return res.json({
        category: '기타',
        tags: [],
        summary: title || content?.substring(0, 100) || '',
        ai_processed: false,
      });
    }
    
    // Prepare the content for classification
    const textToClassify = `
      제목: ${title || '제목 없음'}
      URL: ${url || ''}
      내용: ${content ? content.substring(0, 500) : ''}
    `;
    
    // Call OpenAI API for classification
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content: '당신은 콘텐츠를 분류하고 태그를 생성하는 AI 어시스턴트입니다. 한국어로 답변하고, JSON 형식으로만 응답하세요.'
        },
        {
          role: 'user',
          content: `다음 콘텐츠를 분석해주세요:

${textToClassify}

다음 형식으로 JSON 응답해주세요:
{
  "category": "기술|비즈니스|디자인|교육|정치|경제|사회|문화|건강|기타 중 하나",
  "tags": ["태그1", "태그2", "태그3"] (최대 5개, 콘텐츠와 관련된 핵심 키워드),
  "summary": "50자 이내 요약"
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(completion.choices[0].message.content);
    
    console.log('AI classification result:', result);
    
    res.json({
      category: result.category || '기타',
      tags: result.tags || [],
      summary: result.summary || '',
      ai_processed: true,
    });
  } catch (error) {
    console.error('Error classifying content:', error);
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
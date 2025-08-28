// Follow this setup at https://supabase.com/docs/guides/functions/quickstart
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content, url, title } = await req.json()
    
    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Prepare the prompt for classification
    const prompt = `
    다음 콘텐츠를 분석하여 분류해주세요:
    
    제목: ${title || '제목 없음'}
    URL: ${url || ''}
    내용: ${content ? content.substring(0, 1000) : ''}
    
    다음 형식으로 JSON 응답해주세요:
    {
      "category": "기술|비즈니스|디자인|교육|기타 중 하나",
      "tags": ["태그1", "태그2", "태그3"] (최대 5개),
      "summary": "50자 이내 요약"
    }
    `

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a content classification assistant. Always respond in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
        response_format: { type: "json_object" }
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const openaiData = await openaiResponse.json()
    const classification = JSON.parse(openaiData.choices[0].message.content)

    // Validate and sanitize the response
    const validCategories = ['기술', '비즈니스', '디자인', '교육', '기타']
    const category = validCategories.includes(classification.category) 
      ? classification.category 
      : '기타'
    
    const tags = Array.isArray(classification.tags) 
      ? classification.tags.slice(0, 5).map(tag => String(tag).trim())
      : []
    
    const summary = String(classification.summary || '').substring(0, 100)

    return new Response(
      JSON.stringify({
        category,
        tags,
        summary,
        ai_processed: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        category: '기타',
        tags: [],
        summary: '',
        ai_processed: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 even on error to allow fallback
      }
    )
  }
})
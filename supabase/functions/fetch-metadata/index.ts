// Follow this setup at https://supabase.com/docs/guides/functions/quickstart
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'

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
    const { url } = await req.json()
    
    if (!url || !url.startsWith('http')) {
      throw new Error('Invalid URL provided')
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LaterAI/1.0; +https://later-ai.com)'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const html = await response.text()
    
    // Parse HTML to extract metadata
    const doc = new DOMParser().parseFromString(html, 'text/html')
    
    // Try multiple ways to get the title
    let title = ''
    
    // 1. Try Open Graph title
    const ogTitle = doc?.querySelector('meta[property="og:title"]')?.getAttribute('content')
    if (ogTitle) {
      title = ogTitle
    } else {
      // 2. Try Twitter title
      const twitterTitle = doc?.querySelector('meta[name="twitter:title"]')?.getAttribute('content')
      if (twitterTitle) {
        title = twitterTitle
      } else {
        // 3. Fall back to regular title tag
        const titleTag = doc?.querySelector('title')?.textContent
        if (titleTag) {
          title = titleTag.trim()
        }
      }
    }

    // Extract description
    let description = ''
    const ogDescription = doc?.querySelector('meta[property="og:description"]')?.getAttribute('content')
    if (ogDescription) {
      description = ogDescription
    } else {
      const metaDescription = doc?.querySelector('meta[name="description"]')?.getAttribute('content')
      if (metaDescription) {
        description = metaDescription
      }
    }

    // Extract image
    let image = ''
    const ogImage = doc?.querySelector('meta[property="og:image"]')?.getAttribute('content')
    if (ogImage) {
      image = ogImage
    } else {
      const twitterImage = doc?.querySelector('meta[name="twitter:image"]')?.getAttribute('content')
      if (twitterImage) {
        image = twitterImage
      }
    }

    return new Response(
      JSON.stringify({
        title: title || 'Untitled',
        description: description || '',
        image: image || '',
        url: url
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
        title: '제목을 가져올 수 없습니다',
        description: '',
        image: ''
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 even on error to allow fallback
      }
    )
  }
})
import { useState, useEffect } from 'react'
import { X, Link, FileText, Image, Loader2, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { handleIncomingShare } from '../services/capacitor'
import { saveContent, updateSavedItem } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function SaveContentModal({ isOpen, onClose, sharedContent = null, onSave, onAIUpdate }) {
  const { user } = useAuth()
  const [contentType, setContentType] = useState('url') // url, text, image
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [isFetchingTitle, setIsFetchingTitle] = useState(false)

  // Handle incoming shared content
  useEffect(() => {
    if (sharedContent) {
      if (sharedContent.type === 'url') {
        setContentType('url')
        setUrl(sharedContent.content)
        handleUrlPaste({ target: { value: sharedContent.content } })
      } else if (sharedContent.type === 'text') {
        setContentType('text')
        setText(sharedContent.content)
      }
    }
  }, [sharedContent])

  const handleSave = async () => {
    if (!user) {
      alert('Login required')
      return
    }
    
    // Wait for title fetching to complete
    if (isFetchingTitle) {
      alert('Fetching page information. Please wait a moment.')
      return
    }
    
    // Don't save with placeholder text
    if (title === 'Fetching page info...') {
      alert('Fetching page information. Please try again later.')
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Prepare data based on content type
      let itemData = {
        title: title || (contentType === 'url' ? 'Untitled' : text.substring(0, 50)),
        content: contentType === 'text' ? text : null,
        url: contentType === 'url' ? url : null,
        thumbnail_url: contentType === 'url' ? (thumbnail || null) : null,
        category: '기타',  // Keep Korean for database enum compatibility
        tags: [],
        ai_processed: false
      }
      
      // Save to database (without thumbnail)
      const { data, error } = await saveContent(itemData)
      
      if (error) throw error
      
      // Pass the new item to parent for immediate UI update
      if (data && onSave) {
        onSave(data)
      }
      
      // Trigger AI classification and update UI when done
      if (data) {
        classifyContent(data.id, itemData.content || '', itemData.title, itemData.url)
      }
      
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error saving item:', error)
      alert('Error saving')
    } finally {
      setIsProcessing(false)
    }
  }
  
  const classifyContent = async (itemId, content, title, url) => {
    console.log('🚀 [Client] Starting AI classification for item:', itemId)
    console.log('📋 [Client] Classification data:', { 
      hasContent: !!content, 
      contentLength: content?.length,
      title, 
      url 
    })
    
    try {
      // Call our backend server to classify content
      const serverUrl = import.meta.env.VITE_METADATA_SERVER_URL || 'http://localhost:3001'
      console.log('📡 [Client] Sending classification request to:', `${serverUrl}/api/classify-content`)
      
      const response = await fetch(`${serverUrl}/api/classify-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, title, url })
      })
      
      console.log('📨 [Client] Classification response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('🎯 [Client] Classification result received:', result)
        
        // Update the item in the database with classification results
        if (result.category || result.tags || result.summary) {
          console.log('💾 [Client] Updating item in database with:', {
            category: result.category,
            tags: result.tags,
            ai_summary: result.summary,
            ai_processed: result.ai_processed
          })
          
          const { data: updateData, error: updateError } = await updateSavedItem(itemId, {
            category: result.category || '기타',
            tags: result.tags || [],
            ai_summary: result.summary || '',
            ai_processed: result.ai_processed !== false
          })
          
          if (updateError) {
            console.error('❌ [Client] Error updating item in database:', updateError)
          } else {
            console.log('✅ [Client] Item successfully updated in database:', updateData)
            // Notify parent component about AI update
            if (onAIUpdate && updateData) {
              onAIUpdate(itemId, {
                category: result.category || '기타',
                tags: result.tags || [],
                ai_summary: result.summary || '',
                ai_processed: true
              })
            }
          }
        } else {
          console.warn('⚠️ [Client] No classification data to update')
        }
      } else {
        console.error('❌ [Client] Classification request failed with status:', response.status)
        const errorText = await response.text()
        console.error('❌ [Client] Error response:', errorText)
      }
    } catch (error) {
      console.error('❌ [Client] Error classifying content:', error)
      console.error('🔍 [Client] Error details:', {
        message: error.message,
        stack: error.stack
      })
    }
  }
  
  const resetForm = () => {
    setContentType('url')
    setUrl('')
    setText('')
    setTitle('')
    setThumbnail('')
    setAiResult(null)
  }

  const handleUrlPaste = async (e) => {
    const pastedText = e.target.value
    setUrl(pastedText)
    
    // Clear title if URL is empty
    if (!pastedText) {
      setTitle('')
      return
    }
    
    // Fetch actual page title
    if (pastedText.startsWith('http')) {
      setTitle('Fetching page info...')
      setIsFetchingTitle(true)
      
      try {
        // Call our backend server to fetch metadata
        const serverUrl = import.meta.env.VITE_METADATA_SERVER_URL || 'http://localhost:3001'
        const response = await fetch(`${serverUrl}/api/fetch-metadata`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: pastedText }),
        })
        
        if (response.ok) {
          const data = await response.json()
          setTitle(data.title || 'Untitled')
          setThumbnail(data.image || '')
          
          // You can also use description if needed
          // setDescription(data.description)
        } else {
          // Fallback to domain name
          const urlObj = new URL(pastedText)
          const hostname = urlObj.hostname.replace('www.', '')
          setTitle(hostname)
        }
      } catch (error) {
        console.error('Error fetching metadata:', error)
        // Fallback to domain name
        try {
          const urlObj = new URL(pastedText)
          const hostname = urlObj.hostname.replace('www.', '')
          setTitle(hostname)
        } catch {
          setTitle('Untitled')
        }
      } finally {
        setIsFetchingTitle(false)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Save New Content</CardTitle>
            <CardDescription>Save URL, text, or image and AI will automatically classify it</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Content Type Tabs */}
          <div className="flex gap-2">
            <Button
              variant={contentType === 'url' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContentType('url')}
            >
              <Link className="mr-2 h-4 w-4" />
              URL
            </Button>
            <Button
              variant={contentType === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContentType('text')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Text
            </Button>
            <Button
              variant={contentType === 'image' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContentType('image')}
            >
              <Image className="mr-2 h-4 w-4" />
              Image
            </Button>
          </div>

          {/* URL Input */}
          {contentType === 'url' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">URL</label>
                <Input
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => handleUrlPaste(e)}
                  onBlur={(e) => handleUrlPaste(e)}
                />
              </div>
              {title && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
              )}
            </div>
          )}

          {/* Text Input */}
          {contentType === 'text' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">제목</label>
                <Input
                  placeholder="Note title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <textarea
                  className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Enter text to save..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Image Upload */}
          {contentType === 'image' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-12 text-center">
                <Image className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop an image or
                </p>
                <Button variant="outline" size="sm">
                  Select file
                </Button>
              </div>
            </div>
          )}

          {/* AI Processing Result */}
          {aiResult && (
            <div className="rounded-lg border bg-secondary/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">AI Analysis Result</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <Badge>{aiResult.category}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Tags:</span>
                  <div className="flex gap-1">
                    {aiResult.tags.map(tag => (
                      <Badge key={tag} variant="outline">#{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Summary:</span>
                  <p className="text-sm mt-1">{aiResult.summary}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <div className="flex items-center gap-2">
            {!aiResult && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="mr-1 h-3 w-3" />
                AI will automatically classify
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isProcessing || isFetchingTitle || (!url && !text && !title)}>
              {(isProcessing || isFetchingTitle) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessing ? 'Saving...' : isFetchingTitle ? 'Fetching info...' : 'Save'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default SaveContentModal
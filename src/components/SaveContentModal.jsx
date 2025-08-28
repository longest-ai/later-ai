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
      alert('로그인이 필요합니다')
      return
    }
    
    // Wait for title fetching to complete
    if (isFetchingTitle) {
      alert('페이지 정보를 가져오는 중입니다. 잠시만 기다려주세요.')
      return
    }
    
    // Don't save with placeholder text
    if (title === '페이지 정보 가져오는 중...') {
      alert('페이지 정보를 가져오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Prepare data based on content type
      let itemData = {
        title: title || (contentType === 'url' ? '제목 없음' : text.substring(0, 50)),
        content: contentType === 'text' ? text : null,
        url: contentType === 'url' ? url : null,
        thumbnail_url: contentType === 'url' ? (thumbnail || null) : null,
        category: '기타',
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
      alert('저장 중 오류가 발생했습니다')
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
      setTitle('페이지 정보 가져오는 중...')
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
          setTitle(data.title || '제목 없음')
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
          setTitle('제목 없음')
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
            <CardTitle>새 콘텐츠 저장</CardTitle>
            <CardDescription>URL, 텍스트, 이미지를 저장하고 AI가 자동으로 분류합니다</CardDescription>
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
              텍스트
            </Button>
            <Button
              variant={contentType === 'image' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContentType('image')}
            >
              <Image className="mr-2 h-4 w-4" />
              이미지
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
                  <label className="text-sm font-medium">제목</label>
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
                  placeholder="메모 제목"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">내용</label>
                <textarea
                  className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="저장할 텍스트를 입력하세요..."
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
                  이미지를 드래그 앤 드롭하거나
                </p>
                <Button variant="outline" size="sm">
                  파일 선택
                </Button>
              </div>
            </div>
          )}

          {/* AI Processing Result */}
          {aiResult && (
            <div className="rounded-lg border bg-secondary/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">AI 분석 결과</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">카테고리:</span>
                  <Badge>{aiResult.category}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">태그:</span>
                  <div className="flex gap-1">
                    {aiResult.tags.map(tag => (
                      <Badge key={tag} variant="outline">#{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">요약:</span>
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
                AI가 자동으로 분류합니다
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={isProcessing || isFetchingTitle || (!url && !text && !title)}>
              {(isProcessing || isFetchingTitle) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessing ? '저장 중...' : isFetchingTitle ? '정보 가져오는 중...' : '저장하기'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default SaveContentModal
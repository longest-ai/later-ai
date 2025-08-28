import { useState } from 'react'
import { X, Link, FileText, Image, Loader2, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Badge } from './ui/badge'

function SaveContentModal({ isOpen, onClose }) {
  const [contentType, setContentType] = useState('url') // url, text, image
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiResult, setAiResult] = useState(null)

  const handleSave = async () => {
    setIsProcessing(true)
    
    // AI 분류 시뮬레이션 (나중에 실제 API 호출로 대체)
    setTimeout(() => {
      setAiResult({
        category: '기술',
        tags: ['프로그래밍', 'JavaScript', '웹개발'],
        summary: '웹 개발과 관련된 기술 문서입니다.'
      })
      setIsProcessing(false)
    }, 2000)
  }

  const handleUrlPaste = (e) => {
    const pastedText = e.target.value
    setUrl(pastedText)
    
    // URL에서 제목 추출 시뮬레이션
    if (pastedText.startsWith('http')) {
      setTitle('페이지 제목 가져오는 중...')
      setTimeout(() => {
        setTitle('예시 페이지 제목')
      }, 1000)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl">
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
            <Button onClick={handleSave} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isProcessing ? 'AI 분석 중...' : '저장하기'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default SaveContentModal
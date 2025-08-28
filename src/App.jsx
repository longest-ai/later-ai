import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { Badge } from './components/ui/badge'
import { BookOpen } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">Later AI</span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost">로그인</Button>
            <Button>시작하기</Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              나중에 볼 콘텐츠를 <br />
              AI가 자동으로 정리합니다
            </h1>
            <p className="text-lg text-muted-foreground">
              URL만 입력하면 AI가 자동으로 분류하고 태그를 생성합니다
            </p>
          </div>

          {/* Quick Save */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>빠른 저장</CardTitle>
              <CardDescription>URL을 붙여넣거나 텍스트를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input 
                  placeholder="https://example.com 또는 텍스트 입력..." 
                  className="flex-1"
                />
                <Button>저장하기</Button>
              </div>
              <div className="mt-2">
                <Badge variant="secondary">✨ AI가 자동으로 분류합니다</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Sample Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-2 text-base">
                      Next.js 14의 새로운 기능들
                    </CardTitle>
                    <CardDescription className="mt-2">
                      App Router와 서버 컴포넌트 활용법
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">React</Badge>
                  <Badge variant="outline">Next.js</Badge>
                  <Badge variant="secondary">기술</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-2 text-base">
                      스타트업 투자 유치 전략
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Series A 라운드 준비하기
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">스타트업</Badge>
                  <Badge variant="outline">투자</Badge>
                  <Badge variant="secondary">비즈니스</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Star, TrendingUp, Clock, Hash, Menu, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import SaveContentModal from '../components/SaveContentModal'
import { handleIncomingShare } from '../services/capacitor'

function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [sharedContent, setSharedContent] = useState(null)

  // Check for incoming share on mount
  useEffect(() => {
    const shared = handleIncomingShare()
    if (shared) {
      setSharedContent(shared)
      setIsModalOpen(true)
    }
  }, [])

  // Mock data - 나중에 실제 데이터로 대체
  const savedItems = [
    {
      id: 1,
      title: 'Next.js 14의 새로운 기능들: App Router와 서버 컴포넌트',
      description: 'Next.js 14에서 도입된 App Router와 React Server Components를 활용한 성능 최적화 방법',
      url: 'https://example.com/nextjs-14',
      category: '기술',
      tags: ['React', 'Next.js', '웹개발'],
      aiClassified: true,
      createdAt: '2시간 전',
      isStarred: false
    },
    {
      id: 2,
      title: '스타트업 투자 유치 전략: Series A 라운드 준비하기',
      description: '성공적인 Series A 투자 유치를 위한 준비 사항과 투자자들이 주목하는 핵심 지표',
      url: 'https://example.com/startup-funding',
      category: '비즈니스',
      tags: ['스타트업', '투자', 'VC'],
      aiClassified: true,
      createdAt: '5시간 전',
      isStarred: true
    },
    {
      id: 3,
      title: '2024 UX 디자인 트렌드: AI와 개인화의 시대',
      description: 'AI 기술이 UX 디자인에 미치는 영향과 사용자 경험 개인화의 최신 트렌드',
      url: 'https://example.com/ux-trends',
      category: '디자인',
      tags: ['UX', '디자인', 'AI'],
      aiClassified: true,
      createdAt: '어제',
      isStarred: false
    },
    {
      id: 4,
      title: '효과적인 학습법: 파인만 테크닉 활용하기',
      description: '노벨상 수상자 리처드 파인만의 학습 방법을 활용하여 복잡한 개념을 쉽게 이해하는 방법',
      url: '',
      category: '교육',
      tags: ['학습법', '교육', '자기계발'],
      aiClassified: true,
      createdAt: '2일 전',
      isStarred: false
    }
  ]

  const categories = [
    { id: 'all', name: '모든 콘텐츠', count: 142, icon: '📚' },
    { id: 'tech', name: '기술', count: 48, icon: '💻' },
    { id: 'business', name: '비즈니스', count: 32, icon: '💼' },
    { id: 'design', name: '디자인', count: 24, icon: '🎨' },
    { id: 'education', name: '교육', count: 18, icon: '📖' }
  ]

  const popularTags = [
    { name: 'AI', count: 23 },
    { name: '스타트업', count: 18 },
    { name: 'React', count: 15 },
    { name: '디자인', count: 12 }
  ]

  const Sidebar = () => (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-bold">Later AI</h1>
        <Button 
          variant="ghost" 
          size="sm" 
          className="md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        <button className="flex w-full items-center gap-3 rounded-lg bg-secondary px-3 py-2 text-sm font-medium">
          <span>📁</span>
          <span>모든 콘텐츠</span>
          <span className="ml-auto text-xs text-muted-foreground">142</span>
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary">
          <Star className="h-4 w-4" />
          <span>즐겨찾기</span>
          <span className="ml-auto text-xs text-muted-foreground">28</span>
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary">
          <TrendingUp className="h-4 w-4" />
          <span>AI 추천</span>
          <Badge variant="outline" className="ml-auto text-xs">새로움</Badge>
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary">
          <Clock className="h-4 w-4" />
          <span>최근 본</span>
        </button>
      </nav>

      {/* Categories */}
      <div className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">카테고리</h2>
        <div className="space-y-1">
          {categories.slice(1).map((category) => (
            <button
              key={category.id}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary"
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{category.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Popular Tags */}
      <div className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">인기 태그</h2>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <Badge key={tag.name} variant="outline" className="cursor-pointer hover:bg-secondary">
              #{tag.name}
              <span className="ml-1 text-xs text-muted-foreground">{tag.count}</span>
            </Badge>
          ))}
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 border-b bg-background">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">Later AI</h1>
          </div>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-0 h-full w-64 border-r bg-background p-6 overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-background p-6 overflow-y-auto">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8">
        {/* Quick Save - Desktop Only */}
        <Card className="hidden md:block mb-8">
          <CardContent className="p-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="URL을 붙여넣거나 텍스트를 입력하세요. AI가 자동으로 분류합니다..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                저장하기
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Search Bar */}
        <div className="md:hidden mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="검색..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex items-center justify-between overflow-x-auto">
          <div className="flex gap-2">
            <Button variant={selectedCategory === 'all' ? 'default' : 'outline'} size="sm">
              모든 콘텐츠
            </Button>
            <Button variant="outline" size="sm">
              읽지 않음
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex">
              AI 추천
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex">
              최근 저장
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">필터</span>
          </Button>
        </div>

        {/* Content Grid - Responsive */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {savedItems.map((item) => (
            <Card key={item.id} className="group cursor-pointer transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge variant="secondary" className="mb-2">
                    {item.category}
                  </Badge>
                  {item.aiClassified && (
                    <Badge variant="outline" className="text-xs">
                      ✨ AI
                    </Badge>
                  )}
                </div>
                <CardTitle className="line-clamp-2 text-base">
                  {item.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.createdAt}</span>
                  <div className="flex gap-2 md:opacity-0 transition-opacity md:group-hover:opacity-100">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Star className={`h-4 w-4 ${item.isStarred ? 'fill-current' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Hash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Floating Action Button - Mobile */}
      <Button 
        className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        onClick={() => setIsModalOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Save Content Modal */}
      <SaveContentModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false)
          setSharedContent(null)
        }}
        sharedContent={sharedContent}
      />
    </div>
  )
}

export default Home
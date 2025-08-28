import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Star, TrendingUp, Clock, Hash, Menu, X, Loader2, AlertCircle, LogOut } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import SaveContentModal from '../components/SaveContentModal'
import { handleIncomingShare } from '../services/capacitor'
import { getSavedItems, updateSavedItem, deleteSavedItem } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [sharedContent, setSharedContent] = useState(null)
  const [savedItems, setSavedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch saved items on mount
  useEffect(() => {
    fetchSavedItems()
    
    // Check for incoming share
    const shared = handleIncomingShare()
    if (shared) {
      setSharedContent(shared)
      setIsModalOpen(true)
    }
  }, [user])

  const fetchSavedItems = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await getSavedItems(user.id)
      
      if (error) throw error
      
      setSavedItems(data || [])
    } catch (err) {
      console.error('Error fetching saved items:', err)
      setError('콘텐츠를 불러오는 중 오류가 발생했습니다')
      setSavedItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (id) => {
    try {
      const { error } = await deleteSavedItem(id)
      if (error) throw error
      
      // Remove from local state
      setSavedItems(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      console.error('Error deleting item:', err)
      setError('항목 삭제 중 오류가 발생했습니다')
    }
  }

  const handleToggleStar = async (id, isStarred) => {
    try {
      const { error } = await updateSavedItem(id, { is_starred: !isStarred })
      if (error) throw error
      
      // Update local state
      setSavedItems(prev => prev.map(item => 
        item.id === id ? { ...item, is_starred: !isStarred } : item
      ))
    } catch (err) {
      console.error('Error updating star status:', err)
      setError('즐겨찾기 업데이트 중 오류가 발생했습니다')
    }
  }

  // Helper function to format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}일 전`
    if (hours > 0) return `${hours}시간 전`
    if (minutes > 0) return `${minutes}분 전`
    return '방금 전'
  }

  // Helper function to get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      '기술': '💻',
      '비즈니스': '💼',
      '디자인': '🎨',
      '교육': '📖',
      '기타': '📁'
    }
    return icons[category] || '📁'
  }

  // Calculate dynamic categories from saved items
  const categories = savedItems.reduce((acc, item) => {
    const existing = acc.find(cat => cat.id === item.category?.toLowerCase())
    if (existing) {
      existing.count++
    } else if (item.category) {
      acc.push({
        id: item.category.toLowerCase(),
        name: item.category,
        count: 1,
        icon: getCategoryIcon(item.category)
      })
    }
    return acc
  }, [
    { id: 'all', name: '모든 콘텐츠', count: savedItems.length, icon: '📚' }
  ])

  // Calculate popular tags from saved items
  const popularTags = savedItems.reduce((acc, item) => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach(tag => {
        const existing = acc.find(t => t.name === tag)
        if (existing) {
          existing.count++
        } else {
          acc.push({ name: tag, count: 1 })
        }
      })
    }
    return acc
  }, []).sort((a, b) => b.count - a.count).slice(0, 4)

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
          <span className="ml-auto text-xs text-muted-foreground">{savedItems.length}</span>
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary">
          <Star className="h-4 w-4" />
          <span>즐겨찾기</span>
          <span className="ml-auto text-xs text-muted-foreground">{savedItems.filter(item => item.is_starred).length}</span>
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
          {categories.filter(cat => cat.id !== 'all').map((category) => (
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && savedItems.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">아직 저장된 콘텐츠가 없습니다</h3>
            <p className="text-muted-foreground mb-4">URL을 붙여넣거나 브라우저 확장을 사용해 콘텐츠를 저장하세요</p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              첫 콘텐츠 저장하기
            </Button>
          </div>
        )}

        {/* Content Grid - Responsive */}
        {!loading && savedItems.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {savedItems.map((item) => (
            <Card key={item.id} className="group cursor-pointer transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge variant="secondary" className="mb-2">
                    {item.category}
                  </Badge>
                  {item.ai_processed && (
                    <Badge variant="outline" className="text-xs">
                      ✨ AI
                    </Badge>
                  )}
                </div>
                <CardTitle className="line-clamp-2 text-base">
                  {item.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {item.ai_summary || item.content || '설명이 없습니다'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.tags && Array.isArray(item.tags) && item.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatRelativeTime(item.created_at)}</span>
                  <div className="flex gap-2 md:opacity-0 transition-opacity md:group-hover:opacity-100">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleStar(item.id, item.is_starred)
                      }}
                    >
                      <Star className={`h-4 w-4 ${item.is_starred ? 'fill-current' : ''}`} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteItem(item.id)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
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
        onSave={() => {
          fetchSavedItems() // Refresh the list after saving
        }}
      />
    </div>
  )
}

export default Home
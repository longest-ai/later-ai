import { useState } from 'react'
import { BookOpen, Mail, Lock, Github, Chrome } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'

function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // 나중에 실제 인증 로직 구현
    console.log('Submit:', { email, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <BookOpen className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold">Later AI</span>
          </div>
        </div>

        {/* Login/SignUp Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{isSignUp ? '계정 만들기' : '로그인'}</CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'AI가 콘텐츠를 자동으로 정리하는 서비스를 시작하세요'
                : '다시 오신 것을 환영합니다'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  이메일
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Confirm Password (Sign Up Only) */}
              {isSignUp && (
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    비밀번호 확인
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full">
                {isSignUp ? '계정 만들기' : '로그인'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">또는</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                <Chrome className="mr-2 h-4 w-4" />
                Google로 계속하기
              </Button>
              <Button variant="outline" className="w-full">
                <Github className="mr-2 h-4 w-4" />
                GitHub로 계속하기
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="text-center text-sm">
              {isSignUp ? (
                <>
                  이미 계정이 있으신가요?{' '}
                  <button
                    onClick={() => setIsSignUp(false)}
                    className="text-primary hover:underline"
                  >
                    로그인
                  </button>
                </>
              ) : (
                <>
                  처음이신가요?{' '}
                  <button
                    onClick={() => setIsSignUp(true)}
                    className="text-primary hover:underline"
                  >
                    계정 만들기
                  </button>
                </>
              )}
            </div>
            {!isSignUp && (
              <button className="text-sm text-muted-foreground hover:text-foreground">
                비밀번호를 잊으셨나요?
              </button>
            )}
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          계속 진행하면 Later AI의{' '}
          <a href="#" className="hover:underline">서비스 약관</a>과{' '}
          <a href="#" className="hover:underline">개인정보 처리방침</a>에 동의하는 것입니다.
        </p>
      </div>
    </div>
  )
}

export default Login
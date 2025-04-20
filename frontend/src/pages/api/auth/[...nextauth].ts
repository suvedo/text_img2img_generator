import NextAuth, { DefaultSession, DefaultUser } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { 
    AuthOptions, 
    Account, 
    Profile, 
    User
  } from 'next-auth'
import { AdapterUser } from '@auth/core/adapters'
import { JWT } from 'next-auth/jwt'

// 扩展 Session 类型
declare module 'next-auth' {
    interface Session extends DefaultSession {
      user: {
        id: string
        accessToken?: string
      } & DefaultSession['user']
    }
  }

export const authOptions: AuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          // 增加超时时间
          timeout: 10000
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      httpOptions: {
        timeout: 10000 // 增加到 10 秒
      }
    })
  ],
  callbacks: {
    // 处理 JWT token
    async jwt({ token, account, profile }: { 
        token: JWT, 
        account: Account | null, 
        profile?: Profile 
      }) {
        if (account) {
          token.accessToken = account.access_token
          token.providerId = account.provider
        }
        return token
    },
    // 处理 session
    async session({ session, token }: { 
        session: any, 
        token: JWT 
      }) {
        if (session?.user) {
          session.user.id = token.sub
          // 添加访问令牌到会话中
          session.user.accessToken = token.accessToken as string
        }
        return session
    },
    // 登录回调
    async signIn({ user, account, profile }: { 
        user: User | AdapterUser, 
        account: Account | null, 
        profile?: Profile, 
        email?: { verificationRequest?: boolean } | undefined, 
        credentials?: Record<string, any> | null 
      }) {
        try {
          return true
        } catch (error) {
          console.error('Sign in error:', error)
          return false
        }
    },
    // 重定向回调
    async redirect({ url, baseUrl }: { 
      url: string, 
      baseUrl: string 
    }) {
      // 如果 URL 包含错误参数，重定向到错误页面
      const urlObj = new URL(url.startsWith('http') ? url : `${baseUrl}${url}`)
      if (urlObj.searchParams.has('error')) {
        return `${baseUrl}/auth/error?error=${urlObj.searchParams.get('error')}`
      }

      // 标准重定向逻辑
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      } else if (new URL(url).origin === baseUrl) {
        return url
      }
      return baseUrl
    }
  },

  pages: {
    signIn: '/auth/signin', // 自定义登录页面路径
    error: '/auth/error', // 错误页面
  },
  // 配置 JWT
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 天
  }
}

export default NextAuth(authOptions as AuthOptions)
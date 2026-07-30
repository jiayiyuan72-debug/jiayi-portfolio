import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export interface SessionData {
  isAdmin?: boolean;
  loggedInAt?: string;
}

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET || 'a-very-long-secret-key-that-must-be-at-least-32-characters',
  cookieName: 'jiayi_portfolio_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

// 获取会话（用于 App Router 路由处理器）
// Next.js 16: cookies() 返回 Promise
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
  return session;
}

// 验证管理员身份（用于 API 路由）
export async function requireAdmin(): Promise<IronSession<SessionData>> {
  const session = await getSession();
  if (!session.isAdmin) {
    throw new Error('Unauthorized');
  }
  return session;
}

// 中间件验证 - Next.js 16 使用 proxy 替代 middleware
// 此处保留用于 API 路由的手动验证
export async function validateSession(request: NextRequest): Promise<boolean> {
  const session = await getIronSession<SessionData>(request.cookies as any, SESSION_OPTIONS);
  return !!session.isAdmin;
}

export { SESSION_OPTIONS };

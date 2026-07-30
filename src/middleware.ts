import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只保护 /admin/* 页面路由（不保护 API 路由和登录页本身）
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // 登录页不需要保护
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // 静态资源不需要保护
  if (pathname.startsWith('/_next') || pathname.startsWith('/fonts') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  try {
    const session = await getIronSession(request.cookies as any, SESSION_OPTIONS);
    if (!session.isAdmin) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

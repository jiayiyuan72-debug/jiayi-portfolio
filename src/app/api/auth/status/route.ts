import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// GET /api/auth/status — 检查当前用户是否为管理员
// 供前台判断是否显示"返回后台"等编辑按钮
export async function GET() {
  try {
    const session = await getSession();
    return NextResponse.json({
      isAdmin: !!session.isAdmin,
      loggedInAt: session.loggedInAt || null,
    });
  } catch {
    return NextResponse.json({ isAdmin: false, loggedInAt: null });
  }
}

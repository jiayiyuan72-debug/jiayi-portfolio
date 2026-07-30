import { NextResponse } from 'next/server';
import { compare } from 'bcrypt-ts';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: '请输入密码' }, { status: 400 });
    }

    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!adminPasswordHash) {
      console.error('ADMIN_PASSWORD_HASH 环境变量未设置');
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    const isValid = await compare(password, adminPasswordHash);
    if (!isValid) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    const session = await getSession();
    session.isAdmin = true;
    session.loggedInAt = new Date().toISOString();
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}

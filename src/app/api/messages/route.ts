import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/session';

// GET /api/messages — 获取留言列表（管理员）
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('is_read'); // 'true' | 'false' | null
    const keyword = searchParams.get('keyword');

    let query = supabaseAdmin
      .from('visitor_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (isRead === 'true') {
      query = query.eq('is_read', true);
    } else if (isRead === 'false') {
      query = query.eq('is_read', false);
    }

    if (keyword) {
      query = query.or(`nickname.ilike.%${keyword}%,message.ilike.%${keyword}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('GET /api/messages error:', error);
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 500 });
  }
}

// POST /api/messages — 提交留言（公开）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证
    if (!body.nickname || body.nickname.trim().length < 1) {
      return NextResponse.json({ error: '请输入化名' }, { status: 400 });
    }
    if (body.nickname.trim().length > 30) {
      return NextResponse.json({ error: '化名不超过30个字符' }, { status: 400 });
    }
    if (!body.message || body.message.trim().length < 1) {
      return NextResponse.json({ error: '请输入留言' }, { status: 400 });
    }
    if (body.message.trim().length > 200) {
      return NextResponse.json({ error: '留言不超过200个字符' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('visitor_messages')
      .insert({
        nickname: body.nickname.trim(),
        message: body.message.trim(),
        visitor_ip: request.headers.get('x-forwarded-for') || '',
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/messages error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

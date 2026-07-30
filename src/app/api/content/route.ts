import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/session';

// GET /api/content — 获取内容列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('section_id');
    const all = searchParams.get('all');

    let query = supabaseAdmin
      .from('content_items')
      .select('*')
      .order('sort_order');

    if (sectionId) {
      query = query.eq('section_id', sectionId);
    }

    // 如果不指定 ?all=true，只返回已发布可见内容
    if (all !== 'true') {
      query = query
        .eq('is_visible', true)
        .eq('status', 'published');
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('GET /api/content error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/content — 创建内容（管理员）
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('content_items')
      .insert({
        section_id: body.section_id,
        title: body.title || '',
        content_type: body.content_type || 'article',
        fields: body.fields || {},
        body: body.body || '',
        media_urls: body.media_urls || [],
        file_urls: body.file_urls || [],
        tags: body.tags || [],
        sort_order: body.sort_order ?? 0,
        is_visible: body.is_visible ?? true,
        status: body.status || 'draft',
        published_at: body.status === 'published' ? new Date().toISOString() : null,
        meta_title: body.meta_title || '',
        meta_description: body.meta_description || '',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/content error:', error);
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 500 });
  }
}

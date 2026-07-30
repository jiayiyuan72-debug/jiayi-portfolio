import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/session';

// GET /api/sections — 获取可见板块列表（公开）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all');

    let query = supabaseAdmin
      .from('sections')
      .select('*')
      .order('sort_order');

    // 如果未指定 ?all=true，只返回可见板块
    if (all !== 'true') {
      query = query.eq('is_visible', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('GET /api/sections error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/sections — 创建新板块（管理员）
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('sections')
      .insert({
        name: body.name,
        slug: body.slug,
        layout_type: body.layout_type || 'card',
        field_schema: body.field_schema || [],
        style_config: body.style_config || {},
        is_visible: body.is_visible ?? true,
        sort_order: body.sort_order ?? 0,
        meta_title: body.meta_title || '',
        meta_description: body.meta_description || '',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/sections error:', error);
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 500 });
  }
}

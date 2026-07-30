import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/session';

// GET /api/sections/[id] — 获取单个板块详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('sections')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: '板块不存在' }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('GET /api/sections/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/sections/[id] — 更新板块（管理员）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('sections')
      .update({
        name: body.name,
        slug: body.slug,
        layout_type: body.layout_type,
        field_schema: body.field_schema,
        style_config: body.style_config,
        is_visible: body.is_visible,
        sort_order: body.sort_order,
        meta_title: body.meta_title,
        meta_description: body.meta_description,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('PUT /api/sections/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 500 });
  }
}

// DELETE /api/sections/[id] — 删除板块（管理员）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('sections')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/sections/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 500 });
  }
}

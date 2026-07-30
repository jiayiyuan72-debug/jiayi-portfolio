import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/session';

// GET /api/content/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('content_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: '内容不存在' }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('GET /api/content/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/content/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();

    const updateData: any = {
      title: body.title,
      content_type: body.content_type,
      fields: body.fields,
      body: body.body,
      media_urls: body.media_urls,
      file_urls: body.file_urls,
      tags: body.tags,
      sort_order: body.sort_order,
      is_visible: body.is_visible,
      status: body.status,
      meta_title: body.meta_title,
      meta_description: body.meta_description,
    };

    // 如果发布状态变更，更新发布时间
    if (body.status === 'published' && body.published_at === undefined) {
      updateData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('content_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('PUT /api/content/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 500 });
  }
}

// DELETE /api/content/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('content_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/content/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 500 });
  }
}

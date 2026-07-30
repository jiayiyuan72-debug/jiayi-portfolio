import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/session';

// PUT /api/sections/reorder — 批量更新板块排序（管理员）
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();

    const { order } = await request.json();
    // order: [{ id: string, sort_order: number }]

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: '无效的排序数据' }, { status: 400 });
    }

    // 批量更新 sort_order
    const updates = order.map((item: { id: string; sort_order: number }) =>
      supabaseAdmin
        .from('sections')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Reorder errors:', errors);
      return NextResponse.json({ error: '部分更新失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PUT /api/sections/reorder error:', error);
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 500 });
  }
}

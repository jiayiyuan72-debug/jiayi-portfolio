import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

// POST /api/import/confirm — 确认导入，批量创建内容
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { items, publishDirectly } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: '没有要导入的内容' }, { status: 400 });
    }

    // 获取板块 slug → id 映射
    const { data: sections } = await supabaseAdmin
      .from('sections')
      .select('id, slug');

    const sectionMap: Record<string, string> = {};
    (sections || []).forEach(s => {
      sectionMap[s.slug] = s.id;
    });

    // 批量创建内容项
    const results: any[] = [];
    const now = new Date().toISOString();
    const status = publishDirectly ? 'published' : 'draft';

    for (const item of items) {
      const sectionId = sectionMap[item.targetSection];
      if (!sectionId) {
        results.push({
          title: item.title,
          error: `未找到板块: ${item.targetSection}`,
          skipped: true,
        });
        continue;
      }

      try {
        const { data, error } = await supabaseAdmin
          .from('content_items')
          .insert({
            section_id: sectionId,
            title: item.title || '未命名',
            content_type: mapSectionToContentType(item.targetSection),
            fields: item.fields || {},
            body: item.body || '',
            media_urls: item.media_urls || [],
            file_urls: item.file_urls || [],
            tags: item.tags || [],
            sort_order: 0,
            is_visible: true,
            status,
            published_at: status === 'published' ? now : null,
          })
          .select()
          .single();

        if (error) {
          results.push({ title: item.title, error: error.message });
        } else {
          results.push({ title: item.title, id: data.id, success: true });
        }
      } catch (err: any) {
        results.push({ title: item.title, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => r.error).length;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: items.length,
        imported: successCount,
        failed: failCount,
        status,
      },
    });
  } catch (error: any) {
    console.error('Import confirm error:', error);
    return NextResponse.json(
      { error: error.message === 'Unauthorized' ? '未登录' : '导入失败' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

function mapSectionToContentType(sectionSlug: string): string {
  const map: Record<string, string> = {
    experience: 'article',
    education: 'article',
    travel: 'travelogue',
    diary: 'diary',
    thoughts: 'article',
    life: 'article',
    about: 'text',
    gallery: 'image',
  };
  return map[sectionSlug] || 'article';
}

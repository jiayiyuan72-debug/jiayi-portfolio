import { supabaseAdmin } from '@/lib/supabase/admin';
import { Section, ContentItem } from '@/types';
import VisitorNav from '@/components/visitor/VisitorNav';
import SectionRenderer from '@/components/visitor/SectionRenderer';

export const dynamic = 'force-dynamic';

export default async function PortfolioPage() {
  // 获取所有可见板块
  const { data: sections } = await supabaseAdmin
    .from('sections')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order');

  // 获取所有板块的已发布可见内容
  const sectionIds = sections?.map(s => s.id) ?? [];
  const { data: allContent } = await supabaseAdmin
    .from('content_items')
    .select('*')
    .in('section_id', sectionIds)
    .eq('is_visible', true)
    .eq('status', 'published')
    .order('sort_order');

  // 按 section_id 分组
  const contentBySection: Record<string, ContentItem[]> = {};
  allContent?.forEach(item => {
    if (!contentBySection[item.section_id]) {
      contentBySection[item.section_id] = [];
    }
    contentBySection[item.section_id].push(item as ContentItem);
  });

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <VisitorNav sections={(sections as Section[]) || []} />

      <main>
        {(sections as Section[])?.map(section => (
          <SectionRenderer
            key={section.id}
            section={section}
            contentItems={contentBySection[section.id] || []}
          />
        ))}

        {(!sections || sections.length === 0) && (
          <div className="max-w-5xl mx-auto px-4 py-32 text-center">
            <p className="text-[#b8b4ae]">暂无内容，请管理员在后台添加板块。</p>
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="border-t border-[#e8e4de] py-8 text-center text-xs text-[#b8b4ae]">
        © 2026 Jiayi
      </footer>
    </div>
  );
}

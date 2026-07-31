import { supabaseAdmin } from '@/lib/supabase/admin';
import { Section, ContentItem } from '@/types';
import VisitorNav from '@/components/visitor/VisitorNav';
import SectionRenderer from '@/components/visitor/SectionRenderer';
import PortfolioWrapper from '@/components/visitor/PortfolioWrapper';

// 使用 ISR 每 60 秒重新生成，提升加载速度
export const revalidate = 60;

export default async function PortfolioPage() {
  // 并行获取所有数据
  const [sectionsResult, contentResult] = await Promise.all([
    supabaseAdmin
      .from('sections')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order'),
    supabaseAdmin
      .from('content_items')
      .select('*')
      .eq('is_visible', true)
      .eq('status', 'published')
      .order('sort_order'),
  ]);

  const sections = sectionsResult.data || [];
  const allContent = contentResult.data || [];

  // 按 section_id 分组
  const contentBySection: Record<string, ContentItem[]> = {};
  allContent.forEach(item => {
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

      {/* 管理员悬浮按钮：登录状态下显示"返回后台" */}
      <PortfolioWrapper sections={(sections as Section[]) || []} />
    </div>
  );
}

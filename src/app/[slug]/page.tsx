import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Section, ContentItem } from '@/types';
import VisitorNav from '@/components/visitor/VisitorNav';
import SectionRenderer from '@/components/visitor/SectionRenderer';
import PortfolioWrapper from '@/components/visitor/PortfolioWrapper';

// ISR：板块变化后 60 秒内更新独立页
export const revalidate = 60;

// 并行取所有可见板块（供导航渲染）+ 当前板块 + 其内容
async function fetchPageData(slug: string) {
  const [sectionsResult, singleResult, contentResult] = await Promise.all([
    supabaseAdmin
      .from('sections')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order'),
    supabaseAdmin
      .from('sections')
      .select('*')
      .eq('slug', slug)
      .eq('is_visible', true)
      .single(),
    supabaseAdmin
      .from('content_items')
      .select('*')
      .eq('is_visible', true)
      .eq('status', 'published'),
  ]);

  const sections = (sectionsResult.data || []) as Section[];
  const section = singleResult.data as Section | null;
  const allContent = (contentResult.data || []) as ContentItem[];

  // 只保留当前板块的内容
  const contentItems = section ? allContent.filter(i => i.section_id === section.id) : [];

  return { sections, section, contentItems };
}

// 为所有可见板块预生成静态页（配合 dynamicParams + ISR，新板块也能访问）
export async function generateStaticParams() {
  const { data } = await supabaseAdmin
    .from('sections')
    .select('slug')
    .eq('is_visible', true);
  return (data || []).map(s => ({ slug: s.slug }));
}

// 未在 generateStaticParams 列出的 slug（如后台新加的）也允许按需生成
export const dynamicParams = true;

// 每个板块页的 SEO（优先用 style_config.page 的配置，其次 meta_title/meta_description）
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const { section } = await fetchPageData(slug);

  if (!section) {
    return { title: '未找到页面' };
  }

  const title = section.style_config?.page?.page_meta_title || section.meta_title || section.name;
  const description =
    section.style_config?.page?.page_meta_description ||
    section.meta_description ||
    section.style_config?.page?.subtitle ||
    '';

  return {
    title: title ? `${title} | Jiayi 的个人空间` : 'Jiayi 的个人空间',
    description: description || undefined,
  };
}

export default async function SectionPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { sections, section, contentItems } = await fetchPageData(slug);

  if (!section) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <VisitorNav sections={sections} />

      <main>
        <SectionRenderer section={section} contentItems={contentItems} />
      </main>

      {/* 页脚 */}
      <footer className="border-t border-[#e8e4de] py-8 text-center text-xs text-[#b8b4ae]">
        © 2026 Jiayi
      </footer>

      {/* 管理者悬浮按钮：登录后显示"编辑此页面/返回后台" */}
      <PortfolioWrapper sections={sections} />
    </div>
  );
}

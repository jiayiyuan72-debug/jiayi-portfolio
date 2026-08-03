'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteConfig } from '@/types/site-config';
import { Section } from '@/types/section';
import { QUESTIONNAIRE_KEY, SKIP_DAYS } from '@/lib/constants';
import QuestionnaireModal from '@/components/visitor/QuestionnaireModal';
import SectionEntryCard from '@/components/visitor/SectionEntryCard';

export default function HomePage() {
  const router = useRouter();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/site-config').then(r => r.json()),
      fetch('/api/sections').then(r => r.json()),
    ])
      .then(([cfg, sec]) => {
        setConfig(cfg.data ?? null);
        setSections((sec.data || []));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 问卷完成后进入的内容页路由：多页面结构下，落到第一个可见板块页（如 /about）
  // 若无可见板块则回首页，保证始终有页面可去
  const contentPath = sections.length > 0 ? `/${sections[0].slug}` : '/';

  const handleVisitorClick = () => {
    const stored = localStorage.getItem(QUESTIONNAIRE_KEY);
    let entered = false;
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.submitted) {
          entered = true;
        } else if (data.skippedAt) {
          const daysSinceSkip = (Date.now() - data.skippedAt) / (1000 * 60 * 60 * 24);
          if (daysSinceSkip < SKIP_DAYS) entered = true;
        }
      } catch {
        // ignore
      }
    }
    // 已提交过或跳过未过期：直接进入内容页（不弹问卷）
    if (entered) {
      router.push(contentPath);
      return;
    }
    // 首次访问：弹出问卷
    setShowQuestionnaire(true);
  };

  const handleQuestionnaireComplete = () => {
    setShowQuestionnaire(false);
    router.push(contentPath);
  };

  const handleSkip = () => {
    localStorage.setItem(QUESTIONNAIRE_KEY, JSON.stringify({ skippedAt: Date.now() }));
    setShowQuestionnaire(false);
    router.push(contentPath);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f2]">
        <div className="animate-pulse text-[#d4a574] text-lg">loading...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: config?.entry_style?.bg_color || '#faf7f2' }}
    >
      {/* 入口主区域 */}
      <div
        className="flex flex-col items-center justify-center px-6 relative overflow-hidden min-h-screen"
        style={{ color: config?.entry_style?.text_color || '#2d2a24' }}
      >
        {/* 装饰性背景 */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#d4a574]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#e8c4a0]/5 rounded-full blur-3xl" />

        <div className="text-center relative z-10 max-w-2xl">
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-wide entry-enter"
            style={{
              fontFamily: "'Ma Shan Zheng', cursive, 'system-ui'",
              color: config?.entry_style?.text_color || '#2d2a24',
            }}
          >
            {config?.entry_title || "WELCOME TO JIAYI'S UNIVERSE"}
          </h1>

          <p className="text-lg md:text-xl text-[#8b8b8b] mb-12 tracking-widest entry-enter">
            {config?.entry_subtitle || "JIAYI'S PORTFOLIO"}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center entry-enter">
            <button
              onClick={handleVisitorClick}
              className="px-10 py-3 bg-[#2d2a24] text-[#faf7f2] rounded-full text-base
                         hover:bg-[#4a443c] transition-all duration-300 tracking-wider
                         shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              {config?.visitor_button_text || '我是访客'}
            </button>
            <button
              onClick={() => router.push('/admin/login')}
              className="px-10 py-3 border-2 border-[#2d2a24] text-[#2d2a24] rounded-full text-base
                         hover:bg-[#2d2a24] hover:text-[#faf7f2] transition-all duration-300 tracking-wider
                         active:scale-[0.98]"
            >
              {config?.admin_button_text || '我是管理者'}
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 text-xs text-[#b8b4ae]">
          {config?.footer_text || '© 2026 Jiayi'}
        </div>
      </div>

      {/* 板块入口卡片区（总览，每个卡片链接到独立页） */}
      <section id="explore" className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-20 scroll-mt-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2d2a24] tracking-wider">
            探索 Jiayi 的世界
          </h2>
          <p className="mt-2 text-sm text-[#8b8b8b]">选择你想了解的板块</p>
        </div>

        {sections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sections.map(section => (
              <SectionEntryCard key={section.id} section={section} />
            ))}
          </div>
        ) : (
          <p className="text-center text-[#b8b4ae]">暂无板块，请管理员在后台添加。</p>
        )}
      </section>

      {showQuestionnaire && (
        <QuestionnaireModal
          onComplete={handleQuestionnaireComplete}
          onSkip={handleSkip}
          onClose={() => setShowQuestionnaire(false)}
        />
      )}
    </div>
  );
}

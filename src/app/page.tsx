'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteConfig } from '@/types/site-config';
import { QUESTIONNAIRE_KEY, SKIP_DAYS } from '@/lib/constants';
import QuestionnaireModal from '@/components/visitor/QuestionnaireModal';

export default function HomePage() {
  const router = useRouter();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/site-config')
      .then(res => res.json())
      .then(({ data }) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleVisitorClick = () => {
    const stored = localStorage.getItem(QUESTIONNAIRE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.submitted) {
          router.push('/portfolio');
          return;
        }
        if (data.skippedAt) {
          const daysSinceSkip = (Date.now() - data.skippedAt) / (1000 * 60 * 60 * 24);
          if (daysSinceSkip < SKIP_DAYS) {
            router.push('/portfolio');
            return;
          }
        }
      } catch {
        // ignore
      }
    }
    setShowQuestionnaire(true);
  };

  const handleQuestionnaireComplete = () => {
    setShowQuestionnaire(false);
    router.push('/portfolio');
  };

  const handleSkip = () => {
    localStorage.setItem(QUESTIONNAIRE_KEY, JSON.stringify({ skippedAt: Date.now() }));
    setShowQuestionnaire(false);
    router.push('/portfolio');
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
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{
        backgroundColor: config?.entry_style?.bg_color || '#faf7f2',
        color: config?.entry_style?.text_color || '#2d2a24',
      }}
    >
      {/* 装饰性背景 */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#d4a574]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#e8c4a0]/5 rounded-full blur-3xl" />

      {/* 主内容 */}
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

        <div className="mt-16 flex items-center justify-center gap-6 text-sm text-[#b8b4ae] entry-enter">
          <button
            onClick={() => setShowNav(!showNav)}
            onMouseEnter={() => setShowNav(true)}
            className="hover:text-[#2d2a24] transition-colors"
          >
            Explore
          </button>
        </div>

        {showNav && (
          <div
            className="mt-4 flex items-center justify-center gap-6 text-sm text-[#8b8b8b] entry-enter"
            onMouseLeave={() => setShowNav(false)}
          >
            <span>About</span>
            <span>·</span>
            <span>Works</span>
            <span>·</span>
            <span>Gallery</span>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 text-xs text-[#b8b4ae]">
        {config?.footer_text || '© 2026 Jiayi'}
      </div>

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

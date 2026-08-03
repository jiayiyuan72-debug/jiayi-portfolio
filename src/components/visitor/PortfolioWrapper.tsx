'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Section } from '@/types';

interface Props {
  sections: Section[];
}

export default function PortfolioWrapper({ sections }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setIsAdmin(!!data.isAdmin);
    } catch {
      setIsAdmin(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditSection = (slug: string) => {
    router.push(`/admin/editor?section=${slug}`);
  };

  // 当前所在板块页的 slug（例如 /experience -> experience）；首页(/ 或 /portfolio)无当前板块
  const currentSlug = pathname?.split('/').filter(Boolean)[0] || null;
  const currentSection = sections.find(s => s.slug === currentSlug) || null;

  // 非登录状态或仍在检查时不显示任何按钮
  if (checking || !isAdmin) {
    return null;
  }

  return (
    <>
      {/* 右下角悬浮"返回后台"按钮 */}
      <button
        onClick={() => router.push('/admin/editor')}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5
                   bg-[#2d2a24] text-white rounded-full text-sm shadow-lg
                   hover:bg-[#4a443c] transition-all duration-200
                   hover:shadow-xl active:scale-95"
        title="返回后台编辑器"
      >
        <span>✏️</span>
        <span>返回后台</span>
      </button>

      {/* 左下：当前板块的"编辑此页面" + 板块快捷入口 */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
        {/* 编辑器面板：列出所有板块 + 当前板块高亮 */}
        <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg border border-[#e8e4de] p-2 max-h-72 overflow-y-auto">
          <p className="text-xs text-[#8b8b8b] px-2 pt-1 pb-1.5">编辑板块</p>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => handleEditSection(section.slug)}
              className={`flex items-center gap-2 w-full px-2 py-1.5 text-left text-sm rounded-lg transition-colors ${
                currentSection?.slug === section.slug
                  ? 'bg-[#f8f5f0] text-[#2d2a24] font-medium'
                  : 'text-[#2d2a24] hover:bg-[#f8f5f0]'
              }`}
            >
              <span className="text-xs">✏️</span>
              <span>{section.name}</span>
            </button>
          ))}
        </div>

        {/* 当前板块页：编辑此页面 */}
        {currentSection && (
          <button
            onClick={() => handleEditSection(currentSection.slug)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#d4a574]
                       rounded-xl shadow-lg hover:bg-[#c8976a] transition-colors"
          >
            <span>🖊️</span>
            <span>编辑此页面</span>
          </button>
        )}

        <button
          onClick={() => router.push('/admin/editor')}
          className="flex items-center gap-2 px-3 py-2 text-sm text-[#2d2a24] bg-white/95 backdrop-blur
                     rounded-xl shadow-lg border border-[#e8e4de] hover:bg-[#f8f5f0] transition-colors"
        >
          <span>⚙️</span>
          <span>网站编辑</span>
        </button>
      </div>
    </>
  );
}

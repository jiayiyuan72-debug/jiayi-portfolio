'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Section } from '@/types';

interface Props {
  sections: Section[];
}

export default function PortfolioWrapper({ sections }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

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

  const handleEditSection = (slug: string) => {
    router.push(`/admin/editor?section=${slug}`);
  };

  const handleScrollToSection = (slug: string) => {
    const el = document.getElementById(slug);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push(`/portfolio#${slug}`);
    }
  };

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

      {/* 每个板块的"编辑此板块"悬浮小按钮 */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg border border-[#e8e4de] p-2 max-h-72 overflow-y-auto">
          <p className="text-xs text-[#8b8b8b] px-2 pt-1 pb-1.5">编辑板块</p>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => handleEditSection(section.slug)}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-left text-sm text-[#2d2a24]
                         hover:bg-[#f8f5f0] rounded-lg transition-colors"
            >
              <span className="text-xs">✏️</span>
              <span>{section.name}</span>
            </button>
          ))}
        </div>
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

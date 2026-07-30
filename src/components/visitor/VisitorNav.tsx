'use client';

import { useState } from 'react';
import { Section } from '@/types/section';

interface Props {
  sections: Section[];
}

export default function VisitorNav({ sections }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleClick = (slug: string) => {
    const el = document.getElementById(slug);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-[#faf7f2]/90 backdrop-blur-md border-b border-[#e8e4de]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <span className="text-sm font-medium text-[#2d2a24] tracking-wider">
            Jiayi
          </span>

          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center gap-6">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => handleClick(section.slug)}
                className="text-sm text-[#8b8b8b] hover:text-[#2d2a24] transition-colors"
              >
                {section.name}
              </button>
            ))}
          </div>

          {/* 移动端菜单按钮 */}
          <div className="md:hidden relative">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-[#8b8b8b] hover:text-[#2d2a24]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {mobileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMobileOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-[#e8e4de] py-2 z-20">
                  {sections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => {
                        handleClick(section.slug);
                        setMobileOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-[#2d2a24] hover:bg-[#f8f5f0] transition-colors"
                    >
                      {section.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

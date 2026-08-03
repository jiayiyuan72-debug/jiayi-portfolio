'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Section } from '@/types/section';

interface Props {
  sections: Section[];
}

export default function VisitorNav({ sections }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // 只显示配置了"在导航显示"的板块（默认显示）
  const navSections = sections.filter(s => (s.style_config?.page?.show_in_nav ?? true));

  const isActive = (href: string) => pathname === href;

  const linkClass = (href: string) =>
    `text-sm transition-colors hover:text-[#2d2a24] ${
      isActive(href) ? 'text-[#2d2a24] font-medium' : 'text-[#8b8b8b]'
    }`;

  return (
    <nav className="sticky top-0 z-40 bg-[#faf7f2]/90 backdrop-blur-md border-b border-[#e8e4de]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="text-sm font-medium text-[#2d2a24] tracking-wider hover:opacity-70">
            Jiayi
          </Link>

          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className={linkClass('/')}>
              首页
            </Link>
            {navSections.map(section => (
              <Link
                key={section.id}
                href={`/${section.slug}`}
                className={linkClass(`/${section.slug}`)}
              >
                {section.name}
              </Link>
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
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full px-4 py-2 text-sm text-[#2d2a24] hover:bg-[#f8f5f0] transition-colors"
                  >
                    首页
                  </Link>
                  {navSections.map(section => (
                    <Link
                      key={section.id}
                      href={`/${section.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="block w-full px-4 py-2 text-sm text-[#2d2a24] hover:bg-[#f8f5f0] transition-colors"
                    >
                      {section.name}
                    </Link>
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

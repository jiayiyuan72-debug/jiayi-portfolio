'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // 登录页使用独立布局
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: '/admin/editor', label: '网站编辑', icon: '🎨' },
    { href: '/admin/import', label: '智能导入', icon: '🤖' },
    { href: '/admin/messages', label: '访客留言', icon: '💬' },
    { href: '/admin/settings', label: '站点设置', icon: '⚙️' },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('已退出登录');
      window.location.href = '/';
    } catch {
      toast.error('退出失败');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-[#e8e4de]
          flex flex-col z-50 transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="p-6 border-b border-[#e8e4de]">
          <Link href="/admin" className="text-lg font-bold text-[#2d2a24] tracking-wider">
            Jiayi CMS
          </Link>
          <p className="text-xs text-[#8b8b8b] mt-1">后台管理</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors
                  ${isActive
                    ? 'bg-[#2d2a24] text-white'
                    : 'text-[#5a5349] hover:bg-[#f8f5f0]'
                  }
                `}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#e8e4de] space-y-2">
          <Link
            href="/portfolio"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-[#5a5349] hover:bg-[#f8f5f0] transition-colors"
          >
            <span>👁️</span>
            <span>查看前台</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-[#8b8b8b] hover:bg-[#f8f5f0] transition-colors w-full"
          >
            <span>🚪</span>
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 min-w-0">
        {/* 顶部栏（移动端） */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#e8e4de] md:hidden">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-[#8b8b8b]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-sm font-medium text-[#2d2a24]">Jiayi CMS</span>
            <div className="w-9" />
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

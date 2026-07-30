'use client';

import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { SiteConfig } from '@/types/site-config';

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 表单字段
  const [siteTitle, setSiteTitle] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [entrySubtitle, setEntrySubtitle] = useState('');
  const [visitorBtn, setVisitorBtn] = useState('');
  const [adminBtn, setAdminBtn] = useState('');
  const [footerText, setFooterText] = useState('');

  // 入口页样式
  const [bgColor, setBgColor] = useState('#faf7f2');
  const [textColor, setTextColor] = useState('#2d2a24');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/site-config');
      const { data } = await res.json();

      setConfig(data);
      setSiteTitle(data.site_title || '');
      setSiteDescription(data.site_description || '');
      setEntryTitle(data.entry_title || '');
      setEntrySubtitle(data.entry_subtitle || '');
      setVisitorBtn(data.visitor_button_text || '');
      setAdminBtn(data.admin_button_text || '');
      setFooterText(data.footer_text || '');
      setBgColor(data.entry_style?.bg_color || '#faf7f2');
      setTextColor(data.entry_style?.text_color || '#2d2a24');
    } catch {
      toast.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_title: siteTitle,
          site_description: siteDescription,
          entry_title: entryTitle,
          entry_subtitle: entrySubtitle,
          visitor_button_text: visitorBtn,
          admin_button_text: adminBtn,
          footer_text: footerText,
          entry_style: {
            bg_color: bgColor,
            text_color: textColor,
          },
        }),
      });

      if (!res.ok) throw new Error();
      toast.success('设置已保存');
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse text-[#d4a574]">加载中...</div>;

  return (
    <div className="max-w-3xl">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#2d2a24]">站点设置</h1>
          <p className="text-sm text-[#8b8b8b] mt-1">配置网站名称、入口页文案和样式</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#2d2a24] text-white rounded-xl text-sm
                     hover:bg-[#4a443c] disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      <div className="space-y-6">
        {/* 基本设置 */}
        <div className="bg-white rounded-xl p-6 border border-[#e8e4de]">
          <h2 className="text-base font-bold text-[#2d2a24] mb-4">基本信息</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">网站标题</label>
              <input
                type="text"
                value={siteTitle}
                onChange={e => setSiteTitle(e.target.value)}
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">SEO 描述</label>
              <input
                type="text"
                value={siteDescription}
                onChange={e => setSiteDescription(e.target.value)}
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">页脚文本</label>
              <input
                type="text"
                value={footerText}
                onChange={e => setFooterText(e.target.value)}
                placeholder="© 2026 Jiayi"
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
              />
            </div>
          </div>
        </div>

        {/* 入口页文案 */}
        <div className="bg-white rounded-xl p-6 border border-[#e8e4de]">
          <h2 className="text-base font-bold text-[#2d2a24] mb-4">入口页文案</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">主标题</label>
              <input
                type="text"
                value={entryTitle}
                onChange={e => setEntryTitle(e.target.value)}
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
              />
              <p className="text-xs text-[#b8b4ae] mt-1">默认：WELCOME TO JIAYI'S UNIVERSE</p>
            </div>
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">副标题</label>
              <input
                type="text"
                value={entrySubtitle}
                onChange={e => setEntrySubtitle(e.target.value)}
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
              />
              <p className="text-xs text-[#b8b4ae] mt-1">默认：JIAYI'S PORTFOLIO</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#2d2a24] mb-1">访客按钮文案</label>
                <input
                  type="text"
                  value={visitorBtn}
                  onChange={e => setVisitorBtn(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
                />
              </div>
              <div>
                <label className="block text-sm text-[#2d2a24] mb-1">管理者按钮文案</label>
                <input
                  type="text"
                  value={adminBtn}
                  onChange={e => setAdminBtn(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 入口页样式 */}
        <div className="bg-white rounded-xl p-6 border border-[#e8e4de]">
          <h2 className="text-base font-bold text-[#2d2a24] mb-4">入口页样式</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">背景颜色</label>
              <input
                type="color"
                value={bgColor}
                onChange={e => setBgColor(e.target.value)}
                className="w-full h-10 rounded-lg border border-[#e8e4de] cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">文字颜色</label>
              <input
                type="color"
                value={textColor}
                onChange={e => setTextColor(e.target.value)}
                className="w-full h-10 rounded-lg border border-[#e8e4de] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

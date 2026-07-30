'use client';

import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { VisitorMessage } from '@/types/message';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<VisitorMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages');
      const { data } = await res.json();
      setMessages(data || []);
    } catch {
      toast.error('加载留言失败');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string, is_read: boolean) => {
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read }),
      });

      if (!res.ok) throw new Error();
      fetchMessages();
    } catch {
      toast.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除这条留言吗？')) return;

    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('留言已删除');
      fetchMessages();
    } catch {
      toast.error('删除失败');
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (filter === 'unread') return !msg.is_read;
    if (filter === 'read') return msg.is_read;
    return true;
  }).filter(msg => {
    if (!keyword.trim()) return true;
    const kw = keyword.toLowerCase();
    return msg.nickname.toLowerCase().includes(kw) || msg.message.toLowerCase().includes(kw);
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (loading) return <div className="animate-pulse text-[#d4a574]">加载中...</div>;

  return (
    <div>
      <Toaster position="top-center" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#2d2a24]">访客留言</h1>
          <p className="text-sm text-[#8b8b8b] mt-1">
            共 {messages.length} 条留言
            {unreadCount > 0 && <span className="ml-2 text-[#d4a574]">（{unreadCount} 条未读）</span>}
          </p>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2">
          {(['all', 'unread', 'read'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                filter === f
                  ? 'bg-[#2d2a24] text-white border-[#2d2a24]'
                  : 'border-[#e8e4de] text-[#8b8b8b] hover:bg-[#f8f5f0]'
              }`}
            >
              {{ all: '全部', unread: '未读', read: '已读' }[f]}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder="搜索化名或留言内容..."
          className="px-3 py-1.5 border border-[#e8e4de] rounded-lg text-sm flex-1 max-w-xs
                     focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
        />
      </div>

      {/* 留言列表 */}
      <div className="space-y-3">
        {filteredMessages.map(msg => (
          <div
            key={msg.id}
            className={`bg-white rounded-xl p-5 border transition-colors ${
              !msg.is_read ? 'border-[#d4a574]/30 bg-[#fdfaf5]' : 'border-[#e8e4de]'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-sm font-medium text-[#2d2a24]">
                  {msg.nickname}
                </span>
                <span className="text-xs text-[#b8b4ae] ml-3">
                  {new Date(msg.created_at).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {!msg.is_read && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-[#d4a574]/10 text-[#d4a574] rounded-full">
                    未读
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-[#5a5349] mb-3">{msg.message}</p>

            <div className="flex gap-2">
              {!msg.is_read && (
                <button
                  onClick={() => handleMarkRead(msg.id, true)}
                  className="px-3 py-1 text-xs border border-[#e8e4de] rounded-lg
                             hover:bg-[#f8f5f0] transition-colors"
                >
                  标记已读
                </button>
              )}
              {msg.is_read && (
                <button
                  onClick={() => handleMarkRead(msg.id, false)}
                  className="px-3 py-1 text-xs border border-[#e8e4de] rounded-lg
                             hover:bg-[#f8f5f0] transition-colors"
                >
                  标记未读
                </button>
              )}
              <button
                onClick={() => handleDelete(msg.id)}
                className="px-3 py-1 text-xs text-red-400 border border-red-200 rounded-lg
                           hover:bg-red-50 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        ))}

        {filteredMessages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-[#b8b4ae]">暂无留言</p>
          </div>
        )}
      </div>
    </div>
  );
}

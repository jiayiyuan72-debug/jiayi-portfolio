'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { QUESTIONNAIRE_KEY } from '@/lib/constants';

interface Props {
  onComplete: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function QuestionnaireModal({ onComplete, onSkip, onClose }: Props) {
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      toast.error('请输入化名');
      return;
    }
    if (nickname.trim().length > 30) {
      toast.error('化名不超过30个字符');
      return;
    }
    if (!message.trim()) {
      toast.error('请输入你想说的话');
      return;
    }
    if (message.trim().length > 200) {
      toast.error('留言不超过200个字符');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '提交失败');
      }

      localStorage.setItem(QUESTIONNAIRE_KEY, JSON.stringify({ submitted: true }));
      toast.success('感谢你的留言！');
      onComplete();
    } catch (error: any) {
      toast.error(error.message || '提交失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 fade-in">
        <h2 className="text-xl font-medium text-[#2d2a24] mb-2">
          欢迎来访 🌟
        </h2>
        <p className="text-sm text-[#8b8b8b] mb-6">
          在进入之前，可以留下你的名字和想说的话吗？
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#2d2a24] mb-1">
              你的化名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="例如：小星星"
              maxLength={30}
              className="w-full px-4 py-2.5 border border-[#e8e4de] rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30 focus:border-[#d4a574]
                         text-sm transition-all"
            />
            <p className="text-xs text-[#b8b4ae] mt-1">{nickname.length}/30</p>
          </div>

          <div>
            <label className="block text-sm text-[#2d2a24] mb-1">
              想对 Jiayi 说的话 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="喜欢你的网站！加油~"
              maxLength={200}
              rows={3}
              className="w-full px-4 py-2.5 border border-[#e8e4de] rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30 focus:border-[#d4a574]
                         text-sm resize-none transition-all"
            />
            <p className="text-xs text-[#b8b4ae] mt-1">{message.length}/200</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 px-4 py-2.5 text-sm text-[#8b8b8b] border border-[#e8e4de] rounded-xl
                         hover:bg-[#f8f5f0] transition-colors"
            >
              跳过
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm bg-[#2d2a24] text-white rounded-xl
                         hover:bg-[#4a443c] disabled:opacity-50 transition-colors"
            >
              {submitting ? '提交中...' : '提交'}
            </button>
          </div>
        </form>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#b8b4ae] hover:text-[#2d2a24] transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

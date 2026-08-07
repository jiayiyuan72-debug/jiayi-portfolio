'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.error('请输入密码');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '密码错误');
      }

      toast.success('登录成功！', { duration: 1500 });
      // 稍等一会，让 cookie 设置完成
      setTimeout(() => {
        router.push('/admin/sections');
      }, 500);
    } catch (error: any) {
      toast.error(error.message || '登录失败');
      // 2秒后跳回入口页
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf7f2] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#2d2a24] tracking-wider">
            后台管理
          </h1>
          <p className="text-sm text-[#8b8b8b] mt-2">请输入管理员密码</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="管理员密码"
            autoFocus
            className="w-full px-4 py-3 border border-[#e8e4de] rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30 focus:border-[#d4a574]
                       text-sm text-center transition-all"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2d2a24] text-white rounded-xl text-sm
                       hover:bg-[#4a443c] disabled:opacity-50 transition-colors"
          >
            {loading ? '验证中...' : '登录'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-[#8b8b8b] hover:text-[#2d2a24] transition-colors"
          >
            ← 返回首页
          </button>
        </div>
      </div>
    </div>
  );
}

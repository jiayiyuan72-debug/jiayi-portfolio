'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Block } from '@/types/block';

interface Props {
  block: Block;
  onChange: (block: Block) => void;
}

export default function ImageBlockEdit({ block, onChange }: Props) {
  const p = block.props || {};
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const setProps = (patch: Record<string, any>) => {
    onChange({ ...block, props: { ...p, ...patch } });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '上传失败');
      }
      const data = await res.json();
      setProps({ url: data.url });
      toast.success('图片已上传');
    } catch (e: any) {
      toast.error(e.message || '上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* 预览 */}
      {p.url && (
        <div className="rounded-lg overflow-hidden border border-[#e8e4de]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.url} alt={p.caption || ''} className="w-full max-h-48 object-cover" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 text-sm bg-[#2d2a24] text-white rounded-lg hover:bg-[#4a443c] disabled:opacity-50"
        >
          {uploading ? '上传中...' : '上传图片'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
          }}
        />
        <span className="text-xs text-[#b8b4ae]">或</span>
      </div>

      <div>
        <label className="block text-xs text-[#8b8b8b] mb-1">图片 URL</label>
        <input
          type="text"
          value={p.url || ''}
          onChange={e => setProps({ url: e.target.value })}
          placeholder="粘贴图片链接"
          className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-[#8b8b8b] mb-1">说明文字</label>
        <input
          type="text"
          value={p.caption || ''}
          onChange={e => setProps({ caption: e.target.value })}
          placeholder="图片说明（可选）"
          className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#8b8b8b] mb-1">宽度</label>
          <select
            value={p.width || 'full'}
            onChange={e => setProps({ width: e.target.value })}
            className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm"
          >
            <option value="full">全宽</option>
            <option value="half">半宽</option>
            <option value="third">三分之一</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#8b8b8b] mb-1">对齐</label>
          <select
            value={p.align || 'left'}
            onChange={e => setProps({ align: e.target.value })}
            className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm"
          >
            <option value="left">左对齐</option>
            <option value="center">居中</option>
            <option value="right">右对齐</option>
          </select>
        </div>
      </div>
    </div>
  );
}

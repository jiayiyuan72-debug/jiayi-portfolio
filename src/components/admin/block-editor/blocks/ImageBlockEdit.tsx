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

  // 限制压缩后的尺寸与体积：避免撞上 Vercel 请求体上限（~4.5MB），同时网页加载更快
  const MAX_DIM = 1920;      // 最长边像素
  const JPEG_QUALITY = 0.82; // 压缩质量
  const TARGET_MAX_BYTES = 3.5 * 1024 * 1024; // 控制在 3.5MB 以内

  // 用 canvas 把图片压缩成 JPEG Blob
  const compressImage = async (file: File): Promise<Blob> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = dataUrl;
    });

    // 计算缩放尺寸（等比，最长边不超过 MAX_DIM）
    let { width, height } = img;
    if (width > MAX_DIM || height > MAX_DIM) {
      const scale = MAX_DIM / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法处理图片');
    ctx.drawImage(img, 0, 0, width, height);

    // 逐级压缩，直到体积足够小
    let quality = JPEG_QUALITY;
    let blob = await new Promise<Blob>(resolve =>
      canvas.toBlob(b => resolve(b || new Blob([])), 'image/jpeg', quality)
    );
    while (blob.size > TARGET_MAX_BYTES && quality > 0.5) {
      quality -= 0.1;
      blob = await new Promise<Blob>(resolve =>
        canvas.toBlob(b => resolve(b || new Blob([])), 'image/jpeg', quality)
      );
    }
    return blob;
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      // 大图/非图片类型尽量压缩后再传；已很小或非 JPEG 类型则原样传
      let uploadTarget: Blob = file;
      if (file.type.startsWith('image/') && file.size > 1.5 * 1024 * 1024) {
        const compressed = await compressImage(file);
        if (compressed.size < file.size) {
          uploadTarget = compressed;
        }
      }

      const formData = new FormData();
      // 传压缩后的 jpg；若无法压缩则用原文件
      formData.append('file', uploadTarget, (uploadTarget === file ? file.name : 'image.jpg'));
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '上传失败');
      }
      const data = await res.json();
      setProps({ url: data.url });
      toast.success(uploadTarget !== file ? '图片已压缩后上传' : '图片已上传');
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

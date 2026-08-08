'use client';

import { useState, useEffect, useCallback } from 'react';
import { CanvasNode } from '@/types/canvas';
import CanvasRenderer from './CanvasRenderer';

interface Props {
  title: string;
  subtitle: string;
  icon: string;
  canvasData: CanvasNode[];
  bgColor?: string;
  borderRadius?: number;
}

/** Extract preview content from canvas nodes */
function extractPreview(nodes: CanvasNode[]) {
  const textSnippets: string[] = [];
  const imageUrls: string[] = [];

  for (const node of nodes) {
    const c = node.content as any;
    if (node.type === 'text' || node.type === 'quote') {
      const text = (c?.html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      if (text) textSnippets.push(text);
    } else if (node.type === 'image') {
      if (c?.src) imageUrls.push(c.src);
    } else if (node.type === 'photo-wall' || node.type === 'gallery') {
      const imgs = c?.images || [];
      imgs.forEach((img: any) => { if (img.src || img) imageUrls.push(img.src || img); });
    } else if (node.type === 'timeline') {
      const items = c?.items || [];
      items.forEach((item: any) => {
        if (item.title) textSnippets.push(`${item.date || ''} ${item.title}`);
        if (item.image) imageUrls.push(item.image);
      });
    } else if (node.type === 'stats') {
      const stats = c?.stats || [];
      stats.forEach((s: any) => {
        if (s.label) textSnippets.push(`${s.value || ''}${s.suffix || ''} ${s.label}`);
      });
    } else if (node.type === 'tags') {
      const tags = c?.tags || [];
      if (tags.length > 0) textSnippets.push(tags.join(' · '));
    }
  }

  return { textSnippets, imageUrls };
}

export default function MemoryCardClient({ title, subtitle, icon, canvasData, bgColor = '#f8f5f0', borderRadius = 12 }: Props) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, close]);

  const hasContent = canvasData && canvasData.length > 0;
  const { textSnippets, imageUrls } = hasContent ? extractPreview(canvasData) : { textSnippets: [], imageUrls: [] };
  const hasPreview = textSnippets.length > 0 || imageUrls.length > 0;

  return (
    <>
      {/* Compact card with content preview */}
      <div
        onClick={() => setOpen(true)}
        style={{
          background: bgColor,
          borderRadius,
          cursor: 'pointer',
          overflow: 'hidden',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderBottom: hasPreview ? '1px solid #e8e6e0' : 'none', flexShrink: 0 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#2d2a24', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        </div>

        {/* Content preview area */}
        <div style={{ flex: 1, padding: hasPreview ? '12px 14px' : '20px 14px', overflow: 'hidden' }}>
          {hasPreview ? (
            <>
              {/* Text preview */}
              {textSnippets.length > 0 && (
                <div style={{
                  fontSize: 13,
                  color: '#5a5349',
                  lineHeight: 1.6,
                  marginBottom: imageUrls.length > 0 ? 10 : 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {textSnippets.join('\n')}
                </div>
              )}
              {/* Image preview - show up to 3 thumbnails */}
              {imageUrls.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(imageUrls.length, 3)}, 1fr)`, gap: 6 }}>
                  {imageUrls.slice(0, 3).map((url, i) => (
                    <div key={i} style={{ borderRadius: 6, overflow: 'hidden', aspectRatio: '1/1', background: '#f0ede5' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#8b8b8b', fontSize: 13, padding: '10px 0' }}>{subtitle}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '6px 14px', fontSize: 11, color: '#d4a574', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, borderTop: hasPreview ? '1px solid #f0ede5' : 'none', flexShrink: 0 }}>
          点击查看详情 {'\u2192'}
        </div>
      </div>

      {/* Full-screen modal */}
      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            overflowY: 'auto', padding: '40px 16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16, maxWidth: 800, width: '100%',
              margin: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid #f0ede5',
              position: 'sticky', top: 0, background: '#fff', zIndex: 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>{icon}</span>
                <span style={{ fontSize: 18, fontWeight: 600, color: '#2d2a24' }}>{title}</span>
              </div>
              <button
                onClick={close}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none',
                  background: '#f5f5f0', fontSize: 18, cursor: 'pointer', color: '#5a5349',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {'\u2715'}
              </button>
            </div>
            {/* Modal content */}
            <div style={{ padding: '24px', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
              {canvasData && canvasData.length > 0 ? (
                <CanvasRenderer nodes={canvasData} />
              ) : (
                <div style={{ textAlign: 'center', color: '#b8b4ae', padding: '40px 0', fontSize: 14 }}>
                  暂无内容
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

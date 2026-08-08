'use client';

import { useState, useEffect, useCallback } from 'react';
import { CanvasNode } from '@/types/canvas';
import CanvasRenderer from './CanvasRenderer';

interface Props {
  title: string;
  subtitle: string;
  icon: string;
  coverImage?: string;
  canvasData: CanvasNode[];
  bgColor?: string;
  borderRadius?: number;
}

export default function MemoryCardClient({ title, subtitle, icon, coverImage, canvasData, bgColor = '#f8f5f0', borderRadius = 12 }: Props) {
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

  return (
    <>
      {/* Card with cover image + title - fills container height */}
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
          minHeight: 60,
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {/* Cover image - fills available space */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0ede5' }}>
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImage} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 40, opacity: 0.4 }}>{icon}</span>
          )}
        </div>

        {/* Title bar - fixed at bottom */}
        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, background: 'rgba(255,255,255,0.85)' }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#2d2a24', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
            <div style={{ fontSize: 11, color: '#8b8b8b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>
          </div>
          <span style={{ fontSize: 11, color: '#d4a574', fontWeight: 500, flexShrink: 0 }}>{'\u2192'}</span>
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
              {hasContent ? (
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

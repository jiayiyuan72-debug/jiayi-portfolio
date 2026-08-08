'use client';

import { useState, useEffect, useCallback } from 'react';

interface PhotoWallImage {
  src: string;
  caption?: string;
  alt?: string;
}

interface Props {
  images: PhotoWallImage[];
  columns: number;
  gap: number;
  borderRadius?: number;
}

export default function PhotoWallClient({ images, columns, gap, borderRadius = 8 }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const showPrev = useCallback(() => {
    setLightboxIndex(prev => (prev === null ? null : (prev - 1 + images.length) % images.length));
  }, [images.length]);
  const showNext = useCallback(() => {
    setLightboxIndex(prev => (prev === null ? null : (prev + 1) % images.length));
  }, [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') showPrev();
      else if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, closeLightbox, showPrev, showNext]);

  if (!images || images.length === 0) return null;

  const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null;

  return (
    <>
      <div style={{ columnCount: columns, columnGap: gap + 'px' }}>
        {images.map((img, i) => (
          <div
            key={i}
            onClick={() => setLightboxIndex(i)}
            style={{
              breakInside: 'avoid',
              marginBottom: gap + 'px',
              borderRadius,
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <img
              src={img.src}
              alt={img.alt || img.caption || ''}
              loading="lazy"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            {img.caption && (
              <div
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  color: '#fff', fontSize: 13, padding: '20px 12px 10px',
                }}
              />
            )}
            <div
              style={{
                position: 'absolute', top: 8, right: 8,
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, pointerEvents: 'none',
              }}
            >
              {'\uD83D\uDD0D'}
            </div>
          </div>
        ))}
      </div>

      {currentImage && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.92)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            style={{
              position: 'absolute', top: 20, right: 24,
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', fontSize: 22, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {'\u2715'}
          </button>

          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showPrev(); }}
              style={{
                position: 'absolute', left: 20, top: '50%',
                transform: 'translateY(-50%)',
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: '#fff', fontSize: 28, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {'\u2039'}
            </button>
          )}

          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showNext(); }}
              style={{
                position: 'absolute', right: 20, top: '50%',
                transform: 'translateY(-50%)',
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: '#fff', fontSize: 28, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {'\u203A'}
            </button>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <img
              src={currentImage.src}
              alt={currentImage.alt || currentImage.caption || ''}
              style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 4 }}
            />
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              {currentImage.caption && (
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, margin: 0, marginBottom: 4 }}>
                  {currentImage.caption}
                </p>
              )}
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
                {lightboxIndex! + 1} / {images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

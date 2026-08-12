'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { resolveImageSrc } from '@/lib/generator/renderEngine';
import { downloadImage, shareToX } from '@/lib/generator/exportImage';
import styles from './PreviewCanvas.module.css';

/**
 * PreviewCanvas — Hybrid HTML/CSS + Canvas approach
 *
 * Architecture:
 * ┌─────────────────────────────────────────────┐
 * │  <div> with template PNG as background-image │  ← CSS
 * │  ┌───────────────────┐                       │
 * │  │ <canvas> user     │  ← Canvas API (clip)  │
 * │  │ photo w/ mask     │                       │
 * │  └───────────────────┘                       │
 * │  ┌───────────────────────────────────┐       │
 * │  │ <div> NAME text                   │  ← CSS│
 * │  └───────────────────────────────────┘       │
 * │  ┌───────────────────────────────────┐       │
 * │  │ <div> ROLE text                   │  ← CSS│
 * │  └───────────────────────────────────┘       │
 * │  ... more text fields ...                    │
 * └─────────────────────────────────────────────┘
 *
 * - Canvas handles the octagon/circle clip mask (which html2canvas can't do via CSS clip-path)
 * - html2canvas CAN capture <canvas> elements natively (reads pixel data)
 * - Text is real HTML so fonts render perfectly
 * - Live preview = downloaded image (zero mismatch)
 */
export default function PreviewCanvas({ template, userImageUrl, cropParams, userData }) {
  const captureRef = useRef(null);
  const photoCanvasRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [downloading, setDownloading] = useState(false);

  // ─── Track container width for proportional font sizing ───
  useEffect(() => {
    const el = captureRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── Draw user photo into the small photo canvas with clip mask ───
  useEffect(() => {
    if (!userImageUrl || !template?.photoRegion) {
      return;
    }

    const canvas = photoCanvasRef.current;
    if (!canvas) return;

    const { w: rw, h: rh } = template.photoRegion;
    canvas.width = rw;
    canvas.height = rh;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, rw, rh);

    const img = new Image();
    // blob: and data: URLs don't need crossOrigin
    if (!userImageUrl.startsWith('blob:') && !userImageUrl.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      ctx.save();

      // 1. Apply clip mask (coordinates relative to canvas origin)
      const { x: rx, y: ry } = template.photoRegion;
      if (template.maskShape === 'circle') {
        ctx.beginPath();
        ctx.arc(rw / 2, rh / 2, Math.min(rw, rh) / 2, 0, Math.PI * 2);
        ctx.clip();
      } else if (template.maskPath?.length > 0) {
        ctx.beginPath();
        ctx.moveTo(template.maskPath[0].x - rx, template.maskPath[0].y - ry);
        for (let i = 1; i < template.maskPath.length; i++) {
          ctx.lineTo(template.maskPath[i].x - rx, template.maskPath[i].y - ry);
        }
        ctx.closePath();
        ctx.clip();
      }

      // 2. Draw photo with crop parameters
      const { centerX = 0.5, centerY = 0.5, zoom = 1 } = cropParams || {};
      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;
      if (imgW === 0 || imgH === 0) return;

      const regionAspect = rw / rh;
      const imgAspect = imgW / imgH;

      let cropW, cropH;
      if (imgAspect > regionAspect) {
        cropH = imgH / zoom;
        cropW = cropH * regionAspect;
      } else {
        cropW = imgW / zoom;
        cropH = cropW / regionAspect;
      }
      cropW = Math.min(cropW, imgW);
      cropH = Math.min(cropH, imgH);

      let sx = centerX * imgW - cropW / 2;
      let sy = centerY * imgH - cropH / 2;
      sx = Math.max(0, Math.min(sx, imgW - cropW));
      sy = Math.max(0, Math.min(sy, imgH - cropH));

      ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, rw, rh);
      ctx.restore();
    };

    img.onerror = () => {
      console.error('[PreviewCanvas] Failed to load user photo:', userImageUrl);
    };

    img.src = userImageUrl;
  }, [userImageUrl, cropParams, template]);

  // ─── Download handler: html2canvas captures the whole card ───
  const handleDownload = useCallback(async () => {
    if (!captureRef.current) return;
    setDownloading(true);
    try {
      const element = captureRef.current;
      // Scale up to the template's native resolution
      const scale = template.width / element.offsetWidth;

      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        backgroundColor: null,
      });

      await downloadImage(canvas, template.title);
    } catch (err) {
      console.error('[PreviewCanvas] Download error:', err);
    } finally {
      setDownloading(false);
    }
  }, [template]);

  const handleShare = useCallback(() => {
    shareToX(template.title);
  }, [template]);

  if (!template) return null;

  // Resolve template image URL
  const templateSrc = resolveImageSrc(template.image);

  // Convert photoRegion pixel coords → CSS percentages
  const photoStyle = template.photoRegion
    ? {
        left: `${(template.photoRegion.x / template.width) * 100}%`,
        top: `${(template.photoRegion.y / template.height) * 100}%`,
        width: `${(template.photoRegion.w / template.width) * 100}%`,
        height: `${(template.photoRegion.h / template.height) * 100}%`,
      }
    : {};

  // Scale factor: maps native px font sizes → display px
  const fontScale = containerWidth > 0 ? containerWidth / template.width : 0;

  return (
    <div className={styles.previewWrapper}>
      <div className={styles.canvasWrap}>
        {/* ── The capture target: template bg + photo canvas + text divs ── */}
        <div
          ref={captureRef}
          className={styles.cardContainer}
          style={{
            aspectRatio: template.aspectRatio.replace(' / ', '/'),
            backgroundImage: `url(${templateSrc})`,
          }}
        >
          {/* Photo: small canvas with clip mask */}
          {userImageUrl && (
            <canvas
              ref={photoCanvasRef}
              className={styles.photoCanvas}
              style={photoStyle}
            />
          )}

          {/* Text fields: HTML divs positioned via CSS % */}
          {userData &&
            template.textFields?.map((field) => {
              const value = userData[field.key];
              if (!value) return null;

              return (
                <div
                  key={field.key}
                  className={styles.textField}
                  style={{
                    left: `${(field.x / template.width) * 100}%`,
                    top: `${(field.y / template.height) * 100}%`,
                    maxWidth: `${((field.maxWidth || 1000) / template.width) * 100}%`,
                    fontSize: fontScale > 0 ? `${field.fontSize * fontScale}px` : '14px',
                    color: field.color,
                    fontWeight: field.fontWeight,
                    fontFamily: field.fontFamily || 'Inter, Arial, sans-serif',
                  }}
                >
                  {value.toUpperCase()}
                </div>
              );
            })}
        </div>
      </div>

      {/* Status badge */}
      <div className={styles.statusBadge}>
        <span className={styles.statusDot} aria-hidden="true" />
        Generated · Ready to export
      </div>

      {/* Action buttons */}
      <div className={styles.previewActions}>
        <button
          type="button"
          className={styles.downloadBtn}
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? 'Saving...' : '↓ Download PNG'}
        </button>
        <button
          type="button"
          className={styles.shareBtn}
          onClick={handleShare}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.26 4.26 0 0 0 1.88-2.37 8.49 8.49 0 0 1-2.72 1.04 4.23 4.23 0 0 0-7.32 2.91c0 .33.04.65.1.96C8.09 9.01 4.83 7.3 2.68 4.75a4.22 4.22 0 0 0 1.31 5.65 4.2 4.2 0 0 1-1.92-.53v.05a4.24 4.24 0 0 0 3.4 4.15 4.23 4.23 0 0 1-1.91.07 4.24 4.24 0 0 0 3.96 2.94A8.49 8.49 0 0 1 2 18.86a11.98 11.98 0 0 0 6.29 1.84c7.55 0 11.68-6.26 11.68-11.68l-.01-.53A8.35 8.35 0 0 0 22.46 6Z" />
          </svg>
          Share to X
        </button>
      </div>
    </div>
  );
}

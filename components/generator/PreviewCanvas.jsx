'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { renderCard } from '@/lib/generator/renderer/canvasRenderer';
import { downloadImage, shareToX } from '@/lib/generator/exportImage';
import styles from './PreviewCanvas.module.css';

/**
 * PreviewCanvas
 *
 * Displays the rendered card and provides download/share actions.
 *
 * Architecture:
 * ─────────────
 * renderCard() creates a native-resolution canvas (e.g. 1856×2304).
 * We copy that into a <canvas> DOM element that CSS scales to fit the screen.
 * The same canvas is used directly for the PNG export — no second render pass.
 *
 * This eliminates the preview/export mismatch that existed with the old
 * HTML+CSS text overlay + html2canvas export approach.
 *
 * Props:
 * ─────
 * @param {object}  template      - Template config from TEMPLATE_CATALOGUE
 * @param {string}  [userImageUrl]- blob: or data: URL of user photo
 * @param {object}  [cropParams]  - { centerX, centerY, zoom } from CropEditor
 * @param {object}  [userData]    - { name, role, team, builderId }
 */
export default function PreviewCanvas({ template, userImageUrl, cropParams, userData }) {
  const canvasRef = useRef(null);

  // 'idle' | 'rendering' | 'done' | 'error'
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Re-render whenever any input changes
  useEffect(() => {
    if (!template || !canvasRef.current) return;

    let cancelled = false;
    setStatus('rendering');
    setErrorMsg(null);

    renderCard({ template, userImageUrl, cropParams, userData })
      .then((rendered) => {
        if (cancelled) return;
        const target = canvasRef.current;
        if (!target) return;

        // Transfer pixels to the display canvas
        target.width  = rendered.width;
        target.height = rendered.height;
        const ctx = target.getContext('2d');
        ctx.drawImage(rendered, 0, 0);

        setStatus('done');
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[PreviewCanvas] Render error:', err);
        setErrorMsg(err?.message || 'Render failed');
        setStatus('error');
      });

    return () => { cancelled = true; };
  }, [template, userImageUrl, cropParams, userData]);

  // Download: export the already-rendered canvas directly
  const handleDownload = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || status !== 'done') return;
    setDownloading(true);
    try {
      await downloadImage(canvas, template?.title ?? 'HHGoa2026');
    } catch (err) {
      console.error('[PreviewCanvas] Download error:', err);
    } finally {
      setDownloading(false);
    }
  }, [template, status]);

  const handleShare = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || status !== 'done') return;
    setSharing(true);
    try {
      await shareToX(canvas, template?.title ?? 'HHGoa2026');
    } catch (err) {
      console.error('[PreviewCanvas] Share error:', err);
    } finally {
      setSharing(false);
    }
  }, [template, status]);

  if (!template) return null;

  const isRendering = status === 'rendering';
  const isReady     = status === 'done';

  return (
    <div className={styles.previewWrapper}>
      {/* Canvas container */}
      <div className={styles.canvasWrap}>
        {/* Spinner overlay while rendering */}
        {isRendering && (
          <div className={styles.loadingOverlay} aria-live="polite">
            <div className={styles.spinner} role="status" aria-label="Rendering…" />
            <span className={styles.loadingLabel}>Rendering…</span>
          </div>
        )}

        {/* The canvas — always in DOM so ref is stable.
            Native resolution = nativeWidth × nativeHeight.
            CSS max-width: 100% scales it visually. */}
        <canvas
          ref={canvasRef}
          className={styles.outputCanvas}
          style={{ aspectRatio: `${template.nativeWidth} / ${template.nativeHeight}` }}
          aria-label={`${template.title} preview`}
        />

        {/* Error state */}
        {status === 'error' && errorMsg && (
          <div className={styles.renderError} role="alert">
            ⚠ Render error: {errorMsg}
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div className={styles.statusBar} aria-live="polite">
        <span
          className={styles.statusDot}
          data-status={status}
          aria-hidden="true"
        />
        <span className={styles.statusText}>
          {isRendering
            ? 'Generating your card…'
            : isReady
            ? `${template.nativeWidth} × ${template.nativeHeight} · Ready to export`
            : status === 'error'
            ? 'Render failed — check console'
            : 'Waiting…'}
        </span>
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        <button
          id="btn-download-png"
          type="button"
          className={styles.downloadBtn}
          onClick={handleDownload}
          disabled={!isReady || downloading}
          aria-label="Download PNG"
        >
          {downloading ? 'Saving…' : '↓ Download PNG'}
        </button>
        <button
          id="btn-share-x"
          type="button"
          className={styles.shareBtn}
          onClick={handleShare}
          disabled={!isReady || sharing}
          aria-label="Share to X (Twitter)"
        >
          <XIcon />
          {sharing ? 'Sharing…' : 'Share to X'}
        </button>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.26 4.26 0 0 0 1.88-2.37 8.49 8.49 0 0 1-2.72 1.04 4.23 4.23 0 0 0-7.32 2.91c0 .33.04.65.1.96C8.09 9.01 4.83 7.3 2.68 4.75a4.22 4.22 0 0 0 1.31 5.65 4.2 4.2 0 0 1-1.92-.53v.05a4.24 4.24 0 0 0 3.4 4.15 4.23 4.23 0 0 1-1.91.07 4.24 4.24 0 0 0 3.96 2.94A8.49 8.49 0 0 1 2 18.86a11.98 11.98 0 0 0 6.29 1.84c7.55 0 11.68-6.26 11.68-11.68l-.01-.53A8.35 8.35 0 0 0 22.46 6Z" />
    </svg>
  );
}

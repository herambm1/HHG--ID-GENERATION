'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './CropEditor.module.css';

/**
 * CropEditor
 *
 * Reusable crop component for all 5 templates.
 * Supports pan (drag), zoom (slider + scroll wheel + pinch), and
 * renders a mask overlay showing the crop region shape.
 *
 * Props:
 * @param {string} imageUrl - Object URL of the user's uploaded photo
 * @param {'octagon' | 'circle'} maskShape - Shape of the crop region
 * @param {number} regionAspect - Aspect ratio of the photo region (w/h)
 * @param {{ centerX: number, centerY: number, zoom: number }} initialCrop - Initial crop from face detection
 * @param {function} onCropChange - Called with { centerX, centerY, zoom } on every change
 */
export default function CropEditor({ imageUrl, maskShape, regionAspect = 1, initialCrop, onCropChange }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  // Crop state
  const [centerX, setCenterX] = useState(initialCrop?.centerX ?? 0.5);
  const [centerY, setCenterY] = useState(initialCrop?.centerY ?? 0.5);
  const [zoom, setZoom] = useState(initialCrop?.zoom ?? 1);

  // Drag state refs (avoid re-renders during drag)
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const pinchDistance = useRef(null);

  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // Use ResizeObserver to track container dimensions instead of reading ref during render
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Notify parent of crop changes
  useEffect(() => {
    onCropChange?.({ centerX, centerY, zoom });
  }, [centerX, centerY, zoom, onCropChange]);

  // Load image dimensions
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setImgLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Calculate image transform for display
  const getTransform = useCallback(() => {
    if (containerSize.w === 0 || containerSize.h === 0 || !imgLoaded) return {};

    const cw = containerSize.w;
    const ch = containerSize.h;
    const { w: iw, h: ih } = imgSize;

    if (iw === 0 || ih === 0) return {};

    // Scale image so that at zoom=1 it covers the container
    const containerAspect = cw / ch;
    const imgAspect = iw / ih;
    let baseScale;
    if (imgAspect > containerAspect) {
      baseScale = ch / ih;
    } else {
      baseScale = cw / iw;
    }

    const scale = baseScale * zoom;
    const scaledW = iw * scale;
    const scaledH = ih * scale;

    // Position so that centerX/centerY of the image aligns with the container center
    const tx = cw / 2 - centerX * scaledW;
    const ty = ch / 2 - centerY * scaledH;

    return {
      width: `${iw}px`,
      height: `${ih}px`,
      maxWidth: 'none',
      maxHeight: 'none',
      transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
    };
  }, [imgLoaded, imgSize, centerX, centerY, zoom]);

  // Clamp center values so the image always covers the container
  const clampCenter = useCallback((cx, cy, z) => {
    if (containerSize.w === 0 || containerSize.h === 0 || !imgLoaded) return { cx, cy };

    const cw = containerSize.w;
    const ch = containerSize.h;
    const { w: iw, h: ih } = imgSize;

    const containerAspect = cw / ch;
    const imgAspect = iw / ih;
    let baseScale;
    if (imgAspect > containerAspect) {
      baseScale = ch / ih;
    } else {
      baseScale = cw / iw;
    }

    const scale = baseScale * z;
    const scaledW = iw * scale;
    const scaledH = ih * scale;

    // The visible portion is cw x ch in the center.
    // cx * scaledW must be >= cw/2 (left edge covered)
    // cx * scaledW must be <= scaledW - cw/2 (right edge covered)
    const minCx = (cw / 2) / scaledW;
    const maxCx = 1 - minCx;
    const minCy = (ch / 2) / scaledH;
    const maxCy = 1 - minCy;

    return {
      cx: Math.max(minCx, Math.min(maxCx, cx)),
      cy: Math.max(minCy, Math.min(maxCy, cy)),
    };
  }, [imgLoaded, imgSize]);

  // --- Pointer/Touch handlers ---

  const handlePointerDown = useCallback((e) => {
    if (e.pointerType === 'touch' && e.isPrimary === false) return;
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging.current) return;

    if (containerSize.w === 0 || containerSize.h === 0) return;

    const cw = containerSize.w;
    const ch = containerSize.h;
    const { w: iw, h: ih } = imgSize;

    const containerAspect = cw / ch;
    const imgAspect = iw / ih;
    let baseScale;
    if (imgAspect > containerAspect) {
      baseScale = ch / ih;
    } else {
      baseScale = cw / iw;
    }

    const scale = baseScale * zoom;
    const scaledW = iw * scale;
    const scaledH = ih * scale;

    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };

    setCenterX((prev) => {
      setCenterY((prevY) => {
        const newCx = prev - dx / scaledW;
        const newCy = prevY - dy / scaledH;
        const clamped = clampCenter(newCx, newCy, zoom);
        // We need to set both; use a trick with refs
        return clamped.cy;
      });
      const newCx = prev - dx / scaledW;
      const { cx } = clampCenter(newCx, centerY - dy / scaledH, zoom);
      return cx;
    });
  }, [imgSize, zoom, clampCenter, centerY]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => {
      const newZoom = Math.max(1, Math.min(5, prev + delta));
      const clamped = clampCenter(centerX, centerY, newZoom);
      setCenterX(clamped.cx);
      setCenterY(clamped.cy);
      return newZoom;
    });
  }, [centerX, centerY, clampCenter]);

  // Touch pinch zoom
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDistance.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && pinchDistance.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const scale = newDist / pinchDistance.current;
      pinchDistance.current = newDist;

      setZoom((prev) => {
        const newZoom = Math.max(1, Math.min(5, prev * scale));
        const clamped = clampCenter(centerX, centerY, newZoom);
        setCenterX(clamped.cx);
        setCenterY(clamped.cy);
        return newZoom;
      });
    }
  }, [centerX, centerY, clampCenter]);

  const handleTouchEnd = useCallback(() => {
    pinchDistance.current = null;
  }, []);

  // Attach wheel listener with passive: false
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Render mask SVG overlay
  const renderMask = () => {
    const size = 100; // viewBox percentage
    const padding = 10; // percentage padding from edges
    const regionSize = size - padding * 2;

    if (maskShape === 'circle') {
      return (
        <svg className={styles.maskOverlay} viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <mask id="crop-mask">
              <rect width="100" height="100" fill="white" />
              <circle cx="50" cy="50" r={regionSize / 2} fill="black" />
            </mask>
          </defs>
          <rect width="100" height="100" fill="rgba(0,0,0,0.55)" mask="url(#crop-mask)" />
          <circle cx="50" cy="50" r={regionSize / 2} fill="none" stroke="rgba(255,213,0,0.6)" strokeWidth="0.5" strokeDasharray="2,2" />
        </svg>
      );
    }

    // Octagon mask
    const cx = 50;
    const cy = 50;
    const half = regionSize / 2;
    const chamfer = half * 0.15;
    const octPoints = [
      `${cx - half + chamfer},${cy - half}`,
      `${cx + half - chamfer},${cy - half}`,
      `${cx + half},${cy - half + chamfer}`,
      `${cx + half},${cy + half - chamfer}`,
      `${cx + half - chamfer},${cy + half}`,
      `${cx - half + chamfer},${cy + half}`,
      `${cx - half},${cy + half - chamfer}`,
      `${cx - half},${cy - half + chamfer}`,
    ].join(' ');

    return (
      <svg className={styles.maskOverlay} viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <mask id="crop-mask">
            <rect width="100" height="100" fill="white" />
            <polygon points={octPoints} fill="black" />
          </mask>
        </defs>
        <rect width="100" height="100" fill="rgba(0,0,0,0.55)" mask="url(#crop-mask)" />
        <polygon points={octPoints} fill="none" stroke="rgba(255,213,0,0.6)" strokeWidth="0.5" strokeDasharray="2,2" />
      </svg>
    );
  };

  const imgStyle = getTransform();

  return (
    <div className={styles.cropWrapper}>
      <div
        ref={containerRef}
        className={styles.cropContainer}
        style={{ '--region-aspect': regionAspect }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Crop preview"
            className={styles.cropImage}
            style={imgStyle}
            draggable={false}
          />
        )}
        {renderMask()}
      </div>

      {/* Zoom slider */}
      <div className={styles.zoomControls}>
        <span className={styles.zoomLabel}>Zoom</span>
        <input
          type="range"
          className={styles.zoomSlider}
          min="1"
          max="5"
          step="0.01"
          value={zoom}
          onChange={(e) => {
            const newZoom = parseFloat(e.target.value);
            setZoom(newZoom);
            const clamped = clampCenter(centerX, centerY, newZoom);
            setCenterX(clamped.cx);
            setCenterY(clamped.cy);
          }}
          aria-label="Zoom level"
        />
        <span className={styles.zoomValue}>{zoom.toFixed(1)}×</span>
      </div>

      <p className={styles.cropHint}>
        Drag to reposition · Scroll or pinch to zoom
      </p>
    </div>
  );
}

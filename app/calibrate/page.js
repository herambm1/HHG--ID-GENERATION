'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TEMPLATE_CATALOGUE } from '@/lib/generator/templateConfig';
import { resolveImageSrc } from '@/lib/generator/renderer/canvasRenderer';
import { resolveTextCalibrationRegion } from '@/lib/generator/renderer/coordinateContract';
import styles from './page.module.css';

/**
 * Template Calibration Tool — Internal Development Only
 *
 * Accessible at: http://localhost:3000/calibrate
 *
 * Purpose:
 *   Allows a developer to visually define the photo region and text field
 *   positions for each template by dragging handles over the actual PNG.
 *
 * Output:
 *   Generates a normalized config JSON you can paste back into templateConfig.js.
 *
 * This page is NOT linked from the main application UI.
 * In production it displays a warning but remains functional for verification.
 */

const REGION_TYPES = ['photo', 'name', 'role', 'team', 'builderId'];
const REGION_COLORS = {
  photo: 'rgba(255, 200, 0, 0.5)',
  name: 'rgba(0, 200, 255, 0.4)',
  role: 'rgba(0, 255, 120, 0.4)',
  team: 'rgba(255, 100, 0, 0.4)',
  builderId: 'rgba(200, 0, 255, 0.4)',
};
const REGION_BORDER_COLORS = {
  photo: '#ffd000',
  name: '#00c8ff',
  role: '#00ff78',
  team: '#ff6400',
  builderId: '#c800ff',
};

function defaultRegion(type, nativeWidth, nativeHeight) {
  // Start all regions at 10% inset
  return {
    nx: 0.1,
    ny: 0.1,
    nw: 0.3,
    nh: type === 'photo' ? 0.4 : 0.06,
  };
}

export default function CalibratePage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATE_CATALOGUE[0].id);
  const [activeRegion, setActiveRegion] = useState('photo');
  const [regions, setRegions] = useState(() => {
    const initial = {};
    for (const t of TEMPLATE_CATALOGUE) {
      initial[t.id] = {};
      // Initialize from existing config
      if (t.photo) {
        initial[t.id].photo = { nx: t.photo.nx, ny: t.photo.ny, nw: t.photo.nw, nh: t.photo.nh };
      }
      for (const f of t.textFields || []) {
        // Text `ny` is its centre. Keep that canonical value in state; `nh`
        // exists only to make the adjustable calibration rectangle visible.
        initial[t.id][f.key] = {
          nx: f.nx,
          ny: f.ny,
          nw: f.nw,
          nh: f.heightN ?? f.fontSizeN * 2,
        };
      }
    }
    return initial;
  });

  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });
  const [displayRect, setDisplayRect] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, nx: 0, ny: 0 });
  const dragMode = useRef('move'); // 'move' | 'resize-br' | 'resize-bl' etc.

  const selectedTemplate = TEMPLATE_CATALOGUE.find(t => t.id === selectedTemplateId);
  const templateSrc = selectedTemplate ? resolveImageSrc(selectedTemplate.image) : '';

  // Track natural size of loaded image
  const handleImgLoad = useCallback(() => {
    const img = imgRef.current;
    if (img) {
      setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    }
  }, []);

  // Track display rect of image element
  useEffect(() => {
    const updateRect = () => {
      const img = imgRef.current;
      if (!img) return;
      const r = img.getBoundingClientRect();
      const cr = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
      setDisplayRect({ x: r.left - cr.left, y: r.top - cr.top, w: r.width, h: r.height });
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [selectedTemplateId, imgNaturalSize]);

  // Convert display pixels → normalized coords
  const toNorm = useCallback((dpx, dpy, dpw, dph) => {
    if (!displayRect.w || !displayRect.h) return { nx: 0, ny: 0, nw: 0.1, nh: 0.1 };
    return {
      nx: Math.max(0, Math.min(1 - 0.01, (dpx - displayRect.x) / displayRect.w)),
      ny: Math.max(0, Math.min(1 - 0.01, (dpy - displayRect.y) / displayRect.h)),
      nw: Math.max(0.01, Math.min(1, dpw / displayRect.w)),
      nh: Math.max(0.01, Math.min(1, dph / displayRect.h)),
    };
  }, [displayRect]);

  // Convert normalized → display pixels (relative to container)
  const toDisplay = useCallback((nx, ny, nw, nh) => {
    return {
      x: displayRect.x + nx * displayRect.w,
      y: displayRect.y + ny * displayRect.h,
      w: nw * displayRect.w,
      h: nh * displayRect.h,
    };
  }, [displayRect]);

  const currentRegion = regions[selectedTemplateId]?.[activeRegion] || defaultRegion(activeRegion, 1, 1);
  const isTextRegion = activeRegion !== 'photo';

  // Store drag state in refs so we don't need cross-callback refs
  const dragStateRef = useRef({ selectedTemplateId: '', activeRegion: 'photo', displayRect: { w: 0, h: 0 } });

  // Keep dragStateRef current without reading refs during render
  useEffect(() => {
    dragStateRef.current = { selectedTemplateId, activeRegion, displayRect };
  }, [selectedTemplateId, activeRegion, displayRect]);

  // Register global window listeners for drag/resize interaction
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const { displayRect: dr, selectedTemplateId: tid, activeRegion: ar } = dragStateRef.current;
      if (!dr.w) return;

      const dx = (e.clientX - dragStart.current.mx) / dr.w;
      const dy = (e.clientY - dragStart.current.my) / dr.h;
      const start = dragStart.current;

      let next;
      if (dragMode.current === 'move') {
        const minY = isTextRegion ? start.nh / 2 : 0;
        const maxY = isTextRegion ? 1 - start.nh / 2 : 1 - start.nh;
        next = {
          nx: Math.max(0, Math.min(1 - start.nw, start.nx + dx)),
          ny: Math.max(minY, Math.min(maxY, start.ny + dy)),
          nw: start.nw,
          nh: start.nh,
        };
      } else if (dragMode.current === 'resize') {
        next = {
          nx: start.nx,
          ny: isTextRegion ? Math.max(start.nh / 2, start.ny + dy / 2) : start.ny,
          nw: Math.max(0.02, Math.min(1 - start.nx, start.nw + dx)),
          nh: Math.max(0.02, Math.min(1 - start.ny, start.nh + dy)),
        };
      } else {
        return;
      }

      setRegions(prev => ({
        ...prev,
        [tid]: {
          ...prev[tid],
          [ar]: next,
        },
      }));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isTextRegion]);

  const handleMouseDown = useCallback((e, mode) => {
    e.preventDefault();
    isDragging.current = true;
    dragMode.current = mode;
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      ...currentRegion,
    };
  }, [currentRegion]);

  // Nudge by keyboard
  const handleKeyDown = useCallback((e) => {
    const step = e.shiftKey ? 0.005 : 0.001;
    const r = currentRegion;
    let next = { ...r };
    const minY = isTextRegion ? r.nh / 2 : 0;
    const maxY = isTextRegion ? 1 - r.nh / 2 : 1 - r.nh;
    if (e.key === 'ArrowLeft') next.nx = Math.max(0, r.nx - step);
    else if (e.key === 'ArrowRight') next.nx = Math.min(1 - r.nw, r.nx + step);
    else if (e.key === 'ArrowUp') next.ny = Math.max(minY, r.ny - step);
    else if (e.key === 'ArrowDown') next.ny = Math.min(maxY, r.ny + step);
    else if (e.key === '[') next.nw = Math.max(0.01, r.nw - step);
    else if (e.key === ']') next.nw = Math.min(1 - r.nx, r.nw + step);
    else if (e.key === '-') next.nh = Math.max(0.01, r.nh - step);
    else if (e.key === '=') next.nh = Math.min(1 - r.ny, r.nh + step);
    else return;

    e.preventDefault();
    setRegions(prev => ({
      ...prev,
      [selectedTemplateId]: {
        ...prev[selectedTemplateId],
        [activeRegion]: next,
      },
    }));
  }, [currentRegion, selectedTemplateId, activeRegion, isTextRegion]);

  // Generate config JSON for the selected template
  const generateConfig = useCallback(() => {
    const t = selectedTemplate;
    const r = regions[t.id] || {};
    const photo = r.photo || t.photo;

    const photoConfig = photo ? `    photo: {
      nx: ${photo.nx.toFixed(4)},   // ${Math.round(photo.nx * t.nativeWidth)}px
      ny: ${photo.ny.toFixed(4)},   // ${Math.round(photo.ny * t.nativeHeight)}px
      nw: ${photo.nw.toFixed(4)},   // ${Math.round(photo.nw * t.nativeWidth)}px
      nh: ${photo.nh.toFixed(4)},   // ${Math.round(photo.nh * t.nativeHeight)}px
      shape: '${t.photo?.shape || 'circle'}',
      chamferN: ${t.photo?.chamferN || 0.086},
    },` : '';

    const textFieldsConfig = (t.textFields || []).map(f => {
      const region = r[f.key] || f;
      return `      {
        key: '${f.key}',
        nx: ${region.nx.toFixed(4)},   // ${Math.round(region.nx * t.nativeWidth)}px
        ny: ${region.ny.toFixed(4)},   // ${Math.round(region.ny * t.nativeHeight)}px  (vertical center)
        nw: ${region.nw.toFixed(4)},   // ${Math.round(region.nw * t.nativeWidth)}px
        heightN: ${region.nh.toFixed(5)},
        fontSizeN: ${f.fontSizeN?.toFixed(5) || '0.02083'},
        minFontSizeN: ${f.minFontSizeN?.toFixed(5) || '0.00900'},
        fontFamily: '${f.fontFamily || 'Inter, Arial, sans-serif'}',
        fontWeight: '${f.fontWeight || '400'}',
        color: '${f.color || '#000000'}',
        align: '${f.align || 'left'}',
        shrinkToFit: true,
        wrapLines: false,
      }`;
    }).join(',\n');

    return `{
  id: '${t.id}',
  outputType: '${t.outputType}',
  title: '${t.title}',
  subtitle: '${t.subtitle}',
  orientation: '${t.orientation}',
  nativeWidth: ${t.nativeWidth},
  nativeHeight: ${t.nativeHeight},
  aspectRatio: '${t.nativeWidth} / ${t.nativeHeight}',
${photoConfig}
  textFields: [
${textFieldsConfig}
  ],
}`;
  }, [selectedTemplate, regions]);

  const [copiedConfig, setCopiedConfig] = useState(false);
  const handleCopyConfig = useCallback(() => {
    navigator.clipboard.writeText(generateConfig()).then(() => {
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    });
  }, [generateConfig]);

  const relevantRegions = selectedTemplate?.outputType === 'builder'
    ? ['photo', 'name', 'role', 'team', 'builderId']
    : ['photo'];

  // Get display box for active region
  const activeBox = currentRegion ? toDisplay(currentRegion.nx, currentRegion.ny, currentRegion.nw, currentRegion.nh) : null;

  return (
    <div className={styles.calibratePage} tabIndex={0} onKeyDown={handleKeyDown}>
      <header className={styles.calibrateHeader}>
        <h1 className={styles.calibrateTitle}>
          🎯 Template Calibration Tool
          <span className={styles.devBadge}>DEV ONLY</span>
        </h1>
        <p className={styles.calibrateDesc}>
          Drag the colored region boxes to align them with the template artwork.
          Use <kbd>↑ ↓ ← →</kbd> to nudge, <kbd>[ ]</kbd> to resize width, <kbd>- =</kbd> to resize height.
          Hold <kbd>Shift</kbd> for larger steps.
        </p>
      </header>

      <div className={styles.calibrateLayout}>
        {/* ── Left panel: controls ── */}
        <aside className={styles.calibrateSidebar}>
          <section className={styles.controlSection}>
            <h2 className={styles.controlLabel}>Template</h2>
            <div className={styles.templateButtons}>
              {TEMPLATE_CATALOGUE.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.templateBtn} ${selectedTemplateId === t.id ? styles.active : ''}`}
                  onClick={() => {
                    setSelectedTemplateId(t.id);
                    setActiveRegion('photo');
                  }}
                >
                  {t.title}
                  <span className={styles.templateType}>{t.outputType}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.controlSection}>
            <h2 className={styles.controlLabel}>Active Region</h2>
            <div className={styles.regionButtons}>
              {relevantRegions.map(type => (
                <button
                  key={type}
                  type="button"
                  className={`${styles.regionBtn} ${activeRegion === type ? styles.active : ''}`}
                  style={{ '--region-color': REGION_BORDER_COLORS[type] }}
                  onClick={() => setActiveRegion(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.controlSection}>
            <h2 className={styles.controlLabel}>Current Values (normalized)</h2>
            <div className={styles.coordDisplay}>
              <div className={styles.coordRow}>
                <span>nx</span><code>{currentRegion.nx?.toFixed(4)}</code>
                <span className={styles.coordPx}>{Math.round((currentRegion.nx || 0) * (selectedTemplate?.nativeWidth || 1))}px</span>
              </div>
              <div className={styles.coordRow}>
                <span>ny</span><code>{currentRegion.ny?.toFixed(4)}</code>
                <span className={styles.coordPx}>{Math.round((currentRegion.ny || 0) * (selectedTemplate?.nativeHeight || 1))}px</span>
              </div>
              <div className={styles.coordRow}>
                <span>nw</span><code>{currentRegion.nw?.toFixed(4)}</code>
                <span className={styles.coordPx}>{Math.round((currentRegion.nw || 0) * (selectedTemplate?.nativeWidth || 1))}px</span>
              </div>
              <div className={styles.coordRow}>
                <span>nh</span><code>{currentRegion.nh?.toFixed(4)}</code>
                <span className={styles.coordPx}>{Math.round((currentRegion.nh || 0) * (selectedTemplate?.nativeHeight || 1))}px</span>
              </div>
            </div>

            <div className={styles.nudgeHint}>
              <div><kbd>↑↓←→</kbd> Nudge position</div>
              <div><kbd>[ ]</kbd> Resize width</div>
              <div><kbd>- =</kbd> Resize height</div>
              <div><kbd>Shift</kbd> 5× step</div>
            </div>
          </section>

          <section className={styles.controlSection}>
            <h2 className={styles.controlLabel}>Config Output</h2>
            <button
              type="button"
              className={styles.copyBtn}
              onClick={handleCopyConfig}
            >
              {copiedConfig ? '✓ Copied!' : '📋 Copy Config JSON'}
            </button>
            <pre className={styles.configPreview}>
              {generateConfig()}
            </pre>
          </section>
        </aside>

        {/* ── Right panel: image with overlay ── */}
        <main className={styles.calibrateCanvas}>
          <div
            ref={containerRef}
            className={styles.imageContainer}
          >
            {/* Template image */}
            {templateSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={templateSrc}
                alt={`${selectedTemplate?.title} template`}
                className={styles.templateImage}
                onLoad={handleImgLoad}
                draggable={false}
              />
            )}

            {/* Overlay: all regions for this template */}
            {relevantRegions.map(type => {
              const r = regions[selectedTemplateId]?.[type] || defaultRegion(type, 1, 1);
              const normalizedBox = type === 'photo'
                ? r
                : resolveTextCalibrationRegion(r);
              const box = toDisplay(
                normalizedBox.nx,
                normalizedBox.ny,
                normalizedBox.nw,
                normalizedBox.nh
              );
              const isActive = type === activeRegion;

              return (
                <div
                  key={type}
                  className={`${styles.regionOverlay} ${isActive ? styles.regionActive : ''}`}
                  style={{
                    left: `${box.x}px`,
                    top: `${box.y}px`,
                    width: `${box.w}px`,
                    height: `${box.h}px`,
                    background: REGION_COLORS[type],
                    borderColor: REGION_BORDER_COLORS[type],
                    zIndex: isActive ? 10 : 5,
                  }}
                  onMouseDown={(e) => {
                    setActiveRegion(type);
                    handleMouseDown(e, 'move');
                  }}
                >
                  <span className={styles.regionLabel}>{type}</span>
                  {/* Resize handle */}
                  {isActive && (
                    <div
                      className={styles.resizeHandle}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setActiveRegion(type);
                        handleMouseDown(e, 'resize');
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <p className={styles.imageInfo}>
            Template: <strong>{selectedTemplate?.title}</strong> ·
            Native: <code>{selectedTemplate?.nativeWidth} × {selectedTemplate?.nativeHeight}</code> ·
            Display: <code>{Math.round(displayRect.w)} × {Math.round(displayRect.h)}</code>
          </p>
        </main>
      </div>
    </div>
  );
}

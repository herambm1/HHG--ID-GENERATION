/**
 * canvasRenderer.js
 *
 * THE single Canvas 2D rendering engine for all HHG ID/PFP templates.
 *
 * Pipeline:
 *   1. Create canvas at template native resolution (exact PNG dimensions)
 *   2. Draw template PNG as background (full native resolution)
 *   3. Clip user photo to configured shape (octagon / circle / rect)
 *   4. Cover-fit user photo into clipped region (preserves aspect ratio)
 *   5. Render dynamic text fields with shrink-to-fit (Builder only)
 *   6. Return the Canvas element
 *
 * The SAME renderCard() is used for both preview and export.
 * There is no separate export renderer — no preview/export mismatch.
 *
 * Coordinate system:
 *   All positions in templateConfig are NORMALIZED (0–1) relative to
 *   nativeWidth / nativeHeight. This renderer resolves to canvas px at draw time.
 */

import { drawCoverFit } from './photoFit.js';
import { ensureFontLoaded } from './fontLoader.js';
import { resolvePhotoRegion, resolveTextField } from './coordinateContract.js';

// ─── Image loading ────────────────────────────────────────────────────────────

/**
 * Loads an HTMLImageElement and resolves when it is fully decoded.
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('[canvasRenderer] loadImage: empty src'));
      return;
    }
    const img = new Image();
    // Only set crossOrigin for real http/https URLs
    if (/^https?:\/\//.test(src)) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`[canvasRenderer] Image load failed: ${src}`));
    img.src = src;
  });
}

/**
 * Resolves a Next.js StaticImageData object or plain string to a URL.
 * @param {string | { src: string } | { default: { src: string } }} imageRef
 * @returns {string}
 */
export function resolveImageSrc(imageRef) {
  if (typeof imageRef === 'string') return imageRef;
  if (imageRef && typeof imageRef.src === 'string') return imageRef.src;
  if (imageRef && imageRef.default && typeof imageRef.default.src === 'string') {
    return imageRef.default.src;
  }
  return String(imageRef ?? '');
}

// ─── Clip path helpers ────────────────────────────────────────────────────────

/**
 * Draws an octagon clip path.
 * Chamfer is a fraction of the shorter axis.
 */
function buildOctagonPath(ctx, px, py, pw, ph, chamferN) {
  const c = Math.min(pw, ph) * (chamferN ?? 0.086);
  ctx.beginPath();
  ctx.moveTo(px + c,      py);
  ctx.lineTo(px + pw - c, py);
  ctx.lineTo(px + pw,     py + c);
  ctx.lineTo(px + pw,     py + ph - c);
  ctx.lineTo(px + pw - c, py + ph);
  ctx.lineTo(px + c,      py + ph);
  ctx.lineTo(px,          py + ph - c);
  ctx.lineTo(px,          py + c);
  ctx.closePath();
}

/**
 * Applies a Canvas clip path for the given photo region config.
 * Caller must ctx.save() before and ctx.restore() after drawing the photo.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ px, py, pw, ph, shape, chamferN }} region - all in native canvas px
 */
function applyPhotoClip(ctx, { px, py, pw, ph, shape, chamferN }) {
  ctx.beginPath();
  if (shape === 'circle') {
    const cx = px + pw / 2;
    const cy = py + ph / 2;
    const r  = Math.min(pw, ph) / 2;
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (shape === 'octagon') {
    buildOctagonPath(ctx, px, py, pw, ph, chamferN);
  } else {
    // rect fallback
    ctx.rect(px, py, pw, ph);
  }
  ctx.clip();
}

// ─── Text rendering ───────────────────────────────────────────────────────────

/**
 * Returns text width without mutating the context's current font.
 */
function measureTextWidth(ctx, text, fontString) {
  const prev = ctx.font;
  ctx.font = fontString;
  const w = ctx.measureText(text).width;
  ctx.font = prev;
  return w;
}

/**
 * Builds the CSS font string for Canvas from field config.
 * @param {object} field
 * @param {number} sizePx
 * @returns {string}
 */
function buildFontString(field, sizePx) {
  const weight = field.fontWeight || '400';
  const family = field.fontFamily || 'Space Mono';
  return `${weight} ${sizePx}px ${family}`;
}

/**
 * Applies optional text transform.
 * Supports 'uppercase' | 'lowercase' | 'none' (default = none/as-is).
 */
function applyTextTransform(text, transform) {
  if (!text) return '';
  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'lowercase') return text.toLowerCase();
  return text;
}

/**
 * Renders a single text field onto the canvas with shrink-to-fit.
 *
 * ny is the VERTICAL CENTER of the text box.
 * textBaseline = 'middle' so text is centered on that point.
 *
 * Shrink-to-fit: reduces font size by 1px steps from maxFontPx down to
 * minFontPx until visible glyph bounds fit the configured width and height.
 * If it still does not fit at minFontPx, truncates with an ellipsis.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} value        - Raw user input
 * @param {object} field        - Text field config (normalized coords)
 * @param {number} nativeWidth
 * @param {number} nativeHeight
 */
function renderTextField(ctx, value, field, nativeWidth, nativeHeight) {
  if (!value || !value.trim()) return;

  const text = applyTextTransform(value.trim(), field.textTransform);
  if (!text) return;

  const {
    x: px,
    centerY,
    maxWidth: maxW,
    maxFontSize: maxFontPx,
    minFontSize: minFontPx,
    maxHeight,
  } = resolveTextField(field, nativeWidth, nativeHeight);
  const fieldTop = centerY - maxHeight / 2;

  // Shrink-to-fit loop
  let fontSize = maxFontPx;
  let fontStr  = buildFontString(field, fontSize);
  let textW    = measureTextWidth(ctx, text, fontStr);
  let textH    = measureTextHeight(ctx, text, fontStr);

  while (field.shrinkToFit !== false && (textW > maxW || textH > maxHeight) && fontSize > minFontPx) {
    fontSize -= 1;
    fontStr  = buildFontString(field, fontSize);
    textW    = measureTextWidth(ctx, text, fontStr);
    textH    = measureTextHeight(ctx, text, fontStr);
  }

  // Still too wide at minimum size — truncate with ellipsis
  if (textW > maxW) {
    let truncated = text;
    while (truncated.length > 1) {
      truncated = truncated.slice(0, -1);
      const candidate = truncated + '…';
      if (measureTextWidth(ctx, candidate, fontStr) <= maxW) {
        drawTextWithinField(ctx, candidate, field, fontStr, px, centerY, maxW, maxHeight, fieldTop);
        return;
      }
    }
  }

  drawTextWithinField(ctx, text, field, fontStr, px, centerY, maxW, maxHeight, fieldTop);
}

function drawTextWithinField(ctx, text, field, fontString, x, centerY, width, height, top) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, top, width, height);
  ctx.clip();
  ctx.font = fontString;
  ctx.fillStyle = field.color || '#000000';
  ctx.textAlign = field.align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, getVerticallyCenteredBaseline(ctx, text, centerY));
  ctx.restore();
}

/**
 * Canvas' `middle` baseline centres an em box, not necessarily the visible
 * glyph bounds. Calibrated `ny` values are visual centres, so use measured
 * ascent/descent to centre the pixels that Canvas actually draws.
 */
function getVerticallyCenteredBaseline(ctx, text, centerY) {
  const metrics = ctx.measureText(text);
  const ascent = metrics.actualBoundingBoxAscent;
  const descent = metrics.actualBoundingBoxDescent;

  if (Number.isFinite(ascent) && Number.isFinite(descent)) {
    return centerY + (ascent - descent) / 2;
  }

  // Modern browser Canvas implementations expose actual bounding boxes. This
  // fallback preserves the previous standards-defined centred-baseline result.
  ctx.textBaseline = 'middle';
  return centerY;
}

function measureTextHeight(ctx, text, fontString) {
  const prev = ctx.font;
  ctx.font = fontString;
  const metrics = ctx.measureText(text);
  ctx.font = prev;
  const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  return Number.isFinite(height) && height > 0 ? height : 0;
}

// ─── Main render entry point ──────────────────────────────────────────────────

/**
 * Renders the complete card onto a new Canvas at native resolution.
 *
 * Usage:
 *   const canvas = await renderCard({ template, userImageUrl, cropParams, userData });
 *   // For preview: display canvas in DOM, scale via CSS max-width: 100%
 *   // For export:  pass canvas to downloadImage()
 *
 * @param {object} params
 * @param {object}  params.template       - From TEMPLATE_CATALOGUE
 * @param {string}  [params.userImageUrl] - blob: or data: URL of user photo
 * @param {object}  [params.cropParams]   - { centerX, centerY, zoom } from CropEditor
 * @param {object}  [params.userData]     - { name, role, team, builderId }
 *
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderCard({ template, userImageUrl, cropParams, userData }) {
  if (!template) throw new Error('[canvasRenderer] template is required');

  const { nativeWidth, nativeHeight } = template;
  if (!nativeWidth || !nativeHeight) {
    throw new Error(`[canvasRenderer] Template "${template.id}" missing nativeWidth/nativeHeight`);
  }

  // ── Step 1: create canvas at native resolution ────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.width  = nativeWidth;
  canvas.height = nativeHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, nativeWidth, nativeHeight);

  // ── Step 2: load template image + user photo in parallel ──────────────────
  const templateSrc = resolveImageSrc(template.image);
  const loads = [loadImage(templateSrc)];
  if (userImageUrl) {
    loads.push(loadImage(userImageUrl).catch(() => null)); // user photo failure is non-fatal
  }

  let [templateImg, userImg] = await Promise.all(loads);

  if (!templateImg) throw new Error(`[canvasRenderer] Template image could not be loaded: ${templateSrc}`);

  // ── Step 3: draw template at full native size ──────────────────────────────
  ctx.drawImage(templateImg, 0, 0, nativeWidth, nativeHeight);

  // ── Step 4: composite user photo into photo region ────────────────────────
  if (userImg && template.photo) {
    const { shape, chamferN } = template.photo;
    const { x: px, y: py, w: pw, h: ph } = resolvePhotoRegion(
      template.photo,
      nativeWidth,
      nativeHeight
    );

    ctx.save();
    applyPhotoClip(ctx, { px, py, pw, ph, shape, chamferN });
    drawCoverFit(ctx, userImg, { x: px, y: py, w: pw, h: ph }, cropParams);
    ctx.restore();
  }

  // ── Step 5: render text fields (Builder templates only) ───────────────────
  const textFields = template.textFields;
  if (Array.isArray(textFields) && textFields.length > 0 && userData) {
    // Pre-load all unique font variants before filling any text
    const fontLoadPromises = [];
    const seen = new Set();
    for (const f of textFields) {
      const key = `${f.fontFamily ?? 'Space Mono'}|${f.fontWeight ?? '400'}`;
      if (!seen.has(key)) {
        seen.add(key);
        fontLoadPromises.push(
          ensureFontLoaded(f.fontFamily ?? 'Space Mono', f.fontWeight ?? '400')
        );
      }
    }
    await Promise.all(fontLoadPromises);

    // Render each field
    for (const field of textFields) {
      const value = userData[field.key];
      if (value !== undefined && value !== null && value !== '') {
        renderTextField(ctx, String(value), field, nativeWidth, nativeHeight);
      }
    }
  }

  return canvas;
}

/**
 * Renders the card into an existing <canvas> DOM element.
 * Sets canvas dimensions to match native template resolution.
 *
 * @param {HTMLCanvasElement} targetCanvas
 * @param {object} params - Same as renderCard()
 * @returns {Promise<void>}
 */
export async function renderCardIntoCanvas(targetCanvas, params) {
  const rendered = await renderCard(params);
  const ctx = targetCanvas.getContext('2d');
  targetCanvas.width  = rendered.width;
  targetCanvas.height = rendered.height;
  ctx.drawImage(rendered, 0, 0);
}

/**
 * Canvas Rendering Engine
 *
 * Handles ONLY the photo compositing (template + clipped user photo).
 * Text rendering is now handled by HTML/CSS overlay in PreviewCanvas.
 *
 * This engine draws:
 * 1. The full template image as background
 * 2. The user's photo ON TOP, clipped to the mask region (octagon/circle)
 *
 * The clip mask is handled by Canvas API (which supports arbitrary paths),
 * while the text is rendered by the browser's native HTML/CSS engine.
 */

/**
 * Loads an image from a URL and returns a decoded HTMLImageElement.
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src && !src.startsWith('blob:') && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error('[renderEngine] Failed to load image:', src, e);
      reject(new Error(`Failed to load image: ${src}`));
    };
    img.src = src;
  });
}

/**
 * Resolves image source from Next.js StaticImageData or string.
 */
export function resolveImageSrc(imageRef) {
  if (typeof imageRef === 'string') return imageRef;
  if (imageRef && typeof imageRef === 'object' && typeof imageRef.src === 'string') return imageRef.src;
  if (imageRef && imageRef.default && typeof imageRef.default.src === 'string') return imageRef.default.src;
  return String(imageRef);
}

/**
 * Applies a clip path for the photo region mask.
 */
function applyClipMask(ctx, template) {
  const { maskShape, maskPath, photoRegion } = template;
  const { x, y, w, h } = photoRegion;

  ctx.beginPath();

  if (maskShape === 'circle') {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(w, h) / 2;
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (maskShape === 'octagon' && maskPath && maskPath.length > 0) {
    ctx.moveTo(maskPath[0].x, maskPath[0].y);
    for (let i = 1; i < maskPath.length; i++) {
      ctx.lineTo(maskPath[i].x, maskPath[i].y);
    }
    ctx.closePath();
  } else {
    ctx.rect(x, y, w, h);
  }

  ctx.clip();
}

/**
 * Draws the user photo into the photo region with crop parameters.
 */
function drawUserPhoto(ctx, userImg, photoRegion, cropParams) {
  const { x: rx, y: ry, w: rw, h: rh } = photoRegion;
  const { centerX = 0.5, centerY = 0.5, zoom = 1 } = cropParams || {};

  const imgW = userImg.naturalWidth;
  const imgH = userImg.naturalHeight;
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

  ctx.drawImage(userImg, sx, sy, cropW, cropH, rx, ry, rw, rh);
}

/**
 * Renders template + clipped user photo into a canvas.
 * Text is NOT rendered here — it's handled by the HTML/CSS overlay.
 *
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderPhotoComposite({ template, userImageUrl, cropParams }) {
  const cvs = document.createElement('canvas');
  cvs.width = template.width;
  cvs.height = template.height;
  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, cvs.width, cvs.height);

  const templateSrc = resolveImageSrc(template.image);

  let templateImg, userImg;
  try {
    const promises = [loadImage(templateSrc)];
    if (userImageUrl) promises.push(loadImage(userImageUrl));
    const results = await Promise.all(promises);
    templateImg = results[0];
    userImg = results[1] || null;
  } catch (err) {
    console.error('[renderEngine] Image loading failed:', err);
    templateImg = await loadImage(templateSrc);
  }

  // 1. Draw full template as background
  ctx.drawImage(templateImg, 0, 0, template.width, template.height);

  // 2. Draw clipped user photo ON TOP (replaces the opaque placeholder)
  if (userImg) {
    ctx.save();
    applyClipMask(ctx, template);
    drawUserPhoto(ctx, userImg, template.photoRegion, cropParams);
    ctx.restore();
  }

  return cvs;
}

/**
 * photoFit.js
 *
 * Calculates the cover-fit source rectangle for drawing a user photo into a
 * template region without distortion and without leaving empty space.
 *
 * "Cover" behaviour:
 *   - The image is scaled so its shorter dimension fills the region.
 *   - The longer dimension is cropped symmetrically around the focal point.
 *   - Aspect ratio is always preserved.
 *   - No empty space appears inside the region.
 *
 * This logic is shared between:
 *   - The Canvas renderer (canvasRenderer.js)
 *   - The CropEditor preview (for consistent crop feedback)
 */

/**
 * Computes the source-rectangle parameters needed for ctx.drawImage() to
 * cover-fit a user image into a destination region, respecting crop parameters.
 *
 * @param {object} params
 * @param {number} params.imgW          - Natural width of the user photo
 * @param {number} params.imgH          - Natural height of the user photo
 * @param {number} params.regionW       - Destination region width (px, in canvas coords)
 * @param {number} params.regionH       - Destination region height (px, in canvas coords)
 * @param {number} [params.centerX=0.5] - Focal point X as fraction of imgW (0–1)
 * @param {number} [params.centerY=0.5] - Focal point Y as fraction of imgH (0–1)
 * @param {number} [params.zoom=1]      - Additional zoom multiplier (1 = no extra zoom)
 *
 * @returns {{ sx: number, sy: number, sw: number, sh: number }}
 *   Source rectangle in the user image's pixel space (suitable for ctx.drawImage 9-arg form)
 */
export function computeCoverFitSrc({
  imgW,
  imgH,
  regionW,
  regionH,
  centerX = 0.5,
  centerY = 0.5,
  zoom = 1,
}) {
  if (!imgW || !imgH || !regionW || !regionH) {
    return { sx: 0, sy: 0, sw: imgW, sh: imgH };
  }

  const regionAspect = regionW / regionH;
  const imgAspect = imgW / imgH;

  // Determine the base crop size that exactly covers the region at zoom = 1
  let cropW, cropH;
  if (imgAspect > regionAspect) {
    // Image is wider than region — fit height, crop width
    cropH = imgH;
    cropW = cropH * regionAspect;
  } else {
    // Image is taller than region — fit width, crop height
    cropW = imgW;
    cropH = cropW / regionAspect;
  }

  // Apply zoom (zoom > 1 → crop a smaller source window → image appears zoomed in)
  cropW = cropW / zoom;
  cropH = cropH / zoom;

  // Clamp: source rectangle cannot exceed image bounds
  cropW = Math.min(cropW, imgW);
  cropH = Math.min(cropH, imgH);

  // Position crop window so the focal point is in the center
  let sx = centerX * imgW - cropW / 2;
  let sy = centerY * imgH - cropH / 2;

  // Clamp: prevent the source rectangle from going out of image bounds
  sx = Math.max(0, Math.min(sx, imgW - cropW));
  sy = Math.max(0, Math.min(sy, imgH - cropH));

  return {
    sx: Math.round(sx),
    sy: Math.round(sy),
    sw: Math.round(cropW),
    sh: Math.round(cropH),
  };
}

/**
 * Draws the user photo cover-fitted into the destination rectangle on the canvas.
 * Assumes the clip path has already been applied via ctx.save() / applyClipPath().
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} img
 * @param {object} destRegion - { x, y, w, h } in canvas native pixels
 * @param {object} [cropParams] - { centerX, centerY, zoom }
 */
export function drawCoverFit(ctx, img, destRegion, cropParams) {
  const { x, y, w, h } = destRegion;
  const { sx, sy, sw, sh } = computeCoverFitSrc({
    imgW: img.naturalWidth,
    imgH: img.naturalHeight,
    regionW: w,
    regionH: h,
    ...cropParams,
  });
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/**
 * Normalized template-coordinate contract shared by calibration and rendering.
 *
 * Photos use a top-left origin. Text uses a left edge and a vertical centre;
 * this is intentional because text has no configured bounding-box height.
 */
export function resolvePhotoRegion(photo, nativeWidth, nativeHeight) {
  return {
    x: Math.round(photo.nx * nativeWidth),
    y: Math.round(photo.ny * nativeHeight),
    w: Math.round(photo.nw * nativeWidth),
    h: Math.round(photo.nh * nativeHeight),
  };
}

export function resolveTextField(field, nativeWidth, nativeHeight) {
  return {
    x: Math.round(field.nx * nativeWidth),
    centerY: Math.round(field.ny * nativeHeight),
    maxWidth: Math.round(field.nw * nativeWidth),
    maxFontSize: Math.round((field.fontSizeN ?? 0.02) * nativeHeight),
    minFontSize: Math.round(
      (field.minFontSizeN ?? (field.fontSizeN ?? 0.02) * 0.45) * nativeHeight
    ),
    maxHeight: Math.round((field.heightN ?? (field.fontSizeN ?? 0.02) * 2) * nativeHeight),
  };
}

/**
 * Produces the visible calibration rectangle for a text field. `ny` remains
 * the centre point, while the editor rectangle extends evenly above/below it.
 */
export function resolveTextCalibrationRegion(field) {
  const height = field.nh ?? field.heightN ?? (field.fontSizeN ?? 0.02) * 2;
  return {
    nx: field.nx,
    ny: field.ny - height / 2,
    nw: field.nw,
    nh: height,
  };
}

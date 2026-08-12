/**
 * Upload configuration constants.
 * All upload limits and accepted types are defined here — never scattered in components.
 */

/** Maximum file size in bytes (15 MB) */
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

/** Human-readable max file size for error messages */
export const MAX_FILE_SIZE_LABEL = '15 MB';

/**
 * MIME types accepted natively by browsers for image decoding.
 * HEIC/HEIF is listed here but browser support is inconsistent — see HEIC notes below.
 */
export const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

/**
 * File extensions accepted by the <input accept> attribute.
 * This controls what the OS file picker shows, not actual validation.
 */
export const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.heic,.heif';

/**
 * MIME types the browser can decode natively without conversion.
 * Used to determine whether a HEIC file needs heic2any (Phase 3).
 */
export const NATIVELY_DECODABLE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

/**
 * MIME types that require client-side conversion before browser decoding.
 * heic2any conversion will be injected in Phase 3.
 */
export const CONVERSION_REQUIRED_TYPES = [
  'image/heic',
  'image/heif',
];

/** Upload pipeline statuses */
export const UPLOAD_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SELECTED: 'selected',
  ERROR: 'error',
};

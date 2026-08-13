/**
 * Image upload utilities.
 *
 * This module handles:
 * - File type and size validation
 * - Browser-side image decodability check
 * - HEIC/HEIF → JPEG conversion via heic2any (for iPhone photos on non-Safari browsers)
 * - Object URL lifecycle management
 *
 * Intentionally has NO knowledge of UI, state, or Canvas.
 */

import {
  ACCEPTED_MIME_TYPES,
  CONVERSION_REQUIRED_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
  NATIVELY_DECODABLE_TYPES,
} from './constants';

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string|null} error - User-facing error message, or null if valid.
 */

/**
 * @typedef {Object} NormalizedImage
 * @property {File} file           - The original (or converted) File object.
 * @property {string} previewUrl   - Object URL for image preview (caller must revoke when done).
 * @property {string} mimeType     - Effective MIME type after normalization.
 * @property {boolean} needsConversion - Always false after successful normalization.
 * @property {number} width        - Natural image width in pixels.
 * @property {number} height       - Natural image height in pixels.
 */

/**
 * Determines the effective MIME type of a file.
 * Falls back to extension-based inference if the browser reports an empty type (common on some mobile browsers).
 *
 * @param {File} file
 * @returns {string} lowercase MIME type
 */
export function getEffectiveMimeType(file) {
  if (file.type && file.type !== '') {
    return file.type.toLowerCase();
  }
  // Fallback: infer from extension
  const ext = file.name.split('.').pop().toLowerCase();
  const extMap = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  return extMap[ext] || '';
}

/**
 * Validates a file against type and size constraints.
 *
 * @param {File} file
 * @returns {ValidationResult}
 */
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const mimeType = getEffectiveMimeType(file);

  if (!mimeType || !ACCEPTED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Unsupported file type "${file.name.split('.').pop().toUpperCase()}". Please use JPG, PNG, WEBP, or HEIC.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMB} MB). Maximum allowed size is ${MAX_FILE_SIZE_LABEL}.`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Checks whether the browser can natively decode the image by attempting to
 * create an ImageBitmap. This is the definitive test for HEIC support on the
 * current device (Safari on Apple platforms can decode HEIC natively; most
 * other browsers cannot).
 *
 * @param {string} objectUrl - An object URL pointing to the file.
 * @returns {Promise<boolean>} true if decodable, false if not.
 */
async function canBrowserDecodeUrl(objectUrl) {
  if (typeof createImageBitmap === 'undefined') {
    // Fallback: try via HTMLImageElement
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = objectUrl;
    });
  }

  try {
    const resp = await fetch(objectUrl);
    const blob = await resp.blob();
    await createImageBitmap(blob);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads the natural dimensions of an image from an object URL.
 *
 * @param {string} objectUrl
 * @returns {Promise<{width: number, height: number}>}
 */
function getImageDimensions(objectUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Could not read image dimensions.'));
    img.src = objectUrl;
  });
}

/**
 * Converts a HEIC/HEIF blob to a JPEG blob using heic2any.
 * heic2any is dynamically imported so it's only loaded when needed (code-split).
 *
 * @param {Blob} heicBlob - The original HEIC/HEIF file blob
 * @param {string} originalName - Original file name for the converted File
 * @returns {Promise<{file: File, previewUrl: string}>}
 */
async function convertHeicToJpeg(heicBlob, originalName) {
  // Dynamic import — only loads the ~180KB heic2any wasm bundle when actually needed
  const heic2any = (await import('heic2any')).default;

  const jpegBlob = await heic2any({
    blob: heicBlob,
    toType: 'image/jpeg',
    quality: 0.92,
  });

  // heic2any may return an array of blobs for multi-image HEIC; take the first
  const resultBlob = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;

  // Create a proper File object with a .jpg extension
  const convertedName = originalName.replace(/\.hei[cf]$/i, '.jpg');
  const convertedFile = new File([resultBlob], convertedName, { type: 'image/jpeg' });
  const previewUrl = URL.createObjectURL(convertedFile);

  return { file: convertedFile, previewUrl };
}

/**
 * Main entry point: validates and normalizes an uploaded File into a NormalizedImage.
 *
 * HEIC workflow:
 * 1. Validates the file (type + size)
 * 2. If HEIC/HEIF, checks if the browser can decode it natively (Safari can)
 * 3. If not natively decodable, converts via heic2any → JPEG
 * 4. Returns a NormalizedImage with a working previewUrl
 *
 * @param {File} file
 * @returns {Promise<{image: NormalizedImage|null, error: string|null}>}
 */
export async function normalizeUploadedFile(file) {
  // 1. Validate file type and size
  const validation = validateFile(file);
  if (!validation.valid) {
    return { image: null, error: validation.error };
  }

  const mimeType = getEffectiveMimeType(file);
  const isHeic = CONVERSION_REQUIRED_TYPES.includes(mimeType);

  // 2. Create object URL
  let previewUrl = URL.createObjectURL(file);
  let workingFile = file;
  let workingMimeType = mimeType;

  // 3. Check decodability
  const decodable = await canBrowserDecodeUrl(previewUrl);

  if (!decodable) {
    if (isHeic) {
      // HEIC/HEIF on a browser that can't decode it natively (Chrome, Firefox, Edge).
      // Convert to JPEG using heic2any.
      URL.revokeObjectURL(previewUrl);

      try {
        const converted = await convertHeicToJpeg(file, file.name);
        workingFile = converted.file;
        previewUrl = converted.previewUrl;
        workingMimeType = 'image/jpeg';
      } catch (conversionErr) {
        console.error('[imageUtils] HEIC conversion failed:', conversionErr);
        return {
          image: null,
          error:
            'Could not convert your HEIC image. Please try converting it to JPG first, ' +
            'or take a screenshot of your photo and upload that instead.',
        };
      }
    } else {
      // Non-HEIC file that failed to decode — corrupted or unsupported variant.
      URL.revokeObjectURL(previewUrl);
      return {
        image: null,
        error: 'This image could not be read. The file may be corrupted or in an unsupported format.',
      };
    }
  }

  // 4. Read natural dimensions
  let width = 0;
  let height = 0;
  try {
    ({ width, height } = await getImageDimensions(previewUrl));
  } catch {
    // Dimensions are non-critical at this stage; will be read again during crop
  }

  return {
    image: {
      file: workingFile,
      previewUrl,
      mimeType: workingMimeType,
      needsConversion: false,
      width,
      height,
    },
    error: null,
  };
}

/**
 * Safely revokes an object URL to free browser memory.
 * Safe to call with null/undefined.
 *
 * @param {string|null|undefined} url
 */
export function revokePreviewUrl(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

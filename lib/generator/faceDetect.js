/**
 * Face detection utility.
 *
 * Uses the browser-native FaceDetector API (Chromium) when available.
 * Falls back to center-crop if:
 * - The API is not available (Firefox, Safari)
 * - No face is detected
 * - Detection throws an error
 *
 * This is ASSISTIVE ONLY — it provides a starting crop position.
 * The user can always override via the crop editor.
 */

/**
 * Attempts to detect the most prominent face in an image.
 *
 * @param {string} imageUrl - Object URL or data URL of the uploaded image
 * @param {number} imgWidth - Natural width of the image
 * @param {number} imgHeight - Natural height of the image
 * @returns {Promise<{ x: number, y: number, width: number, height: number } | null>}
 *   Bounding box of the detected face in pixel coordinates, or null if no face found.
 */
export async function detectFace(imageUrl, imgWidth, imgHeight) {
  // Check if FaceDetector API is available
  if (typeof window === 'undefined' || !('FaceDetector' in window)) {
    return null;
  }

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
    const faces = await detector.detect(img);

    if (faces.length === 0) {
      return null;
    }

    const face = faces[0].boundingBox;
    return {
      x: face.x,
      y: face.y,
      width: face.width,
      height: face.height,
    };
  } catch {
    // FaceDetector may throw on some platforms or image types
    return null;
  }
}

/**
 * Calculates initial crop parameters based on face detection or center fallback.
 *
 * Returns crop values that the CropEditor can use as its initial state:
 * - centerX, centerY: the focal point (face center or image center)
 * - zoom: initial zoom level that preserves the natural cover crop
 *
 * @param {string} imageUrl - Object URL of the uploaded image
 * @param {number} imgWidth - Natural image width
 * @param {number} imgHeight - Natural image height
 * @returns {Promise<{ centerX: number, centerY: number, zoom: number }>}
 */
export async function getInitialCrop(imageUrl, imgWidth, imgHeight) {
  const face = await detectFace(imageUrl, imgWidth, imgHeight);

  if (face) {
    // Keep the detected face as the focal point, but do not automatically
    // zoom past the aperture's normal cover fit. The previous face-size
    // calculation routinely reached the 3× cap, cutting off the shoulders
    // and background the Builder frames are designed to show.
    const faceCenterX = face.x + face.width / 2;
    const faceCenterY = face.y + face.height / 2;

    return {
      centerX: faceCenterX / imgWidth,
      centerY: faceCenterY / imgHeight,
      zoom: 1,
    };
  }

  // Fallback: center crop with zoom 1
  return {
    centerX: 0.5,
    centerY: 0.5,
    zoom: 1,
  };
}

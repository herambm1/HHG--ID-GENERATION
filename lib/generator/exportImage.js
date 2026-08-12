/**
 * Image export utility.
 *
 * Converts a rendered Canvas to a PNG Blob and triggers a client-side download.
 * Works on both desktop and mobile browsers.
 */

/**
 * Downloads the rendered canvas as a PNG file.
 *
 * @param {HTMLCanvasElement} canvas - The fully rendered canvas
 * @param {string} templateTitle - Human-readable template name (e.g. "Classic Base")
 * @returns {Promise<void>}
 */
export async function downloadImage(canvas, templateTitle) {
  const safeName = templateTitle.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  const fileName = `HHGoa2026-${safeName}.png`;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate image blob.'));
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve();
        }, 100);
      },
      'image/png'
    );
  });
}

/**
 * Opens a pre-filled X (Twitter) share intent.
 * Basic text-only share — no OG image (Phase 10 will add Vercel Blob storage).
 *
 * @param {string} templateTitle - Template name for the caption
 */
export function shareToX(templateTitle) {
  const text = encodeURIComponent(
    `Just made my Hacker House Goa 2026 ${templateTitle}! 🌴🏗️\n\n#FrameInGoa #HHGoa2026`
  );
  const url = `https://twitter.com/intent/tweet?text=${text}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

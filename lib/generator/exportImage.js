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
 * Converts a canvas to a PNG File object suitable for sharing.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string} templateTitle
 * @returns {Promise<File>}
 */
function canvasToFile(canvas, templateTitle) {
  const safeName = templateTitle.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  const fileName = `HHGoa2026-${safeName}.png`;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate image blob.'));
          return;
        }
        resolve(new File([blob], fileName, { type: 'image/png' }));
      },
      'image/png'
    );
  });
}

/**
 * The share text for Twitter / Web Share.
 * Always includes #FrameInGoa as required.
 *
 * @param {string} templateTitle
 * @returns {string}
 */
function getShareText(templateTitle) {
  return `Just made my Hacker House Goa 2026 ${templateTitle}! 🌴🏗️\n\n#FrameInGoa #HHGoa2026`;
}

/**
 * Shares the generated card image to X (Twitter).
 *
 * Flow:
 * 1. Uploads image to /api/share → gets a share URL with OG metadata
 * 2. Auto-downloads the card image to the user's device
 * 3. Opens the Twitter tweet composer directly with #FrameInGoa text
 *    + the share URL (when deployed, Twitter shows the card image via OG tags)
 *
 * @param {HTMLCanvasElement} canvas - The rendered canvas with the card
 * @param {string} templateTitle - Template name for the caption
 * @returns {Promise<void>}
 */
export async function shareToX(canvas, templateTitle) {
  const shareText = getShareText(templateTitle);

  // 1. Upload to server for OG card URL (when deployed)
  let shareUrl = '';
  try {
    const file = await canvasToFile(canvas, templateTitle);
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch('/api/share', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      shareUrl = data.shareUrl || '';
    }
  } catch (err) {
    console.warn('[shareToX] Image upload failed:', err);
  }

  // 2. Auto-download the card image
  try {
    await downloadImage(canvas, templateTitle);
  } catch (err) {
    console.warn('[shareToX] Download failed:', err);
  }

  // 3. Open Twitter with pre-filled text and share URL as separate `url` param
  //    Twitter's crawler only reads OG tags from the `url` param, NOT from links in `text`
  const text = encodeURIComponent(shareText);
  let intentUrl = `https://twitter.com/intent/tweet?text=${text}`;

  // Include share URL only if publicly accessible (not localhost)
  if (shareUrl && !shareUrl.includes('localhost')) {
    intentUrl += `&url=${encodeURIComponent(shareUrl)}`;
  }

  window.open(intentUrl, '_blank', 'noopener,noreferrer');
}

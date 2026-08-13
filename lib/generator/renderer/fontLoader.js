/**
 * fontLoader.js
 *
 * Ensures web fonts are fully loaded and available to the Canvas 2D API
 * before fillText() is called.
 *
 * WHY THIS IS NECESSARY
 * ─────────────────────
 * Canvas fillText() uses whatever font the browser has loaded at call time.
 * If a web font (e.g. "Space Mono") hasn't finished downloading yet, the canvas
 * silently falls back to a system font, causing the rendered text to look
 * different from the page's body text — or from what the user expects.
 *
 * The app uses two fonts loaded via next/font/google in layout.js:
 *   - Inter         (UI body text)
 *   - Space Mono    (monospace headings, Canvas dynamic text)
 *
 * Both are available as CSS class variables:
 *   --font-inter      → 'Inter'
 *   --font-space-mono → 'Space Mono'
 *
 * CANVAS FONT FAMILY NAMES
 * ────────────────────────
 * Canvas ctx.font must use the resolved family name, NOT the CSS variable.
 * next/font injects the font into the document under its real name.
 * Use 'Space Mono' directly — the browser will find it if it's loaded.
 *
 * STRATEGY
 * ────────
 * 1. document.fonts.check() — if already loaded, return immediately (fast path)
 * 2. document.fonts.load()  — wait for the specific font variant to be ready
 * 3. Timeout fallback       — resolve after MAX_WAIT_MS even if load fails
 *    (prevents rendering from blocking forever on network error)
 */

const MAX_WAIT_MS = 3000;

/**
 * Ensures a specific font variant is loaded and ready for Canvas use.
 *
 * @param {string} fontFamily - CSS font-family string, e.g. 'Space Mono'
 * @param {string} [fontWeight='400'] - CSS font-weight, e.g. '700'
 * @param {number} [testSize=32] - Font size used for the readiness check
 * @returns {Promise<void>}
 */
export async function ensureFontLoaded(fontFamily, fontWeight = '400', testSize = 32) {
  if (typeof document === 'undefined' || !document.fonts) {
    return; // SSR or unsupported browser — no-op
  }

  // Extract the primary family name (before any comma fallback)
  // e.g. 'Space Mono, monospace' → 'Space Mono'
  const primaryFamily = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
  const fontString = `${fontWeight} ${testSize}px "${primaryFamily}"`;

  // Fast path: already in the font cache
  try {
    if (document.fonts.check(fontString)) return;
  } catch {
    // Some browsers throw if the font string is malformed — continue to load()
  }

  // Request the font and race against a timeout
  try {
    await Promise.race([
      document.fonts.load(fontString),
      new Promise((resolve) => setTimeout(resolve, MAX_WAIT_MS)),
    ]);
  } catch {
    console.warn(`[fontLoader] Failed to load font: ${fontString}`);
  }
}

/**
 * Preloads all unique fonts referenced by a template's text fields.
 * Call this when a template is selected (Step 3→4 transition) to avoid
 * a delay at render time.
 *
 * @param {Array<{ fontFamily?: string, fontWeight?: string }>} textFields
 * @returns {Promise<void>}
 */
export async function preloadTemplateFonts(textFields) {
  if (!textFields || textFields.length === 0) return;

  const seen = new Set();
  const promises = [];

  for (const field of textFields) {
    const family = field.fontFamily || 'Space Mono';
    const weight = field.fontWeight || '400';
    const key = `${family}|${weight}`;
    if (!seen.has(key)) {
      seen.add(key);
      promises.push(ensureFontLoaded(family, weight));
    }
  }

  await Promise.all(promises);
}

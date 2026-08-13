import baseTemplate from '@/design/Builder/base.png';
import error404Template from '@/design/Builder/404.png';
import boardingTemplate from '@/design/Builder/boarding.png';
import terminalTemplate from '@/design/PFP/terminal.png';
import stampTemplate from '@/design/PFP/stamp.png';

/**
 * Output types available in Step 2.
 */
export const OUTPUT_TYPES = [
  {
    id: 'builder',
    title: 'BUILDER ID',
    description: 'Hacker House Goa Builder identity card & badge',
    marker: 'ID',
  },
  {
    id: 'pfp',
    title: 'PFP FRAME',
    description: 'Hacker House Goa profile picture frame',
    marker: 'PFP',
  },
];

/**
 * Field length limits for Builder details.
 * Enforced in the UI and also backed up by renderer shrink-to-fit.
 */
export const FIELD_LIMITS = {
  name: 30,
  role: 40,
  team: 30,
};

/**
 * Generates a unique Builder ID string.
 * Format: #HHG-2026-XXXX where XXXX is a random alphanumeric code.
 */
export function generateBuilderId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `#HHG-2026-${code}`;
}

/**
 * TEMPLATE CATALOGUE
 *
 * COORDINATE SYSTEM
 * ─────────────────
 * All positional values (nx, ny, nw, nh) are NORMALIZED (0–1):
 *   nx = x / nativeWidth      (0 = left edge)
 *   ny = y / nativeHeight     (0 = top edge)
 *   nw = width / nativeWidth  (fraction of template width)
 *   nh = height / nativeHeight
 *
 * fontSizeN = font size in px / nativeHeight
 *   → at 2304px tall: fontSizeN 0.0208 ≈ 48px
 *
 * Text field ny = VERTICAL CENTER of the input box.
 * Renderer uses textBaseline='middle' to center text on ny.
 *
 * FONT
 * ────
 * The app loads "Space Mono" and "Inter" via next/font/google (layout.js).
 * Canvas fillText() must use the resolved family name, not a CSS variable.
 * Use 'Space Mono' or 'Inter' directly.
 *
 * CALIBRATION STATUS
 * ──────────────────
 * All nativeWidth/nativeHeight values are VERIFIED against actual PNG bytes.
 * Photo regions and text field positions are ESTIMATED and should be refined
 * using the /calibrate development tool.
 *
 * Run `node scripts/checkTemplateDimensions.js` to re-verify dimensions.
 */
export const TEMPLATE_CATALOGUE = [

  // ═══════════════════════════════════════════════
  // BUILDER TEMPLATES
  // ═══════════════════════════════════════════════

  {
    id: 'base',
    outputType: 'builder',
    title: 'Classic Base',
    subtitle: 'Standard portrait ID badge',
    image: baseTemplate,
    orientation: 'portrait',

    // Verified 2026-08-13 via PNG header bytes
    nativeWidth: 1856,
    nativeHeight: 2304,

    aspectRatio: '1856 / 2304',

    // Photo octagon region [CALIBRATED]
    photo: {
      nx: 0.3303,       // 613px / 1856
      ny: 0.2350,       // 541px / 2304
      nw: 0.3462,       // 643px / 1856
      nh: 0.3033,       // 699px / 2304
      shape: 'octagon',
      chamferN: 0.086,  // chamfer = 8.6% of shorter dim (~55px)
    },

    // Text fields [REFERENCE CALIBRATED]
    // Measured from the beige field interiors: x includes intentional left
    // padding, while ny is the visible vertical centre (not the top edge).
    textFields: [
      {
        key: 'name',
        nx: 0.3551,     // 659px / 1856
        ny: 0.6163,     // 1420px / 2304
        nw: 0.5474,     // 1016px / 1856
        heightN: 0.0500,
        fontSizeN: 0.0243, // 56px / 2304
        minFontSizeN: 0.0095,
        fontFamily: 'Space Mono',
        fontWeight: '700',
        color: '#1A4D2E',
        align: 'left',
        textTransform: 'uppercase',
        shrinkToFit: true,
        wrapLines: false,
      },
      {
        key: 'role',
        nx: 0.3551,     // 659px / 1856
        ny: 0.6840,     // 1576px / 2304
        nw: 0.5474,     // 1016px / 1856
        heightN: 0.0500,
        fontSizeN: 0.0191, // 44px / 2304
        minFontSizeN: 0.0082,
        fontFamily: 'Space Mono',
        fontWeight: '700',
        color: '#1A4D2E',
        align: 'left',
        textTransform: 'uppercase',
        shrinkToFit: true,
        wrapLines: false,
      },
      {
        key: 'team',
        nx: 0.3551,     // 659px / 1856
        ny: 0.7517,     // 1732px / 2304
        nw: 0.5474,     // 1016px / 1856
        heightN: 0.0500,
        fontSizeN: 0.0182, // 42px / 2304
        minFontSizeN: 0.0078,
        fontFamily: 'Space Mono',
        fontWeight: '700',
        color: '#1A4D2E',
        align: 'left',
        textTransform: 'uppercase',
        shrinkToFit: true,
        wrapLines: false,
      },
      {
        key: 'builderId',
        nx: 0.3551,     // 659px / 1856
        ny: 0.8194,     // 1888px / 2304
        nw: 0.5474,     // 1016px / 1856
        heightN: 0.0500,
        fontSizeN: 0.0182, // 42px / 2304
        minFontSizeN: 0.0078,
        fontFamily: 'Space Mono',
        fontWeight: '700',
        color: '#C8A415',
        align: 'left',
        textTransform: 'uppercase',
        shrinkToFit: true,
        wrapLines: false,
      },
    ],
  },

  {
    id: 'error-404',
    outputType: 'builder',
    title: 'Glitch 404',
    subtitle: 'Cyberpunk glitch theme ID',
    image: error404Template,
    orientation: 'portrait',

    // Verified 2026-08-13
    nativeWidth: 1844,
    nativeHeight: 2304,

    aspectRatio: '1844 / 2304',

    // Photo octagon [CALIBRATED]
    photo: {
      nx: 0.3396,       // 626px / 1844
      ny: 0.2317,       // 534px / 2304
      nw: 0.3254,       // 600px / 1844
      nh: 0.3083,       // 710px / 2304
      shape: 'octagon',
      chamferN: 0.08,
    },

    // Text fields [REFERENCE CALIBRATED]
    textFields: [
      {
        key: 'name',
        nx: 0.3688,
        ny: 0.6267,
        nw: 0.5092,
        heightN: 0.0540,
        fontSizeN: 0.0243,
        minFontSizeN: 0.0095,
        fontFamily: 'Space Mono',
        fontWeight: '700',
        color: '#CC0000',
        align: 'left',
        textTransform: 'uppercase',
        shrinkToFit: true,
        wrapLines: false,
      },
      {
        key: 'role',
        nx: 0.3688,
        ny: 0.6953,
        nw: 0.5092,
        heightN: 0.0540,
        fontSizeN: 0.0191,
        minFontSizeN: 0.0082,
        fontFamily: 'Space Mono',
        fontWeight: '700',
        color: '#CC0000',
        align: 'left',
        textTransform: 'uppercase',
        shrinkToFit: true,
        wrapLines: false,
      },
      {
        key: 'team',
        nx: 0.3688,
        ny: 0.7652,
        nw: 0.5092,
        heightN: 0.0540,
        fontSizeN: 0.0182,
        minFontSizeN: 0.0078,
        fontFamily: 'Space Mono',
        fontWeight: '700',
        color: '#CC0000',
        align: 'left',
        textTransform: 'uppercase',
        shrinkToFit: true,
        wrapLines: false,
      },
      {
        key: 'builderId',
        nx: 0.3688,
        ny: 0.8346,
        nw: 0.5092,
        heightN: 0.0540,
        fontSizeN: 0.0182,
        minFontSizeN: 0.0078,
        fontFamily: 'Space Mono',
        fontWeight: '700',
        color: '#CC0000',
        align: 'left',
        textTransform: 'uppercase',
        shrinkToFit: true,
        wrapLines: false,
      },
    ],
  },

  {
    id: 'boarding',
    outputType: 'builder',
    title: 'Boarding Pass',
    subtitle: 'Landscape flight boarding pass',
    image: boardingTemplate,
    orientation: 'landscape',

    // Verified 2026-08-13
    nativeWidth: 2299,
    nativeHeight: 1343,

    aspectRatio: '2299 / 1343',

    // Photo on left side of ticket [CALIBRATED]
    photo: {
      nx: 0.0959,       // 220px / 2299
      ny: 0.2297,       // 309px / 1343
      nw: 0.1592,       // 366px / 2299
      nh: 0.4050,       // 544px / 1343
      shape: 'octagon',
      chamferN: 0.087,
    },

    // Text in centre section of boarding pass [REFERENCE CALIBRATED]
    textFields: [
      {
        key: 'name',
        nx: 0.4611,
        ny: 0.3270,
        nw: 0.2827,
        heightN: 0.0660,
        fontSizeN: 0.0340,
        minFontSizeN: 0.0119,
        fontFamily: 'Space Mono',
        fontWeight: '700',
        color: '#C92F62',
        align: 'left',
        textTransform: 'uppercase',
        shrinkToFit: true,
        wrapLines: false,
      },
      {
        key: 'role',
        nx: 0.4611,
        ny: 0.4290,
        nw: 0.2827,
        heightN: 0.0660,
        fontSizeN: 0.0320,
        minFontSizeN: 0.0104,
        fontFamily: 'Space Mono',
        fontWeight: '700',
        color: '#C92F62',
        align: 'left',
        textTransform: 'uppercase',
        shrinkToFit: true,
        wrapLines: false,
      },
      {
        key: 'team',
        nx: 0.4611,
        ny: 0.5340,
        nw: 0.2827,
        heightN: 0.0660,
        fontSizeN: 0.0300,
        minFontSizeN: 0.0096,
        fontFamily: 'Space Mono',
        fontWeight: '700',
        color: '#C92F62',
        align: 'left',
        textTransform: 'uppercase',
        shrinkToFit: true,
        wrapLines: false,
      },
      {
        key: 'builderId',
        nx: 0.4611,
        ny: 0.6390,
        nw: 0.2827,
        heightN: 0.0660,
        fontSizeN: 0.0300,
        minFontSizeN: 0.0096,
        fontFamily: 'Space Mono',
        fontWeight: '700',
        color: '#C92F62',
        align: 'left',
        textTransform: 'uppercase',
        shrinkToFit: true,
        wrapLines: false,
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // PFP TEMPLATES (photo only, no text fields)
  // ═══════════════════════════════════════════════

  {
    id: 'terminal',
    outputType: 'pfp',
    title: 'Terminal Frame',
    subtitle: 'Retro terminal window frame',
    image: terminalTemplate,
    orientation: 'landscape',

    // Verified 2026-08-13 — CORRECTED from wrong 1080×1080
    nativeWidth: 1402,
    nativeHeight: 1122,

    aspectRatio: '1402 / 1122',

    // Circular photo region [ESTIMATED — calibrate at /calibrate]
    // CORRECTED: was 'octagon' — artwork has a circular photo area
    photo: {
      nx: 0.286,
      ny: 0.245,
      nw: 0.428,
      nh: 0.535,
      shape: 'circle',
    },

    textFields: [], // PFP — no dynamic text
  },

  {
    id: 'stamp',
    outputType: 'pfp',
    title: 'Passport Stamp',
    subtitle: 'Travel-themed passport stamp',
    image: stampTemplate,
    orientation: 'portrait',

    // Verified 2026-08-13 — CORRECTED from wrong 1080×1080
    nativeWidth: 1024,
    nativeHeight: 1536,

    aspectRatio: '1024 / 1536',

    // Circular photo region [ESTIMATED — calibrate at /calibrate]
    photo: {
      nx: 0.245,
      ny: 0.345,
      nw: 0.510,
      nh: 0.340,
      shape: 'circle',
    },

    textFields: [], // PFP — no dynamic text
  },
];

// ─── Legacy compatibility shim ─────────────────────────────────────────────────
// These derived fields allow code that still references template.photoRegion,
// template.maskShape, template.width, template.height to continue working
// without modification during the renderer transition.

for (const t of TEMPLATE_CATALOGUE) {
  // width / height aliases (match legacy field names)
  if (!t.width) t.width = t.nativeWidth;
  if (!t.height) t.height = t.nativeHeight;

  // photoRegion in absolute pixels (used by CropEditor for aspect ratio)
  if (t.photo && !t.photoRegion) {
    t.photoRegion = {
      x: Math.round(t.photo.nx * t.nativeWidth),
      y: Math.round(t.photo.ny * t.nativeHeight),
      w: Math.round(t.photo.nw * t.nativeWidth),
      h: Math.round(t.photo.nh * t.nativeHeight),
    };
  }

  // maskShape alias (used by CropEditor)
  if (t.photo && !t.maskShape) {
    t.maskShape = t.photo.shape;
  }

  // maskPath for octagon (backward compat)
  if (!t.maskPath) {
    if (t.photo?.shape === 'octagon') {
      const { x, y, w, h } = t.photoRegion;
      const c = Math.round(Math.min(w, h) * (t.photo.chamferN ?? 0.086));
      t.maskPath = [
        { x: x + c,     y },
        { x: x + w - c, y },
        { x: x + w,     y: y + c },
        { x: x + w,     y: y + h - c },
        { x: x + w - c, y: y + h },
        { x: x + c,     y: y + h },
        { x,            y: y + h - c },
        { x,            y: y + c },
      ];
    } else {
      t.maskPath = [];
    }
  }
}

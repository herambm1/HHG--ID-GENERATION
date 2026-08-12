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
 * Enforced in the UI and used by the renderer to prevent overflow.
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
 * Full template catalogue for Builder ID and PFP outputs.
 *
 * Each entry contains:
 * - Display metadata (title, subtitle, image, orientation, aspectRatio)
 * - Native canvas dimensions (width, height)
 * - photoRegion: pixel coordinates where the user photo is composited
 * - maskShape: 'octagon' or 'circle' clip path for the photo region
 * - textFields: array of text rendering instructions for Builder templates
 *
 * All coordinates are in pixels relative to the template's native resolution.
 *
 * TEXT FIELD COORDINATES:
 * Measured from the actual template PNG images.
 * x = left padding inside the beige input box
 * y = vertical center of the beige input box
 * baseline = 'middle' so y is the visual center of the text
 */
export const TEMPLATE_CATALOGUE = [
  // ──────────────────────────────────────────────
  // BUILDER TEMPLATES
  // ──────────────────────────────────────────────
  {
    id: 'base',
    outputType: 'builder',
    title: 'Classic Base',
    subtitle: 'Standard portrait ID badge',
    image: baseTemplate,
    orientation: 'portrait',
    aspectRatio: '1856 / 2304',
    width: 1856,
    height: 2304,
    photoRegion: { x: 460, y: 430, w: 930, h: 930 },
    maskShape: 'octagon',
    // Chamfered rectangle — 8 corner points
    maskPath: [
      { x: 460 + 80, y: 430 },           // top-left chamfer
      { x: 460 + 930 - 80, y: 430 },     // top-right chamfer
      { x: 460 + 930, y: 430 + 80 },
      { x: 460 + 930, y: 430 + 930 - 80 },
      { x: 460 + 930 - 80, y: 430 + 930 },
      { x: 460 + 80, y: 430 + 930 },
      { x: 460, y: 430 + 930 - 80 },
      { x: 460, y: 430 + 80 },
    ],
    // Beige input boxes run from ~x:650 to ~x:1730
    // Vertical centers: NAME~1430, ROLE~1565, TEAM~1700, BUILDER_ID~1835
    textFields: [
      {
        key: 'name',
        x: 680,
        y: 1430,
        fontSize: 48,
        fontFamily: 'Inter, Arial, sans-serif',
        fontWeight: '700',
        color: '#1B5E35',
        align: 'left',
        baseline: 'middle',
        maxWidth: 1030,
      },
      {
        key: 'role',
        x: 680,
        y: 1565,
        fontSize: 44,
        fontFamily: 'Inter, Arial, sans-serif',
        fontWeight: '600',
        color: '#1B5E35',
        align: 'left',
        baseline: 'middle',
        maxWidth: 1030,
      },
      {
        key: 'team',
        x: 680,
        y: 1700,
        fontSize: 42,
        fontFamily: 'Inter, Arial, sans-serif',
        fontWeight: '600',
        color: '#1B5E35',
        align: 'left',
        baseline: 'middle',
        maxWidth: 1030,
      },
      {
        key: 'builderId',
        x: 680,
        y: 1835,
        fontSize: 42,
        fontFamily: 'Inter, Arial, sans-serif',
        fontWeight: '700',
        color: '#C8A415',
        align: 'left',
        baseline: 'middle',
        maxWidth: 1030,
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
    aspectRatio: '1844 / 2304',
    width: 1844,
    height: 2304,
    photoRegion: { x: 555, y: 340, w: 770, h: 870 },
    maskShape: 'octagon',
    maskPath: [
      { x: 555 + 70, y: 340 },
      { x: 555 + 770 - 70, y: 340 },
      { x: 555 + 770, y: 340 + 70 },
      { x: 555 + 770, y: 340 + 870 - 70 },
      { x: 555 + 770 - 70, y: 340 + 870 },
      { x: 555 + 70, y: 340 + 870 },
      { x: 555, y: 340 + 870 - 70 },
      { x: 555, y: 340 + 70 },
    ],
    // Dark theme — beige/tan input boxes from ~x:650 to ~x:1720
    // Vertical centers: NAME~1420, ROLE~1560, TEAM~1695, BUILDER_ID~1830
    textFields: [
      {
        key: 'name',
        x: 680,
        y: 1420,
        fontSize: 48,
        fontFamily: 'Inter, Arial, sans-serif',
        fontWeight: '700',
        color: '#8B1A1A',
        align: 'left',
        baseline: 'middle',
        maxWidth: 1020,
      },
      {
        key: 'role',
        x: 680,
        y: 1560,
        fontSize: 44,
        fontFamily: 'Inter, Arial, sans-serif',
        fontWeight: '600',
        color: '#8B1A1A',
        align: 'left',
        baseline: 'middle',
        maxWidth: 1020,
      },
      {
        key: 'team',
        x: 680,
        y: 1695,
        fontSize: 42,
        fontFamily: 'Inter, Arial, sans-serif',
        fontWeight: '600',
        color: '#8B1A1A',
        align: 'left',
        baseline: 'middle',
        maxWidth: 1020,
      },
      {
        key: 'builderId',
        x: 680,
        y: 1830,
        fontSize: 42,
        fontFamily: 'Inter, Arial, sans-serif',
        fontWeight: '700',
        color: '#CC3333',
        align: 'left',
        baseline: 'middle',
        maxWidth: 1020,
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
    aspectRatio: '2299 / 1343',
    width: 2299,
    height: 1343,
    photoRegion: { x: 65, y: 120, w: 690, h: 860 },
    maskShape: 'octagon',
    maskPath: [
      { x: 65 + 60, y: 120 },
      { x: 65 + 690 - 60, y: 120 },
      { x: 65 + 690, y: 120 + 60 },
      { x: 65 + 690, y: 120 + 860 - 60 },
      { x: 65 + 690 - 60, y: 120 + 860 },
      { x: 65 + 60, y: 120 + 860 },
      { x: 65, y: 120 + 860 - 60 },
      { x: 65, y: 120 + 60 },
    ],
    // Landscape layout — input boxes are bordered rectangles to the right of labels
    // Input boxes from ~x:780 to ~x:1355
    // Vertical centers: NAME~375, ROLE~530, TEAM~680, BUILDER_ID~830
    textFields: [
      {
        key: 'name',
        x: 800,
        y: 375,
        fontSize: 38,
        fontFamily: 'Inter, Arial, sans-serif',
        fontWeight: '700',
        color: '#3D2B1F',
        align: 'left',
        baseline: 'middle',
        maxWidth: 530,
      },
      {
        key: 'role',
        x: 800,
        y: 530,
        fontSize: 34,
        fontFamily: 'Inter, Arial, sans-serif',
        fontWeight: '600',
        color: '#3D2B1F',
        align: 'left',
        baseline: 'middle',
        maxWidth: 530,
      },
      {
        key: 'team',
        x: 800,
        y: 680,
        fontSize: 32,
        fontFamily: 'Inter, Arial, sans-serif',
        fontWeight: '600',
        color: '#3D2B1F',
        align: 'left',
        baseline: 'middle',
        maxWidth: 530,
      },
      {
        key: 'builderId',
        x: 800,
        y: 830,
        fontSize: 32,
        fontFamily: 'Inter, Arial, sans-serif',
        fontWeight: '700',
        color: '#8B4513',
        align: 'left',
        baseline: 'middle',
        maxWidth: 530,
      },
    ],
  },

  // ──────────────────────────────────────────────
  // PFP TEMPLATES (no text fields)
  // ──────────────────────────────────────────────
  {
    id: 'terminal',
    outputType: 'pfp',
    title: 'Terminal Frame',
    subtitle: 'Retro terminal window frame',
    image: terminalTemplate,
    orientation: 'square',
    aspectRatio: '1 / 1',
    width: 1080,
    height: 1080,
    photoRegion: { x: 85, y: 175, w: 910, h: 775 },
    maskShape: 'octagon',
    maskPath: [
      { x: 85 + 40, y: 175 },
      { x: 85 + 910 - 40, y: 175 },
      { x: 85 + 910, y: 175 + 40 },
      { x: 85 + 910, y: 175 + 775 - 40 },
      { x: 85 + 910 - 40, y: 175 + 775 },
      { x: 85 + 40, y: 175 + 775 },
      { x: 85, y: 175 + 775 - 40 },
      { x: 85, y: 175 + 40 },
    ],
    textFields: [],
  },
  {
    id: 'stamp',
    outputType: 'pfp',
    title: 'Passport Stamp',
    subtitle: 'Travel-themed passport stamp',
    image: stampTemplate,
    orientation: 'square',
    aspectRatio: '1 / 1',
    width: 1080,
    height: 1080,
    photoRegion: { x: 140, y: 140, w: 800, h: 800 },
    maskShape: 'circle',
    maskPath: [],
    textFields: [],
  },
];

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
 * Full template catalogue for Builder ID and PFP outputs.
 * Native dimensions and aspect ratios preserved from source assets in design/.
 */
export const TEMPLATE_CATALOGUE = [
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
  },
  {
    id: 'terminal',
    outputType: 'pfp',
    title: 'Terminal Frame',
    subtitle: 'Retro terminal interface frame',
    image: terminalTemplate,
    orientation: 'landscape',
    aspectRatio: '1402 / 1122',
    width: 1402,
    height: 1122,
  },
  {
    id: 'stamp',
    outputType: 'pfp',
    title: 'Goa Stamp',
    subtitle: 'Passport stamp badge frame',
    image: stampTemplate,
    orientation: 'portrait',
    aspectRatio: '1024 / 1536',
    width: 1024,
    height: 1536,
  },
];

/**
 * Generates a stable random Builder ID in the required format: #HHG-2026-XXXX
 * Uses 4 alphanumeric uppercase characters.
 */
export function generateBuilderId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `#HHG-2026-${code}`;
}

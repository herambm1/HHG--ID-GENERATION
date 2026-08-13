/**
 * checkTemplateDimensions.js
 *
 * Development utility — verifies that templateConfig.js nativeWidth/nativeHeight
 * values match the actual PNG file dimensions.
 *
 * Run with: node scripts/checkTemplateDimensions.js
 *
 * Will exit with code 1 if any mismatch is found.
 */

const fs = require('fs');
const path = require('path');

// Manually listed to avoid ES module complexity (config uses import syntax)
const EXPECTED = [
  { id: 'base',       file: 'design/Builder/base.png',     nativeWidth: 1856, nativeHeight: 2304 },
  { id: 'error-404',  file: 'design/Builder/404.png',      nativeWidth: 1844, nativeHeight: 2304 },
  { id: 'boarding',   file: 'design/Builder/boarding.png', nativeWidth: 2299, nativeHeight: 1343 },
  { id: 'terminal',   file: 'design/PFP/terminal.png',     nativeWidth: 1402, nativeHeight: 1122 },
  { id: 'stamp',      file: 'design/PFP/stamp.png',        nativeWidth: 1024, nativeHeight: 1536 },
];

function getPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4E || buf[3] !== 0x47) {
    throw new Error('Not a valid PNG file');
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

const root = path.resolve(__dirname, '..');
let allPassed = true;

console.log('\n📐 Template Dimension Check\n');

for (const entry of EXPECTED) {
  const filePath = path.join(root, entry.file);

  if (!fs.existsSync(filePath)) {
    console.log(`  ❌ ${entry.id}: FILE NOT FOUND — ${entry.file}`);
    allPassed = false;
    continue;
  }

  const { width, height } = getPngDimensions(filePath);
  const wMatch = width === entry.nativeWidth;
  const hMatch = height === entry.nativeHeight;
  const ok = wMatch && hMatch;

  if (ok) {
    console.log(`  ✅ ${entry.id}: ${width}×${height} — matches config`);
  } else {
    console.log(`  ❌ ${entry.id}: PNG is ${width}×${height} but config says ${entry.nativeWidth}×${entry.nativeHeight}`);
    allPassed = false;
  }
}

console.log('');
if (allPassed) {
  console.log('✅ All template dimensions verified.\n');
  process.exit(0);
} else {
  console.log('❌ DIMENSION MISMATCH DETECTED. Update templateConfig.js.\n');
  process.exit(1);
}

/**
 * POST /api/share
 *
 * Accepts a generated card image (PNG) via FormData and stores it.
 * - On Vercel (production): uses Vercel Blob for persistent public storage
 * - Locally: falls back to filesystem (.data/shares/)
 *
 * Returns { id, shareUrl, imageUrl } — the shareUrl is used in the tweet,
 * and Twitter's crawler reads OG tags from /share/[id] which point to imageUrl.
 */

import { randomUUID } from 'crypto';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || !(file instanceof Blob)) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    const id = randomUUID().slice(0, 8);
    const origin = new URL(request.url).origin;
    let imageUrl = '';

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // ── Vercel Blob (production) ──────────────────────────────
      const { put } = await import('@vercel/blob');
      const blob = await put(`shares/${id}.png`, file, {
        access: 'public',
        contentType: 'image/png',
      });
      imageUrl = blob.url;
    } else {
      // ── Filesystem fallback (local dev) ───────────────────────
      const { writeFile, mkdir } = await import('fs/promises');
      const { join } = await import('path');
      const SHARES_DIR = join(process.cwd(), '.data', 'shares');
      await mkdir(SHARES_DIR, { recursive: true });
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(join(SHARES_DIR, `${id}.png`), buffer);
      imageUrl = `${origin}/api/shares/${id}/image`;
    }

    const shareUrl = `${origin}/share/${id}`;

    return Response.json({ id, shareUrl, imageUrl });
  } catch (err) {
    console.error('[api/share] Upload failed:', err);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}

/**
 * POST /api/share
 *
 * Accepts a generated card image (PNG) via FormData,
 * stores it on disk with a unique ID, and returns the share URL.
 *
 * Twitter's crawler will later hit /share/[id] to pick up OG metadata
 * that points to /api/shares/[id]/image for the card image.
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { headers } from 'next/headers';

const SHARES_DIR = join(process.cwd(), '.data', 'shares');

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || !(file instanceof Blob)) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    // Generate a short unique ID
    const id = randomUUID().slice(0, 8);

    // Ensure storage directory exists
    await mkdir(SHARES_DIR, { recursive: true });

    // Write PNG to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(SHARES_DIR, `${id}.png`), buffer);

    // Build the share URL from the request origin
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const origin = `${protocol}://${host}`;
    const shareUrl = `${origin}/share/${id}`;

    return Response.json({ id, shareUrl });
  } catch (err) {
    console.error('[api/share] Upload failed:', err);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}

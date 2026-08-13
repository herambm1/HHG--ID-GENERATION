/**
 * GET /api/og/[id]
 *
 * Serves the OG card image for a share ID.
 * Twitter's crawler fetches this URL from the og:image / twitter:image meta tags.
 *
 * This route acts as a reliable proxy — it fetches the image from Vercel Blob
 * (production) or the local filesystem and returns it with proper headers
 * that Twitter's crawler expects.
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const SHARES_DIR = join(process.cwd(), '.data', 'shares');

export async function GET(_request, { params }) {
  try {
    const { id } = await params;

    // Sanitize: only allow alphanumeric + hyphens
    if (!id || !/^[a-z0-9-]+$/i.test(id)) {
      return new Response('Invalid ID', { status: 400 });
    }

    let imageBuffer;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Vercel Blob — find and fetch the uploaded image
      const { list } = await import('@vercel/blob');
      const { blobs } = await list({ prefix: `shares/${id}`, limit: 1 });

      if (!blobs[0]?.url) {
        return new Response('Not found', { status: 404 });
      }

      // Fetch the image from Blob storage
      const res = await fetch(blobs[0].url);
      if (!res.ok) {
        return new Response('Not found', { status: 404 });
      }
      imageBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      // Filesystem fallback
      const filePath = join(SHARES_DIR, `${id}.png`);
      if (!existsSync(filePath)) {
        return new Response('Not found', { status: 404 });
      }
      imageBuffer = await readFile(filePath);
    }

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        // Allow Twitter's crawler to access this image
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

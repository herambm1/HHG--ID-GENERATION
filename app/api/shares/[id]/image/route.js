/**
 * GET /api/shares/[id]/image
 *
 * Serves a previously uploaded card image by its share ID.
 * Used by Twitter's crawler (via OG meta tags) to fetch the card image.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

const SHARES_DIR = join(process.cwd(), '.data', 'shares');

export async function GET(_request, { params }) {
  try {
    const { id } = await params;

    // Sanitize: only allow alphanumeric + hyphens
    if (!id || !/^[a-z0-9-]+$/i.test(id)) {
      return new Response('Invalid ID', { status: 400 });
    }

    const filePath = join(SHARES_DIR, `${id}.png`);
    const buffer = await readFile(filePath);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

/**
 * /share/[id] — Twitter Card share page
 *
 * When a tweet contains a link to /share/[id], Twitter's crawler visits this page
 * and reads the OG / Twitter Card meta tags. The `twitter:card = summary_large_image`
 * meta tag tells Twitter to display the card image as a large preview under the tweet.
 *
 * Image lookup:
 * - Vercel Blob (production): lists blobs with prefix `shares/{id}`
 * - Filesystem fallback (local): serves via /api/shares/[id]/image
 */

import { existsSync } from 'fs';
import { join } from 'path';
import Link from 'next/link';

const SHARES_DIR = join(process.cwd(), '.data', 'shares');

/**
 * Checks whether the share image exists (without returning the URL).
 * Used by generateMetadata to conditionally include OG image tags.
 */
async function checkImageExists(id, origin) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: `shares/${id}`, limit: 1 });
    return blobs.length > 0;
  }

  const filePath = join(SHARES_DIR, `${id}.png`);
  return existsSync(filePath);
}

/**
 * Finds the public image URL for a share ID.
 * Used by the page component to display the image inline.
 */
async function getImageUrl(id, origin) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // Vercel Blob — find the uploaded image
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: `shares/${id}`, limit: 1 });
    return blobs[0]?.url || '';
  }

  // Filesystem fallback
  const filePath = join(SHARES_DIR, `${id}.png`);
  if (existsSync(filePath)) {
    return `${origin}/api/shares/${id}/image`;
  }
  return '';
}

export async function generateMetadata({ params }) {
  const { id } = await params;

  // We need the origin for OG image URLs
  let origin = 'https://hhg-id-generation.vercel.app';
  try {
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const host = headersList.get('host');
    const proto = headersList.get('x-forwarded-proto') || 'https';
    if (host) origin = `${proto}://${host}`;
  } catch {
    // Use default origin
  }

  // Use our own API route for the OG image — Twitter's crawler works more
  // reliably with same-domain URLs that return proper Content-Type headers.
  // The /api/og/[id] route fetches from Vercel Blob or filesystem internally.
  const ogImageUrl = `${origin}/api/og/${id}`;
  const shareUrl = `${origin}/share/${id}`;

  // Check if the image actually exists before including it in metadata
  const imageExists = await checkImageExists(id, origin);

  return {
    title: 'My HH Goa 2026 Builder Card | #FrameInGoa',
    description:
      'Check out my Hacker House Goa 2026 card! Create yours too — upload a photo, pick a template, share to X. #FrameInGoa #HHGoa2026',
    openGraph: {
      title: 'My HH Goa 2026 Builder Card',
      description:
        'Check out my Hacker House Goa 2026 card! #FrameInGoa #HHGoa2026',
      type: 'website',
      siteName: 'HH Goa 2026',
      url: shareUrl,
      images: imageExists
        ? [
            {
              url: ogImageUrl,
              width: 1080,
              height: 1350,
              alt: 'Hacker House Goa 2026 Builder Card',
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'My HH Goa 2026 Builder Card',
      description:
        'Check out my Hacker House Goa 2026 card! #FrameInGoa #HHGoa2026',
      images: imageExists ? [ogImageUrl] : [],
    },
  };
}

export default async function SharePage({ params }) {
  const { id } = await params;

  let origin = 'https://hhg-id-generation.vercel.app';
  try {
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const host = headersList.get('host');
    const proto = headersList.get('x-forwarded-proto') || 'https';
    if (host) origin = `${proto}://${host}`;
  } catch {
    // Use default origin
  }

  const imageUrl = await getImageUrl(id, origin);

  if (!imageUrl) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h1 style={styles.title}>Card Not Found</h1>
          <p style={styles.text}>
            This card may have expired or doesn&apos;t exist.
          </p>
          <Link href="/" style={styles.cta}>
            Create Your Own →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Hacker House Goa 2026</h1>
        <p style={styles.subtitle}>#FrameInGoa #HHGoa2026</p>

        <div style={styles.imageWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Hacker House Goa 2026 Builder Card"
            style={styles.image}
          />
        </div>

        <Link href="/" style={styles.cta}>
          🌴 Create Your Own Card →
        </Link>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80vh',
    padding: '2rem 1rem',
  },
  card: {
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary, #fff)',
    marginBottom: '0.25rem',
    fontFamily: 'var(--font-mono)',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary, #aaa)',
    marginBottom: '1.5rem',
    fontFamily: 'var(--font-mono)',
  },
  imageWrap: {
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '1.5rem',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  image: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  text: {
    color: 'var(--text-secondary, #aaa)',
    marginBottom: '1.5rem',
  },
  cta: {
    display: 'inline-block',
    padding: '0.75rem 2rem',
    background: 'var(--accent-yellow, #FFD500)',
    color: '#000',
    fontWeight: 700,
    borderRadius: '8px',
    textDecoration: 'none',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.9rem',
    transition: 'transform 0.15s ease',
  },
};

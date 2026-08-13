/**
 * /share/[id] — Share page
 *
 * This page exists primarily for Twitter's crawler. When a tweet contains
 * a link to /share/[id], Twitter crawls this page and reads the OG meta tags
 * to display a rich card preview with the user's generated card image.
 *
 * Human visitors see a simple page with the card image and a CTA to create their own.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { headers } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';

const SHARES_DIR = join(process.cwd(), '.data', 'shares');

/**
 * Dynamic OG metadata so Twitter shows the card image in the tweet.
 */
export async function generateMetadata({ params }) {
  const { id } = await params;
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const origin = `${protocol}://${host}`;

  const imageUrl = `${origin}/api/shares/${id}/image`;

  return {
    title: 'My HH Goa 2026 Builder Card | #FrameInGoa',
    description:
      'Check out my Hacker House Goa 2026 card! Create yours too — upload a photo, pick a template, share to X. #FrameInGoa #HHGoa2026',
    openGraph: {
      title: 'My HH Goa 2026 Builder Card',
      description: 'Check out my Hacker House Goa 2026 card! #FrameInGoa #HHGoa2026',
      siteName: 'HH Goa 2026',
      images: [
        {
          url: imageUrl,
          width: 1080,
          height: 1350,
          alt: 'Hacker House Goa 2026 Builder Card',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'My HH Goa 2026 Builder Card',
      description: 'Check out my Hacker House Goa 2026 card! #FrameInGoa #HHGoa2026',
      images: [imageUrl],
    },
  };
}

export default async function SharePage({ params }) {
  const { id } = await params;
  const imageExists = existsSync(join(SHARES_DIR, `${id}.png`));

  if (!imageExists) {
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
            src={`/api/shares/${id}/image`}
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

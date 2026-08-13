import { Inter, Space_Mono } from 'next/font/google';
import Header from '@/components/shared/Header';
import './globals.css';

/**
 * Inter — UI body text.
 * Exposed as --font-inter CSS variable; used via var(--font-body) in globals.css.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  // Fallback: system fonts defined in globals.css var(--font-body)
});

/**
 * Space Mono — monospace headings, terminal motifs, Canvas dynamic text.
 * Exposed as --font-space-mono CSS variable; used via var(--font-mono) in globals.css.
 */
const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://hhg-id-generation.vercel.app'),
  title: 'HH Goa 2026 — Frame & Builder ID Generator',
  description:
    'Create your Hacker House Goa 2026 PFP frame or Builder ID card. Upload a photo, pick a template, and share to X. #FrameInGoa',
  keywords: ['Hacker House Goa', 'FrameInGoa', 'Builder ID', 'HHGoa2026', 'hackathon'],
  openGraph: {
    title: 'HH Goa 2026 — Frame & Builder ID Generator',
    description: 'Generate your Hacker House Goa 2026 Builder identity. #FrameInGoa',
    siteName: 'HH Goa 2026',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HH Goa 2026 — Frame & Builder ID Generator',
    description: 'Generate your Hacker House Goa 2026 Builder identity. #FrameInGoa',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable}`}>
      <body>
        <Header />
        <main className="page-wrapper">
          {children}
        </main>
      </body>
    </html>
  );
}

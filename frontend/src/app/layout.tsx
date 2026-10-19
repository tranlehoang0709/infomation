import type { Metadata } from 'next';
import './globals.css';
import { siteOrigin } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: { default: 'Portfolio cá nhân', template: '%s | Portfolio' },
  description: 'Portfolio cá nhân giới thiệu hồ sơ, kinh nghiệm và các dự án.',
  applicationName: 'Portfolio cá nhân',
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Portfolio cá nhân',
    title: 'Portfolio cá nhân',
    description: 'Hồ sơ cá nhân, kinh nghiệm và các dự án.',
    url: '/',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Portfolio cá nhân' }],
  },
  twitter: { card: 'summary_large_image', title: 'Portfolio cá nhân', images: ['/opengraph-image'] },
  icons: { icon: '/icon.svg', shortcut: '/icon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}

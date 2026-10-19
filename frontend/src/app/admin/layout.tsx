import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Quản trị', template: '%s | Quản trị Portfolio' },
  robots: { index: false, follow: false, noarchive: true },
  alternates: { canonical: null },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

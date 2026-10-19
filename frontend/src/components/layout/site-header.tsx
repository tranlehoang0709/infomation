'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function SiteHeader({ title }: { title?: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 18));
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
    };
  }, []);

  return <header data-scrolled={scrolled} className="public-site-header flex flex-wrap items-center justify-between gap-3">
    <Link href="/" className="font-bold tracking-tight text-blue-800">{title ?? 'Portfolio cá nhân'}</Link>
    <nav className="flex items-center gap-3 sm:gap-5" aria-label="Điều hướng chính">
      <Link href="/projects" className="text-sm font-medium text-slate-600 hover:text-blue-700">Dự án</Link>
      <Link href="/admin/login" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-blue-300 hover:text-blue-700">Quản trị</Link>
    </nav>
  </header>;
}

'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export function ScrollReveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = revealRef.current;
    if (!element) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      element.classList.add('scroll-reveal-visible');
      return;
    }

    element.classList.add('scroll-reveal-active');
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add('scroll-reveal-visible');
        observer.unobserve(element);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={revealRef} className={`scroll-reveal ${className}`}>{children}</div>;
}

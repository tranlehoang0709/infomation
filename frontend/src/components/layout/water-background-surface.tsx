'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';

type SurfaceProps = {
  as?: 'main' | 'div';
  className: string;
  children: ReactNode;
};

const BACKGROUND_TARGETS = '.public-workspace .public-section, .admin-workspace > div > section';
const TRAIL_SLOTS = 5;

function contrastColor(section: HTMLElement) {
  const channels = getComputedStyle(section).backgroundColor.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length < 3) return '0 0 0';
  const [red, green, blue] = channels;
  const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
  return luminance >= 128 ? '0 0 0' : '255 255 255';
}

export function WaterBackgroundSurface({ as = 'main', className, children }: SurfaceProps) {
  const lastPointer = useRef<{ x: number; y: number; time: number } | null>(null);
  const activeBackground = useRef<HTMLElement | null>(null);
  const lastTrailTime = useRef(0);
  const trailSlot = useRef(0);
  const trailIds = useRef(Array<number>(TRAIL_SLOTS).fill(0));
  const nextTrailId = useRef(0);
  const Surface = as;

  function fadeTrails(section: HTMLElement) {
    for (let index = 1; index <= TRAIL_SLOTS; index += 1) {
      section.style.setProperty(`--water-tail-${index}-strength`, '0');
    }
  }

  function fadeBackground(section: HTMLElement) {
    section.style.setProperty('--water-strength', '0');
    fadeTrails(section);
    window.setTimeout(() => {
      if (activeBackground.current !== section) section.classList.remove('water-bg-active');
    }, 1600);
  }

  function move(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === 'touch' || !(event.target instanceof Element)) return;
    const section = event.target.closest<HTMLElement>(BACKGROUND_TARGETS);
    if (!section || !event.currentTarget.contains(section) || section.closest('[data-water-background-surface]') !== event.currentTarget) return;

    const bounds = section.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const time = performance.now();
    const previous = lastPointer.current;
    lastPointer.current = { x: event.clientX, y: event.clientY, time };

    const sameSection = activeBackground.current === section;
    if (activeBackground.current && !sameSection) {
      fadeBackground(activeBackground.current);
      trailIds.current.fill(0);
    }
    activeBackground.current = section;
    section.classList.add('water-bg-active');
    const distance = previous ? Math.hypot(event.clientX - previous.x, event.clientY - previous.y) : 0;
    const speed = previous ? distance / Math.max(time - previous.time, 1) : 0;
    const strength = Math.max(0.045, Math.min(0.38, 0.4 / (1 + speed * 0.85)));
    section.style.setProperty('--water-x', `${x}px`);
    section.style.setProperty('--water-y', `${y}px`);
    section.style.setProperty('--water-color', contrastColor(section));
    section.style.setProperty('--water-strength', String(strength));

    if (sameSection && previous && distance > 7 && time - lastTrailTime.current > 90) {
      const slot = trailSlot.current++ % TRAIL_SLOTS;
      const id = ++nextTrailId.current;
      trailIds.current[slot] = id;
      const trailX = previous.x - bounds.left;
      const trailY = previous.y - bounds.top;
      const trailStrength = Math.min(0.16, strength * 0.5);
      section.style.setProperty(`--water-tail-${slot + 1}-x`, `${trailX}px`);
      section.style.setProperty(`--water-tail-${slot + 1}-y`, `${trailY}px`);
      section.style.setProperty(`--water-tail-${slot + 1}-strength`, String(trailStrength));
      lastTrailTime.current = time;
      window.setTimeout(() => {
        if (trailIds.current[slot] === id) section.style.setProperty(`--water-tail-${slot + 1}-strength`, '0');
      }, 110);
    }
  }

  function leave() {
    lastPointer.current = null;
    if (activeBackground.current) fadeBackground(activeBackground.current);
    activeBackground.current = null;
  }

  return <Surface data-water-background-surface className={className} onPointerMove={move} onPointerLeave={leave}>{children}</Surface>;
}

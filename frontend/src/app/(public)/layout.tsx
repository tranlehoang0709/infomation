import { CursorGlow } from '@/components/layout/cursor-glow';

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="public-atmosphere-root">
    <CursorGlow />
    {children}
  </div>;
}

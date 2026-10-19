import { ImageResponse } from 'next/og';

export const alt = 'Portfolio cá nhân';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 55%, #dbeafe 100%)', color: '#0f2440', fontSize: 72, fontWeight: 700 }}>
      Portfolio cá nhân
    </div>,
    size,
  );
}

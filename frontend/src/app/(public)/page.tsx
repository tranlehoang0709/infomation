import type { Metadata } from 'next';
import { ApiError, apiAssetUrl } from '@/lib/api';
import { getPublicProfile, seoDescription, siteUrl } from '@/lib/seo';
import { PublicProfilePage } from '@/components/profile/public-profile';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { title, profile } = await getPublicProfile();
    const pageTitle = profile.headline ? `${profile.fullName} — ${profile.headline}` : profile.fullName;
    const description = seoDescription(profile.bio, profile.headline, title);
    const image = profile.avatarUrl ? apiAssetUrl(profile.avatarUrl) : siteUrl('/opengraph-image');
    return {
      title: pageTitle,
      description,
      alternates: { canonical: siteUrl('/') },
      openGraph: { type: 'profile', locale: 'vi_VN', siteName: title, title: pageTitle, description, url: siteUrl('/'), images: [{ url: image, width: 1200, height: 630, alt: `Ảnh đại diện ${profile.fullName}` }] },
      twitter: { card: 'summary_large_image', title: pageTitle, description, images: [image] },
    };
  } catch (error) {
    return {
      title: 'Portfolio cá nhân',
      description: 'Portfolio cá nhân giới thiệu hồ sơ, kinh nghiệm và các dự án.',
      alternates: { canonical: siteUrl('/') },
      robots: { index: false, follow: false },
      ...(error instanceof ApiError && error.status === 404 ? { openGraph: { type: 'website', url: siteUrl('/') } } : {}),
    };
  }
}

export default function PublicHome() { return <PublicProfilePage />; }

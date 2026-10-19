import { cache } from 'react';
import type { ProjectDetailResponse, ProjectListResponse } from '@/types/project';
import type { PublicProfileResponse } from '@/types/profile';
import { apiRequest } from '@/lib/api';

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
export const siteOrigin = (() => {
  if (!configuredSiteUrl) return 'http://localhost:3000';
  const parsed = new URL(configuredSiteUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS.');
  return parsed.origin;
})();

export function siteUrl(path: string) {
  return new URL(path, `${siteOrigin}/`).toString();
}

export function seoDescription(...values: Array<string | null | undefined>) {
  const text = values.find((value) => value?.trim())?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() ?? '';
  if (!text) return 'Portfolio cá nhân giới thiệu hồ sơ, kinh nghiệm và các dự án.';
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text;
}

export function serializeJsonLd(value: Record<string, unknown>) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export const getPublicProfile = cache(() => apiRequest<PublicProfileResponse>('/profile/public'));
export const getPublicProjects = cache(() => apiRequest<ProjectListResponse>('/projects/public'));
export const getPublicProject = cache((slug: string) =>
  apiRequest<ProjectDetailResponse>(`/projects/public/${encodeURIComponent(slug)}`),
);

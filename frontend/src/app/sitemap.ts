import type { MetadataRoute } from 'next';
import { getPublicProjects, siteUrl } from '@/lib/seo';
import { apiAssetUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { projects } = await getPublicProjects();
  return [
    { url: siteUrl('/'), priority: 1, changeFrequency: 'monthly' },
    { url: siteUrl('/projects'), priority: 0.8, changeFrequency: 'weekly' },
    ...projects.filter((project) => project.isVisible).map((project) => ({
      url: siteUrl(`/projects/${encodeURIComponent(project.slug ?? project.id)}`),
      priority: project.isFeatured ? 0.8 : 0.6,
      changeFrequency: 'monthly' as const,
      ...(project.thumbnail ? { images: [apiAssetUrl(project.thumbnail.filePath)] } : {}),
    })),
  ];
}

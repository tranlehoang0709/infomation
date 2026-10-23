import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ApiError, apiAssetUrl } from '@/lib/api';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { ScrollReveal } from '@/components/layout/scroll-reveal';
import { getPublicProject, seoDescription, serializeJsonLd, siteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { project } = await getPublicProject(slug);
    const canonical = siteUrl(`/projects/${encodeURIComponent(project.slug ?? project.id)}`);
    const description = seoDescription(project.summary, project.description);
    const image = project.thumbnail ? apiAssetUrl(project.thumbnail.filePath) : siteUrl('/opengraph-image');
    return {
      title: project.name,
      description,
      alternates: { canonical },
      openGraph: { type: 'article', title: project.name, description, url: canonical, images: [{ url: image, alt: project.thumbnail?.altText ?? project.name }] },
      twitter: { card: 'summary_large_image', title: project.name, description, images: [image] },
    };
  } catch {
    return {
      title: 'Dự án',
      alternates: { canonical: siteUrl(`/projects/${encodeURIComponent(slug)}`) },
      robots: { index: false, follow: false },
    };
  }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let project: Awaited<ReturnType<typeof getPublicProject>>['project'] | null = null;
  let unavailable = false;
  try { project = (await getPublicProject(slug)).project; }
  catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    unavailable = true;
  }
  if (unavailable || !project) return <main className="min-h-screen px-5 py-10 sm:px-8 sm:py-16"><div className="mx-auto max-w-4xl"><SiteHeader />
    <section role="status" className="mt-16 rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-2xl font-semibold text-slate-900">Chưa thể tải dự án</h1><p className="mt-2 text-sm leading-6 text-slate-700">Máy chủ đang bận hoặc chưa kết nối. Vui lòng thử lại sau.</p><Link href="/projects" className="mt-5 inline-flex font-semibold text-blue-700 hover:underline">← Trở lại danh sách dự án</Link></section>
    <SiteFooter />
  </div></main>;
  const projectUrl = siteUrl(`/projects/${encodeURIComponent(project.slug ?? project.id)}`);
  const jsonLd = serializeJsonLd({
    '@context': 'https://schema.org', '@type': 'CreativeWork', name: project.name,
    description: seoDescription(project.summary, project.description), url: projectUrl,
    ...(project.thumbnail ? { image: apiAssetUrl(project.thumbnail.filePath) } : {}),
    ...(project.startDate ? { dateCreated: project.startDate } : {}),
  });
  return <main className="min-h-screen px-5 py-10 sm:px-8 sm:py-16"><article className="mx-auto max-w-4xl"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} /><SiteHeader />
    <Link href="/projects" className="mt-12 inline-block text-sm font-semibold text-blue-700 hover:underline">← Tất cả dự án</Link>
    <ScrollReveal><header className="mt-8">
      {project.role && <p className="text-sm font-semibold text-blue-700"><span className="text-[11px] uppercase tracking-wider text-slate-500">Vai trò: </span>{project.role}</p>}
      <span className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tên dự án: </span><h1 className="inline text-4xl font-semibold tracking-tight sm:text-5xl">{project.name}</h1>
      {project.summary && <p className="mt-5 text-lg leading-8 text-slate-600"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tóm tắt: </span>{project.summary}</p>}
      <div className="mt-5 flex flex-wrap gap-4 text-sm">{project.startDate && <span className="text-slate-500"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Thời gian: </span>{new Intl.DateTimeFormat('vi-VN', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(project.startDate))}{project.endDate ? ` — ${new Intl.DateTimeFormat('vi-VN', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(project.endDate))}` : ''}</span>}{(project.githubUrl || project.demoUrl) && <div><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Liên kết: </span><div className="inline-flex flex-wrap gap-4">{project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">GitHub ↗</a>}{project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">Demo ↗</a>}</div></div>}</div>
    </header></ScrollReveal>
    {project.thumbnail && <ScrollReveal className="mt-8"><Image src={apiAssetUrl(project.thumbnail.filePath)} alt={project.thumbnail.altText ?? project.name} width={1440} height={900} sizes="(max-width: 896px) 100vw, 896px" className="max-h-[560px] w-full rounded-3xl object-cover" /></ScrollReveal>}
    {project.technologies.length > 0 && <div className="mt-7"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Công nghệ: </span><ul className="inline-flex flex-wrap gap-2">{project.technologies.map((tag) => <li key={tag} className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800">{tag}</li>)}</ul></div>}
    {project.description && <ScrollReveal className="mt-8"><div className="whitespace-pre-line text-base leading-8 text-slate-700"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mô tả chi tiết: </span>{project.description}</div></ScrollReveal>}
    {project.gallery.length > 0 && <section aria-label="Thư viện ảnh dự án" className="mt-10"><h2 className="mb-4 text-xl font-semibold">Hình ảnh dự án</h2><div className="grid gap-4 sm:grid-cols-2">{project.gallery.map((image) => <ScrollReveal key={image.id}><Image src={apiAssetUrl(image.filePath)} alt={image.altText ?? `Ảnh ${project.name}`} width={900} height={600} sizes="(max-width: 640px) 100vw, 50vw" className="w-full rounded-2xl border border-slate-200 object-cover" /></ScrollReveal>)}</div></section>}
    <SiteFooter />
  </article></main>;
}

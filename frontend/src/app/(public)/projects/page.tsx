import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ApiError, apiAssetUrl } from '@/lib/api';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { ScrollReveal } from '@/components/layout/scroll-reveal';
import { getPublicProjects, seoDescription, siteUrl } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const description = 'Một số sản phẩm và dự án đã thực hiện.';
  try {
    await getPublicProjects();
    return {
      title: 'Dự án', description,
      alternates: { canonical: siteUrl('/projects') },
      openGraph: { type: 'website', title: 'Dự án', description, url: siteUrl('/projects') },
      twitter: { card: 'summary_large_image', title: 'Dự án', description },
    };
  } catch {
    return {
      title: 'Dự án', description,
      alternates: { canonical: siteUrl('/projects') },
      robots: { index: false, follow: false },
    };
  }
}

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  let projects: Awaited<ReturnType<typeof getPublicProjects>>['projects'] = [];
  let unavailable = false;
  try { projects = (await getPublicProjects()).projects; }
  catch (error) { unavailable = !(error instanceof ApiError && error.status === 404); }
  return <main className="min-h-screen px-5 py-10 sm:px-8 sm:py-16"><div className="mx-auto max-w-6xl"><SiteHeader />
    <section className="mt-16"><ScrollReveal><p className="text-sm font-semibold text-blue-700">CODE. CREATE. INNOVATE.</p><h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Dự án</h1><p className="mt-4 max-w-2xl text-slate-600">Một số sản phẩm và dự án đã thực hiện.</p></ScrollReveal>
      {unavailable ? <p role="status" className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Không thể tải danh sách dự án lúc này.</p>
        : projects.length === 0 ? <p className="mt-8 rounded-2xl border border-dashed border-slate-300 p-8 text-slate-500">Chưa có dự án được công khai.</p>
          : <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{projects.map((project) => <ScrollReveal key={project.id} className="min-w-0"><article className="project-card h-full rounded-2xl border border-slate-200 bg-white shadow-sm">
            {project.thumbnail && <Link href={`/projects/${encodeURIComponent(project.slug ?? project.id)}`} aria-label={`Xem ${project.name}`}><Image src={apiAssetUrl(project.thumbnail.filePath)} alt={project.thumbnail.altText ?? project.name} width={960} height={600} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="project-card-image aspect-[16/10] w-full object-cover" /></Link>}
            <div className="p-5">{project.isFeatured && <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">Nổi bật</span>}<span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tên dự án: </span><h2 className="inline text-xl font-semibold"><Link className="hover:text-blue-700" href={`/projects/${encodeURIComponent(project.slug ?? project.id)}`}>{project.name}</Link></h2>
              {project.summary && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tóm tắt: </span>{project.summary}</p>}
              {project.technologies.length > 0 && <div className="mt-4"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Công nghệ: </span><ul className="inline-flex flex-wrap gap-2">{project.technologies.map((tag) => <li key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">{tag}</li>)}</ul></div>}
            </div></article></ScrollReveal>)}</div>}
    </section><SiteFooter />
  </div></main>;
}

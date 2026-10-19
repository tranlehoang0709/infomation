import Image from 'next/image';
import { apiAssetUrl, ApiError } from '@/lib/api';
import { getPublicProfile, serializeJsonLd, siteUrl } from '@/lib/seo';
import { initials } from '@/lib/utils';
import type { PublicProfileResponse } from '@/types/profile';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { ScrollReveal } from '@/components/layout/scroll-reveal';
import { PublicExperiences } from '@/components/profile/public-experiences';
import { PublicInterests } from '@/components/profile/public-interests';

export async function PublicProfilePage() {
  let data: PublicProfileResponse | null = null;
  let unavailable = false;
  try { data = await getPublicProfile(); }
  catch (error) { unavailable = !(error instanceof ApiError && error.status === 404); }

  return <main className="min-h-screen px-5 py-16 sm:px-8">
    <div className="mx-auto max-w-5xl">
      <SiteHeader title={data?.title} />
      {data?.profile.coverUrl && <Image src={apiAssetUrl(data.profile.coverUrl)} alt="Ảnh bìa hồ sơ" width={1200} height={384} sizes="100vw" priority className="mt-8 h-48 w-full rounded-3xl object-cover sm:h-64" />}
      {data ? <ScrollReveal className="mt-24"><section className="public-hero grid gap-12 md:grid-cols-[1fr_240px] md:items-center">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({
          '@context': 'https://schema.org', '@type': 'Person', name: data.profile.fullName,
          ...(data.profile.headline ? { jobTitle: data.profile.headline } : {}),
          ...(data.profile.bio ? { description: data.profile.bio } : {}),
          ...(data.profile.avatarUrl ? { image: apiAssetUrl(data.profile.avatarUrl) } : {}),
          url: siteUrl('/'),
        }) }} />
        <div><p className="mb-4 font-mono text-xs font-semibold tracking-[.22em] text-green-400">CODE. CREATE. INNOVATE.</p><p className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.15em] text-blue-700"><span className="size-2 rounded-full bg-blue-500" /> Xin chào, tôi là</p><h1 className="max-w-3xl text-5xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-7xl">{data.profile.fullName}</h1>{data.profile.headline && <p className="mt-5 text-xl text-blue-700">{data.profile.headline}</p>}{data.profile.bio && <p className="mt-7 max-w-2xl whitespace-pre-line text-lg leading-8 text-slate-600">{data.profile.bio}</p>}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">{data.profile.location && <span>{data.profile.location}</span>}{data.profile.contactEmail && <a className="text-blue-700 hover:underline" href={`mailto:${data.profile.contactEmail}`}>{data.profile.contactEmail}</a>}{data.profile.phone && <a className="hover:text-blue-700" href={`tel:${data.profile.phone}`}>{data.profile.phone}</a>}</div>
        </div><div className="mx-auto flex size-56 items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-100 to-sky-50 text-6xl font-semibold text-blue-700 ring-1 ring-blue-100 md:mx-0" aria-hidden={!data.profile.avatarUrl}>{data.profile.avatarUrl ? <Image src={apiAssetUrl(data.profile.avatarUrl)} alt={data.profile.fullName} width={224} height={224} priority className="size-full object-cover" /> : initials(data.profile.fullName)}</div>
      </section></ScrollReveal> : <section className="mt-32 rounded-3xl border border-slate-200 bg-white px-8 py-12 text-center shadow-sm"><h1 className="text-2xl font-semibold">{unavailable ? 'Portfolio tạm thời chưa tải được' : 'Portfolio chưa được xuất bản'}</h1><p className="mx-auto mt-3 max-w-lg text-slate-600">{unavailable ? 'Máy chủ đang bận hoặc chưa kết nối. Vui lòng thử lại sau.' : 'Nội dung sẽ xuất hiện tại đây sau khi chủ portfolio xuất bản.'}</p></section>}
      {data?.profile.cvUrl && <p className="mt-6 text-center"><a href={apiAssetUrl(data.profile.cvUrl)} className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white">Download CV</a></p>}
      {data && <ScrollReveal><PublicExperiences /></ScrollReveal>}
      {data && <ScrollReveal><PublicInterests /></ScrollReveal>}
      <SiteFooter name={data?.profile.fullName} />
    </div>
  </main>;
}

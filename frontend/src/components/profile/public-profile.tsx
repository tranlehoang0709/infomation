import Image from 'next/image';
import { apiAssetUrl, ApiError } from '@/lib/api';
import { getPublicProfile, serializeJsonLd, siteUrl } from '@/lib/seo';
import { initials } from '@/lib/utils';
import type { PublicProfileResponse } from '@/types/profile';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { ScrollReveal } from '@/components/layout/scroll-reveal';
import { PublicExperiences } from '@/components/profile/public-experiences';
import { PublicEducations } from '@/components/profile/public-educations';
import { PublicInterests } from '@/components/profile/public-interests';
import { PublicSkills } from '@/components/profile/public-skills';
import { PublicCertificates } from '@/components/profile/public-certificates';
import { WaterBackgroundSurface } from '@/components/layout/water-background-surface';

export async function PublicProfilePage() {
  let data: PublicProfileResponse | null = null;
  let unavailable = false;
  try { data = await getPublicProfile(); }
  catch (error) { unavailable = !(error instanceof ApiError && error.status === 404); }

  return <WaterBackgroundSurface className="public-workspace min-h-screen px-4 pb-12 pt-5 sm:px-6 lg:px-10">
    <div className="mx-auto max-w-[1600px]">
      <SiteHeader title={data?.title} />
      <nav className="public-workspace-nav sticky top-0 z-30 mt-4 flex gap-2 overflow-x-auto border-y border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-10" aria-label="Điều hướng portfolio">
        <a href="#tong-quan" aria-current="location">Tổng quan</a>
        <a href="#ho-so">Hồ sơ</a>
        <a href="#hoc-van">Học vấn</a>
        <a href="#chung-chi">Chứng chỉ</a>
        <a href="#kinh-nghiem">Kinh nghiệm</a>
        <a href="#ky-nang">Kỹ năng</a>
        <a href="#so-thich">Sở thích</a>
        <a href="/projects">Dự án</a>
      </nav>
      {data?.profile.coverUrl && <Image src={apiAssetUrl(data.profile.coverUrl)} alt="Ảnh bìa hồ sơ" width={1200} height={384} sizes="100vw" priority className="mt-8 h-48 w-full rounded-3xl object-cover sm:h-64" />}
      <div className="mt-6 space-y-0">
      <section id="tong-quan" className="public-section scroll-mt-20" aria-labelledby="overview-title">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-green-700">Portfolio cá nhân</p>
          <h1 id="overview-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Tổng quan</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">Đây là trang giới thiệu hồ sơ, quá trình học tập, kinh nghiệm, kỹ năng và các dự án. Chọn một mục để xem thông tin chi tiết.</p>
          <div className="mt-7 flex flex-wrap gap-3" aria-label="Đi nhanh đến nội dung">
            <a className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50" href="#ho-so">Hồ sơ cá nhân <span aria-hidden="true">→</span></a>
            <a className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50" href="#hoc-van">Học vấn <span aria-hidden="true">→</span></a>
            <a className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50" href="#kinh-nghiem">Kinh nghiệm <span aria-hidden="true">→</span></a>
            <a className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50" href="#ky-nang">Kỹ năng <span aria-hidden="true">→</span></a>
            <a className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50" href="/projects">Dự án <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>
      {data ? <section id="ho-so" className="public-section scroll-mt-20"><ScrollReveal><div className="public-hero grid gap-12 md:grid-cols-[1fr_240px] md:items-center">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({
          '@context': 'https://schema.org', '@type': 'Person', name: data.profile.fullName,
          ...(data.profile.headline ? { jobTitle: data.profile.headline } : {}),
          ...(data.profile.bio ? { description: data.profile.bio } : {}),
          ...(data.profile.avatarUrl ? { image: apiAssetUrl(data.profile.avatarUrl) } : {}),
          url: siteUrl('/'),
        }) }} />
        <div><p className="mb-4 font-mono text-xs font-semibold tracking-[.22em] text-green-400">CODE. CREATE. INNOVATE.</p><p className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.15em] text-blue-700"><span className="size-2 rounded-full bg-blue-500" /> Xin chào, tôi là</p>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Họ và tên: </span><h1 className="inline max-w-3xl text-5xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-7xl">{data.profile.fullName}</h1>
          {data.profile.headline && <p className="mt-5"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Chức danh: </span><span className="text-xl text-blue-700">{data.profile.headline}</span></p>}
          {data.profile.bio && <p className="mt-7 max-w-2xl whitespace-pre-line text-lg leading-8 text-slate-600"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Giới thiệu: </span>{data.profile.bio}</p>}
          <dl className="mt-8 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            {data.profile.location && <div><dt className="inline text-xs font-semibold uppercase tracking-wider text-slate-500">Địa chỉ: </dt><dd className="inline text-slate-700">{data.profile.location}</dd></div>}
            {data.profile.contactEmail && <div><dt className="inline text-xs font-semibold uppercase tracking-wider text-slate-500">Email: </dt><dd className="inline"><a className="text-blue-700 hover:underline" href={`mailto:${data.profile.contactEmail}`}>{data.profile.contactEmail}</a></dd></div>}
            {data.profile.phone && <div><dt className="inline text-xs font-semibold uppercase tracking-wider text-slate-500">Số điện thoại: </dt><dd className="inline"><a className="text-slate-700" href={`tel:${data.profile.phone}`}>{data.profile.phone}</a></dd></div>}
          </dl>
        </div><div className="mx-auto flex size-56 items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-100 to-sky-50 text-6xl font-semibold text-blue-700 ring-1 ring-blue-100 md:mx-0" aria-hidden={!data.profile.avatarUrl}>{data.profile.avatarUrl ? <Image src={apiAssetUrl(data.profile.avatarUrl)} alt={data.profile.fullName} width={224} height={224} priority className="size-full object-cover" /> : initials(data.profile.fullName)}</div>
      </div></ScrollReveal></section> : <section className="public-section mt-6"><h1 className="text-2xl font-semibold">{unavailable ? 'Portfolio tạm thời chưa tải được' : 'Portfolio chưa được xuất bản'}</h1><p className="mx-auto mt-3 max-w-lg text-slate-600">{unavailable ? 'Máy chủ đang bận hoặc chưa kết nối. Vui lòng thử lại sau.' : 'Nội dung sẽ xuất hiện tại đây sau khi chủ portfolio xuất bản.'}</p></section>}
      {data?.profile.cvUrl && <p className="mt-6 text-center"><a href={apiAssetUrl(data.profile.cvUrl)} className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white">Download CV</a></p>}
      {data && <section id="hoc-van" className="public-section"><ScrollReveal><PublicEducations /></ScrollReveal></section>}
      {data && <section id="chung-chi" className="public-section"><ScrollReveal><PublicCertificates /></ScrollReveal></section>}
      {data && <section id="kinh-nghiem" className="public-section"><ScrollReveal><PublicExperiences /></ScrollReveal></section>}
      {data && <section id="ky-nang" className="public-section"><ScrollReveal><PublicSkills /></ScrollReveal></section>}
      {data && <section id="so-thich" className="public-section"><ScrollReveal><PublicInterests /></ScrollReveal></section>}
      </div>
      <SiteFooter name={data?.profile.fullName} />
    </div>
  </WaterBackgroundSurface>;
}

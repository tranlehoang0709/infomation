import Image from 'next/image';
import { apiAssetUrl } from '@/lib/api';
import { WaterBackgroundSurface } from '@/components/layout/water-background-surface';
import type { SharedPortfolioResponse } from '@/types/shared-portfolio';

const date = (value: string | null) => value
  ? new Intl.DateTimeFormat('vi-VN', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value))
  : '';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="public-section scroll-mt-20">
    <div className="mx-auto max-w-6xl">
      <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
      {children}
    </div>
  </section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div>
    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}: </span>
    <div className="shared-field-value">{children}</div>
  </div>;
}

export function SharedPortfolioView({ data }: { data: SharedPortfolioResponse }) {
  const profile = data.profile;
  const highlightedSkills = data.skills.slice(0, 6);
  const featuredProjects = [...data.projects]
    .sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)))
    .slice(0, 2);
  const skillGroups = new Map<string, typeof data.skills>();
  for (const skill of data.skills) {
    const category = skill.category?.trim() || 'Khác';
    skillGroups.set(category, [...(skillGroups.get(category) ?? []), skill]);
  }
  const navItems = [
    { id: 'ho-so', label: 'Hồ sơ cá nhân', visible: Boolean(profile) },
    { id: 'hoc-van', label: 'Học vấn', visible: data.educations.length > 0 },
    { id: 'chung-chi', label: 'Chứng chỉ', visible: data.certificates.length > 0 },
    { id: 'kinh-nghiem', label: 'Kinh nghiệm', visible: data.experiences.length > 0 },
    { id: 'ky-nang', label: 'Kỹ năng', visible: data.skills.length > 0 },
    { id: 'du-an', label: 'Dự án', visible: data.projects.length > 0 },
    { id: 'so-thich', label: 'Sở thích', visible: data.interests.length > 0 },
  ];

  return <WaterBackgroundSurface className="public-workspace min-h-screen px-4 pb-12 pt-5 sm:px-6 lg:px-10">
    <div className="mx-auto max-w-[1600px]">
      <header className="border-b border-slate-200 py-4">
        <span className="font-bold tracking-tight">{data.title}</span>
        <span className="ml-2 text-sm text-slate-500">/ Link chia sẻ</span>
      </header>
      <nav className="public-workspace-nav sticky top-0 z-30 flex gap-2 overflow-x-auto border-y border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-10" aria-label="Điều hướng portfolio">
        <a href="#tong-quan">Tổng quan</a>
        {navItems.filter((item) => item.visible).map((item) => <a key={item.id} href={`#${item.id}`}>{item.label}</a>)}
      </nav>

      <section id="tong-quan" className="public-section scroll-mt-20" aria-labelledby="overview-title">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 border-t border-slate-200 bg-transparent py-8 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
            {profile?.avatarUrl && <Image src={apiAssetUrl(profile.avatarUrl)} alt={profile.fullName} width={220} height={220} priority className="size-55 rounded-3xl object-cover" />}
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.16em] text-green-700">Portfolio cá nhân</p>
              <h1 id="overview-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Xin chào, tôi là {profile?.fullName ?? data.title}</h1>
              {profile?.headline && <p className="mt-3 text-xl font-medium text-blue-700">{profile.headline}</p>}
              {profile?.bio && <p className="mt-4 max-w-3xl whitespace-pre-line text-lg leading-8 text-slate-600">{profile.bio}</p>}
              {!profile?.bio && <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">Xem hồ sơ, kỹ năng và những dự án được chia sẻ bên dưới.</p>}
              <div className="mt-5 flex flex-wrap gap-3">
                {data.projects.length > 0 && <a className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800" href="#du-an">Xem dự án →</a>}
                {profile?.contactEmail && <a className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-white" href={`mailto:${profile.contactEmail}`}>Liên hệ</a>}
              </div>
            </div>
          </div>

          {highlightedSkills.length > 0 && <div className="mt-6">
            <h2 className="text-lg font-semibold">Kỹ năng nổi bật</h2>
            <div className="mt-3 flex flex-wrap gap-2">{highlightedSkills.map((skill) => <span key={skill.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">{skill.name}</span>)}</div>
          </div>}

          {featuredProjects.length > 0 && <div className="mt-6">
            <h2 className="text-lg font-semibold">Dự án tiêu biểu</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">{featuredProjects.map((project) => <article key={project.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold">{project.name}</h3>
              {project.summary && <p className="mt-1 text-sm text-slate-600">{project.summary}</p>}
              {(project.demoUrl || project.githubUrl) && <div className="mt-3 flex gap-4 text-sm font-semibold text-blue-700">{project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noreferrer">Demo ↗</a>}{project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer">GitHub ↗</a>}</div>}
            </article>)}</div>
          </div>}

          <div className="mt-7 flex flex-wrap gap-3" aria-label="Đi nhanh đến nội dung">
            {navItems.filter((item) => item.visible).map((item) => <a key={item.id} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50" href={`#${item.id}`}>{item.label} <span aria-hidden="true">→</span></a>)}
          </div>
        </div>
      </section>

      {profile && <Section id="ho-so" title="Hồ sơ cá nhân">
        <div className="mt-8 grid gap-8 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
          {profile.avatarUrl && <Image src={apiAssetUrl(profile.avatarUrl)} alt={profile.fullName} width={220} height={220} className="size-55 rounded-3xl object-cover" />}
          <div className="space-y-5">
            <Field label="Họ và tên"><h1 className="text-5xl font-semibold tracking-tight">{profile.fullName}</h1></Field>
            {profile.headline && <Field label="Chức danh"><p className="text-xl text-blue-700">{profile.headline}</p></Field>}
            {profile.bio && <Field label="Giới thiệu"><p className="max-w-2xl whitespace-pre-line text-lg leading-8 text-slate-600">{profile.bio}</p></Field>}
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              {profile.location && <Field label="Địa chỉ"><span>{profile.location}</span></Field>}
              {profile.contactEmail && <Field label="Email"><a className="text-blue-700 hover:underline" href={`mailto:${profile.contactEmail}`}>{profile.contactEmail}</a></Field>}
              {profile.phone && <Field label="Số điện thoại"><a href={`tel:${profile.phone}`}>{profile.phone}</a></Field>}
            </div>
          </div>
        </div>
      </Section>}

      {data.educations.length > 0 && <Section id="hoc-van" title="Học vấn">
        <div className="mt-8 grid gap-4">{data.educations.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="space-y-3">
            <Field label="Trường học"><h3 className="font-semibold">{item.schoolName}</h3></Field>
            {item.degree && <Field label="Bằng cấp"><p>{item.degree}</p></Field>}
            {item.major && <Field label="Chuyên ngành"><p>{item.major}</p></Field>}
            {(item.startDate || item.endDate || item.isCurrent) && <Field label="Thời gian"><p className="text-sm text-slate-500">{date(item.startDate)} — {item.isCurrent ? 'Hiện tại' : date(item.endDate)}</p></Field>}
            {item.description && <Field label="Mô tả"><p className="whitespace-pre-line text-sm leading-6 text-slate-600">{item.description}</p></Field>}
          </div>
        </article>)}</div>
      </Section>}

      {data.certificates.length > 0 && <Section id="chung-chi" title="Chứng chỉ">
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.certificates.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="space-y-3">
            <Field label="Chứng chỉ"><h3 className="font-semibold">{item.name}</h3></Field>
            {item.issuer && <Field label="Đơn vị cấp"><p>{item.issuer}</p></Field>}
            {item.credentialCode && <Field label="Mã chứng chỉ"><p className="font-mono">{item.credentialCode}</p></Field>}
            {(item.issueDate || item.expiryDate) && <Field label="Thời hạn"><p className="text-sm text-slate-500">{date(item.issueDate)}{item.expiryDate ? ` — ${date(item.expiryDate)}` : ''}</p></Field>}
            {item.description && <Field label="Mô tả"><p className="text-sm text-slate-600">{item.description}</p></Field>}
            {item.credentialUrl && <Field label="Liên kết xác minh"><a className="inline-block text-sm font-semibold text-blue-700" href={item.credentialUrl} target="_blank" rel="noreferrer">Xem chứng chỉ ↗</a></Field>}
          </div>
        </article>)}</div>
      </Section>}

      {data.experiences.length > 0 && <Section id="kinh-nghiem" title="Kinh nghiệm">
        <div className="mt-8 grid gap-4">{data.experiences.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="space-y-3">
            <Field label="Chức danh"><h3 className="font-semibold">{item.position}</h3></Field>
            <Field label="Công ty"><p>{item.companyName}</p></Field>
            {item.location && <Field label="Địa điểm"><p>{item.location}</p></Field>}
            {item.employmentType && <Field label="Hình thức làm việc"><p>{item.employmentType}</p></Field>}
            {(item.startDate || item.endDate || item.isCurrent) && <Field label="Thời gian"><p className="text-sm text-slate-500">{date(item.startDate)} — {item.isCurrent ? 'Hiện tại' : date(item.endDate)}</p></Field>}
            {item.description && <Field label="Mô tả"><p className="whitespace-pre-line text-sm leading-6 text-slate-600">{item.description}</p></Field>}
          </div>
        </article>)}</div>
      </Section>}

      {data.skills.length > 0 && <Section id="ky-nang" title="Kỹ năng">
        <div className="mt-8 grid gap-6 md:grid-cols-2">{[...skillGroups].map(([category, skills]) => <section key={category} aria-label={category} className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">{category}</h3>
          <ul className="mt-4 space-y-4">{skills.map((item) => <li key={item.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><Field label="Kỹ năng"><span className="font-medium">{item.name}</span></Field>{item.proficiency !== null && <Field label="Mức độ"><span className="text-sm text-slate-500">{item.proficiency}%</span></Field>}</div>
            {item.proficiency !== null && <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#101810]" style={{ width: `${item.proficiency}%` }} /></div>}
            {item.description && <div className="mt-2"><Field label="Mô tả"><span className="text-sm text-slate-600">{item.description}</span></Field></div>}
          </li>)}</ul>
        </section>)}</div>
      </Section>}

      {data.projects.length > 0 && <Section id="du-an" title="Dự án">
        <div className="mt-8 grid gap-4 md:grid-cols-2">{data.projects.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="space-y-3">
            <Field label="Tên dự án"><h3 className="font-semibold">{item.name}</h3></Field>
            {item.summary && <Field label="Tóm tắt"><p className="text-slate-600">{item.summary}</p></Field>}
            {item.role && <Field label="Vai trò"><p className="text-sm text-slate-500">{item.role}</p></Field>}
            {(item.demoUrl || item.githubUrl) && <Field label="Liên kết"><div className="flex gap-4 text-sm font-semibold text-blue-700">{item.demoUrl && <a href={item.demoUrl} target="_blank" rel="noreferrer">Demo ↗</a>}{item.githubUrl && <a href={item.githubUrl} target="_blank" rel="noreferrer">GitHub ↗</a>}</div></Field>}
          </div>
        </article>)}</div>
      </Section>}

      {data.interests.length > 0 && <Section id="so-thich" title="Sở thích">
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.interests.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <Field label="Sở thích"><h3 className="font-semibold">{item.title}</h3></Field>
          {item.description && <div className="mt-3"><Field label="Mô tả"><p className="text-sm text-slate-600">{item.description}</p></Field></div>}
        </article>)}</div>
      </Section>}
    </div>
  </WaterBackgroundSurface>;
}

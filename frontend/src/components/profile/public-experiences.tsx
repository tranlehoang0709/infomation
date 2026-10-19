import Image from 'next/image';
import { ApiError, apiAssetUrl, apiRequest } from '@/lib/api';
import type { ExperienceListResponse, ExperienceRecord } from '@/types/experience';

function dateLabel(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

function dateRange(item: ExperienceRecord) {
  const start = dateLabel(item.startDate);
  const end = item.isCurrent ? 'Hiện tại' : dateLabel(item.endDate);
  if (!start) return end;
  return end ? `${start} — ${end}` : start;
}

export async function PublicExperiences() {
  let records: ExperienceRecord[] = [];
  let unavailable = false;
  try {
    const response = await apiRequest<ExperienceListResponse>('/experiences/public');
    records = response.experiences;
  } catch (cause) {
    unavailable = !(cause instanceof ApiError && cause.status === 404);
  }

  if (unavailable) return <section aria-labelledby="experience-heading" className="mt-24 pt-12">
    <h2 id="experience-heading" className="text-2xl font-semibold">Kinh nghiệm làm việc</h2>
    <p role="status" className="mt-4 text-sm text-slate-500">Chưa thể tải kinh nghiệm làm việc. Vui lòng thử lại sau.</p>
  </section>;
  if (!records.length) return null;

  return <section aria-labelledby="experience-heading" className="mt-24 pt-12">
    <p className="text-sm font-semibold text-blue-700">Hành trình nghề nghiệp</p>
    <h2 id="experience-heading" className="mt-2 text-3xl font-semibold tracking-tight">Kinh nghiệm làm việc</h2>
    <div className="mt-8 space-y-5">
      {records.map((item) => <article key={item.id} className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="flex items-start gap-4">
            {item.companyLogo && <Image src={apiAssetUrl(item.companyLogo.filePath)} alt={item.companyLogo.altText ?? `${item.companyName} logo`} width={48} height={48} className="size-12 shrink-0 rounded-xl border border-slate-100 bg-white object-contain p-1.5" />}
            <div className="min-w-0"><h3 className="text-lg font-semibold text-slate-900">{item.position}</h3><p className="mt-1 font-medium text-blue-700">{item.companyName}</p>
              {(item.location || item.employmentType) && <p className="mt-1 text-sm text-slate-500">{[item.location, item.employmentType].filter(Boolean).join(' · ')}</p>}</div>
          </div>
          {item.description && <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">{item.description}</p>}
          {item.achievements.length > 0 && <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">{item.achievements.map((achievement, index) => <li key={`${item.id}-${index}`}>{achievement}</li>)}</ul>}
        </div>
        <p className="text-sm font-medium text-slate-500 sm:text-right">{dateRange(item)}</p>
      </article>)}
    </div>
  </section>;
}

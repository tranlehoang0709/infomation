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
            <div className="min-w-0"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Chức danh: </span><h3 className="inline text-lg font-semibold text-slate-900">{item.position}</h3><p className="mt-2 font-medium text-blue-700"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Công ty: </span>{item.companyName}</p>
              {item.location && <p className="mt-2 text-sm text-slate-500"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Địa điểm: </span>{item.location}</p>}
              {item.employmentType && <p className="mt-2 text-sm text-slate-500"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Hình thức làm việc: </span>{item.employmentType}</p>}</div>
          </div>
          {item.description && <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mô tả: </span>{item.description}</p>}
          {item.achievements.length > 0 && <div className="mt-4"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Thành tựu: </span><ul className="inline list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">{item.achievements.map((achievement, index) => <li key={`${item.id}-${index}`}>{achievement}</li>)}</ul></div>}
        </div>
        <p className="text-sm font-medium text-slate-500 sm:text-right"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Thời gian: </span>{dateRange(item)}</p>
      </article>)}
    </div>
  </section>;
}

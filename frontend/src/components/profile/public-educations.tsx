import { ApiError, apiRequest } from '@/lib/api';
import type { EducationListResponse, EducationRecord } from '@/types/education';

function dateLabel(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

function dateRange(item: EducationRecord) {
  const start = dateLabel(item.startDate);
  const end = item.isCurrent ? 'Hiện tại' : dateLabel(item.endDate);
  if (!start) return end;
  return end ? `${start} — ${end}` : start;
}

export async function PublicEducations() {
  let records: EducationRecord[] = [];
  let unavailable = false;
  try {
    const response = await apiRequest<EducationListResponse>('/educations/public');
    records = response.educations;
  } catch (cause) {
    unavailable = !(cause instanceof ApiError && cause.status === 404);
  }

  if (unavailable) return (
    <section aria-labelledby="education-heading" className="mt-24 pt-12">
      <h2 id="education-heading" className="text-2xl font-semibold">Học vấn</h2>
      <p role="status" className="mt-4 text-sm text-slate-500">Chưa thể tải thông tin học vấn. Vui lòng thử lại sau.</p>
    </section>
  );
  if (!records.length) return null;

  return (
    <section aria-labelledby="education-heading" className="mt-24 pt-12">
      <p className="text-sm font-semibold text-blue-700">Nền tảng kiến thức</p>
      <h2 id="education-heading" className="mt-2 text-3xl font-semibold tracking-tight">Học vấn</h2>

      <div className="mt-8 space-y-5">
        {records.map((item) => (
          <article
            key={item.id}
            className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                🎓
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Trường học: </span>
                <h3 className="inline text-lg font-semibold text-slate-900">{item.schoolName}</h3>
                {(item.degree || item.major) && (
                  <p className="mt-1 font-medium text-blue-700">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Bằng cấp / chuyên ngành: </span>
                    {[item.degree, item.major].filter(Boolean).join(' · ')}
                  </p>
                )}
                {item.description && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mô tả: </span>{item.description}</p>
                )}
              </div>
            </div>
            <div className="text-sm font-medium text-slate-500 sm:text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Thời gian: </span>
              <span>{dateRange(item)}</span>
              {item.isCurrent && (
                <span className="mt-1 block rounded-full bg-blue-50 px-3 py-1 text-center text-xs font-semibold text-blue-700">
                  Đang học
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

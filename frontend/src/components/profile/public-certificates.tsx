import { ApiError, apiRequest } from '@/lib/api';
import type { CertificateListResponse, CertificateRecord } from '@/types/certificate';

function dateLabel(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

function isExpired(expiryDate: string | null) {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

export async function PublicCertificates() {
  let records: CertificateRecord[] = [];
  let unavailable = false;
  try {
    const response = await apiRequest<CertificateListResponse>('/certificates/public');
    records = response.certificates;
  } catch (cause) {
    unavailable = !(cause instanceof ApiError && cause.status === 404);
  }

  if (unavailable) return (
    <section aria-labelledby="certificate-heading" className="mt-24 pt-12">
      <h2 id="certificate-heading" className="text-2xl font-semibold">Chứng chỉ</h2>
      <p role="status" className="mt-4 text-sm text-slate-500">Chưa thể tải danh sách chứng chỉ. Vui lòng thử lại sau.</p>
    </section>
  );
  if (!records.length) return null;

  return (
    <section aria-labelledby="certificate-heading" className="mt-24 pt-12">
      <p className="text-sm font-semibold text-blue-700">Bằng cấp & chứng nhận</p>
      <h2 id="certificate-heading" className="mt-2 text-3xl font-semibold tracking-tight">Chứng chỉ</h2>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {records.map((item) => (
          <article
            key={item.id}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-xl">
                🏆
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start gap-1.5">
                  <div><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Chứng chỉ: </span><h3 className="inline text-sm font-semibold leading-snug text-slate-900">{item.name}</h3></div>
                  {item.expiryDate && isExpired(item.expiryDate) && (
                    <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                      Hết hạn
                    </span>
                  )}
                </div>
                {item.issuer && (
                  <p className="mt-0.5 text-xs font-medium text-blue-700"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Đơn vị cấp: </span>{item.issuer}</p>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              {item.credentialCode && (
                <p><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mã chứng chỉ: </span><span className="font-mono font-medium text-slate-700">{item.credentialCode}</span></p>
              )}
              {item.issueDate && <p><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ngày cấp: </span>{dateLabel(item.issueDate)}</p>}
              {item.expiryDate && <p><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Hạn đến: </span>{dateLabel(item.expiryDate)}</p>}
            </div>

            {item.description && (
              <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-600"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mô tả: </span>{item.description}</p>
            )}

            {/* Link xác minh */}
            {item.credentialUrl && (
              <a
                href={item.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
              >
                Xem chứng chỉ
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2.5 9.5 9.5 2.5M5 2.5h4.5V7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

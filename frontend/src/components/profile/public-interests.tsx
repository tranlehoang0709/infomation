import Image from 'next/image';
import { ApiError, apiAssetUrl, apiRequest } from '@/lib/api';
import type { InterestListResponse } from '@/types/interest';

export async function PublicInterests() {
  let interests: InterestListResponse['interests'];
  try { ({ interests } = await apiRequest<InterestListResponse>('/interests/public')); }
  catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    return <section aria-labelledby="interests-heading" className="mt-24 pt-12"><h2 id="interests-heading" className="text-2xl font-semibold">Sở thích</h2><p role="status" className="mt-4 text-sm text-slate-500">Chưa thể tải sở thích. Vui lòng thử lại sau.</p></section>;
  }
  if (!interests.length) return null;
  return <section aria-labelledby="interests-heading" className="mt-24 pt-12">
    <p className="text-sm font-semibold text-blue-700">Ngoài công việc</p>
    <h2 id="interests-heading" className="mt-2 text-3xl font-semibold tracking-tight">Sở thích</h2>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {interests.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {item.icon && <Image src={apiAssetUrl(item.icon.filePath)} alt={item.icon.altText ?? ''} width={48} height={48} className="mb-4 size-12 rounded-xl object-cover" />}
        <h3 className="font-semibold text-slate-900">{item.title}</h3>
        {item.description && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{item.description}</p>}
      </article>)}
    </div>
  </section>;
}

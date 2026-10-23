'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { SharedPortfolioView } from '@/components/profile/shared-portfolio-view';
import type { SharedPortfolioResponse } from '@/types/shared-portfolio';
import type { AdminProfileResponse } from '@/types/profile';
import type { EducationListResponse } from '@/types/education';
import type { CertificateListResponse } from '@/types/certificate';
import type { ExperienceListResponse } from '@/types/experience';
import type { SkillListResponse } from '@/types/skill';
import type { ProjectListResponse } from '@/types/project';
import type { InterestListResponse } from '@/types/interest';

export type ShareVisibilityKey = 'profile' | 'educations' | 'certificates' | 'experiences' | 'skills' | 'projects' | 'interests';
export type ShareVisibility = Record<ShareVisibilityKey, boolean>;
type Visibility = ShareVisibility;

export function ShareLinkManager({ visibility }: { visibility: Visibility }) {
  const [createdUrl, setCreatedUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewData, setPreviewData] = useState<SharedPortfolioResponse | null>(null);

  async function create() {
    setBusy(true); setError(''); setSuccess(''); setCreatedUrl('');
    try {
      const result = await apiRequest<{ url: string }>('/share-links', { method: 'POST', body: JSON.stringify({ visibility }) });
      setCreatedUrl(result.url); setSuccess('Đã tạo link chia sẻ. Hãy sao chép và gửi cho người xem.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể tạo link chia sẻ.'); }
    finally { setBusy(false); }
  }
  async function preview() {
    setBusy(true); setError('');
    try {
      const [profileResult, educationsResult, certificatesResult, experiencesResult, skillsResult, projectsResult, interestsResult] = await Promise.all([
        apiRequest<AdminProfileResponse>('/profile/admin'),
        apiRequest<EducationListResponse>('/educations/admin'),
        apiRequest<CertificateListResponse>('/certificates/admin'),
        apiRequest<ExperienceListResponse>('/experiences/admin'),
        apiRequest<SkillListResponse>('/skills/admin'),
        apiRequest<ProjectListResponse>('/projects/admin'),
        apiRequest<InterestListResponse>('/interests/admin'),
      ]);
      const profile = profileResult.profile;
      setPreviewData({
        title: profileResult.portfolio.title,
        visibility,
        profile: visibility.profile && profile ? {
          fullName: profile.fullName, headline: profile.headline, phone: profile.phone,
          contactEmail: profile.contactEmail, location: profile.location, bio: profile.bio,
          avatarUrl: profile.avatarMediaId ? `/media/${profile.avatarMediaId}/file` : null,
          cvUrl: profile.cvMediaId ? `/media/${profile.cvMediaId}/file` : null,
        } : null,
        educations: visibility.educations ? educationsResult.educations.filter((item) => item.isVisible) : [],
        certificates: visibility.certificates ? certificatesResult.certificates.filter((item) => item.isVisible) : [],
        experiences: visibility.experiences ? experiencesResult.experiences.filter((item) => item.isVisible) : [],
        skills: visibility.skills ? skillsResult.skills.filter((item) => item.isVisible) : [],
        projects: visibility.projects ? projectsResult.projects.filter((item) => item.isVisible).map((item) => ({ ...item, isFeatured: item.isFeatured })) : [],
        interests: visibility.interests ? interestsResult.interests.filter((item) => item.isVisible) : [],
      });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể tải bản xem trước.'); }
    finally { setBusy(false); }
  }
  return <div>
    <div className="mb-6"><p className="text-sm font-semibold text-blue-700">Chia sẻ có kiểm soát</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Xuất link xem</h1><p className="mt-2 text-slate-600">Chọn những phần người nhận link được phép xem. Link chỉ có quyền đọc.</p></div>
    {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {success && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
    <div className="flex flex-wrap gap-3"><button type="button" disabled={busy || !Object.values(visibility).some(Boolean)} onClick={() => void preview()} className="rounded-xl border border-blue-300 bg-white px-5 py-2.5 text-sm font-semibold text-blue-800 disabled:opacity-50">Xem trước</button><button type="button" disabled={busy || !Object.values(visibility).some(Boolean)} onClick={() => void create()} className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang tạo…' : 'Xuất link chia sẻ'}</button></div>
    {createdUrl && <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4"><input readOnly value={createdUrl} className="control min-w-[240px] flex-1" /><button type="button" onClick={() => void navigator.clipboard.writeText(createdUrl)} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white">Sao chép link</button></div>}
    {previewData && <div className="mt-8 overflow-hidden rounded-3xl border-2 border-blue-200"><div className="flex items-center justify-between bg-blue-50 px-5 py-3"><p className="font-semibold text-blue-900">Bản xem trước theo lựa chọn hiện tại</p><button type="button" onClick={() => setPreviewData(null)} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800">Đóng</button></div><SharedPortfolioView data={previewData} /></div>}
  </div>;
}

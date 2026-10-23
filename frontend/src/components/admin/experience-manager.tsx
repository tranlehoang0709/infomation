'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiAssetUrl, apiRequest } from '@/lib/api';
import { getSession, logout, Session } from '@/lib/auth';
import { MediaPicker } from '@/components/admin/media-picker';
import type { ExperienceInput, ExperienceListResponse, ExperienceRecord, MediaUploadResponse } from '@/types/experience';

const emptyForm: ExperienceInput = {
  companyName: '', position: '', employmentType: '', location: '', startDate: '', endDate: '',
  isCurrent: false, description: '', achievements: '', sortOrder: 0, isVisible: true, companyLogoMediaId: null,
};

function toInput(item: ExperienceRecord): ExperienceInput {
  return {
    companyName: item.companyName,
    position: item.position,
    employmentType: item.employmentType ?? '',
    location: item.location ?? '',
    startDate: item.startDate?.slice(0, 10) ?? '',
    endDate: item.endDate?.slice(0, 10) ?? '',
    isCurrent: item.isCurrent,
    description: item.description ?? '',
    achievements: item.achievements.join('\n'),
    sortOrder: item.sortOrder,
    isVisible: item.isVisible,
    companyLogoMediaId: item.companyLogo?.id ?? null,
  };
}

export function ExperienceManager() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<ExperienceRecord[]>([]);
  const [form, setForm] = useState<ExperienceInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savedLogoPath, setSavedLogoPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const current = await getSession();
        const data = await apiRequest<ExperienceListResponse>('/experiences/admin');
        if (!active) return;
        setSession(current);
        setItems(data.experiences);
      } catch (cause) {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
        else setError(cause instanceof Error ? cause.message : 'Không thể tải danh sách kinh nghiệm.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void initialize();
    return () => { active = false; };
  }, [router]);

  function clearPreview() {
    if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    setSavedLogoPath(null);
  }

  function cancelEdit() {
    clearPreview();
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(false);
    setError('');
    setSuccess('');
  }

  function edit(item: ExperienceRecord) {
    clearPreview();
    setForm(toInput(item));
    setEditingId(item.id);
    setFormOpen(true);
    setSavedLogoPath(item.companyLogo?.filePath ?? null);
    setError('');
    setSuccess('');
  }

  function update<K extends keyof ExperienceInput>(key: K, value: ExperienceInput[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setError('');
    setSuccess('');
  }

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setError('Choose a JPEG, PNG, GIF, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Logo công ty không được vượt quá 10 MB.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    const body = new FormData();
    body.append('file', file);
    try {
      const uploaded = await apiRequest<MediaUploadResponse>('/media/admin/upload', { method: 'POST', body });
      clearPreview();
      setForm((previous) => ({ ...previous, companyLogoMediaId: uploaded.id }));
      setLogoPreview(URL.createObjectURL(file));
      setSuccess('Đã tải logo. Hãy lưu kinh nghiệm để liên kết ảnh.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
      else setError(cause instanceof Error ? cause.message : 'Không thể tải logo công ty.');
    } finally {
      setUploading(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    const payload = {
      ...form,
      companyName: form.companyName.trim(),
      position: form.position.trim(),
      employmentType: form.employmentType.trim() || null,
      location: form.location.trim() || null,
      startDate: form.startDate || null,
      endDate: form.isCurrent ? null : form.endDate || null,
      description: form.description.trim() || null,
      achievements: form.achievements.split('\n').map((line) => line.trim()).filter(Boolean),
    };
    try {
      const saved = await apiRequest<ExperienceRecord>(editingId ? `/experiences/admin/${editingId}` : '/experiences/admin', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      setItems((current) => {
        const next = editingId ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved];
        return next.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
      });
      clearPreview();
      setForm(emptyForm);
      setEditingId(null);
      setSuccess('Đã lưu kinh nghiệm.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
      else setError(cause instanceof Error ? cause.message : 'Không thể lưu kinh nghiệm.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: ExperienceRecord) {
    if (!window.confirm(`Xóa kinh nghiệm ${item.position} tại ${item.companyName}?`)) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/experiences/admin/${item.id}`, { method: 'DELETE' });
      setItems((current) => current.filter(({ id }) => id !== item.id));
      if (editingId === item.id) cancelEdit();
      setSuccess('Đã xóa kinh nghiệm.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
      else setError(cause instanceof Error ? cause.message : 'Không thể xóa kinh nghiệm.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    try {
      await logout();
      router.replace('/admin/login');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể đăng xuất.');
    }
  }

  if (loading) return <main className="grid min-h-screen place-items-center text-sm text-slate-500">Đang tải kinh nghiệm…</main>;

  const logoSource = logoPreview ?? (savedLogoPath ? apiAssetUrl(savedLogoPath) : null);
  return <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-[250px_1fr]">
    <aside className="border-b border-slate-200 bg-white px-5 py-5 md:min-h-screen md:border-b-0 md:border-r md:px-6 md:py-8">
      <a href="/" className="font-bold tracking-tight text-blue-800">Hồ sơ cá nhân <span className="font-normal text-slate-400">/ Quản trị</span></a>
      <nav className="mt-8 flex flex-wrap gap-2 md:flex-col" aria-label="Admin">
        <a href="#ho-so" className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-800">Hồ sơ</a>
        <a aria-current="page" href="#kinh-nghiem" className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">Kinh nghiệm</a>
      </nav>
      <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 md:absolute md:bottom-7 md:left-6 md:w-[202px]">
        <p className="truncate text-xs font-semibold">{session?.email}</p>
        <button onClick={signOut} className="text-xs font-semibold text-slate-500 hover:text-blue-700">Đăng xuất</button>
      </div>
    </aside>

    <main className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto grid max-w-6xl gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.85fr)]">
        <section>
          <p className="text-sm font-semibold text-blue-700">Nội dung hồ sơ</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Kinh nghiệm làm việc</h1>
          <p className="mt-2 text-slate-600">Quản lý vị trí và thành tựu hiển thị trên trang cá nhân.</p>
          <button type="button" onClick={() => { clearPreview(); setForm(emptyForm); setEditingId(null); setFormOpen(true); setError(''); setSuccess(''); }} className="mb-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"><span aria-hidden="true" className="text-lg leading-none">+</span> Thêm kinh nghiệm</button>
          <div className="mt-7 space-y-3">
            {items.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-sm text-slate-500">Chưa có kinh nghiệm làm việc.</p> : items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  {item.companyLogo && <img crossOrigin="use-credentials" src={apiAssetUrl(item.companyLogo.filePath)} alt={item.companyLogo.altText ?? `${item.companyName} logo`} className="size-12 rounded-xl border border-slate-100 object-contain p-1" />}
                  <div className="min-w-0 flex-1"><h2 className="font-semibold text-slate-900">{item.position}</h2><p className="mt-1 text-sm text-slate-600">{item.companyName}{item.location ? ` · ${item.location}` : ''}</p>
                    <p className="mt-2 text-xs text-slate-500">{item.isVisible ? 'Đang hiển thị' : 'Đang ẩn'} · thứ tự {item.sortOrder}</p></div>
                  <div className="flex gap-3 text-sm"><button type="button" onClick={() => edit(item)} aria-label="Sửa kinh nghiệm" title="Sửa kinh nghiệm" className="icon-action-button icon-edit-button font-semibold text-blue-700"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z"/><path d="m14.5 6.5 3 3"/></svg></button><button type="button" disabled={busy} onClick={() => void remove(item)} aria-label="Xóa kinh nghiệm" title="Xóa kinh nghiệm" className="icon-action-button icon-delete-button font-semibold text-red-700 disabled:opacity-50"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {formOpen && (<section className="self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5"><h2 className="font-semibold">{editingId ? 'Sửa kinh nghiệm' : 'Thêm kinh nghiệm'}</h2><p className="mt-1 text-sm text-slate-500">Công ty và chức danh là bắt buộc.</p></div>
          <div className="grid gap-4 px-6 pt-5 sm:grid-cols-2"><MediaPicker label="Logo công ty" value={form.companyLogoMediaId} accept="images" onChange={(value) => update('companyLogoMediaId', typeof value === 'string' ? value : null)} /></div>
          <form onSubmit={save}>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <label className="field">Công ty *<input className="control" required maxLength={255} value={form.companyName} onChange={(event) => update('companyName', event.target.value)} /></label>
              <label className="field">Chức danh *<input className="control" required maxLength={200} value={form.position} onChange={(event) => update('position', event.target.value)} /></label>
              <label className="field">Hình thức làm việc<input className="control" maxLength={50} value={form.employmentType} onChange={(event) => update('employmentType', event.target.value)} placeholder="Toàn thời gian, hợp đồng…" /></label>
              <label className="field">Địa điểm<input className="control" maxLength={255} value={form.location} onChange={(event) => update('location', event.target.value)} /></label>
              <label className="field">Ngày bắt đầu<input className="control" type="date" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} /></label>
              <label className="field">Ngày kết thúc<input className="control" type="date" disabled={form.isCurrent} value={form.isCurrent ? '' : form.endDate} onChange={(event) => update('endDate', event.target.value)} /></label>
              <label className="field sm:col-span-2">Mô tả<textarea className="control min-h-24 resize-y" maxLength={10000} value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
              <label className="field sm:col-span-2">Thành tựu <span className="font-normal text-slate-500">Mỗi dòng một nội dung</span><textarea className="control min-h-28 resize-y" maxLength={15000} value={form.achievements} onChange={(event) => update('achievements', event.target.value)} placeholder="Cải thiện tốc độ tải trang…&#10;Dẫn dắt nhóm kỹ sư…" /></label>
              <label className="field">Thứ tự hiển thị<input className="control" type="number" min={0} step={1} value={form.sortOrder} onChange={(event) => update('sortOrder', Number(event.target.value))} /></label>
              <div className="field">Logo công ty
                <input className="control p-2" type="file" accept="image/png,image/jpeg,image/gif,image/webp" disabled={uploading || busy} onChange={(event) => void uploadLogo(event)} />
                {logoSource && <img crossOrigin="use-credentials" src={logoSource} alt="Xem trước logo công ty" className="size-20 rounded-xl border border-slate-200 object-contain p-2" />}
                {form.companyLogoMediaId && <button className="w-fit text-xs font-semibold text-red-700" type="button" onClick={() => { update('companyLogoMediaId', null); clearPreview(); }}>Gỡ logo</button>}
              </div>
              <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.isCurrent} onChange={(event) => { update('isCurrent', event.target.checked); if (event.target.checked) update('endDate', ''); }} /> Hiện đang làm việc tại đây</label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.isVisible} onChange={(event) => update('isVisible', event.target.checked)} /> Hiển thị công khai</label>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <p role={error ? 'alert' : 'status'} className={`text-sm ${error ? 'text-red-700' : success ? 'text-emerald-700' : 'text-slate-500'}`}>{error || success || (uploading ? 'Đang tải logo…' : 'Thay đổi được lưu vào hồ sơ.')}</p>
              <div className="flex gap-2"><button type="button" disabled={busy || uploading} onClick={cancelEdit} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">Hủy</button><button disabled={busy || uploading} className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">{busy ? 'Đang lưu…' : editingId ? 'Lưu thay đổi' : 'Thêm kinh nghiệm'}</button></div>
            </div>
          </form>
        </section>)}
      </div>
    </main>
  </div>;
}

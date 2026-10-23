'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiAssetUrl, apiRequest } from '@/lib/api';
import { getSession, logout, Session } from '@/lib/auth';
import { MediaPicker } from '@/components/admin/media-picker';
import type { ProjectInput, ProjectListResponse, ProjectRecord } from '@/types/project';

const empty: ProjectInput = {
  title: '', slug: '', shortDescription: '', description: '', role: '', technologies: '', githubUrl: '', demoUrl: '',
  startDate: '', endDate: '', isFeatured: false, sortOrder: 0, isVisible: true, thumbnailMediaId: null, galleryMediaIds: [],
};
type Preview = { id: string; src: string };
type UploadResponse = { id: string; adminFilePath: string };

function toForm(item: ProjectRecord): ProjectInput {
  return {
    ...empty, title: item.name, slug: item.slug ?? '', shortDescription: item.summary ?? '', description: item.description ?? '',
    role: item.role ?? '', technologies: item.technologies.join(', '), githubUrl: item.githubUrl ?? '', demoUrl: item.demoUrl ?? '',
    startDate: item.startDate?.slice(0, 10) ?? '', endDate: item.endDate?.slice(0, 10) ?? '', isFeatured: item.isFeatured,
    sortOrder: item.sortOrder, isVisible: item.isVisible, thumbnailMediaId: item.thumbnail?.id ?? null,
    galleryMediaIds: item.gallery.map((image) => image.id),
  };
}

export function ProjectManager() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<ProjectRecord[]>([]);
  const [form, setForm] = useState<ProjectInput>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<Preview | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<Preview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [current, result] = await Promise.all([getSession(), apiRequest<ProjectListResponse>('/projects/admin')]);
        if (!active) return;
        setSession(current); setItems(result.projects);
      } catch (cause) {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
        else setError(cause instanceof Error ? cause.message : 'Không thể tải dự án.');
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [router]);

  function clearPreviews() {
    for (const preview of [thumbnailPreview, ...galleryPreviews]) if (preview?.src.startsWith('blob:')) URL.revokeObjectURL(preview.src);
    setThumbnailPreview(null); setGalleryPreviews([]);
  }
  function cancel() { clearPreviews(); setForm(empty); setEditingId(null); setFormOpen(false); setError(''); setSuccess(''); }
  function edit(item: ProjectRecord) { clearPreviews(); setForm(toForm(item)); setEditingId(item.id); setFormOpen(true); setError(''); setSuccess(''); }
  function update<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) { setForm((current) => ({ ...current, [key]: value })); setError(''); setSuccess(''); }

  async function upload(file: File) {
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) throw new Error('Chọn ảnh JPEG, PNG, GIF hoặc WebP.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Ảnh không được lớn hơn 10 MB.');
    const body = new FormData(); body.append('file', file);
    const result = await apiRequest<UploadResponse>('/media/admin/upload', { method: 'POST', body });
    return { id: result.id, src: URL.createObjectURL(file) };
  }

  async function uploadThumbnail(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    setUploading(true); setError(''); setSuccess('');
    try {
      const result = await upload(file);
      if (thumbnailPreview?.src.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreview.src);
      setThumbnailPreview(result); update('thumbnailMediaId', result.id); setSuccess('Đã tải ảnh. Lưu dự án để liên kết ảnh.');
    } catch (cause) { if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login'); else setError(cause instanceof Error ? cause.message : 'Tải ảnh thất bại.'); }
    finally { setUploading(false); }
  }

  async function uploadGallery(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []); event.target.value = ''; if (!files.length) return;
    if (form.galleryMediaIds.length + files.length > 20) { setError('Mỗi dự án tối đa 20 ảnh thư viện.'); return; }
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)) {
      setError('Mỗi ảnh phải là JPEG, PNG, GIF hoặc WebP và không lớn hơn 10 MB.'); return;
    }
    setUploading(true); setError(''); setSuccess('');
    try {
      const results: Preview[] = [];
      for (const file of files) results.push(await upload(file));
      setGalleryPreviews((current) => [...current, ...results]);
      setForm((current) => ({ ...current, galleryMediaIds: [...current.galleryMediaIds, ...results.map(({ id }) => id)] }));
      setSuccess(`Đã tải ${results.length} ảnh. Lưu dự án để liên kết ảnh.`);
    } catch (cause) { if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login'); else setError(cause instanceof Error ? cause.message : 'Tải thư viện ảnh thất bại.'); }
    finally { setUploading(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    const payload = {
      ...form, title: form.title.trim(), slug: form.slug.trim() || null,
      shortDescription: form.shortDescription.trim() || null, description: form.description.trim() || null, role: form.role.trim() || null,
      technologies: form.technologies.split(',').map((value) => value.trim()).filter(Boolean),
      githubUrl: form.githubUrl.trim() || null, demoUrl: form.demoUrl.trim() || null,
      startDate: form.startDate || null, endDate: form.endDate || null,
      galleryMediaIds: form.galleryMediaIds.filter((id) => id !== form.thumbnailMediaId),
    };
    try {
      const saved = await apiRequest<ProjectRecord>(editingId ? `/projects/admin/${editingId}` : '/projects/admin', {
        method: editingId ? 'PATCH' : 'POST', body: JSON.stringify(payload),
      });
      setItems((current) => {
        const next = editingId ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved];
        return next.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder || (BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0));
      });
      clearPreviews(); setForm(empty); setEditingId(null); setSuccess('Đã lưu dự án.');
    } catch (cause) { if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login'); else setError(cause instanceof Error ? cause.message : 'Không thể lưu dự án.'); }
    finally { setBusy(false); }
  }

  async function remove(item: ProjectRecord) {
    if (!window.confirm(`Xóa dự án “${item.name}”?`)) return;
    setBusy(true); setError(''); setSuccess('');
    try { await apiRequest(`/projects/admin/${item.id}`, { method: 'DELETE' }); setItems((current) => current.filter(({ id }) => id !== item.id)); if (editingId === item.id) cancel(); setSuccess('Đã xóa dự án.'); }
    catch (cause) { if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login'); else setError(cause instanceof Error ? cause.message : 'Không thể xóa dự án.'); }
    finally { setBusy(false); }
  }
  async function signOut() { try { await logout(); router.replace('/admin/login'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Đăng xuất thất bại.'); } }

  if (loading) return <main className="grid min-h-screen place-items-center text-sm text-slate-500">Đang tải dự án…</main>;
  const editing = items.find(({ id }) => id === editingId);
  const thumbnail = thumbnailPreview?.src ?? (form.thumbnailMediaId && editing?.thumbnail?.id === form.thumbnailMediaId ? apiAssetUrl(editing.thumbnail.filePath) : null);
  const galleryAssets = new Map([
    ...(editing?.gallery.map((image) => [image.id, { id: image.id, src: apiAssetUrl(image.filePath) }] as const) ?? []),
    ...galleryPreviews.map((image) => [image.id, image] as const),
  ]);
  const gallery = form.galleryMediaIds.flatMap((id) => galleryAssets.has(id) ? [galleryAssets.get(id)!] : []);

  return <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-[250px_1fr]">
    <aside className="border-b border-slate-200 bg-white px-5 py-5 md:min-h-screen md:border-b-0 md:border-r md:px-6 md:py-8">
      <a href="/" className="font-bold text-blue-800">Hồ sơ cá nhân <span className="font-normal text-slate-400">/ Quản trị</span></a>
      <nav className="mt-8 flex flex-wrap gap-2 md:flex-col" aria-label="Điều hướng quản trị">
        <a href="#ho-so" className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-blue-50">Hồ sơ</a>
        <a href="#kinh-nghiem" className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-blue-50">Kinh nghiệm</a>
        <a aria-current="page" href="#du-an" className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">Dự án</a>
      </nav>
      <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 md:absolute md:bottom-7 md:left-6 md:w-[202px]"><p className="truncate text-xs font-semibold">{session?.email}</p><button onClick={() => void signOut()} className="text-xs font-semibold text-slate-500">Đăng xuất</button></div>
    </aside>
    <main className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12"><div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(380px,.9fr)]">
      <section><p className="text-sm font-semibold text-blue-700">Nội dung hồ sơ</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Dự án</h1><p className="mt-2 text-slate-600">Quản lý thông tin và trạng thái hiển thị công khai của dự án.</p>
        <button type="button" onClick={() => { clearPreviews(); setForm(empty); setEditingId(null); setFormOpen(true); setError(''); setSuccess(''); }} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"><span aria-hidden="true" className="text-lg leading-none">+</span> Thêm dự án</button>
        <div className="mt-7 space-y-3">{items.length === 0 ? <p className="project-panel rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-sm text-slate-500">Chưa có dự án.</p> : items.map((item) => <article key={item.id} className="project-panel flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {item.thumbnail && <img crossOrigin="use-credentials" src={apiAssetUrl(item.thumbnail.filePath)} alt={item.thumbnail.altText ?? item.name} className="size-20 rounded-xl object-cover" />}
          <div className="min-w-0 flex-1"><h2 className="font-semibold">{item.name}</h2><p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.summary ?? '—'}</p><p className="mt-2 text-xs text-slate-500">{item.isVisible ? 'Đang hiển thị' : 'Đang ẩn'} · {item.isFeatured ? 'Nổi bật · ' : ''}thứ tự {item.sortOrder}</p></div>
          <div className="flex gap-3 text-sm"><button type="button" onClick={() => edit(item)} aria-label="Sửa dự án" title="Sửa dự án" className="icon-action-button icon-edit-button font-semibold text-blue-700"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z"/><path d="m14.5 6.5 3 3"/></svg></button><button type="button" disabled={busy} onClick={() => void remove(item)} aria-label="Xóa dự án" title="Xóa dự án" className="icon-action-button icon-delete-button font-semibold text-red-700 disabled:opacity-50"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button></div>
        </article>)}</div>
      </section>
      {formOpen && (<section className="project-panel self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-6 py-5"><h2 className="font-semibold">{editingId ? 'Sửa dự án' : 'Thêm dự án'}</h2><p className="mt-1 text-sm text-slate-500">Tên dự án là bắt buộc. Để trống đường dẫn để hệ thống tự tạo từ tên.</p></div>
        <div className="grid gap-4 px-6 pt-5 sm:grid-cols-2"><MediaPicker label="Chọn ảnh bìa từ thư viện" value={form.thumbnailMediaId} accept="images" onChange={(value) => update('thumbnailMediaId', typeof value === 'string' ? value : null)} /><MediaPicker label="Chọn ảnh thư viện" value={form.galleryMediaIds} accept="images" multiple onChange={(value) => update('galleryMediaIds', Array.isArray(value) ? value : [])} /></div>
        <form onSubmit={(event) => void save(event)}><div className="grid gap-4 p-6 sm:grid-cols-2">
          <label className="field sm:col-span-2">Tên dự án *<input className="control" required maxLength={255} value={form.title} onChange={(e) => update('title', e.target.value)} /></label>
          <label className="field sm:col-span-2">Đường dẫn<input className="control" maxLength={180} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder="tu-dong-tao-tu-ten-du-an" /></label>
          <label className="field sm:col-span-2">Mô tả ngắn<textarea className="control min-h-20" maxLength={500} value={form.shortDescription} onChange={(e) => update('shortDescription', e.target.value)} /></label>
          <label className="field sm:col-span-2">Mô tả chi tiết<textarea className="control min-h-32" value={form.description} onChange={(e) => update('description', e.target.value)} /></label>
          <label className="field">Vai trò<input className="control" maxLength={150} value={form.role} onChange={(e) => update('role', e.target.value)} /></label>
          <label className="field">Công nghệ <span className="font-normal text-slate-500">Phân cách bằng dấu phẩy</span><input className="control" value={form.technologies} onChange={(e) => update('technologies', e.target.value)} placeholder="Next.js, MySQL" /></label>
          <label className="field">Ngày bắt đầu<input className="control" type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} /></label>
          <label className="field">Ngày kết thúc<input className="control" type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} /></label>
          <label className="field">Đường dẫn GitHub<input className="control" type="url" value={form.githubUrl} onChange={(e) => update('githubUrl', e.target.value)} placeholder="https://github.com/…" /></label>
          <label className="field">Đường dẫn bản chạy<input className="control" type="url" value={form.demoUrl} onChange={(e) => update('demoUrl', e.target.value)} placeholder="https://…" /></label>
          <label className="field">Thứ tự hiển thị<input className="control" type="number" min={0} max={2147483647} step={1} value={form.sortOrder} onChange={(e) => update('sortOrder', Number(e.target.value))} /></label>
          <div className="field">Ảnh đại diện dự án<input className="control p-2" type="file" accept="image/jpeg,image/png,image/gif,image/webp" disabled={uploading || busy} onChange={(e) => void uploadThumbnail(e)} />{thumbnail && <img crossOrigin="use-credentials" src={thumbnail} alt="Xem trước ảnh đại diện dự án" className="mt-2 h-28 w-full rounded-xl object-cover" />}{form.thumbnailMediaId && <button type="button" className="mt-1 text-xs text-red-700" onClick={() => { update('thumbnailMediaId', null); if (thumbnailPreview?.src.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreview.src); setThumbnailPreview(null); }}>Gỡ ảnh đại diện</button>}</div>
          <div className="field sm:col-span-2">Ảnh thư viện<input className="control p-2" type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp" disabled={uploading || busy} onChange={(e) => void uploadGallery(e)} /><div className="mt-2 flex flex-wrap gap-2">{gallery.map((image, index) => <div key={image.id} className="relative"><img src={image.src} alt="Xem trước ảnh dự án" className="size-20 rounded-lg object-cover" /><span className="absolute left-1 top-1 rounded bg-white/90 px-1 text-xs">{index + 1}</span><button type="button" aria-label="Chuyển ảnh lên trên" disabled={index === 0} className="absolute bottom-1 left-1 rounded bg-white px-1.5 disabled:opacity-40" onClick={() => { const ids = [...form.galleryMediaIds]; [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]; update('galleryMediaIds', ids); }}>↑</button><button type="button" aria-label="Chuyển ảnh xuống dưới" disabled={index === gallery.length - 1} className="absolute bottom-1 left-8 rounded bg-white px-1.5 disabled:opacity-40" onClick={() => { const ids = [...form.galleryMediaIds]; [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]]; update('galleryMediaIds', ids); }}>↓</button><button type="button" aria-label="Gỡ ảnh khỏi thư viện" className="absolute -right-1 -top-1 rounded-full bg-red-700 px-2 text-white" onClick={() => { const preview = galleryPreviews.find(({ id }) => id === image.id); if (preview?.src.startsWith('blob:')) URL.revokeObjectURL(preview.src); update('galleryMediaIds', form.galleryMediaIds.filter((id) => id !== image.id)); setGalleryPreviews((current) => current.filter(({ id }) => id !== image.id)); }}>×</button></div>)}</div></div>
          <div className="flex flex-wrap gap-5 sm:col-span-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => update('isFeatured', e.target.checked)} /> Dự án nổi bật</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isVisible} onChange={(e) => update('isVisible', e.target.checked)} /> Hiển thị công khai</label></div>
        </div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4"><p role={error ? 'alert' : 'status'} className={`text-sm ${error ? 'text-red-700' : success ? 'text-emerald-700' : 'text-slate-500'}`}>{error || success || (uploading ? 'Đang tải ảnh…' : 'Thay đổi được lưu vào portfolio.')}</p><div className="flex gap-2"><button type="button" disabled={busy || uploading} onClick={cancel} className="rounded-xl border px-4 py-2.5 text-sm font-semibold">Hủy</button><button disabled={busy || uploading} className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu…' : editingId ? 'Lưu thay đổi' : 'Thêm dự án'}</button></div></div></form>
      </section>)}
    </div></main>
  </div>;
}

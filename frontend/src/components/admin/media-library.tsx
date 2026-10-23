'use client';

import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiAssetUrl, apiRequest } from '@/lib/api';
import { getSession, logout, Session } from '@/lib/auth';

interface MediaAsset {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: string;
  altText: string | null;
  createdAt: string;
  adminFilePath: string;
  usedBy: string[];
  canDelete: boolean;
  storageAvailable: boolean;
}
interface MediaListResponse { media: MediaAsset[] }
interface UploadResponse { id: string; originalName: string; mimeType: string; fileSize: string; adminFilePath: string }

function readableSize(value: string) {
  const size = Number(value);
  if (!Number.isFinite(size)) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    const response = await apiRequest<MediaListResponse>('/media/admin');
    setItems(response.media);
  }, []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const current = await getSession();
        const response = await apiRequest<MediaListResponse>('/media/admin');
        if (active) { setSession(current); setItems(response.media); }
      } catch (cause) {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
        else setError(cause instanceof Error ? cause.message : 'Không tải được thư viện media.');
      } finally { if (active) setLoading(false); }
    }
    void initialize();
    return () => { active = false; };
  }, [router]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Tệp không được lớn hơn 10 MB.'); return; }
    const accepted = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']);
    if (!accepted.has(file.type)) { setError('Chọn ảnh JPEG, PNG, GIF, WebP hoặc PDF.'); return; }
    setUploading(true); setError(''); setSuccess('');
    const body = new FormData(); body.append('file', file);
    try {
      const uploaded = await apiRequest<UploadResponse>('/media/admin/upload', { method: 'POST', body });
      await load(); setSuccess(`Đã tải ${uploaded.originalName}. ID media: ${uploaded.id}`);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
      else setError(cause instanceof Error ? cause.message : 'Tải tệp thất bại.');
    } finally { setUploading(false); }
  }

  async function remove(item: MediaAsset) {
    if (!item.canDelete) { setError('Tệp đang được dùng; hãy gỡ liên kết ở mục portfolio trước.'); return; }
    if (!window.confirm(`Xóa vĩnh viễn ${item.originalName}?`)) return;
    setDeletingId(item.id); setError(''); setSuccess('');
    try {
      const result = await apiRequest<{ deleted: true; fileMissing: boolean }>(`/media/admin/${item.id}`, { method: 'DELETE' });
      setItems((current) => current.filter(({ id }) => id !== item.id));
      setSuccess(result.fileMissing ? 'Đã xóa metadata. Tệp đã không còn trong storage.' : 'Đã xóa tệp.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
      else setError(cause instanceof Error ? cause.message : 'Không thể xóa tệp.');
    } finally { setDeletingId(null); }
  }

  async function signOut() { try { await logout(); router.replace('/admin/login'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Đăng xuất thất bại.'); } }

  if (loading) return <main className="grid min-h-screen place-items-center text-sm text-slate-500">Đang tải thư viện media…</main>;
  return <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-[250px_1fr]">
    <aside className="border-b border-slate-200 bg-white px-5 py-5 md:min-h-screen md:border-b-0 md:border-r md:px-6 md:py-8">
      <a href="/" className="font-bold text-blue-800">Hồ sơ cá nhân <span className="font-normal text-slate-400">/ Quản trị</span></a>
      <nav className="mt-8 flex flex-wrap gap-2 md:flex-col" aria-label="Admin">
        <a href="#ho-so" className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-blue-50">Hồ sơ</a>
        <a href="#kinh-nghiem" className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-blue-50">Kinh nghiệm</a>
        <a href="#du-an" className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-blue-50">Dự án</a>
        <a aria-current="page" href="#tep-hinh-anh" className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">Tệp & hình ảnh</a>
      </nav>
      <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 md:absolute md:bottom-7 md:left-6 md:w-[202px]"><p className="truncate text-xs font-semibold">{session?.email}</p><button onClick={() => void signOut()} className="text-xs font-semibold text-slate-500 hover:text-blue-700">Đăng xuất</button></div>
    </aside>

    <main className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12"><div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm font-semibold text-blue-700">Tài nguyên hồ sơ</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Thư viện tệp</h1><p className="mt-2 text-slate-600">Tệp được lưu ngoài thư mục công khai. Không thể xóa tệp đang được sử dụng.</p></div>
        <label className="cursor-pointer rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">{uploading ? 'Đang tải…' : 'Tải ảnh hoặc PDF'}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" disabled={uploading} onChange={(event) => void upload(event)} /></label>
      </div>
      {(error || success) && <p role={error ? 'alert' : 'status'} className={`mt-5 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || success}</p>}
      {items.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Chưa có tệp. Tải ảnh JPEG, PNG, GIF, WebP hoặc PDF (tối đa 10 MB).</div>
        : <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid aspect-[16/10] place-items-center bg-slate-100">
            {!item.storageAvailable ? <span className="text-sm font-medium text-red-700">Không tìm thấy tệp trong bộ nhớ</span>
              : item.mimeType.startsWith('image/') ? <a href={apiAssetUrl(item.adminFilePath)} target="_blank" rel="noreferrer" className="grid size-full place-items-center"><img crossOrigin="use-credentials" src={apiAssetUrl(item.adminFilePath)} alt={item.altText ?? item.originalName} className="size-full object-contain" /></a>
              : <a href={apiAssetUrl(item.adminFilePath)} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 bg-white px-6 py-4 font-semibold text-blue-700">Mở PDF ↗</a>}
          </div>
          <div className="p-4"><h2 className="truncate font-semibold" title={item.originalName}>{item.originalName}</h2><p className="mt-1 text-xs text-slate-500">{item.mimeType} · {readableSize(item.fileSize)} · ID {item.id}</p>
            <p className="mt-2 text-xs text-slate-500">{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(item.createdAt))}</p>
            {item.usedBy.length > 0 ? <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900"><span className="font-semibold">Đang dùng:</span> {item.usedBy.join(', ')}</div> : <p className="mt-3 text-xs text-slate-500">Chưa liên kết với nội dung nào.</p>}
            <div className="mt-4 flex items-center justify-between gap-3"><button type="button" onClick={() => void navigator.clipboard.writeText(item.id).then(() => setSuccess(`Đã sao chép mã tệp ${item.id}.`)).catch(() => setError('Không thể sao chép mã tệp.'))} className="text-sm font-semibold text-blue-700 hover:underline">Sao chép mã tệp</button>
              <button type="button" disabled={!item.canDelete || deletingId === item.id} onClick={() => void remove(item)} aria-label={item.canDelete ? 'Xóa tệp' : 'Không thể xóa tệp đang được sử dụng'} title={item.canDelete ? 'Xóa tệp chưa được sử dụng' : `Tệp đang được dùng bởi ${item.usedBy.join(', ')}`} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"><span aria-hidden="true">{deletingId === item.id ? '…' : '🗑'}</span></button></div>
          </div>
        </article>)}</div>}
    </div></main>
  </div>;
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MediaPicker } from '@/components/admin/media-picker';
import { ApiError, apiAssetUrl, apiRequest } from '@/lib/api';
import { getSession, logout, Session } from '@/lib/auth';
import type { InterestListResponse, InterestRecord } from '@/types/interest';

const blank = { title: '', description: '', sortOrder: 0, isVisible: true, iconMediaId: null as string | null };
type FormData = typeof blank;

function toForm(item: InterestRecord): FormData {
  return { title: item.title, description: item.description ?? '', sortOrder: item.sortOrder, isVisible: item.isVisible, iconMediaId: item.icon?.id ?? null };
}

export function InterestManager() {
  const router = useRouter();
  const [items, setItems] = useState<InterestRecord[]>([]);
  const [form, setForm] = useState<FormData>(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [current, response] = await Promise.all([getSession(), apiRequest<InterestListResponse>('/interests/admin')]);
        if (active) { setSession(current); setItems(response.interests); }
      } catch (cause) {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
        else setError(cause instanceof Error ? cause.message : 'Không tải được danh sách sở thích.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [router]);

  const change = <K extends keyof FormData>(key: K, value: FormData[K]) => { setForm((old) => ({ ...old, [key]: value })); setError(''); setSuccess(''); };
  function cancel() { setForm(blank); setEditing(null); setError(''); setSuccess(''); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try {
      const saved = await apiRequest<InterestRecord>(editing ? `/interests/admin/${editing}` : '/interests/admin', {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify({ ...form, title: form.title.trim(), description: form.description.trim() || null }),
      });
      setItems((old) => (editing ? old.map((item) => item.id === saved.id ? saved : item) : [...old, saved]).sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)));
      cancel(); setSuccess('Đã lưu sở thích.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
      else setError(cause instanceof Error ? cause.message : 'Không thể lưu sở thích.');
    } finally { setBusy(false); }
  }

  async function remove(item: InterestRecord) {
    if (!window.confirm(`Xóa sở thích “${item.title}”?`)) return;
    setBusy(true); setError(''); setSuccess('');
    try { await apiRequest(`/interests/admin/${item.id}`, { method: 'DELETE' }); setItems((old) => old.filter(({ id }) => id !== item.id)); if (editing === item.id) cancel(); setSuccess('Đã xóa sở thích.'); }
    catch (cause) { if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login'); else setError(cause instanceof Error ? cause.message : 'Không thể xóa sở thích.'); }
    finally { setBusy(false); }
  }

  async function signOut() { try { await logout(); router.replace('/admin/login'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể đăng xuất.'); } }
  if (loading) return <main className="grid min-h-screen place-items-center text-sm text-slate-500">Đang tải sở thích…</main>;

  return <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-[250px_1fr]">
    <aside className="border-b border-slate-200 bg-white px-5 py-5 md:min-h-screen md:border-b-0 md:border-r md:px-6 md:py-8">
      <a href="/" className="font-bold text-blue-800">Hồ sơ cá nhân <span className="font-normal text-slate-400">/ Quản trị</span></a>
      <nav className="mt-8 flex flex-wrap gap-2 md:flex-col" aria-label="Điều hướng quản trị"><a href="#ho-so" className="rounded-xl px-4 py-3 text-sm">Hồ sơ</a><a href="#kinh-nghiem" className="rounded-xl px-4 py-3 text-sm">Kinh nghiệm</a><a aria-current="page" href="#so-thich" className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">Sở thích</a><a href="#tep-hinh-anh" className="rounded-xl px-4 py-3 text-sm">Tệp & hình ảnh</a></nav>
      <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5"><span className="truncate text-xs font-semibold">{session?.email}</span><button onClick={signOut} className="text-xs font-semibold text-slate-500">Đăng xuất</button></div>
    </aside>
    <main className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12"><div className="mx-auto grid max-w-6xl gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.85fr)]">
      <section><p className="text-sm font-semibold text-blue-700">Nội dung hồ sơ</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Sở thích</h1><p className="mt-2 text-slate-600">Quản lý những điều bạn muốn chia sẻ trên portfolio.</p>
        <div className="mt-7 space-y-3">{items.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-sm text-slate-500">Chưa có sở thích nào.</p> : items.map((item) => <article key={item.id} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {item.icon && <img crossOrigin="use-credentials" src={apiAssetUrl(item.icon.filePath)} alt={item.icon.altText ?? ''} className="size-12 rounded-xl object-cover" />}
          <div className="min-w-0 flex-1"><h2 className="font-semibold">{item.title}</h2>{item.description && <p className="mt-1 line-clamp-3 text-sm text-slate-600">{item.description}</p>}<p className="mt-2 text-xs text-slate-500">{item.isVisible ? 'Công khai' : 'Đã ẩn'} · thứ tự {item.sortOrder}</p></div>
          <div className="flex gap-3 text-sm"><button type="button" onClick={() => { setForm(toForm(item)); setEditing(item.id); setError(''); setSuccess(''); }} className="font-semibold text-blue-700">Sửa</button><button type="button" disabled={busy} onClick={() => void remove(item)} className="font-semibold text-red-700 disabled:opacity-50">Xóa</button></div>
        </article>)}</div>
      </section>
      <section className="self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-6 py-5"><h2 className="font-semibold">{editing ? 'Sửa sở thích' : 'Thêm sở thích'}</h2><p className="mt-1 text-sm text-slate-500">Tiêu đề là bắt buộc. Ảnh chọn từ thư viện Media.</p></div>
        <form onSubmit={(event) => void save(event)}><div className="grid gap-4 p-6">
          <label className="field">Ảnh / biểu tượng<MediaPicker label="Chọn ảnh từ Media" value={form.iconMediaId} onChange={(value) => change('iconMediaId', typeof value === 'string' ? value : null)} /></label>
          <label className="field">Tiêu đề *<input className="control" required maxLength={150} value={form.title} onChange={(event) => change('title', event.target.value)} /></label>
          <label className="field">Mô tả<textarea className="control min-h-28 resize-y" maxLength={10000} value={form.description} onChange={(event) => change('description', event.target.value)} /></label>
          <label className="field">Thứ tự hiển thị<input className="control" type="number" min={0} max={2147483647} step={1} value={form.sortOrder} onChange={(event) => change('sortOrder', Number(event.target.value))} /></label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.isVisible} onChange={(event) => change('isVisible', event.target.checked)} /> Hiển thị công khai</label>
        </div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4"><p role={error ? 'alert' : 'status'} className={`text-sm ${error ? 'text-red-700' : 'text-emerald-700'}`}>{error || success || 'Thay đổi được lưu vào portfolio.'}</p><div className="flex gap-2"><button type="button" disabled={busy} onClick={cancel} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Hủy</button><button disabled={busy} className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Thêm sở thích'}</button></div></div></form>
      </section>
    </div></main>
  </div>;
}

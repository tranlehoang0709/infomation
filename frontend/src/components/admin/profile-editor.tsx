'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiRequest } from '@/lib/api';
import { getSession, logout, Session } from '@/lib/auth';
import { nullableText } from '@/lib/utils';
import { MediaPicker } from '@/components/admin/media-picker';
import type { AdminProfileResponse, ProfileInput } from '@/types/profile';

const emptyForm: ProfileInput = { fullName: '', headline: '', phone: '', contactEmail: '', location: '', bio: '', avatarMediaId: null, cvMediaId: null, coverMediaId: null };

export function ProfileEditor() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [portfolio, setPortfolio] = useState<AdminProfileResponse['portfolio'] | null>(null);
  const [form, setForm] = useState<ProfileInput>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const current = await getSession();
        const data = await apiRequest<AdminProfileResponse>('/profile/admin');
        if (!active) return;
        setSession(current); setPortfolio(data.portfolio);
        if (data.profile) setForm({
          fullName: data.profile.fullName,
          headline: data.profile.headline ?? '',
          phone: data.profile.phone ?? '',
          contactEmail: data.profile.contactEmail ?? '',
          location: data.profile.location ?? '',
          bio: data.profile.bio ?? '',
          avatarMediaId: data.profile.avatarMediaId,
          cvMediaId: data.profile.cvMediaId,
          coverMediaId: data.profile.coverMediaId,
        });
      } catch (cause) {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
        else setError(cause instanceof Error ? cause.message : 'Không thể tải hồ sơ.');
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [router]);

  function change<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setForm((current) => ({ ...current, [key]: value })); setSuccess(''); setError('');
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess(''); setBusy(true);
    const payload: ProfileInput = {
      fullName: form.fullName.trim(), headline: nullableText(form.headline ?? ''),
      phone: nullableText(form.phone ?? ''), contactEmail: nullableText(form.contactEmail ?? '')?.toLowerCase() ?? null,
      location: nullableText(form.location ?? ''), bio: nullableText(form.bio ?? ''),
      avatarMediaId: form.avatarMediaId, cvMediaId: form.cvMediaId, coverMediaId: form.coverMediaId,
    };
    try {
      await apiRequest('/profile/admin', { method: 'PATCH', body: JSON.stringify(payload) });
      setForm(payload); setSuccess('Thông tin hồ sơ đã được lưu.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
      else setError(cause instanceof Error ? cause.message : 'Không thể lưu hồ sơ.');
    } finally { setBusy(false); }
  }

  async function signOut() {
    try { await logout(); router.replace('/admin/login'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể đăng xuất.'); }
  }

  if (loading) return <main className="grid min-h-screen place-items-center text-sm text-slate-500">Đang tải hồ sơ…</main>;

  return <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
    <aside className="border-b border-slate-200 bg-white px-5 py-5 md:min-h-screen md:border-b-0 md:border-r md:px-6 md:py-8">
      <a href="/" className="font-bold tracking-tight text-blue-800">Hồ sơ cá nhân <span className="font-normal text-slate-400">/ Quản trị</span></a>
      <nav className="mt-8 flex flex-wrap gap-2 md:flex-col" aria-label="Quản trị"><a aria-current="page" href="#ho-so" className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">Hồ sơ cá nhân</a><a href="#kinh-nghiem" className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-800">Kinh nghiệm</a><a href="#du-an" className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-800">Dự án</a></nav>
      <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 md:absolute md:bottom-7 md:left-6 md:right-auto md:w-[202px]"><div className="min-w-0"><p className="truncate text-xs font-semibold">{session?.email}</p><p className="mt-1 text-xs text-slate-500">Chủ portfolio</p></div><button onClick={signOut} className="text-xs font-semibold text-slate-500 hover:text-blue-700">Thoát</button></div>
    </aside>
    <main className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-4xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-blue-700">Nội dung portfolio</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Hồ sơ cá nhân</h1><p className="mt-2 text-slate-600">Thông tin này hiển thị trên trang công khai của bạn.</p></div>{portfolio && <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">/{portfolio.slug}</span>}</div>
        <form onSubmit={save} className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5 sm:px-8"><h2 className="font-semibold">Thông tin cơ bản</h2><p className="mt-1 text-sm text-slate-500">Các trường có dấu * là bắt buộc.</p></div>
          <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
            <label className="field sm:col-span-2">Họ và tên *<input className="control" required minLength={1} maxLength={150} value={form.fullName} onChange={(e) => change('fullName', e.target.value)} placeholder="Ví dụ: Nguyễn Minh Anh" /></label>
            <label className="field sm:col-span-2">Chức danh trên Tổng quan<input className="control" maxLength={200} value={form.headline ?? ''} onChange={(e) => change('headline', e.target.value)} placeholder="Ví dụ: Frontend Developer · UI Engineer" /></label>
            <label className="field">Email liên hệ<input className="control" type="email" maxLength={255} value={form.contactEmail ?? ''} onChange={(e) => change('contactEmail', e.target.value)} placeholder="ban@example.com" /></label>
            <label className="field">Số điện thoại<input className="control" type="tel" maxLength={30} value={form.phone ?? ''} onChange={(e) => change('phone', e.target.value)} placeholder="+84 …" /></label>
            <label className="field sm:col-span-2">Địa điểm<input className="control" maxLength={255} value={form.location ?? ''} onChange={(e) => change('location', e.target.value)} placeholder="Thành phố, quốc gia" /></label>
            <label className="field sm:col-span-2">Lời giới thiệu trên Tổng quan<textarea className="control min-h-40 resize-y leading-6" maxLength={10000} value={form.bio ?? ''} onChange={(e) => change('bio', e.target.value)} placeholder="Giới thiệu ngắn về bạn, định hướng và điều bạn đang tìm kiếm…" /></label>
          </div>
          <div className="grid gap-5 border-t border-slate-100 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3 sm:px-8">
            <MediaPicker label="Ảnh đại diện" value={form.avatarMediaId} accept="images" onChange={(value) => change('avatarMediaId', typeof value === 'string' ? value : null)} />
            <MediaPicker label="CV (PDF)" value={form.cvMediaId} accept="pdf" onChange={(value) => change('cvMediaId', typeof value === 'string' ? value : null)} />
            <MediaPicker label="Ảnh bìa" value={form.coverMediaId} accept="images" onChange={(value) => change('coverMediaId', typeof value === 'string' ? value : null)} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:px-8">{error ? <p role="alert" className="text-sm text-red-700">{error}</p> : success ? <p role="status" className="text-sm text-emerald-700">{success}</p> : <p className="text-xs text-slate-500">Lưu trực tiếp vào hồ sơ portfolio.</p>}<button disabled={busy} className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button></div>
        </form>
        <p className="mt-4 text-xs leading-5 text-slate-500">Tải ảnh và quản lý tệp ngay trong thẻ Tệp & hình ảnh.</p>
      </div>
    </main>
  </div>;
}

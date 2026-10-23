'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiRequest } from '@/lib/api';
import { getSession, logout, Session } from '@/lib/auth';
import type { AdminDashboardSummary } from '@/types/admin-dashboard';
import type { ShareVisibility, ShareVisibilityKey } from './share-link-manager';

const sections = [
  { key: 'profile', title: 'Hồ sơ cá nhân', href: '#ho-so', available: true },
  { key: 'educations', title: 'Học vấn', href: '#hoc-van', available: true },
  { key: 'certificates', title: 'Chứng chỉ', href: '#chung-chi', available: true },
  { key: 'experiences', title: 'Kinh nghiệm', href: '#kinh-nghiem', available: true },
  { key: 'skills', title: 'Kỹ năng', href: '#ky-nang', available: true },
  { key: 'projects', title: 'Dự án', href: '#du-an', available: true },
  { key: 'interests', title: 'Sở thích', href: '#so-thich', available: true },
  { key: 'media', title: 'Thư viện tệp', href: '#tep-hinh-anh', available: true },
] as const;

export function AdminDashboard({ visibility, onVisibilityChange }: { visibility: ShareVisibility; onVisibilityChange: (key: ShareVisibilityKey, checked: boolean) => void }) {
  const router = useRouter();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [current, data] = await Promise.all([getSession(), apiRequest<AdminDashboardSummary>('/admin/dashboard')]);
        if (active) { setSession(current); setSummary(data); }
      } catch (cause) {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
        else setError(cause instanceof Error ? cause.message : 'Không thể tải tổng quan quản trị.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [router]);

  async function signOut() {
    setError('');
    try { await logout(); router.replace('/admin/login'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Đăng xuất thất bại.'); }
  }

  if (loading) return <main className="grid min-h-screen place-items-center text-sm text-slate-500" role="status">Đang tải tổng quan…</main>;

  return <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-[250px_1fr]">
    <aside className="border-b border-slate-200 bg-white px-5 py-5 md:min-h-screen md:border-b-0 md:border-r md:px-6 md:py-8">
      <a href="/" className="font-bold tracking-tight text-blue-800">Hồ sơ cá nhân <span className="font-normal text-slate-400">/ Quản trị</span></a>
      <nav className="mt-8 flex flex-wrap gap-2 md:flex-col" aria-label="Quản trị">
        <a aria-current="page" href="#tong-quan" className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">Tổng quan</a>
        {sections.map((item) => item.available
          ? <a key={item.key} href={item.href} className="rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-800">{item.title}</a>
          : <span key={item.key} className="flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm text-slate-400" aria-label={`${item.title}: trang quản lý chưa được triển khai`}>{item.title}<span className="text-[10px]">Chưa sẵn sàng</span></span>)}
      </nav>
      <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 md:absolute md:bottom-7 md:left-6 md:w-[202px]">
        <div className="min-w-0"><p className="truncate text-xs font-semibold">{session?.email}</p><p className="mt-1 text-xs text-slate-500">Chủ hồ sơ</p></div>
        <button onClick={() => void signOut()} className="text-xs font-semibold text-slate-500 hover:text-blue-700">Đăng xuất</button>
      </div>
    </aside>

    <main className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-semibold text-blue-700">Khu vực quản trị</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Tổng quan</h1><p className="mt-2 text-slate-600">Tổng quan nội dung hồ sơ của {summary?.portfolio.title ?? 'bạn'}.</p></div>
          {summary && <div className={`rounded-full px-3 py-1.5 text-xs font-semibold ${summary.portfolio.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{summary.portfolio.isPublished ? 'Hồ sơ đang công khai' : 'Hồ sơ chưa xuất bản'}</div>}
        </header>

        {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {summary ? <>
          <section aria-label="Trạng thái hệ thống" className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4"><span className="size-2.5 rounded-full bg-emerald-500"/><div><p className="text-sm font-semibold text-slate-900">Cơ sở dữ liệu đã kết nối</p><p className="text-xs text-slate-500">Đã đọc số liệu từ API quản trị</p></div></div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"><span className={`size-2.5 rounded-full ${summary.portfolio.isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`}/><div><p className="text-sm font-semibold text-slate-900">{summary.portfolio.isPublished ? 'Nội dung đã xuất bản' : 'Nội dung đang ở chế độ nháp'}</p><p className="text-xs text-slate-500">Phần ẩn không xuất hiện trên portfolio công khai</p></div></div>
          </section>

          <section aria-labelledby="overview-edit-title" className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/70 p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><h2 id="overview-edit-title" className="text-lg font-semibold text-slate-900">Chỉnh trang Tổng quan</h2><p className="mt-1 text-sm text-slate-600">Nội dung được lấy từ hồ sơ, kỹ năng và dự án của bạn. Chỉnh từng phần bên dưới; các mục quản trị hiện có vẫn giữ nguyên.</p></div>
              <a href="#chia-se" className="rounded-xl border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-100">Xem trước trang link</a>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <a href="#ho-so" className="rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300"><h3 className="font-semibold text-slate-900">Giới thiệu và ảnh</h3><p className="mt-1 text-sm text-slate-600">Sửa tên, chức danh, lời giới thiệu, ảnh đại diện và email liên hệ.</p><span className="mt-3 inline-block text-sm font-semibold text-blue-700">Chỉnh hồ sơ →</span></a>
              <a href="#ky-nang" className="rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300"><h3 className="font-semibold text-slate-900">Kỹ năng nổi bật</h3><p className="mt-1 text-sm text-slate-600">Sáu kỹ năng hiển thị đầu tiên theo thứ tự trong danh sách kỹ năng.</p><span className="mt-3 inline-block text-sm font-semibold text-blue-700">Sắp xếp kỹ năng →</span></a>
              <a href="#du-an" className="rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300"><h3 className="font-semibold text-slate-900">Dự án tiêu biểu</h3><p className="mt-1 text-sm text-slate-600">Đánh dấu dự án nổi bật; tối đa hai dự án sẽ lên Tổng quan.</p><span className="mt-3 inline-block text-sm font-semibold text-blue-700">Chọn dự án →</span></a>
            </div>
          </section>

          <section aria-label="Số lượng nội dung" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {sections.map((item) => {
              const count = summary.sections[item.key];
              const visible = 'visible' in count ? count.visible : null;
              const shareKey = item.key as ShareVisibilityKey;
              return <article key={item.key} className={`share-visibility-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm${visibility[shareKey] ? ' share-visibility-card-selected' : ''}`}>
                <div className="flex items-start justify-between gap-3"><h2 className="font-semibold text-slate-800">{item.title}</h2><div className="flex items-center gap-2">{visible !== null && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{visible}/{count.total} hiển thị</span>}{item.key !== 'media' && <button type="button" role="switch" aria-checked={visibility[shareKey]} aria-label={`${item.title}: ${visibility[shareKey] ? 'đang bật hiển thị' : 'đang tắt hiển thị'}`} title={visibility[shareKey] ? 'Tắt hiển thị trong trang cá nhân' : 'Bật hiển thị trong trang cá nhân'} className={`share-visibility-switch${visibility[shareKey] ? ' share-visibility-switch-on' : ''}`} onClick={() => onVisibilityChange(shareKey, !visibility[shareKey])}><span aria-hidden="true" /></button>}</div></div>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{count.total}</p>
                <p className="mt-1 text-xs text-slate-500">{item.key === 'media' ? 'tệp trong thư viện' : 'mục nội dung'}</p>
                {item.available && <a href={item.href} className="mt-4 inline-flex rounded-xl bg-[#090b09] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1b211d]">Mở quản lý <span aria-hidden="true" className="ml-1">→</span></a>}
              </article>;
            })}
          </section>
          {sections.every((item) => summary.sections[item.key].total === 0) && <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">Chưa có nội dung. Bắt đầu bằng cách cập nhật hồ sơ cá nhân.</p>}
        </> : !error && <p role="status" className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">Chưa có dữ liệu tổng quan để hiển thị.</p>}
      </div>
    </main>
  </div>;
}

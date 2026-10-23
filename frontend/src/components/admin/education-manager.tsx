'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiRequest } from '@/lib/api';
import type { EducationInput, EducationListResponse, EducationRecord } from '@/types/education';

const blank: EducationInput = {
  schoolName: '',
  degree: '',
  major: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
  sortOrder: 0,
  isVisible: true,
};

function toInput(item: EducationRecord): EducationInput {
  return {
    schoolName: item.schoolName,
    degree: item.degree ?? '',
    major: item.major ?? '',
    startDate: item.startDate?.slice(0, 10) ?? '',
    endDate: item.endDate?.slice(0, 10) ?? '',
    isCurrent: item.isCurrent,
    description: item.description ?? '',
    sortOrder: item.sortOrder,
    isVisible: item.isVisible,
  };
}

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

export function EducationManager() {
  const router = useRouter();
  const [items, setItems] = useState<EducationRecord[]>([]);
  const [form, setForm] = useState<EducationInput>(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await apiRequest<EducationListResponse>('/educations/admin');
        if (active) setItems(response.educations);
      } catch (cause) {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
        else setError(cause instanceof Error ? cause.message : 'Không tải được danh sách học vấn.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [router]);

  const change = <K extends keyof EducationInput>(key: K, value: EducationInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
    setSuccess('');
  };

  function cancel() {
    setForm(blank);
    setEditing(null);
    setFormOpen(false);
    setError('');
    setSuccess('');
  }

  function startEdit(item: EducationRecord) {
    setForm(toInput(item));
    setEditing(item.id);
    setFormOpen(true);
    setError('');
    setSuccess('');
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    const payload = {
      ...form,
      schoolName: form.schoolName.trim(),
      degree: form.degree.trim() || null,
      major: form.major.trim() || null,
      startDate: form.startDate || null,
      endDate: form.isCurrent ? null : form.endDate || null,
      description: form.description.trim() || null,
    };
    try {
      const saved = await apiRequest<EducationRecord>(
        editing ? `/educations/admin/${editing}` : '/educations/admin',
        { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload) },
      );
      setItems((prev) => {
        const next = editing
          ? prev.map((item) => (item.id === saved.id ? saved : item))
          : [...prev, saved];
        return next.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
      });
      cancel();
      setSuccess('Đã lưu thông tin học vấn.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
      else setError(cause instanceof Error ? cause.message : 'Không thể lưu học vấn.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: EducationRecord) {
    if (!window.confirm(`Xóa "${item.schoolName}"?`)) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/educations/admin/${item.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter(({ id }) => id !== item.id));
      if (editing === item.id) cancel();
      setSuccess('Đã xóa thông tin học vấn.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
      else setError(cause instanceof Error ? cause.message : 'Không thể xóa học vấn.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return (
    <p className="py-6 text-sm text-slate-500">Đang tải học vấn…</p>
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Học vấn</h2>
          <p className="mt-1 text-sm text-slate-400">Quản lý quá trình học tập hiển thị trên trang cá nhân.</p>
        </div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      {success && !error && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</p>}

      <button type="button" onClick={() => { setForm(blank); setEditing(null); setFormOpen(true); setError(''); setSuccess(''); }} className="mb-4 inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600"><span aria-hidden="true" className="text-lg leading-none">+</span> Thêm học vấn</button>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.85fr)]">
        {/* Danh sách */}
        <section>
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-600 bg-white/5 px-5 py-8 text-sm text-slate-400">
                Chưa có thông tin học vấn nào.
              </p>
            ) : (
              items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon học vấn */}
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-950/60 text-lg text-green-400">
                      🎓
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-100">{item.schoolName}</h3>
                      {(item.degree || item.major) && (
                        <p className="mt-0.5 text-sm text-green-400">
                          {[item.degree, item.major].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        {dateRange(item)}
                        {item.isCurrent && <span className="ml-2 rounded-full bg-green-900/50 px-2 py-0.5 text-green-400">Đang học</span>}
                        {' · '}
                        {item.isVisible ? 'Đang hiển thị' : 'Đang ẩn'}
                        {' · '}thứ tự {item.sortOrder}
                      </p>
                      {item.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-400">{item.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        aria-label="Sửa học vấn"
                        title="Sửa học vấn"
                        className="icon-action-button icon-edit-button font-semibold text-blue-400 hover:text-blue-300"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z"/><path d="m14.5 6.5 3 3"/></svg>
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void remove(item)}
                        aria-label="Xóa học vấn"
                        title="Xóa học vấn"
                        className="icon-action-button icon-delete-button font-semibold text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {/* Form thêm / sửa */}
        {formOpen && (<section className="self-start overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm">
          <div className="border-b border-white/10 px-6 py-5">
            <h3 className="font-semibold text-slate-100">{editing ? 'Sửa học vấn' : 'Thêm học vấn'}</h3>
            <p className="mt-1 text-sm text-slate-400">Tên trường là bắt buộc.</p>
          </div>

          <form onSubmit={(e) => void save(e)}>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <label className="field sm:col-span-2">
                Tên trường *
                <input
                  className="control"
                  required
                  maxLength={255}
                  value={form.schoolName}
                  onChange={(e) => change('schoolName', e.target.value)}
                  placeholder="Đại học Bách Khoa Hà Nội…"
                />
              </label>

              <label className="field">
                Bằng cấp
                <input
                  className="control"
                  maxLength={150}
                  value={form.degree}
                  onChange={(e) => change('degree', e.target.value)}
                  placeholder="Cử nhân, Thạc sĩ…"
                />
              </label>

              <label className="field">
                Chuyên ngành
                <input
                  className="control"
                  maxLength={200}
                  value={form.major}
                  onChange={(e) => change('major', e.target.value)}
                  placeholder="Công nghệ thông tin…"
                />
              </label>

              <label className="field">
                Ngày bắt đầu
                <input
                  className="control"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => change('startDate', e.target.value)}
                />
              </label>

              <label className="field">
                Ngày kết thúc
                <input
                  className="control"
                  type="date"
                  disabled={form.isCurrent}
                  value={form.isCurrent ? '' : form.endDate}
                  onChange={(e) => change('endDate', e.target.value)}
                />
              </label>

              <label className="field sm:col-span-2">
                Mô tả
                <textarea
                  className="control min-h-24 resize-y"
                  maxLength={10000}
                  value={form.description}
                  onChange={(e) => change('description', e.target.value)}
                  placeholder="Thành tích, hoạt động nổi bật…"
                />
              </label>

              <label className="field">
                Thứ tự hiển thị
                <input
                  className="control"
                  type="number"
                  min={0}
                  max={2147483647}
                  step={1}
                  value={form.sortOrder}
                  onChange={(e) => change('sortOrder', Number(e.target.value))}
                />
              </label>

              <div className="flex flex-col gap-3 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.isCurrent}
                    onChange={(e) => {
                      change('isCurrent', e.target.checked);
                      if (e.target.checked) change('endDate', '');
                    }}
                  />
                  Đang học tại đây
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.isVisible}
                    onChange={(e) => change('isVisible', e.target.checked)}
                  />
                  Hiển thị công khai
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/5 px-6 py-4">
              <p
                role={error ? 'alert' : 'status'}
                className={`text-sm ${error ? 'text-red-400' : success ? 'text-emerald-400' : 'text-slate-500'}`}
              >
                {error || success || 'Thay đổi được lưu vào hồ sơ.'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={cancel}
                  className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 disabled:opacity-50 hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  disabled={busy}
                  className="rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:cursor-wait disabled:opacity-60"
                >
                  {busy ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Thêm học vấn'}
                </button>
              </div>
            </div>
          </form>
        </section>)}
      </div>
    </div>
  );
}

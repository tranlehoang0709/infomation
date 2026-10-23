'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiRequest } from '@/lib/api';
import type { CertificateInput, CertificateListResponse, CertificateRecord } from '@/types/certificate';

const blank: CertificateInput = {
  name: '',
  issuer: '',
  credentialCode: '',
  issueDate: '',
  expiryDate: '',
  credentialUrl: '',
  description: '',
  sortOrder: 0,
  isVisible: true,
};

function toInput(item: CertificateRecord): CertificateInput {
  return {
    name: item.name,
    issuer: item.issuer ?? '',
    credentialCode: item.credentialCode ?? '',
    issueDate: item.issueDate?.slice(0, 10) ?? '',
    expiryDate: item.expiryDate?.slice(0, 10) ?? '',
    credentialUrl: item.credentialUrl ?? '',
    description: item.description ?? '',
    sortOrder: item.sortOrder,
    isVisible: item.isVisible,
  };
}

function dateLabel(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

function isExpired(expiryDate: string | null) {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

export function CertificateManager() {
  const router = useRouter();
  const [items, setItems] = useState<CertificateRecord[]>([]);
  const [form, setForm] = useState<CertificateInput>(blank);
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
        const response = await apiRequest<CertificateListResponse>('/certificates/admin');
        if (active) setItems(response.certificates);
      } catch (cause) {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
        else setError(cause instanceof Error ? cause.message : 'Không tải được danh sách chứng chỉ.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [router]);

  const change = <K extends keyof CertificateInput>(key: K, value: CertificateInput[K]) => {
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

  function startEdit(item: CertificateRecord) {
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
      name: form.name.trim(),
      issuer: form.issuer.trim() || null,
      credentialCode: form.credentialCode.trim() || null,
      issueDate: form.issueDate || null,
      expiryDate: form.expiryDate || null,
      credentialUrl: form.credentialUrl.trim() || null,
      description: form.description.trim() || null,
    };
    try {
      const saved = await apiRequest<CertificateRecord>(
        editing ? `/certificates/admin/${editing}` : '/certificates/admin',
        { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload) },
      );
      setItems((prev) => {
        const next = editing
          ? prev.map((item) => (item.id === saved.id ? saved : item))
          : [...prev, saved];
        return next.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
      });
      cancel();
      setSuccess('Đã lưu chứng chỉ.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
      else setError(cause instanceof Error ? cause.message : 'Không thể lưu chứng chỉ.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: CertificateRecord) {
    if (!window.confirm(`Xóa chứng chỉ "${item.name}"?`)) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/certificates/admin/${item.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter(({ id }) => id !== item.id));
      if (editing === item.id) cancel();
      setSuccess('Đã xóa chứng chỉ.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
      else setError(cause instanceof Error ? cause.message : 'Không thể xóa chứng chỉ.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="py-6 text-sm text-slate-500">Đang tải chứng chỉ…</p>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-semibold tracking-tight">Chứng chỉ</h2>
        <p className="mt-1 text-sm text-slate-400">Quản lý chứng chỉ và bằng cấp hiển thị trên trang cá nhân.</p>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      {success && !error && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</p>}

      <button type="button" onClick={() => { setForm(blank); setEditing(null); setFormOpen(true); setError(''); setSuccess(''); }} className="mb-4 inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600"><span aria-hidden="true" className="text-lg leading-none">+</span> Thêm chứng chỉ</button>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.85fr)]">
        {/* Danh sách chứng chỉ */}
        <section>
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-600 bg-white/5 px-5 py-8 text-sm text-slate-400">
                Chưa có chứng chỉ nào. Nhấn &ldquo;Thêm chứng chỉ&rdquo; để bắt đầu.
              </p>
            ) : (
              items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon chứng chỉ */}
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-yellow-950/60 text-lg text-yellow-400">
                      🏆
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-100">{item.name}</h3>
                        {item.expiryDate && isExpired(item.expiryDate) && (
                          <span className="rounded-full bg-red-900/40 px-2 py-0.5 text-xs font-semibold text-red-400">Hết hạn</span>
                        )}
                        {!item.isVisible && (
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-500">Đang ẩn</span>
                        )}
                      </div>
                      {item.issuer && (
                        <p className="mt-0.5 text-sm text-yellow-400">{item.issuer}</p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                        {item.credentialCode && <span>Mã: {item.credentialCode}</span>}
                        {item.issueDate && <span>Cấp: {dateLabel(item.issueDate)}</span>}
                        {item.expiryDate && <span>Hết hạn: {dateLabel(item.expiryDate)}</span>}
                        <span>Thứ tự: {item.sortOrder}</span>
                      </div>
                      {item.credentialUrl && (
                        <a
                          href={item.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs text-blue-400 hover:underline"
                        >
                          Xem chứng chỉ ↗
                        </a>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        aria-label="Sửa chứng chỉ"
                        title="Sửa chứng chỉ"
                        className="icon-action-button icon-edit-button font-semibold text-blue-400 hover:text-blue-300"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z"/><path d="m14.5 6.5 3 3"/></svg>
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void remove(item)}
                        aria-label="Xóa chứng chỉ"
                        title="Xóa chứng chỉ"
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
            <h3 className="font-semibold text-slate-100">{editing ? 'Sửa chứng chỉ' : 'Thêm chứng chỉ'}</h3>
            <p className="mt-1 text-sm text-slate-400">Tên chứng chỉ là bắt buộc.</p>
          </div>

          <form onSubmit={(e) => void save(e)}>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <label className="field sm:col-span-2">
                Tên chứng chỉ *
                <input
                  className="control"
                  required
                  maxLength={255}
                  value={form.name}
                  onChange={(e) => change('name', e.target.value)}
                  placeholder="AWS Certified Solutions Architect…"
                />
              </label>

              <label className="field">
                Tổ chức cấp
                <input
                  className="control"
                  maxLength={255}
                  value={form.issuer}
                  onChange={(e) => change('issuer', e.target.value)}
                  placeholder="Amazon Web Services…"
                />
              </label>

              <label className="field">
                Mã chứng chỉ
                <input
                  className="control"
                  maxLength={150}
                  value={form.credentialCode}
                  onChange={(e) => change('credentialCode', e.target.value)}
                  placeholder="ABC-12345…"
                />
              </label>

              <label className="field">
                Ngày cấp
                <input
                  className="control"
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => change('issueDate', e.target.value)}
                />
              </label>

              <label className="field">
                Ngày hết hạn
                <input
                  className="control"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => change('expiryDate', e.target.value)}
                />
              </label>

              <label className="field sm:col-span-2">
                Link xác minh
                <input
                  className="control"
                  type="url"
                  maxLength={2048}
                  value={form.credentialUrl}
                  onChange={(e) => change('credentialUrl', e.target.value)}
                  placeholder="https://www.credly.com/badges/…"
                />
              </label>

              <label className="field sm:col-span-2">
                Mô tả
                <textarea
                  className="control min-h-20 resize-y"
                  maxLength={10000}
                  value={form.description}
                  onChange={(e) => change('description', e.target.value)}
                  placeholder="Nội dung chứng chỉ, kỹ năng đạt được…"
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

              <div className="flex items-end pb-1">
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
                  className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  disabled={busy}
                  className="rounded-xl bg-yellow-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-yellow-500 disabled:cursor-wait disabled:opacity-60"
                >
                  {busy ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Thêm chứng chỉ'}
                </button>
              </div>
            </div>
          </form>
        </section>)}
      </div>
    </div>
  );
}

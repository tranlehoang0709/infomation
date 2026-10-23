'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiRequest } from '@/lib/api';
import type { SkillInput, SkillListResponse, SkillRecord } from '@/types/skill';

const blank: SkillInput = { name: '', category: '', proficiency: null, description: '', sortOrder: 0, isVisible: true };

function toInput(skill: SkillRecord): SkillInput {
  return { name: skill.name, category: skill.category ?? '', proficiency: skill.proficiency, description: skill.description ?? '', sortOrder: skill.sortOrder, isVisible: skill.isVisible };
}

export function SkillManager() {
  const router = useRouter();
  const [items, setItems] = useState<SkillRecord[]>([]);
  const [form, setForm] = useState<SkillInput>(blank);
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
        const response = await apiRequest<SkillListResponse>('/skills/admin');
        if (active) setItems(response.skills);
      } catch (cause) {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
        else setError(cause instanceof Error ? cause.message : 'Không tải được danh sách kỹ năng.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [router]);

  function change<K extends keyof SkillInput>(key: K, value: SkillInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(''); setSuccess('');
  }

  function add() { setForm(blank); setEditing(null); setFormOpen(true); setError(''); setSuccess(''); }
  function edit(skill: SkillRecord) { setForm(toInput(skill)); setEditing(skill.id); setFormOpen(true); setError(''); setSuccess(''); }
  function cancel() { setForm(blank); setEditing(null); setFormOpen(false); setError(''); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try {
      const saved = await apiRequest<SkillRecord>(editing ? `/skills/admin/${editing}` : '/skills/admin', {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify({ ...form, name: form.name.trim(), category: form.category.trim() || null, description: form.description.trim() || null }),
      });
      setItems((current) => (editing ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved])
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
      setForm(blank); setEditing(null); setFormOpen(false); setSuccess('Đã lưu kỹ năng.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
      else setError(cause instanceof Error ? cause.message : 'Không thể lưu kỹ năng.');
    } finally { setBusy(false); }
  }

  async function remove(skill: SkillRecord) {
    if (!window.confirm(`Xóa kỹ năng “${skill.name}”?`)) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      await apiRequest(`/skills/admin/${skill.id}`, { method: 'DELETE' });
      setItems((current) => current.filter((item) => item.id !== skill.id));
      if (editing === skill.id) cancel();
      setSuccess('Đã xóa kỹ năng.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) router.replace('/admin/login');
      else setError(cause instanceof Error ? cause.message : 'Không thể xóa kỹ năng.');
    } finally { setBusy(false); }
  }

  if (loading) return <p className="py-6 text-sm text-slate-500" role="status">Đang tải kỹ năng…</p>;

  return <div>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="text-3xl font-semibold tracking-tight">Kỹ năng</h2><p className="mt-1 text-sm text-slate-400">Quản lý kỹ năng và mức độ thành thạo hiển thị trên trang cá nhân.</p></div>
      <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600"><span aria-hidden="true" className="text-lg leading-none">＋</span> Thêm kỹ năng</button>
    </div>
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}
    {success && !error && <p role="status" className="mb-4 rounded-xl bg-emerald-100 px-4 py-3 text-sm text-emerald-700">{success}</p>}
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.85fr)]">
      <section aria-label="Danh sách kỹ năng" className="space-y-3">
        {items.length === 0 ? <p className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-5 py-8 text-sm text-slate-400">Chưa có kỹ năng. Bấm “＋ Thêm kỹ năng” để bắt đầu.</p> : items.map((skill) => <article key={skill.id} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-100">{skill.name}</h3>{skill.category && <span className="rounded-full bg-green-950/60 px-2.5 py-1 text-xs text-green-300">{skill.category}</span>}</div>
            {skill.proficiency !== null && <div className="mt-3"><div className="mb-1 flex justify-between text-xs text-slate-400"><span>Mức độ thành thạo</span><span>{skill.proficiency}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-green-500" style={{ width: `${skill.proficiency}%` }} /></div></div>}
            {skill.description && <p className="mt-2 text-sm text-slate-400">{skill.description}</p>}
            <p className="mt-2 text-xs text-slate-500">{skill.isVisible ? 'Đang hiển thị' : 'Đang ẩn'} · thứ tự {skill.sortOrder}</p>
          </div>
          <div className="flex shrink-0 gap-3 text-sm"><button type="button" onClick={() => edit(skill)} aria-label="Sửa kỹ năng" title="Sửa kỹ năng" className="icon-action-button icon-edit-button font-semibold text-blue-400"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z"/><path d="m14.5 6.5 3 3"/></svg></button><button type="button" disabled={busy} onClick={() => void remove(skill)} aria-label="Xóa kỹ năng" title="Xóa kỹ năng" className="icon-action-button icon-delete-button font-semibold text-red-400 disabled:opacity-50"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button></div>
        </article>)}
      </section>
      {formOpen && <section className="self-start overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm" aria-labelledby="skill-form-title">
        <div className="border-b border-white/10 px-6 py-5"><h3 id="skill-form-title" className="font-semibold text-slate-100">{editing ? 'Sửa kỹ năng' : 'Thêm kỹ năng'}</h3><p className="mt-1 text-sm text-slate-400">Tên kỹ năng là bắt buộc. Mức độ thành thạo từ 0 đến 100%.</p></div>
        <form onSubmit={(event) => void save(event)}>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <label className="field sm:col-span-2">Tên kỹ năng *<input className="control" required maxLength={100} value={form.name} onChange={(event) => change('name', event.target.value)} placeholder="TypeScript" /></label>
            <label className="field">Nhóm kỹ năng<input className="control" maxLength={100} value={form.category} onChange={(event) => change('category', event.target.value)} placeholder="Ngôn ngữ, Công cụ…" /></label>
            <label className="field">Mức độ thành thạo (%)<input className="control" type="number" min={0} max={100} step={1} value={form.proficiency ?? ''} onChange={(event) => change('proficiency', event.target.value === '' ? null : Number(event.target.value))} /></label>
            <label className="field sm:col-span-2">Mô tả< textarea className="control min-h-24 resize-y" maxLength={500} value={form.description} onChange={(event) => change('description', event.target.value)} /></label>
            <label className="field">Thứ tự hiển thị<input className="control" type="number" min={0} max={2147483647} step={1} value={form.sortOrder} onChange={(event) => change('sortOrder', Number(event.target.value))} /></label>
            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.isVisible} onChange={(event) => change('isVisible', event.target.checked)} /> Hiển thị công khai</label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/5 px-6 py-4"><p role={error ? 'alert' : 'status'} className={`text-sm ${error ? 'text-red-400' : 'text-slate-400'}`}>{error || 'Thay đổi được lưu vào portfolio.'}</p><div className="flex gap-2"><button type="button" disabled={busy} onClick={cancel} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-slate-300 disabled:opacity-50">Hủy</button><button disabled={busy} className="rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Thêm kỹ năng'}</button></div></div>
        </form>
      </section>}
    </div>
  </div>;
}

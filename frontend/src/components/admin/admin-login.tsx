'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { login } from '@/lib/auth';

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    try { await login(email, password); router.replace('/admin/dashboard'); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Không thể đăng nhập lúc này.'); }
    finally { setBusy(false); }
  }

  return <main className="flex min-h-screen items-center justify-center px-5 py-12">
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_80px_-48px_rgba(15,36,64,.3)] sm:p-10">
      <a href="/" className="text-sm font-semibold text-blue-700">← Trang cá nhân</a>
      <div className="mt-8"><p className="text-sm font-semibold uppercase tracking-[.16em] text-blue-700">Khu vực riêng tư</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Đăng nhập quản trị</h1><p className="mt-3 text-sm leading-6 text-slate-600">Chỉ tài khoản chủ portfolio được cấp sẵn mới có thể đăng nhập.</p></div>
      <form onSubmit={submit} className="mt-8 grid gap-5">
        <label className="field">Email<input className="control" type="email" autoComplete="username" maxLength={255} required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="field">Mật khẩu<input className="control" type="password" autoComplete="current-password" maxLength={200} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="mt-1 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">{busy ? 'Đang xác thực…' : 'Đăng nhập'}</button>
      </form>
    </section>
  </main>;
}

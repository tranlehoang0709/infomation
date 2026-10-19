'use client';

import { AdminDashboard } from './admin-dashboard';
import { ExperienceManager } from './experience-manager';
import { InterestManager } from './interest-manager';
import { MediaLibrary } from './media-library';
import { ProfileEditor } from './profile-editor';
import { ProjectManager } from '@/components/projects/project-manager';

export function AdminWorkspace() {
  return <div className="admin-workspace min-h-screen px-4 pb-12 pt-5 sm:px-6 lg:px-10">
    <header className="mx-auto max-w-[1600px]">
      <a href="/" className="text-sm font-semibold tracking-wide text-green-400">HỒ SƠ CÁ NHÂN <span className="font-normal text-slate-400">/ QUẢN TRỊ</span></a>
      <nav className="sticky top-0 z-20 mt-4 flex gap-2 overflow-x-auto border-y border-slate-200 bg-[#080b09]/90 py-3 backdrop-blur-md" aria-label="Điều hướng trong trang quản trị">
        <a href="#tong-quan" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-green-950/60 hover:text-green-300">Tổng quan</a>
        <a href="#ho-so" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-green-950/60 hover:text-green-300">Hồ sơ</a>
        <a href="#hoc-van" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-green-950/60 hover:text-green-300">Học vấn</a>
        <a href="#chung-chi" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-green-950/60 hover:text-green-300">Chứng chỉ</a>
        <a href="#kinh-nghiem" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-green-950/60 hover:text-green-300">Kinh nghiệm</a>
        <a href="#ky-nang" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-green-950/60 hover:text-green-300">Kỹ năng</a>
        <a href="#du-an" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-green-950/60 hover:text-green-300">Dự án</a>
        <a href="#so-thich" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-green-950/60 hover:text-green-300">Sở thích</a>
        <a href="#tep-hinh-anh" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-green-950/60 hover:text-green-300">Tệp & hình ảnh</a>
      </nav>
    </header>

    <div className="mx-auto mt-6 max-w-[1600px] space-y-0">
      <section id="tong-quan" className="scroll-mt-20 rounded-3xl border border-white/10 bg-[#111713]/70 p-3 sm:p-5">
        <AdminDashboard />
      </section>
      <section id="ho-so" className="scroll-mt-20 rounded-3xl border border-white/10 bg-[#111713]/70 p-3 sm:p-5">
        <ProfileEditor />
      </section>
      <section id="hoc-van" className="scroll-mt-20 rounded-3xl border border-white/10 bg-[#111713]/70 p-3 sm:p-5">
        <h2 className="text-3xl font-semibold tracking-tight">Học vấn</h2>
        <p className="mt-3">Chức năng quản lý học vấn chưa được triển khai.</p>
      </section>
      <section id="chung-chi" className="scroll-mt-20 rounded-3xl border border-white/10 bg-[#111713]/70 p-3 sm:p-5">
        <h2 className="text-3xl font-semibold tracking-tight">Chứng chỉ</h2>
        <p className="mt-3">Chức năng quản lý chứng chỉ chưa được triển khai.</p>
      </section>
      <section id="kinh-nghiem" className="scroll-mt-20 rounded-3xl border border-white/10 bg-[#111713]/70 p-3 sm:p-5">
        <ExperienceManager />
      </section>
      <section id="ky-nang" className="scroll-mt-20 rounded-3xl border border-white/10 bg-[#111713]/70 p-3 sm:p-5">
        <h2 className="text-3xl font-semibold tracking-tight">Kỹ năng</h2>
        <p className="mt-3">Chức năng quản lý kỹ năng chưa được triển khai.</p>
      </section>
      <section id="du-an" className="scroll-mt-20 rounded-3xl border border-white/10 bg-[#111713]/70 p-3 sm:p-5">
        <ProjectManager />
      </section>
      <section id="so-thich" className="scroll-mt-20 rounded-3xl border border-white/10 bg-[#111713]/70 p-3 sm:p-5">
        <InterestManager />
      </section>
      <section id="tep-hinh-anh" className="scroll-mt-20 rounded-3xl border border-white/10 bg-[#111713]/70 p-3 sm:p-5">
        <MediaLibrary />
      </section>
    </div>
  </div>;
}

import { ApiError, apiRequest } from '@/lib/api';
import type { SkillListResponse } from '@/types/skill';

export async function PublicSkills() {
  let skills: SkillListResponse['skills'];
  try { ({ skills } = await apiRequest<SkillListResponse>('/skills/public')); }
  catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    return <section aria-labelledby="skills-heading" className="mt-24 pt-12"><h2 id="skills-heading" className="text-2xl font-semibold">Kỹ năng</h2><p role="status" className="mt-4 text-sm text-slate-500">Chưa thể tải kỹ năng. Vui lòng thử lại sau.</p></section>;
  }
  if (!skills.length) return null;
  const groups = new Map<string, typeof skills>();
  for (const skill of skills) {
    const key = skill.category?.trim() || 'Khác';
    groups.set(key, [...(groups.get(key) ?? []), skill]);
  }
  return <section aria-labelledby="skills-heading" className="mt-24 pt-12">
    <p className="text-sm font-semibold text-blue-700">Chuyên môn</p><h2 id="skills-heading" className="mt-2 text-3xl font-semibold tracking-tight">Kỹ năng</h2>
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {[...groups].map(([category, items]) => <section key={category} aria-label={category} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">{category}</h3><ul className="mt-4 space-y-4">
          {items.map((skill) => <li key={skill.id}><div className="flex items-center justify-between gap-3"><span className="font-medium text-slate-800"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Kỹ năng: </span>{skill.name}</span>{skill.proficiency !== null && <span className="text-xs text-slate-500"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mức độ: </span>{skill.proficiency}%</span>}</div>
            {skill.proficiency !== null && <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${skill.proficiency}%` }} /></div>}
            {skill.description && <p className="mt-2 text-sm text-slate-600"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mô tả: </span>{skill.description}</p>}
          </li>)}
        </ul>
      </section>)}
    </div>
  </section>;
}

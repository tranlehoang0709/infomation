export function SiteFooter({ name }: { name?: string }) {
  return <footer className="mt-28 pt-5 text-sm text-slate-500">© {new Date().getFullYear()} {name ?? 'Portfolio cá nhân'}</footer>;
}

export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

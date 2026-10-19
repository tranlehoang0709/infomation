'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { apiAssetUrl, apiRequest } from '@/lib/api';

interface MediaOption { id: string; originalName: string; mimeType: string; fileSize: string; adminFilePath: string }
interface MediaListResponse { media: MediaOption[] }
interface MediaPickerProps {
  label: string;
  value: string | null | string[];
  onChange: (value: string | null | string[]) => void;
  accept?: 'images' | 'pdf' | 'images-and-pdf';
  multiple?: boolean;
}

export function MediaPicker({ label, value, onChange, accept = 'images', multiple = false }: MediaPickerProps) {
  const [items, setItems] = useState<MediaOption[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    let active = true;
    apiRequest<MediaListResponse>('/media/admin')
      .then((response) => { if (active) setItems(response.media); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Không thể tải danh sách tệp.'); });
    return () => { active = false; };
  }, []);

  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const valid = items.filter((item) => accept === 'pdf'
    ? item.mimeType === 'application/pdf'
    : item.mimeType.startsWith('image/') || (accept === 'images-and-pdf' && item.mimeType === 'application/pdf'));
  const firstSelected = valid.find((item) => item.id === selected[0]);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    const allowed = accept === 'pdf'
      ? ['application/pdf']
      : accept === 'images-and-pdf'
        ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
        : ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError(accept === 'pdf' ? 'Vui lòng chọn tệp PDF.' : 'Chọn ảnh JPEG, PNG, GIF hoặc WebP.');
      setSuccess('');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Tệp không được lớn hơn 10 MB.');
      setSuccess('');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    const body = new FormData();
    body.append('file', file);
    try {
      const uploaded = await apiRequest<MediaOption>('/media/admin/upload', { method: 'POST', body });
      setItems((current) => [uploaded, ...current.filter((item) => item.id !== uploaded.id)]);
      onChange(multiple ? [...new Set([...selected, uploaded.id])] : uploaded.id);
      setSuccess(`Đã tải lên và chọn “${uploaded.originalName}”.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể tải tệp lên.');
    } finally {
      setUploading(false);
    }
  }

  return <div className="field">
    {label}
    <select className="control" multiple={multiple} value={multiple ? selected : selected[0] ?? ''} onChange={(event) => {
      const values = multiple ? Array.from(event.currentTarget.selectedOptions, (option) => option.value).filter(Boolean) : event.currentTarget.value || null;
      onChange(values);
    }}>
      {!multiple && <option value="">Chưa chọn tệp</option>}
      {valid.map((item) => <option key={item.id} value={item.id}>{item.originalName} ({item.mimeType}, ID {item.id})</option>)}
    </select>
    {multiple && <p className="text-xs font-normal text-slate-500">Giữ Ctrl hoặc Command để chọn nhiều tệp.</p>}
    {firstSelected?.mimeType.startsWith('image/') && <img crossOrigin="use-credentials" src={apiAssetUrl(firstSelected.adminFilePath)} alt={`Xem trước: ${label}`} className="mt-2 max-h-32 max-w-48 rounded-xl border border-slate-200 object-contain" />}
    {firstSelected?.mimeType === 'application/pdf' && <p className="text-xs text-slate-500">Đã chọn tệp PDF: {firstSelected.originalName}</p>}
    <label className="mt-1 inline-flex w-fit cursor-pointer items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:border-green-400">
      {uploading ? 'Đang tải lên…' : 'Tải tệp lên ngay tại đây'}
      <input className="sr-only" type="file" accept={accept === 'pdf' ? 'application/pdf' : accept === 'images-and-pdf' ? 'image/jpeg,image/png,image/gif,image/webp,application/pdf' : 'image/jpeg,image/png,image/gif,image/webp'} disabled={uploading} onChange={(event) => void upload(event)} />
    </label>
    {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
    {success && <p role="status" className="text-xs text-green-400">{success}</p>}
  </div>;
}

import { useState } from 'react';

const serverOptions = [
  { value: 'EUROPE', label: 'Европа' },
  { value: 'NA', label: 'Сев. Америка' },
  { value: 'ASIA', label: 'Азия' },
  { value: 'ME', label: 'Ближний Восток' },
  { value: 'SA', label: 'Юж. Америка' },
];

export type FormData = {
  title: string; description: string; map: string; mapImage: string;
  mode: string; server: string; startTime: string; entryFee: number;
  prizePool: number; maxParticipants: number; winnerCount: number;
  prize1: number; prize2: number; prize3: number;
};

interface Props {
  form: FormData;
  setForm: (f: FormData) => void;
  editingId: string | null;
  saving: boolean;
  formError: string;
  onSave: () => void;
  onClose: () => void;
}

export default function FormModal({ form, setForm, editingId, saving, formError, onSave, onClose }: Props) {
  const upd = (key: keyof FormData, val: string | number) => setForm({ ...form, [key]: val });
  const [imagePreview, setImagePreview] = useState<string>(form.mapImage || '');
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { alert('Максимум 5 МБ'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setForm({ ...form, mapImage: base64 });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-4">{editingId ? 'Редактировать турнир' : 'Новый Classic турнир'}</h2>
        {formError && <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 whitespace-pre-wrap">{formError}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Название</label>
            <input value={form.title} onChange={e => upd('title', e.target.value)} placeholder="Необязательно"
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-600/50" />
          </div>
          <div className="md:col-span-2">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Описание</label>
            <textarea value={form.description} onChange={e => upd('description', e.target.value)} rows={2} placeholder="Необязательно"
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none focus:border-emerald-600/50" />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Карта *</label>
            <input value={form.map} onChange={e => upd('map', e.target.value)} placeholder="Erangel, Miramar..."
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-600/50" />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Картинка карты</label>
            <div className="mt-1 flex items-center gap-3">
              {imagePreview && (
                <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-zinc-600 shrink-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <label className="cursor-pointer px-3 py-2 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 rounded-lg text-xs text-white transition-colors">
                📷 {imagePreview ? 'Заменить' : 'Загрузить'}
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Режим *</label>
            <select value={form.mode} onChange={e => upd('mode', e.target.value)}
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
              <option value="SOLO">Соло</option><option value="DUO">Дуо</option><option value="SQUAD">Сквад</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Сервер *</label>
            <select value={form.server} onChange={e => upd('server', e.target.value)}
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
              {serverOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Время старта *</label>
            <input type="datetime-local" value={form.startTime} onChange={e => upd('startTime', e.target.value)}
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-600/50" />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Макс. участников</label>
            <input type="number" value={form.maxParticipants} onChange={e => upd('maxParticipants', Number(e.target.value))}
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-600/50" />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Взнос (UC)</label>
            <input type="number" value={form.entryFee} onChange={e => upd('entryFee', Number(e.target.value))}
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-600/50" />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Призовой фонд (UC)</label>
            <input type="number" value={form.prizePool} onChange={e => upd('prizePool', Number(e.target.value))}
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-600/50" />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Кол-во победителей</label>
            <select value={form.winnerCount} onChange={e => upd('winnerCount', Number(e.target.value))}
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
              <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Приз 1 место (UC)</label>
            <input type="number" value={form.prize1} onChange={e => upd('prize1', Number(e.target.value))}
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-600/50" />
          </div>
          {Number(form.winnerCount) >= 2 && <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Приз 2 место (UC)</label>
            <input type="number" value={form.prize2} onChange={e => upd('prize2', Number(e.target.value))}
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-600/50" />
          </div>}
          {Number(form.winnerCount) >= 3 && <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Приз 3 место (UC)</label>
            <input type="number" value={form.prize3} onChange={e => upd('prize3', Number(e.target.value))}
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-600/50" />
          </div>}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white">Отмена</button>
          <button onClick={onSave} disabled={saving}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
            {saving ? 'Сохранение...' : editingId ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
}

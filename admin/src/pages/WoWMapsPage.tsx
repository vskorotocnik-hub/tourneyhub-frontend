import { useState, useEffect } from 'react';
import { wowMapApi, type WoWMapAdmin } from '../lib/api';

export default function WoWMapsPage() {
  const [maps, setMaps] = useState<WoWMapAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMap, setEditingMap] = useState<WoWMapAdmin | null>(null);
  const [form, setForm] = useState({ mapId: '', name: '', image: '', format: '', teamCount: 2, playersPerTeam: 1, rounds: 10, rules: '', isActive: true, prizeDistribution: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { const r = await wowMapApi.list(); setMaps(r.maps); } catch { setError('Ошибка загрузки'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ mapId: '', name: '', image: '', format: '', teamCount: 2, playersPerTeam: 1, rounds: 10, rules: '', isActive: true, prizeDistribution: '' }); setEditingMap(null); setShowForm(false); };

  const openEdit = (m: WoWMapAdmin) => {
    setEditingMap(m);
    setForm({ mapId: m.mapId, name: m.name, image: m.image, format: m.format, teamCount: m.teamCount, playersPerTeam: m.playersPerTeam, rounds: m.rounds, rules: m.rules || '', isActive: m.isActive, prizeDistribution: m.prizeDistribution || '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const data: any = { ...form };
      if (!data.rules) data.rules = null;
      if (!data.prizeDistribution) data.prizeDistribution = null;
      if (editingMap) await wowMapApi.update(editingMap.id, data);
      else await wowMapApi.create(data);
      resetForm(); await load();
    } catch (e: any) { setError(e?.message || 'Ошибка'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (m: WoWMapAdmin) => {
    if (!confirm(`Удалить "${m.name}"?`)) return;
    try { await wowMapApi.remove(m.id); await load(); } catch (e: any) { setError(e?.message || 'Ошибка'); }
  };

  const inp = "w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🗺️ WoW Карты</h1>
          <p className="text-zinc-400 text-sm mt-1">Управление картами War of Wonders</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium">+ Добавить</button>
      </div>

      {error && <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

      {showForm && (
        <div className="bg-zinc-800/80 rounded-xl border border-zinc-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">{editingMap ? 'Редактировать' : 'Новая карта'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-zinc-400 block mb-1">Map ID</label><input value={form.mapId} onChange={e => setForm({...form, mapId: e.target.value})} className={inp} /></div>
            <div><label className="text-xs text-zinc-400 block mb-1">Название</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inp} /></div>
            <div className="col-span-2"><label className="text-xs text-zinc-400 block mb-1">URL изображения</label><input value={form.image} onChange={e => setForm({...form, image: e.target.value})} className={inp} /></div>
            <div><label className="text-xs text-zinc-400 block mb-1">Формат</label><input value={form.format} onChange={e => setForm({...form, format: e.target.value})} className={inp} /></div>
            <div><label className="text-xs text-zinc-400 block mb-1">Команд</label><input type="number" value={form.teamCount} onChange={e => setForm({...form, teamCount: +e.target.value})} className={inp} /></div>
            <div><label className="text-xs text-zinc-400 block mb-1">Игроков/команда</label><input type="number" value={form.playersPerTeam} onChange={e => setForm({...form, playersPerTeam: +e.target.value})} className={inp} /></div>
            <div><label className="text-xs text-zinc-400 block mb-1">Раундов</label><input type="number" value={form.rounds} onChange={e => setForm({...form, rounds: +e.target.value})} className={inp} /></div>
            <div className="col-span-2"><label className="text-xs text-zinc-400 block mb-1">Правила</label><input value={form.rules} onChange={e => setForm({...form, rules: e.target.value})} className={inp} /></div>
            <div><label className="text-xs text-zinc-400 block mb-1">Призы JSON</label><input value={form.prizeDistribution} onChange={e => setForm({...form, prizeDistribution: e.target.value})} placeholder="[50,30,20,0]" className={inp} /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} /><label className="text-sm text-zinc-300">Активна</label></div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? '...' : editingMap ? 'Сохранить' : 'Создать'}</button>
            <button onClick={resetForm} className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-sm">Отмена</button>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-zinc-500">Загрузка...</div> : maps.length === 0 ? <div className="text-center py-12 text-zinc-500">Карт нет</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {maps.map(m => (
            <div key={m.id} className={`bg-zinc-800/80 rounded-xl border overflow-hidden ${m.isActive ? 'border-zinc-700' : 'border-red-500/30 opacity-60'}`}>
              <div className="relative h-32">
                <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white/80 font-mono">ID: {m.mapId}</div>
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.isActive ? 'bg-emerald-500/80 text-white' : 'bg-red-500/80 text-white'}`}>{m.isActive ? 'Активна' : 'Выкл'}</span>
                </div>
                <div className="absolute bottom-2 left-2 text-white font-semibold text-sm">{m.name}</div>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex gap-2 text-xs">
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">{m.format}</span>
                  <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">{m.teamCount} команд</span>
                  <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded">{m.playersPerTeam} игр.</span>
                  <span className="bg-white/10 text-white/60 px-2 py-0.5 rounded">{m.rounds}R</span>
                </div>
                {m.rules && <p className="text-xs text-zinc-400 truncate">{m.rules}</p>}
                <p className="text-xs text-zinc-500">Турниров: {m._count?.tournaments || 0}</p>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => openEdit(m)} className="flex-1 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-xs">✏️ Изменить</button>
                  <button onClick={() => handleDelete(m)} className="flex-1 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs">🗑 Удалить</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

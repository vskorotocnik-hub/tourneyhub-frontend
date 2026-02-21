import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classicApi, type ClassicTournamentListItem } from '../lib/api';

interface Props {
  tournament: ClassicTournamentListItem;
  onClose: () => void;
  onSuccess: () => void;
}

const ClassicRegistrationModal = ({ tournament, onClose, onSuccess }: Props) => {
  const navigate = useNavigate();
  const reqIds = tournament.mode === 'SOLO' ? 1 : tournament.mode === 'DUO' ? 2 : 4;
  const [ids, setIds] = useState<string[]>(Array(reqIds).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    for (let i = 0; i < reqIds; i++) {
      if (!/^\d{10}$/.test(ids[i] || '')) {
        setError(`ID ${i === 0 ? 'игрока' : `тиммейта ${i}`} должен быть ровно 10 цифр`);
        return;
      }
    }
    setLoading(true); setError('');
    try {
      const r = await classicApi.register(tournament.id, ids.slice(0, reqIds));
      onClose(); onSuccess();
      navigate(`/messages/classic-${r.registrationId}`);
    } catch (e: any) { setError(e?.message || 'Ошибка регистрации'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !loading && onClose()} />
      <div className="relative w-full max-w-lg bg-dark-100 rounded-2xl border border-white/20 p-4 pb-6 animate-slide-up" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4" />
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white">📝 Регистрация на турнир</h3>
          <p className="text-xs text-white/50">{tournament.title || tournament.map} • {tournament.mode === 'SOLO' ? 'Solo' : tournament.mode === 'DUO' ? 'Duo' : 'Squad'}</p>
          <p className="text-xs text-white/40 mt-1">Взнос: <span className="text-yellow-400 font-semibold">{tournament.entryFee} UC</span> • Приз: <span className="text-accent-green font-semibold">{tournament.prizePool} UC</span></p>
        </div>
        {error && <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">{error}</div>}
        <div className="space-y-3 mb-4">
          <p className="text-xs text-white/60">🆔 PUBG Mobile ID (ровно 10 цифр)</p>
          {ids.map((id, i) => (
            <div key={i}>
              <input type="text" inputMode="numeric" maxLength={10} value={id}
                onChange={(e) => { const n = [...ids]; n[i] = e.target.value.replace(/\D/g, '').slice(0, 10); setIds(n); }}
                placeholder={i === 0 ? 'Твой PUBG ID (10 цифр)' : `ID тиммейта ${i} (10 цифр)`}
                className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50 ${id.length > 0 && id.length !== 10 ? 'border-red-500/50' : 'border-white/10'}`} />
              {id.length > 0 && id.length !== 10 && <p className="text-[10px] text-red-400 mt-0.5">{id.length}/10 цифр</p>}
            </div>
          ))}
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
          <p className="text-xs text-yellow-400/90 leading-relaxed">⚠️ Мы хотели бы напомнить вам о важности соблюдать правила кастом-матча. Если вы оказались на чужом месте и ваше место занято, вам необходимо выйти из лобби. Вас пригласят обратно, когда ваше место освободится.</p>
        </div>
        <div className="space-y-2">
          <button disabled={loading} onClick={handleSubmit} className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? '⏳ Регистрация...' : `✅ Подтвердить (${tournament.entryFee} UC)`}
          </button>
          <button onClick={onClose} disabled={loading} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-medium hover:bg-white/10 transition-colors disabled:opacity-50">Отмена</button>
        </div>
      </div>
    </div>
  );
};

export default ClassicRegistrationModal;

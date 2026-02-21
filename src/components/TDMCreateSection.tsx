import type { TeamMode, ServerRegion } from '../types';

const validateId = (id: string) => /^\d{10}$/.test(id);

const betValues = [60,120,180,240,300,360,420,480,540,600,720,840,960,1080,1200,1500,1800,2100,2400,2700,3000];

const servers: { id: ServerRegion; label: string }[] = [
  { id: 'europe', label: '🇪🇺 Европа' },
  { id: 'na', label: '🇺🇸 С. Америка' },
  { id: 'asia', label: '🇯🇵 Азия' },
  { id: 'me', label: '��🇦 Бл. Восток' },
  { id: 'sa', label: '🇧🇷 Ю. Америка' },
];

interface Prize {
  place: number;
  amount: string;
  pct: number;
}

interface Props {
  bet: number;
  setBet: (b: number) => void;
  teamMode: TeamMode;
  setTeamMode: (m: TeamMode) => void;
  teamCount: number;
  setTeamCount: (c: number) => void;
  server: ServerRegion;
  setServer: (s: ServerRegion) => void;
  playerId: string;
  setPlayerId: (v: string) => void;
  partnerId: string;
  setPartnerId: (v: string) => void;
  idError: string;
  setIdError: (e: string) => void;
  createError: string;
  totalPool: number;
  platformFee: number;
  prizes: Prize[];
  onShowRules: () => void;
  onStartSearch: () => void;
}

const TDMCreateSection = ({
  bet, setBet, teamMode, setTeamMode, teamCount, setTeamCount,
  server, setServer, playerId, setPlayerId, partnerId, setPartnerId,
  idError, setIdError, createError, totalPool, platformFee, prizes,
  onShowRules, onStartSearch,
}: Props) => {
  const currentIndex = betValues.indexOf(bet) >= 0 ? betValues.indexOf(bet) : 0;
  const teamMultiplier = teamCount === 2 ? 1 : teamCount === 3 ? 1.5 : 2;
  const winRating = Math.round((10 + bet * 0.5) * teamMultiplier);
  const loseRating = Math.round((5 + bet * 0.3) * teamMultiplier);

  const prizeBlock = (
    <div className="bg-red-600/20 rounded-xl p-3 mb-4 border border-red-500/30">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-white/60">💰 Выплаты по местам</p>
        <span className="text-xs text-white/40">Пул {totalPool} UC • Комиссия {platformFee.toFixed(0)} UC (10%)</span>
      </div>
      <div className={`grid gap-1 ${teamCount === 2 ? 'grid-cols-2' : teamCount === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {prizes.map((p) => (
          <div key={p.place} className={`text-center py-1.5 rounded-lg ${p.place === 1 ? 'bg-yellow-500/20' : 'bg-white/5'}`}>
            <p className={`text-sm font-bold ${p.place === 1 ? 'text-yellow-400' : p.place === teamCount ? 'text-red-400' : 'text-white/70'}`}>
              {p.amount} UC
            </p>
            <p className="text-[9px] text-white/40">
              {p.place === 1 ? '🥇' : p.place === 2 ? '🥈' : p.place === 3 ? '🥉' : '4️⃣'} {p.pct}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const ratingBlock = (
    <div className="flex justify-center gap-6 mb-4 text-xs">
      <span className="text-white/60">Победа: <span className="text-accent-green font-semibold">+{winRating} 🏆</span></span>
      <span className="text-white/60">Поражение: <span className="text-red-400 font-semibold">-{loseRating} 🏆</span></span>
    </div>
  );

  const betSlider = (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-white/60">💰 Ставка (UC)</p>
        <span className="text-xl font-bold text-accent-green">{bet} UC</span>
      </div>
      <input
        type="range"
        min={0}
        max={betValues.length - 1}
        value={currentIndex}
        onChange={(e) => setBet(betValues[Number(e.target.value)])}
        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer
                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 
                 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full 
                 [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:shadow-lg
                 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/30"
      />
      <div className="flex justify-between text-xs text-white/40 mt-1">
        <span>60 UC</span>
        <span>3000 UC</span>
      </div>
    </div>
  );

  const teamModeSelector = (
    <div className="mb-4">
      <p className="text-xs text-white/60 mb-2">👥 Режим команды</p>
      <div className="flex gap-2 mb-3">
        {(['solo', 'duo'] as TeamMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setTeamMode(mode)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border
                      ${teamMode === mode 
                        ? 'bg-red-600/30 border-red-500 text-white' 
                        : 'bg-white/5 border-white/10 text-white/50'}`}
          >
            {mode === 'solo' ? '👤 Solo' : '👥 Duo'}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {[2, 3, 4].map((count) => (
          <button
            key={count}
            onClick={() => setTeamCount(count)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border
                      ${teamCount === count 
                        ? 'bg-red-600/30 border-red-500 text-white' 
                        : 'bg-white/5 border-white/10 text-white/50'}`}
          >
            {count} команды
          </button>
        ))}
      </div>
      <p className="text-xs text-white/30 mt-2 text-center">
        Всего игроков: {teamMode === 'solo' ? teamCount : teamCount * 2}
      </p>
    </div>
  );

  const serverSelector = (
    <div className="mb-4">
      <p className="text-xs text-white/60 mb-2">🌐 Сервер</p>
      <div className="grid grid-cols-3 gap-2">
        {servers.slice(0, 3).map((s) => (
          <button
            key={s.id}
            onClick={() => setServer(s.id)}
            className={`py-2 rounded-lg text-xs font-medium transition-all border
                      ${server === s.id 
                        ? 'bg-red-600/30 border-red-500 text-white' 
                        : 'bg-white/5 border-white/10 text-white/50'}`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );

  const playerIds = (
    <div className="mb-4">
      <p className="text-xs text-white/60 mb-2">🆔 ID в игре</p>
      <div className="mb-2">
        <input
          type="text"
          inputMode="numeric"
          value={playerId}
          onChange={(e) => { setPlayerId(e.target.value.replace(/\D/g, '')); setIdError(''); }}
          placeholder="Твой ID (10 цифр)"
          maxLength={10}
          className={`w-full bg-white/5 border rounded-lg px-3 py-2.5
                   text-sm text-white placeholder-white/30 outline-none focus:border-red-500/50 ${idError && !validateId(playerId) ? 'border-red-500' : 'border-white/10'}`}
        />
        <p className="text-xs text-white/40 mt-1">{playerId.length}/10 цифр</p>
      </div>
      {teamMode === 'duo' && (
        <div>
          <input
            type="text"
            inputMode="numeric"
            value={partnerId}
            onChange={(e) => { setPartnerId(e.target.value.replace(/\D/g, '')); setIdError(''); }}
            placeholder="ID напарника (10 цифр)"
            maxLength={10}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5
                     text-sm text-white placeholder-white/30 outline-none focus:border-red-500/50"
          />
          <p className="text-xs text-white/40 mt-1">{partnerId.length}/10 цифр</p>
        </div>
      )}
      {idError && <p className="text-red-400 text-xs mt-2">{idError}</p>}
    </div>
  );

  const warningBlock = (
    <div className="bg-white/5 rounded-lg p-3 mb-4">
      <p className="text-xs text-white/70 mb-1">📍 <strong>Карта:</strong> Warehouse (TDM)</p>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-xs text-red-400/80">⚠️ Использование читов или мошенничества — блокировка, ставка сгорает.</p>
        <button onClick={onShowRules} className="text-xs text-purple-400 underline hover:text-purple-300">Подробнее</button>
      </div>
    </div>
  );

  const errorBlock = createError ? (
    <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 mb-3">
      <p className="text-red-400 text-sm">{createError}</p>
    </div>
  ) : null;

  const createButton = (
    <button
      onClick={onStartSearch}
      className="w-full py-3.5 rounded-xl bg-red-600 text-white font-bold hover:opacity-90 transition-opacity"
    >
      🚀 Найти соперника
    </button>
  );

  return (
    <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4 mb-4">
      {prizeBlock}
      {ratingBlock}
      {betSlider}
      {teamModeSelector}
      {serverSelector}
      {playerIds}
      {warningBlock}
      {errorBlock}
      {createButton}
    </div>
  );
};

export default TDMCreateSection;

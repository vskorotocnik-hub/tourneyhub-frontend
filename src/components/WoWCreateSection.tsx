import type { WoWMapItem } from '../lib/api';
import type { ServerRegion } from '../types';

const validateId = (id: string) => /^\d{10}$/.test(id);

const servers: { id: ServerRegion; label: string }[] = [
  { id: 'europe', label: '🇪🇺 Европа' },
  { id: 'na', label: '🇺🇸 С. Америка' },
  { id: 'asia', label: '🇯🇵 Азия' },
  { id: 'me', label: '🇸🇦 Бл. Восток' },
  { id: 'sa', label: '🇧🇷 Ю. Америка' },
];

interface Props {
  wowMaps: WoWMapItem[];
  selectedMap: WoWMapItem | null;
  setSelectedMap: (m: WoWMapItem) => void;
  bet: number;
  setBet: (b: number) => void;
  server: ServerRegion;
  setServer: (s: ServerRegion) => void;
  playerId: string;
  setPlayerId: (v: string) => void;
  partnerId: string;
  setPartnerId: (v: string) => void;
  wowExtraIds: string[];
  setWowExtraIds: (ids: string[]) => void;
  idError: string;
  setIdError: (e: string) => void;
  createError: string;
  onShowRules: () => void;
  onCreate: () => void;
}

const WoWCreateSection = ({
  wowMaps, selectedMap, setSelectedMap, bet, setBet, server, setServer,
  playerId, setPlayerId, partnerId, setPartnerId, wowExtraIds, setWowExtraIds,
  idError, setIdError, createError, onShowRules, onCreate,
}: Props) => {
  const betValues = [60,120,180,240,300,360,420,480,540,600,720,840,960,1080,1200,1500,1800,2100,2400,2700,3000];
  const currentIndex = betValues.indexOf(bet) >= 0 ? betValues.indexOf(bet) : 0;

  const wowPool = bet * (selectedMap?.teamCount || 2);
  const wowFee = wowPool * 0.1;
  const wowNet = wowPool - wowFee;
  const wowPrizes = selectedMap?.teamCount === 2 
    ? [{ place: 1, pct: 100, amount: wowNet.toFixed(0) }, { place: 2, pct: 0, amount: '0' }]
    : selectedMap?.teamCount === 3
    ? [{ place: 1, pct: 70, amount: (wowNet * 0.7).toFixed(0) }, { place: 2, pct: 30, amount: (wowNet * 0.3).toFixed(0) }, { place: 3, pct: 0, amount: '0' }]
    : [{ place: 1, pct: 50, amount: (wowNet * 0.5).toFixed(0) }, { place: 2, pct: 30, amount: (wowNet * 0.3).toFixed(0) }, { place: 3, pct: 20, amount: (wowNet * 0.2).toFixed(0) }, { place: 4, pct: 0, amount: '0' }];

  const wowMultiplier = selectedMap?.teamCount === 2 ? 1 : selectedMap?.teamCount === 3 ? 1.5 : 2;
  const winRating = Math.round((10 + bet * 0.5) * wowMultiplier);
  const loseRating = Math.round((5 + bet * 0.3) * wowMultiplier);

  const mapSelector = (imgH: string, cardW: string) => (
    <div>
      <p className="text-xs text-white/60 mb-2">🗺️ Выбери карту</p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {wowMaps.map((map) => (
          <div
            key={map.id}
            onClick={() => setSelectedMap(map)}
            className={`flex-shrink-0 ${cardW} cursor-pointer rounded-xl overflow-hidden border-2 transition-all
                      ${selectedMap?.id === map.id 
                        ? 'border-red-500 ring-2 ring-red-500/30' 
                        : 'border-white/10'}`}
          >
            <div className={`relative ${imgH}`}>
              <img src={map.image} alt={map.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute top-1 right-1 bg-black/50 backdrop-blur-sm px-1 py-0.5 rounded text-[8px] text-white/70 font-mono">
                ID: {map.mapId}
              </div>
              <div className="absolute bottom-1 left-1 bg-blue-600/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-white font-semibold">
                {map.format}
              </div>
            </div>
            <div className="bg-dark-200/90 p-2">
              <p className="text-[11px] text-white font-medium truncate">{map.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const mapInfo = (
    <div className="bg-zinc-800/90 backdrop-blur-sm rounded-xl border border-zinc-600 p-3">
      <p className="text-sm text-white font-medium mb-2">📋 Параметры карты</p>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-700/80 rounded-lg p-2 text-center border border-zinc-600">
          <p className="text-xs text-zinc-300">Формат</p>
          <p className="text-xs font-bold text-purple-300">{selectedMap?.format}</p>
        </div>
        <div className="bg-zinc-700/80 rounded-lg p-2 text-center border border-zinc-600">
          <p className="text-xs text-zinc-300">Команд</p>
          <p className="text-xs font-bold text-cyan-300">{selectedMap?.teamCount}</p>
        </div>
        <div className="bg-zinc-700/80 rounded-lg p-2 text-center border border-zinc-600">
          <p className="text-xs text-zinc-300">Раундов</p>
          <p className="text-xs font-bold text-yellow-300">{selectedMap?.rounds}</p>
        </div>
      </div>
      {selectedMap?.rules && (
        <p className="text-xs text-zinc-300 mt-2 text-center bg-zinc-700/50 rounded-lg py-1.5 px-2">{selectedMap?.rules}</p>
      )}
    </div>
  );

  const prizeBlock = (
    <div className="bg-red-600/20 rounded-xl p-3 mb-4 border border-red-500/30">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-white/60">💰 Выплаты по местам</p>
        <span className="text-xs text-white/40">Пул {wowPool} UC • Комиссия {wowFee.toFixed(0)} UC (10%)</span>
      </div>
      <div className={`grid gap-1 ${wowPrizes.length === 2 ? 'grid-cols-2' : wowPrizes.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {wowPrizes.map((p) => (
          <div key={p.place} className={`text-center py-1.5 rounded-lg ${p.place === 1 ? 'bg-yellow-500/20' : 'bg-white/5'}`}>
            <p className={`text-sm font-bold ${p.place === 1 ? 'text-yellow-400' : p.place === selectedMap?.teamCount ? 'text-red-400' : 'text-white/70'}`}>
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

  const serverSelector = (
    <div className="mb-4">
      <p className="text-xs text-white/60 mb-2">🌍 Сервер</p>
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
      <p className="text-xs text-white font-medium mb-2">🆔 ID игроков ({selectedMap?.playersPerTeam} чел.)</p>
      <div className="space-y-2">
        <div>
          <input
            type="text"
            value={playerId}
            onChange={(e) => { setPlayerId(e.target.value.replace(/\D/g, '')); setIdError(''); }}
            placeholder="Твой ID (10 цифр)"
            maxLength={10}
            className={`w-full bg-zinc-700/80 border rounded-lg px-3 py-2.5
                     text-sm text-white placeholder-zinc-400 outline-none focus:border-red-500/50 ${idError && !validateId(playerId) ? 'border-red-500' : 'border-zinc-600'}`}
          />
          <p className="text-xs text-zinc-400 mt-1">{playerId.length}/10 цифр</p>
        </div>
        {(selectedMap?.playersPerTeam ?? 0) >= 2 && (
          <div>
            <input
              type="text"
              value={partnerId}
              onChange={(e) => { setPartnerId(e.target.value.replace(/\D/g, '')); setIdError(''); }}
              placeholder="ID друга #2 (10 цифр)"
              maxLength={10}
              className="w-full bg-zinc-700/80 border border-zinc-600 rounded-lg px-3 py-2.5
                       text-sm text-white placeholder-zinc-400 outline-none focus:border-red-500/50"
            />
            <p className="text-xs text-zinc-400 mt-1">{partnerId.length}/10 цифр</p>
          </div>
        )}
        {(selectedMap?.playersPerTeam || 0) >= 3 && (
          <input
            type="text"
            value={wowExtraIds[0] || ''}
            onChange={(e) => { const n = [...wowExtraIds]; n[0] = e.target.value.replace(/\D/g, ''); setWowExtraIds(n); setIdError(''); }}
            placeholder="ID друга #3 (10 цифр)"
            maxLength={10}
            className="w-full bg-zinc-700/80 border border-zinc-600 rounded-lg px-3 py-2.5
                     text-sm text-white placeholder-zinc-400 outline-none focus:border-red-500/50"
          />
        )}
        {(selectedMap?.playersPerTeam || 0) >= 4 && (
          <input
            type="text"
            value={wowExtraIds[1] || ''}
            onChange={(e) => { const n = [...wowExtraIds]; n[1] = e.target.value.replace(/\D/g, ''); setWowExtraIds(n); setIdError(''); }}
            placeholder="ID друга #4 (10 цифр)"
            maxLength={10}
            className="w-full bg-zinc-700/80 border border-zinc-600 rounded-lg px-3 py-2.5
                     text-sm text-white placeholder-zinc-400 outline-none focus:border-red-500/50"
          />
        )}
      </div>
      {idError && <p className="text-red-400 text-xs mt-2">{idError}</p>}
    </div>
  );

  const warningBlock = (
    <div className="bg-white/5 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-xs text-red-400/80">⚠️ Использование читов или мошенничества — блокировка, ставка сгорает.</p>
        <button onClick={onShowRules} className="text-xs text-purple-400 underline hover:text-purple-300">Правила</button>
      </div>
    </div>
  );

  const createButton = (
    <button
      onClick={onCreate}
      disabled={!playerId.trim()}
      className="w-full py-3.5 rounded-xl bg-red-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
    >
      🔍 Найти соперника
    </button>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block space-y-4">
        {mapSelector('h-[100px] sm:h-[110px] md:h-[120px]', 'w-48 sm:w-52 md:w-56 max-w-[240px]')}
        {mapInfo}
        <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4">
          {prizeBlock}
          {ratingBlock}
          {betSlider}
          {serverSelector}
          {playerIds}
          {warningBlock}
          {createError && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 mb-3">
              <p className="text-red-400 text-sm">{createError}</p>
            </div>
          )}
          {createButton}
        </div>
      </div>
      {/* Mobile */}
      <div className="md:hidden space-y-4">
        {mapSelector('h-24', 'w-44')}
        {mapInfo}
        <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4">
          {betSlider}
          {serverSelector}
          {playerIds}
          {warningBlock}
          {createError && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 mb-3">
              <p className="text-red-400 text-sm">{createError}</p>
            </div>
          )}
          {createButton}
        </div>
      </div>
    </>
  );
};

export default WoWCreateSection;

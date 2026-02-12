import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Level {
  id: number;
  title: string;
  videoUrl: string;
  mapId: string;
  thumbnail: string;
}

// Generate 30 levels for classic mode
const classicLevels: Level[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  title: `Уровень ${i + 1}: ${['Основы стрельбы', 'Позиционирование', 'Тактика в команде', 'Управление ресурсами', 'Финальные круги', 'Продвинутые техники', 'Снайперская стрельба', 'Ближний бой', 'Работа с гранатами', 'Вождение техники'][i % 10]}`,
  videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  mapId: `MAP${String(i + 1).padStart(3, '0')}`,
  thumbnail: [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400',
    'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0d?w=400',
    'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400',
  ][i % 5],
}));

// Generate 30 levels for TDM mode
const tdmLevels: Level[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  title: `TDM ${i + 1}: ${['Быстрый старт', 'Контроль точек', 'Агрессивная игра', 'Оборона', 'Командная работа', 'Мастерство', 'Флэнг атаки', 'Прикрытие', 'Респавн контроль', 'Финальный раунд'][i % 10]}`,
  videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  mapId: `TDM${String(i + 1).padStart(3, '0')}`,
  thumbnail: [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400',
    'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0d?w=400',
    'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400',
  ][i % 5],
}));

const TrainingPage = () => {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  
  // States
  const [mode, setMode] = useState<'classic' | 'tdm'>('classic');
  const [selectedLevel, setSelectedLevel] = useState(1);
  
  // Separate payment state for each mode
  const [isPaidClassic, setIsPaidClassic] = useState(false);
  const [isPaidTdm, setIsPaidTdm] = useState(false);
  
  // Separate progress for each mode
  const [completedClassic, setCompletedClassic] = useState<number[]>([]);
  const [completedTdm, setCompletedTdm] = useState<number[]>([]);
  const [unlockedClassic, setUnlockedClassic] = useState(1);
  const [unlockedTdm, setUnlockedTdm] = useState(1);
  
  // Derived state based on current mode
  const isPaid = mode === 'classic' ? isPaidClassic : isPaidTdm;
  const completedLevels = mode === 'classic' ? completedClassic : completedTdm;
  const currentUnlockedLevel = mode === 'classic' ? unlockedClassic : unlockedTdm;
  
  // Modal states
  const [showInfo, setShowInfo] = useState(false);
  const [showConfirmLevel, setShowConfirmLevel] = useState(false);
  const [mapIdInput, setMapIdInput] = useState('');
  const [mapIdError, setMapIdError] = useState('');

  // Toggle for rewards section
  const [showRewards, setShowRewards] = useState(false);

  const levels = mode === 'classic' ? classicLevels : tdmLevels;
  const currentLevel = levels.find(l => l.id === selectedLevel) || levels[0];

  // Toast for locked level
  const [showLockedToast, setShowLockedToast] = useState(false);

  const handleLevelSelect = useCallback((level: Level) => {
    const maxUnlocked = isPaid ? currentUnlockedLevel : 1;
    if (level.id <= maxUnlocked) {
      setSelectedLevel(level.id);
    } else {
      setShowLockedToast(true);
      setTimeout(() => setShowLockedToast(false), 2000);
    }
  }, [isPaid, currentUnlockedLevel]);

  const handleConfirmLevel = useCallback(() => {
    const level = levels.find(l => l.id === selectedLevel);
    if (!level) return;

    if (mapIdInput.toUpperCase() === level.mapId) {
      if (mode === 'classic') {
        setCompletedClassic(prev => [...prev, selectedLevel]);
        if (selectedLevel === unlockedClassic && unlockedClassic < levels.length) {
          setUnlockedClassic(prev => prev + 1);
        }
      } else {
        setCompletedTdm(prev => [...prev, selectedLevel]);
        if (selectedLevel === unlockedTdm && unlockedTdm < levels.length) {
          setUnlockedTdm(prev => prev + 1);
        }
      }
      setShowConfirmLevel(false);
      setMapIdInput('');
      setMapIdError('');
    } else {
      setMapIdError('Неверный ID карты. Попробуйте ещё раз.');
    }
  }, [mapIdInput, selectedLevel, levels, mode, unlockedClassic, unlockedTdm]);

  const handlePayment = useCallback(() => {
    if (mode === 'classic') {
      setIsPaidClassic(true);
    } else {
      setIsPaidTdm(true);
    }
  }, [mode]);

  const isLevelLocked = (levelId: number) => {
    const maxUnlocked = isPaid ? currentUnlockedLevel : 1;
    return levelId > maxUnlocked;
  };

  const isLevelCompleted = (levelId: number) => completedLevels.includes(levelId);

  const gameName = gameId === 'pubg-mobile' ? 'PUBG Mobile' : 'Game';

  // Level card renderer (reusable) - uniform square cards
  const renderLevelCard = (level: Level) => {
    const locked = isLevelLocked(level.id);
    const completed = isLevelCompleted(level.id);
    const isCurrent = isPaid && level.id === currentUnlockedLevel && !completed;
    const isSelected = level.id === selectedLevel;

    return (
      <button
        key={level.id}
        onClick={() => handleLevelSelect(level)}
        className={`relative aspect-square bg-zinc-800/80 rounded-xl border-2 overflow-hidden transition-all
          ${isSelected ? 'border-purple-500 ring-2 ring-purple-500/40' : 'md:border-zinc-500 border-zinc-600'}
          ${locked ? 'cursor-pointer' : 'hover:border-purple-400/60'}
          ${isCurrent ? 'ring-2 ring-emerald-400/60 border-emerald-400' : ''}
        `}
      >
        <img src={level.thumbnail} alt={level.title} className={`w-full h-full object-cover ${locked ? 'opacity-40' : ''}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        )}

        {completed && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Level number badge */}
        <div className="absolute bottom-1.5 left-1.5 w-6 h-6 bg-black/70 rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-xs">{level.id}</span>
        </div>

        {/* Title tooltip on hover - bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/90 to-transparent">
          <p className="text-[9px] text-white/90 font-medium truncate pl-7">{level.title.split(': ')[1] || level.title}</p>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen pb-36 md:pb-24 relative">
      {/* Character Image — desktop/tablet only */}
      <div className="hidden character:block fixed right-0 bottom-0 z-10 pointer-events-none">
        <img
          src="/обучения1212.png"
          alt=""
          className="h-[92vh] w-auto object-contain translate-y-[0px]"
        />
      </div>

      <main className="max-w-[1800px] mx-auto px-4 md:px-8 py-4 character:pr-[580px]">
        {/* Header */}
        <div className="flex items-center relative mb-4 py-1">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">{gameName}</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-white">Обучение</h1>
        </div>

        {/* Desktop: 2 columns layout */}
        <div className="lg:flex lg:gap-6">
          {/* Left Column - Video Player */}
          <div className="lg:w-[55%] lg:flex-shrink-0">
            <div className="relative w-full overflow-hidden rounded-2xl border-2 md:border-zinc-500 border-zinc-600 mb-3 bg-zinc-900">
              <div className="aspect-video">
                <iframe
                  src={currentLevel.videoUrl}
                  title={currentLevel.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="py-2 px-3 border-t border-zinc-600 bg-zinc-800">
                <p className="text-xs text-zinc-400">Уровень {selectedLevel}</p>
                <h3 className="text-sm font-semibold text-white">{currentLevel.title}</h3>
              </div>
            </div>

          </div>

          {/* Right Column - Controls & Levels (desktop) */}
          <div className="lg:flex-1">
            {/* Payment / Confirm — desktop/tablet only */}
            <div className="hidden md:block mb-3">
              {!isPaid ? (
                <div className="flex gap-2">
                  <button
                    onClick={handlePayment}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all border-2 border-emerald-500"
                  >
                    Оплатить — $10
                  </button>
                  <button
                    onClick={() => setShowInfo(true)}
                    className="px-4 py-3 rounded-xl bg-zinc-800 border-2 border-zinc-500 text-white font-medium hover:bg-zinc-700 transition-all"
                  >
                    Инфо
                  </button>
                </div>
              ) : selectedLevel === currentUnlockedLevel && !isLevelCompleted(selectedLevel) ? (
                <button
                  onClick={() => setShowConfirmLevel(true)}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all border-2 border-emerald-500"
                >
                  Подтвердить прохождение уровня
                </button>
              ) : (
                <div className="py-2 px-3 bg-zinc-800/50 border-2 border-zinc-600 rounded-xl text-center">
                  <p className="text-zinc-300 text-sm">Уровень {selectedLevel} — {isLevelCompleted(selectedLevel) ? 'пройден ✅' : 'выбран'}</p>
                </div>
              )}
            </div>

            {/* Mode Switcher + Support */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => { setMode('classic'); setSelectedLevel(1); }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                  mode === 'classic'
                    ? 'bg-purple-600/20 text-white border-purple-500'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 md:border-zinc-500 border-zinc-600'
                }`}
              >
                Классическое
              </button>
              <button
                onClick={() => { setMode('tdm'); setSelectedLevel(1); }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                  mode === 'tdm'
                    ? 'bg-purple-600/20 text-white border-purple-500'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 md:border-zinc-500 border-zinc-600'
                }`}
              >
                TDM
              </button>
              <button
                onClick={() => navigate('/messages')}
                className="flex items-center gap-1.5 py-2.5 px-3 bg-zinc-800 border-2 md:border-zinc-500 border-zinc-600 rounded-xl text-zinc-200 hover:bg-zinc-700 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm font-medium hidden sm:inline">Поддержка</span>
              </button>
            </div>

            {/* Rewards — collapsible toggle */}
            <div className="mb-3 border-2 md:border-zinc-500 border-zinc-600 bg-zinc-800 overflow-hidden rounded-xl">
              <button
                type="button"
                onClick={() => setShowRewards(prev => !prev)}
                className="w-full flex items-center justify-between py-2.5 px-3 hover:bg-zinc-700/50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎁</span>
                  <span className="font-semibold text-white text-sm">Выигрыш за все уровни</span>
                </div>
                <svg
                  className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${showRewards ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showRewards && (
                <div className="px-3 pb-3 pt-1 border-t border-zinc-700">
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span className="text-white text-sm">Бесплатная заявка в клан</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span className="text-white text-sm">Бот для лобби — 2 недели</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span className="text-white text-sm">+2 недели если бот уже оплачен</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-400">📈</span>
                      <span className="text-white text-sm">+5% рейтинга за турниры</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white">Прогресс обучения</h3>
            <span className="text-sm text-zinc-400">{completedLevels.length} / {levels.length}</span>
          </div>
          <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-600">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${(completedLevels.length / levels.length) * 100}%` }}
            />
          </div>
          {completedLevels.length === levels.length && (
            <p className="text-emerald-400 text-xs mt-1.5 font-medium">🎉 Поздравляем! Все уровни пройдены!</p>
          )}
        </div>

        {/* All Levels Grid - unified for all screen sizes */}
        <div>
          <h3 className="text-sm font-bold text-white mb-3">Уровни обучения</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {levels.map(level => renderLevelCard(level))}
          </div>
        </div>
      </main>

      {/* ===== MOBILE: Sticky payment bar (above BottomNav ~56px) ===== */}
      <div className="fixed bottom-14 left-0 right-0 z-40 md:hidden">
        <div className="bg-zinc-900/98 backdrop-blur-lg border-t-2 border-zinc-600 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          {!isPaid ? (
            <div className="flex gap-2">
              <button
                onClick={handlePayment}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-sm shadow-lg"
              >
                Оплатить — $10
              </button>
              <button
                onClick={() => setShowInfo(true)}
                className="px-4 py-3 rounded-xl bg-zinc-800 border-2 border-zinc-500 text-white font-medium hover:bg-zinc-700 transition-all text-sm"
              >
                Инфо
              </button>
            </div>
          ) : selectedLevel === currentUnlockedLevel && !isLevelCompleted(selectedLevel) ? (
            <button
              onClick={() => setShowConfirmLevel(true)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-sm shadow-lg"
            >
              Подтвердить прохождение
            </button>
          ) : (
            <div className="flex items-center justify-center py-2">
              <p className="text-zinc-300 text-sm font-medium">Уровень {selectedLevel} — {isLevelCompleted(selectedLevel) ? 'пройден ✅' : 'выбран'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Locked Level Toast */}
      {showLockedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-zinc-800 border border-zinc-500 rounded-xl shadow-lg">
          <p className="text-white text-sm font-medium">Сначала пройди предыдущий уровень</p>
        </div>
      )}

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowInfo(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl border-2 border-zinc-500 p-5">
            <button 
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              {mode === 'classic' ? 'Классическое обучение' : 'TDM обучение'}
            </h3>
            
            {mode === 'classic' ? (
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-zinc-800 border border-zinc-600 rounded-xl">
                  <p className="text-zinc-400 text-xs">Режим</p>
                  <p className="text-white font-medium">Классический Battle Royale</p>
                </div>
                <div className="p-3 bg-zinc-800 border border-zinc-600 rounded-xl">
                  <p className="text-zinc-400 text-xs">Количество уровней</p>
                  <p className="text-white font-medium">30 уровней прогрессивной сложности</p>
                </div>
                <div className="p-3 bg-zinc-800 border border-zinc-600 rounded-xl">
                  <p className="text-zinc-400 text-xs">Что изучаешь</p>
                  <p className="text-white font-medium">Позиционирование, лут, ротации, финальные круги, командная тактика</p>
                </div>
                <div className="p-3 bg-zinc-800 border border-zinc-600 rounded-xl">
                  <p className="text-zinc-400 text-xs">Результат</p>
                  <p className="text-white font-medium">Уверенная игра в рейтинге и турнирах</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-zinc-800 border border-zinc-600 rounded-xl">
                  <p className="text-zinc-400 text-xs">Режим</p>
                  <p className="text-white font-medium">Team Deathmatch (TDM)</p>
                </div>
                <div className="p-3 bg-zinc-800 border border-zinc-600 rounded-xl">
                  <p className="text-zinc-400 text-xs">Количество уровней</p>
                  <p className="text-white font-medium">30 уровней боевой подготовки</p>
                </div>
                <div className="p-3 bg-zinc-800 border border-zinc-600 rounded-xl">
                  <p className="text-zinc-400 text-xs">Что изучаешь</p>
                  <p className="text-white font-medium">Стрельба, контроль отдачи, быстрые перестрелки, работа в команде</p>
                </div>
                <div className="p-3 bg-zinc-800 border border-zinc-600 rounded-xl">
                  <p className="text-zinc-400 text-xs">Результат</p>
                  <p className="text-white font-medium">Улучшение aim и реакции для всех режимов</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInfo(false)}
              className="w-full mt-4 py-3 rounded-xl bg-white text-zinc-900 font-bold hover:bg-zinc-100 transition-all"
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      {/* Confirm Level Modal */}
      {showConfirmLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowConfirmLevel(false)} />
          <div className="relative w-full max-w-sm bg-zinc-900 rounded-2xl border-2 border-zinc-500 p-5">
            <h3 className="text-lg font-bold text-white mb-2">Подтверждение уровня</h3>
            <p className="text-sm text-zinc-400 mb-4">Введите ID карты, которую вы прошли</p>

            <input
              type="text"
              value={mapIdInput}
              onChange={(e) => {
                setMapIdInput(e.target.value.toUpperCase());
                setMapIdError('');
              }}
              placeholder="Например: MAP001"
              className={`w-full px-4 py-3 rounded-xl bg-zinc-800 border-2 text-white placeholder-zinc-500
                        focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all
                        ${mapIdError ? 'border-red-500' : 'border-zinc-500'}`}
            />
            {mapIdError && (
              <p className="text-red-400 text-xs mt-2">{mapIdError}</p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowConfirmLevel(false);
                  setMapIdInput('');
                  setMapIdError('');
                }}
                className="flex-1 py-3 rounded-xl bg-zinc-800 border-2 border-zinc-500 text-white font-medium hover:bg-zinc-700 transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmLevel}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-all"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingPage;

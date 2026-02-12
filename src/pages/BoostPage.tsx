import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BannerCarousel from '../components/BannerCarousel';
import { banners } from '../data/banners';

// ============ TYPES ============
type BoostMode = 'account' | 'team';
type FilterType = 'rank' | 'quests' | 'achievements' | 'other';
type Platform = 'any' | 'android' | 'ios';
type SortOption = 'none' | 'price_asc' | 'price_desc';
type Gender = 'any' | 'male' | 'female';

interface FilterState {
  type: FilterType;
  platform: Platform;
  priceFrom: string;
  priceTo: string;
  sort: SortOption;
  // Team filters
  gender: Gender;
  ageFrom: string;
  ageTo: string;
}

// ============ RANK PRICES (per 100 points) ============
interface RankPrice {
  rank: string;
  icon: string;
  price: number;
}

const rankPrices: RankPrice[] = [
  { rank: 'Bronze', icon: '🥉', price: 1.5 },
  { rank: 'Silver', icon: '🥈', price: 2.0 },
  { rank: 'Gold', icon: '�', price: 2.5 },
  { rank: 'Platinum', icon: '💠', price: 3.5 },
  { rank: 'Diamond', icon: '💎', price: 5.0 },
  { rank: 'Crown', icon: '👑', price: 7.0 },
  { rank: 'Ace', icon: '🎖️', price: 10.0 },
  { rank: 'Ace Master', icon: '🏅', price: 15.0 },
  { rank: 'Ace Dominator', icon: '🏆', price: 20.0 },
  { rank: 'Conqueror', icon: '👑🔥', price: 30.0 },
];

// ============ ACCOUNT BOOSTERS (Вход в аккаунт) ============
interface AccountBooster {
  id: string;
  gameName: string;
  avatar: string;
  rating: number;
  reviews: number;
  shortDescription: string;
  fullDescription: string;
  pricePerRank: { [key: string]: number };
  platform: Platform;
  online: boolean;
  verified: boolean;
}

const accountBoosters: AccountBooster[] = [
  {
    id: 'a1',
    gameName: 'ProBooster_X',
    avatar: 'https://i.pravatar.cc/150?img=11',
    rating: 4.9,
    reviews: 234,
    shortDescription: 'Топ-1 бустер, 500+ заказов',
    fullDescription: 'Профессиональный бустер с опытом 4+ года. Гарантирую безопасность аккаунта и быстрое выполнение. Работаю 24/7, всегда на связи. Использую VPN вашего региона.',
    pricePerRank: { Bronze: 1.5, Silver: 2.0, Gold: 2.5, Platinum: 3.5, Diamond: 5.0, Crown: 7.0, Ace: 10.0, 'Ace Master': 15.0 },
    platform: 'any',
    online: true,
    verified: true,
  },
  {
    id: 'a2',
    gameName: 'AceMaster',
    avatar: 'https://i.pravatar.cc/150?img=12',
    rating: 4.8,
    reviews: 189,
    shortDescription: 'Быстрый буст до Ace',
    fullDescription: 'Специализируюсь на быстром поднятии до Ace и выше. Средняя скорость — 500 очков в день. Работаю аккуратно, без банов.',
    pricePerRank: { Bronze: 1.3, Silver: 1.8, Gold: 2.2, Platinum: 3.0, Diamond: 4.5, Crown: 6.0, Ace: 9.0 },
    platform: 'android',
    online: true,
    verified: true,
  },
  {
    id: 'a3',
    gameName: 'ConquerorKing',
    avatar: 'https://i.pravatar.cc/150?img=13',
    rating: 4.7,
    reviews: 156,
    shortDescription: 'Conqueror каждый сезон',
    fullDescription: 'Достигаю Conqueror каждый сезон. Могу поднять ваш аккаунт до любого ранга. Безопасные методы, никаких читов.',
    pricePerRank: { Gold: 3.0, Platinum: 4.0, Diamond: 6.0, Crown: 8.0, Ace: 12.0, 'Ace Master': 18.0, 'Ace Dominator': 25.0 },
    platform: 'ios',
    online: false,
    verified: true,
  },
  {
    id: 'a4',
    gameName: 'BudgetBoost',
    avatar: 'https://i.pravatar.cc/150?img=14',
    rating: 4.5,
    reviews: 67,
    shortDescription: 'Низкие цены, новичок',
    fullDescription: 'Новый бустер, но уже 50+ выполненных заказов. Предлагаю низкие цены для старта. Качество гарантирую!',
    pricePerRank: { Bronze: 1.0, Silver: 1.5, Gold: 2.0, Platinum: 2.5, Diamond: 3.5, Crown: 5.0, Ace: 7.0 },
    platform: 'any',
    online: true,
    verified: false,
  },
];

// ============ TEAM PLAYERS (Игра в команде) ============
interface TeamPlayer {
  id: string;
  realName: string;
  gameName: string;
  avatar: string;
  age: number;
  gender: 'male' | 'female';
  shortDescription: string;
  fullDescription: string;
  pricePerHour: number;
  yearsPlaying: number;
  hasMic: boolean;
  availableFrom: string;
  availableTo: string;
  rating: number;
  reviews: number;
  platform: Platform;
  online: boolean;
}

const teamPlayers: TeamPlayer[] = [
  {
    id: 't1',
    realName: 'Алексей',
    gameName: 'SnipeKing',
    avatar: 'https://i.pravatar.cc/150?img=33',
    age: 22,
    gender: 'male',
    shortDescription: 'Снайпер, топ-100 сервера',
    fullDescription: 'Играю на снайперских позициях. Топ-100 на европейском сервере. Спокойный, неконфликтный. Помогу прокачать скиллы и выиграть матчи.',
    pricePerHour: 5,
    yearsPlaying: 4,
    hasMic: true,
    availableFrom: '18:00',
    availableTo: '02:00',
    rating: 4.9,
    reviews: 89,
    platform: 'any',
    online: true,
  },
  {
    id: 't2',
    realName: 'Мария',
    gameName: 'MariaPro',
    avatar: 'https://i.pravatar.cc/150?img=45',
    age: 20,
    gender: 'female',
    shortDescription: 'Поддержка и медик',
    fullDescription: 'Играю в роли поддержки. Всегда на связи, помогу с тактикой. Дружелюбная атмосфера гарантирована!',
    pricePerHour: 4,
    yearsPlaying: 3,
    hasMic: true,
    availableFrom: '14:00',
    availableTo: '23:00',
    rating: 4.8,
    reviews: 56,
    platform: 'ios',
    online: true,
  },
  {
    id: 't3',
    realName: 'Дмитрий',
    gameName: 'DimAssault',
    avatar: 'https://i.pravatar.cc/150?img=52',
    age: 25,
    gender: 'male',
    shortDescription: 'Агрессивный фраггер',
    fullDescription: 'Играю агрессивно, беру на себя большинство перестрелок. K/D 5.2 в текущем сезоне. Подойдёт для тех, кто хочет побеждать.',
    pricePerHour: 7,
    yearsPlaying: 5,
    hasMic: true,
    availableFrom: '20:00',
    availableTo: '04:00',
    rating: 4.7,
    reviews: 112,
    platform: 'android',
    online: false,
  },
  {
    id: 't4',
    realName: 'Анна',
    gameName: 'AnnaSniper',
    avatar: 'https://i.pravatar.cc/150?img=47',
    age: 19,
    gender: 'female',
    shortDescription: 'Новичок, но старается',
    fullDescription: 'Недавно начала играть профессионально. Ищу команду для совместной игры. Низкие цены!',
    pricePerHour: 2,
    yearsPlaying: 1,
    hasMic: false,
    availableFrom: '16:00',
    availableTo: '22:00',
    rating: 4.3,
    reviews: 12,
    platform: 'any',
    online: true,
  },
];

const BoostPage = () => {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  
  // Mode: account (Вход в аккаунт) or team (Игра в команде)
  const [mode, setMode] = useState<BoostMode>('account');
  
  // Dropdown state
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  // Filter
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<FilterState>({
    type: 'rank',
    platform: 'any',
    priceFrom: '',
    priceTo: '',
    sort: 'none',
    gender: 'any',
    ageFrom: '',
    ageTo: '',
  });
  
  // Modals
  const [selectedAccountBooster, setSelectedAccountBooster] = useState<AccountBooster | null>(null);
  const [selectedTeamPlayer, setSelectedTeamPlayer] = useState<TeamPlayer | null>(null);
  
  // Account booster modal state
  const [ratingAmount, setRatingAmount] = useState(100);
  const [selectedRank, setSelectedRank] = useState('Gold');
  
  // Team player modal state
  const [hoursCount, setHoursCount] = useState(1);
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [timeError, setTimeError] = useState('');

  // Account booster modal state - validation
  const [ratingError, setRatingError] = useState('');
  
  // Rank prices expanded state
  const [showRankPrices, setShowRankPrices] = useState(false);

  const closeAllModals = useCallback(() => {
    setSelectedAccountBooster(null);
    setSelectedTeamPlayer(null);
    setShowFilter(false);
  }, []);

  const gameName = gameId === 'pubg-mobile' ? 'PUBG Mobile' : 'Game';

  // Filter logic
  const filteredAccountBoosters = accountBoosters.filter(b => {
    if (filter.platform !== 'any' && b.platform !== 'any' && b.platform !== filter.platform) return false;
    const minPrice = Object.values(b.pricePerRank)[0] || 0;
    if (filter.priceFrom && minPrice < parseFloat(filter.priceFrom)) return false;
    if (filter.priceTo && minPrice > parseFloat(filter.priceTo)) return false;
    return true;
  }).sort((a, b) => {
    if (filter.sort === 'price_asc') return (Object.values(a.pricePerRank)[0] || 0) - (Object.values(b.pricePerRank)[0] || 0);
    if (filter.sort === 'price_desc') return (Object.values(b.pricePerRank)[0] || 0) - (Object.values(a.pricePerRank)[0] || 0);
    return 0;
  });

  const filteredTeamPlayers = teamPlayers.filter(p => {
    if (filter.platform !== 'any' && p.platform !== 'any' && p.platform !== filter.platform) return false;
    if (filter.priceFrom && p.pricePerHour < parseFloat(filter.priceFrom)) return false;
    if (filter.priceTo && p.pricePerHour > parseFloat(filter.priceTo)) return false;
    // Gender filter
    if (filter.gender !== 'any' && p.gender !== filter.gender) return false;
    // Age filter
    if (filter.ageFrom && p.age < parseInt(filter.ageFrom)) return false;
    if (filter.ageTo && p.age > parseInt(filter.ageTo)) return false;
    return true;
  }).sort((a, b) => {
    if (filter.sort === 'price_asc') return a.pricePerHour - b.pricePerHour;
    if (filter.sort === 'price_desc') return b.pricePerHour - a.pricePerHour;
    return 0;
  });

  const calculateAccountPrice = () => {
    if (!selectedAccountBooster) return 0;
    const priceFor100 = selectedAccountBooster.pricePerRank[selectedRank] || Object.values(selectedAccountBooster.pricePerRank)[0] || 0;
    return Math.round(priceFor100 * (ratingAmount / 100) * 100) / 100;
  };

  const calculateTeamPrice = () => {
    if (!selectedTeamPlayer) return 0;
    return selectedTeamPlayer.pricePerHour * hoursCount;
  };

  return (
    <div className="min-h-screen pb-44">
      <main className="max-w-[1800px] mx-auto px-4 md:px-8 py-4">
        {/* Header */}
        <div className="flex items-center relative mb-4 py-1">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">{gameName}</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-white">Буст — напарник</h1>
        </div>

        {/* Banner - Desktop */}
        <section className="hidden lg:flex items-stretch h-[280px] lg:h-[320px] relative mb-5 gap-4">
          <div className="flex-shrink-0 h-full pl-2">
            <img 
              src={mode === 'account' ? '/boost-account.png.png' : '/boost-team.png.png'} 
              alt="Character" 
              className="h-full w-auto object-contain transition-opacity duration-300" 
            />
          </div>
          <div className="flex-1 min-w-0 h-full pr-2">
            <BannerCarousel banners={banners} />
          </div>
        </section>

        {/* Banner - Mobile + Small Tablet */}
        <section className="lg:hidden h-[200px] mb-5">
          <BannerCarousel banners={banners} />
        </section>

        {/* Mode Switcher + Filter - Desktop: одна строка по всей ширине */}
        <div className="hidden lg:flex items-center justify-between gap-4 mb-4 bg-slate-800/50 rounded-xl p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setMode('account')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                mode === 'account'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-700/50 text-white/60 hover:text-white hover:bg-slate-700'
              }`}
            >
              Вход в аккаунт
            </button>
            <button
              onClick={() => setMode('team')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                mode === 'team'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-700/50 text-white/60 hover:text-white hover:bg-slate-700'
              }`}
            >
              Игра в команде
            </button>
          </div>
          
          {/* Filter controls inline on desktop — custom dropdowns */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            {/* Platform dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowPlatformDropdown(!showPlatformDropdown); setShowSortDropdown(false); }}
                className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm cursor-pointer hover:border-slate-500 flex items-center gap-2"
              >
                {filter.platform === 'any' ? 'Любая платформа' : filter.platform === 'android' ? 'Android' : 'iOS'}
                <svg className={`w-4 h-4 text-white/50 transition-transform ${showPlatformDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showPlatformDropdown && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl z-50 overflow-hidden">
                  {(['any', 'android', 'ios'] as Platform[]).map(p => (
                    <button key={p} onClick={() => { setFilter({ ...filter, platform: p }); setShowPlatformDropdown(false); }}
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-700 transition-colors ${
                        filter.platform === p ? 'text-purple-400 bg-slate-700/50' : 'text-white/80'
                      }`}>
                      {p === 'any' ? '✓ Любая платформа' : p === 'android' ? 'Android' : 'iOS'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowSortDropdown(!showSortDropdown); setShowPlatformDropdown(false); }}
                className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm cursor-pointer hover:border-slate-500 flex items-center gap-2"
              >
                {filter.sort === 'none' ? 'Сортировка' : filter.sort === 'price_asc' ? 'Сначала дешевле' : 'Сначала дороже'}
                <svg className={`w-4 h-4 text-white/50 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showSortDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl z-50 overflow-hidden">
                  {([['none', 'Сортировка'], ['price_asc', 'Сначала дешевле'], ['price_desc', 'Сначала дороже']] as [SortOption, string][]).map(([val, label]) => (
                    <button key={val} onClick={() => { setFilter({ ...filter, sort: val }); setShowSortDropdown(false); }}
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-700 transition-colors ${
                        filter.sort === val ? 'text-purple-400 bg-slate-700/50' : 'text-white/80'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowFilter(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white/70 hover:text-white hover:border-slate-500 text-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Все фильтры
            </button>
          </div>
        </div>

        {/* Mode Switcher + Filter - Mobile + Small Tablet */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <div className="flex gap-1.5">
            <button
              onClick={() => setMode('account')}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                mode === 'account'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-white/60 hover:text-white'
              }`}
            >
              Вход в аккаунт
            </button>
            <button
              onClick={() => setMode('team')}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                mode === 'team'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-white/60 hover:text-white'
              }`}
            >
              Игра в команде
            </button>
          </div>
          <button
            onClick={() => setShowFilter(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 rounded-xl text-white/70 hover:text-white text-xs whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Фильтр
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {mode === 'account' ? (
            filteredAccountBoosters.map((booster) => (
              <button
                key={booster.id}
                onClick={() => setSelectedAccountBooster(booster)}
                className="bg-slate-800/80 rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition-all p-3 text-left"
              >
                <div className="relative mb-2">
                  <img src={booster.avatar} alt={booster.gameName} className="w-full aspect-square rounded-lg object-cover" />
                  {booster.online && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full" />
                  )}
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-white font-semibold text-sm truncate">{booster.gameName}</span>
                  {booster.verified && (
                    <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-white/50 text-xs mb-2 line-clamp-2">{booster.shortDescription}</p>
                <div className="flex items-center justify-between">
                  <span className="text-green-400 text-xs font-semibold">от ${Object.values(booster.pricePerRank)[0]}/100</span>
                  <span className="text-yellow-400 text-xs">★{booster.rating} ({booster.reviews})</span>
                </div>
              </button>
            ))
          ) : (
            filteredTeamPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedTeamPlayer(player)}
                className="bg-slate-800/80 rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition-all p-3 text-left"
              >
                <div className="relative mb-2">
                  <img src={player.avatar} alt={player.realName} className="w-full aspect-square rounded-lg object-cover" />
                  {player.online && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full" />
                  )}
                  {player.hasMic && (
                    <span className="absolute top-2 left-2 bg-blue-500/80 px-1.5 py-0.5 rounded text-xs text-white">🎤</span>
                  )}
                </div>
                <p className="text-white font-semibold text-sm">{player.realName}, {player.age}</p>
                <p className="text-purple-400 text-xs mb-1">{player.gameName}</p>
                <p className="text-white/50 text-xs mb-2 line-clamp-2">{player.shortDescription}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-400 font-semibold">${player.pricePerHour}/час</span>
                  <span className="text-white/40">{player.yearsPlaying} лет опыта</span>
                </div>
                <p className="text-white/30 text-xs mt-1">🕐 {player.availableFrom}–{player.availableTo}</p>
              </button>
            ))
          )}
        </div>
      </main>

      {/* Filter Modal */}
      {showFilter && (
        <div className="fixed inset-x-0 top-14 z-50 flex items-end justify-center" style={{ bottom: '72px' }} onClick={() => setShowFilter(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-slate-900 w-full max-w-lg rounded-t-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            <div className="px-4 pb-4 space-y-4">
              <h3 className="text-white font-semibold text-center">Фильтр</h3>
              
              {mode === 'account' && (
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Тип</label>
                  <select
                    value={filter.type}
                    onChange={(e) => setFilter({ ...filter, type: e.target.value as FilterType })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm appearance-none"
                  >
                    <option value="rank">Ранг</option>
                    <option value="quests">Квесты</option>
                    <option value="achievements">Достижения</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Платформа</label>
                <select
                  value={filter.platform}
                  onChange={(e) => setFilter({ ...filter, platform: e.target.value as Platform })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm appearance-none"
                >
                  <option value="any">Любая</option>
                  <option value="android">Android</option>
                  <option value="ios">iOS</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Цена от</label>
                  <input
                    type="number"
                    value={filter.priceFrom}
                    onChange={(e) => setFilter({ ...filter, priceFrom: e.target.value })}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Цена до</label>
                  <input
                    type="number"
                    value={filter.priceTo}
                    onChange={(e) => setFilter({ ...filter, priceTo: e.target.value })}
                    placeholder="999"
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm"
                  />
                </div>
              </div>

              {mode === 'team' && (
                <>
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">Пол</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFilter({ ...filter, gender: 'any' })}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                          filter.gender === 'any'
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-white/60 hover:text-white border border-slate-600'
                        }`}
                      >
                        Любой
                      </button>
                      <button
                        onClick={() => setFilter({ ...filter, gender: 'male' })}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                          filter.gender === 'male'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-white/60 hover:text-white border border-slate-600'
                        }`}
                      >
                        👦 Мальчик
                      </button>
                      <button
                        onClick={() => setFilter({ ...filter, gender: 'female' })}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                          filter.gender === 'female'
                            ? 'bg-pink-600 text-white'
                            : 'bg-slate-800 text-white/60 hover:text-white border border-slate-600'
                        }`}
                      >
                        👧 Девочка
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/50 text-xs mb-1.5 block">Возраст от</label>
                      <input
                        type="number"
                        value={filter.ageFrom}
                        onChange={(e) => setFilter({ ...filter, ageFrom: e.target.value })}
                        placeholder="16"
                        min="16"
                        max="99"
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs mb-1.5 block">Возраст до</label>
                      <input
                        type="number"
                        value={filter.ageTo}
                        onChange={(e) => setFilter({ ...filter, ageTo: e.target.value })}
                        placeholder="99"
                        min="16"
                        max="99"
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Сортировка</label>
                <select
                  value={filter.sort}
                  onChange={(e) => setFilter({ ...filter, sort: e.target.value as SortOption })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm appearance-none"
                >
                  <option value="none">Отключить</option>
                  <option value="price_asc">Сначала дешевле</option>
                  <option value="price_desc">Сначала дороже</option>
                </select>
              </div>

              <button
                onClick={() => setShowFilter(false)}
                className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl mt-2"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Booster Modal */}
      {selectedAccountBooster && (
        <div className="fixed inset-x-0 top-14 z-50 flex items-end justify-center" style={{ bottom: '72px' }} onClick={closeAllModals}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-slate-900 w-full max-w-lg rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="px-4 pb-3 flex items-center gap-3">
              <img src={selectedAccountBooster.avatar} alt={selectedAccountBooster.gameName} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-semibold">{selectedAccountBooster.gameName}</span>
                  {selectedAccountBooster.verified && (
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-yellow-400 text-sm">★{selectedAccountBooster.rating} • {selectedAccountBooster.reviews} отзывов</span>
              </div>
              <button onClick={closeAllModals} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-4 pb-4 space-y-4">
              {/* Description */}
              <p className="text-white/70 text-sm">{selectedAccountBooster.fullDescription}</p>

              {/* Rank Prices - визуально понятный раскрывающийся список */}
              <button
                onClick={() => setShowRankPrices(!showRankPrices)}
                className="w-full bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/50 rounded-xl px-4 py-3 flex items-center justify-between hover:border-purple-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center text-lg">💰</span>
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">Цены за 100 очков по рангам</p>
                    <p className="text-white/50 text-xs">Нажмите, чтобы посмотреть все цены</p>
                  </div>
                </div>
                <svg 
                  className={`w-5 h-5 text-white/50 transition-transform duration-200 ${showRankPrices ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showRankPrices && (
                <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/50 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    {rankPrices.filter(rp => selectedAccountBooster.pricePerRank[rp.rank]).map((rp) => (
                      <div key={rp.rank} className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2.5 hover:bg-slate-700/70 transition-colors">
                        <span className="text-white/80 text-sm">{rp.icon} {rp.rank}</span>
                        <span className="text-green-400 text-sm font-bold">${selectedAccountBooster.pricePerRank[rp.rank]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Select Rank */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Ваш текущий ранг</label>
                <select
                  value={selectedRank}
                  onChange={(e) => setSelectedRank(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm appearance-none"
                >
                  {Object.keys(selectedAccountBooster.pricePerRank).map((rank) => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>

              {/* Rating Amount с валидацией */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Количество очков рейтинга</label>
                <input
                  type="number"
                  value={ratingAmount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setRatingAmount(val);
                    if (val < 100) {
                      setRatingError('Минимум 100 очков');
                    } else if (val % 100 !== 0) {
                      setRatingError('Введите значение кратное 100 (100, 200, 300...)');
                    } else {
                      setRatingError('');
                    }
                  }}
                  min={100}
                  step={100}
                  placeholder="100, 200, 300..."
                  className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white text-sm ${
                    ratingError ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {ratingError && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {ratingError}
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl py-3 text-center">
                <span className="text-white/50 text-xs block">Итого</span>
                <span className="text-2xl font-bold text-green-400">${calculateAccountPrice()}</span>
              </div>

              {/* Refund Notice */}
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                <span className="text-yellow-400 text-lg">ℹ️</span>
                <p className="text-white/70 text-xs">
                  Если информация не совпадает с реальностью, вы можете вернуть деньги. <a href="#" className="text-purple-400 underline">Подробнее</a>
                </p>
              </div>

              <button 
                disabled={!!ratingError || ratingAmount < 100}
                className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3.5 rounded-xl transition-all ${
                  ratingError || ratingAmount < 100 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-purple-600/30'
                }`}
              >
                Купить за ${calculateAccountPrice()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Player Modal */}
      {selectedTeamPlayer && (
        <div className="fixed inset-x-0 top-14 z-50 flex items-end justify-center" style={{ bottom: '72px' }} onClick={closeAllModals}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-slate-900 w-full max-w-lg rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="px-4 pb-3 flex items-center gap-3">
              <img src={selectedTeamPlayer.avatar} alt={selectedTeamPlayer.realName} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="text-white font-semibold">{selectedTeamPlayer.realName}, {selectedTeamPlayer.age}</p>
                <p className="text-purple-400 text-sm">{selectedTeamPlayer.gameName}</p>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span>★{selectedTeamPlayer.rating}</span>
                  <span>•</span>
                  <span>{selectedTeamPlayer.yearsPlaying} лет опыта</span>
                  {selectedTeamPlayer.hasMic && <span>• 🎤</span>}
                </div>
              </div>
              <button onClick={closeAllModals} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-4 pb-4 space-y-4">
              {/* Description */}
              <p className="text-white/70 text-sm">{selectedTeamPlayer.fullDescription}</p>

              {/* Info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-white/50 text-xs block">Доступен</span>
                  <span className="text-white">{selectedTeamPlayer.availableFrom} – {selectedTeamPlayer.availableTo}</span>
                </div>
                <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-white/50 text-xs block">Цена</span>
                  <span className="text-green-400 font-semibold">${selectedTeamPlayer.pricePerHour}/час</span>
                </div>
              </div>

              {/* Hours */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Количество часов</label>
                <input
                  type="number"
                  value={hoursCount}
                  onChange={(e) => setHoursCount(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm"
                />
              </div>

              {/* Time - ручной ввод с валидацией */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Время начала (доступно: {selectedTeamPlayer.availableFrom} – {selectedTeamPlayer.availableTo})</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => {
                    const time = e.target.value;
                    setSelectedTime(time);
                    
                    // Проверка диапазона времени
                    const from = selectedTeamPlayer.availableFrom;
                    const to = selectedTeamPlayer.availableTo;
                    
                    // Конвертируем в минуты для сравнения
                    const timeToMinutes = (t: string) => {
                      const [h, m] = t.split(':').map(Number);
                      return h * 60 + m;
                    };
                    
                    const inputMin = timeToMinutes(time);
                    const fromMin = timeToMinutes(from);
                    const toMin = timeToMinutes(to);
                    
                    // Учитываем переход через полночь
                    if (toMin < fromMin) {
                      // Ночной диапазон (например 18:00 - 02:00)
                      if (inputMin < fromMin && inputMin > toMin) {
                        setTimeError(`Время должно быть в диапазоне ${from} – ${to}`);
                      } else {
                        setTimeError('');
                      }
                    } else {
                      // Обычный диапазон
                      if (inputMin < fromMin || inputMin > toMin) {
                        setTimeError(`Время должно быть в диапазоне ${from} – ${to}`);
                      } else {
                        setTimeError('');
                      }
                    }
                  }}
                  className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white text-sm ${
                    timeError ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {timeError && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {timeError}
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl py-3 text-center">
                <span className="text-white/50 text-xs block">Итого за {hoursCount} ч.</span>
                <span className="text-2xl font-bold text-green-400">${calculateTeamPrice()}</span>
              </div>

              {/* Refund Notice */}
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                <span className="text-yellow-400 text-lg">ℹ️</span>
                <p className="text-white/70 text-xs">
                  Если информация не совпадает с реальностью, вы можете вернуть деньги. <a href="#" className="text-purple-400 underline">Подробнее</a>
                </p>
              </div>

              <button 
                disabled={!!timeError}
                className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3.5 rounded-xl transition-all ${
                  timeError ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-purple-600/30'
                }`}
              >
                Оплатить ${calculateTeamPrice()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BoostPage;

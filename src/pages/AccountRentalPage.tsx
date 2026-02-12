import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BannerCarousel from '../components/BannerCarousel';
import StarRating from '../components/StarRating';
import { banners } from '../data/banners';

interface RentalAccount {
  id: string;
  image: string;
  pricePerHour: number;
  minHours: number;
  collectionLevel: number;
  description: string;
  rentalTerms: string;
  sellerRating: number;
  sellerReviews: number;
}

const defaultRentalTerms = '• Не менять пароль и привязки\n• Не удалять друзей и клан\n• Не тратить UC и валюту\n• После аренды выйти из аккаунта';

const mockAccounts: RentalAccount[] = [
  { id: 'ACC001', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400', pricePerHour: 0.5, minHours: 2, collectionLevel: 45, description: 'Аккаунт с редкими скинами Season 1-5', rentalTerms: defaultRentalTerms, sellerRating: 4.8, sellerReviews: 124 },
  { id: 'ACC002', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400', pricePerHour: 0.8, minHours: 1, collectionLevel: 72, description: 'Премиум аккаунт, все RP с 1 сезона', rentalTerms: defaultRentalTerms, sellerRating: 4.9, sellerReviews: 203 },
  { id: 'ACC003', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', pricePerHour: 0.3, minHours: 3, collectionLevel: 28, description: 'Базовый аккаунт с хорошей коллекцией', rentalTerms: defaultRentalTerms, sellerRating: 4.5, sellerReviews: 67 },
  { id: 'ACC004', image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f764e?w=400', pricePerHour: 1.2, minHours: 1, collectionLevel: 95, description: 'Топ аккаунт с эксклюзивами', rentalTerms: '• Не менять пароль\n• Не тратить UC\n• При нарушении — штраф $100', sellerRating: 5.0, sellerReviews: 312 },
  { id: 'ACC005', image: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=400', pricePerHour: 0.6, minHours: 2, collectionLevel: 55, description: 'Много скинов на оружие', rentalTerms: defaultRentalTerms, sellerRating: 4.6, sellerReviews: 89 },
  { id: 'ACC006', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0e?w=400', pricePerHour: 0.4, minHours: 4, collectionLevel: 38, description: 'Аккаунт с редким транспортом', rentalTerms: defaultRentalTerms, sellerRating: 4.3, sellerReviews: 42 },
  { id: 'ACC007', image: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=400', pricePerHour: 0.9, minHours: 1, collectionLevel: 68, description: 'Коллекционный аккаунт', rentalTerms: defaultRentalTerms, sellerRating: 4.7, sellerReviews: 156 },
  { id: 'ACC008', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', pricePerHour: 0.7, minHours: 2, collectionLevel: 52, description: 'Аккаунт с Glacier M416', rentalTerms: defaultRentalTerms, sellerRating: 4.4, sellerReviews: 78 },
  { id: 'ACC009', image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400', pricePerHour: 1.5, minHours: 1, collectionLevel: 99, description: 'Легендарный аккаунт, все сезоны', rentalTerms: '• Не менять пароль\n• Не удалять друзей\n• Не тратить UC\n• Штраф за нарушение — $150', sellerRating: 4.9, sellerReviews: 287 },
  { id: 'ACC010', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400', pricePerHour: 0.35, minHours: 3, collectionLevel: 32, description: 'Стартовый аккаунт с бонусами', rentalTerms: defaultRentalTerms, sellerRating: 4.2, sellerReviews: 35 },
  { id: 'ACC011', image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=400', pricePerHour: 0.55, minHours: 2, collectionLevel: 48, description: 'Аккаунт с мифическими нарядами', rentalTerms: defaultRentalTerms, sellerRating: 4.6, sellerReviews: 91 },
  { id: 'ACC012', image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400', pricePerHour: 0.65, minHours: 2, collectionLevel: 58, description: 'Премиум скины на транспорт', rentalTerms: defaultRentalTerms, sellerRating: 4.7, sellerReviews: 112 },
  { id: 'ACC013', image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400', pricePerHour: 0.75, minHours: 1, collectionLevel: 64, description: 'Полная коллекция AWM', rentalTerms: defaultRentalTerms, sellerRating: 4.8, sellerReviews: 145 },
  { id: 'ACC014', image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400', pricePerHour: 0.45, minHours: 2, collectionLevel: 41, description: 'Редкие костюмы из ивентов', rentalTerms: defaultRentalTerms, sellerRating: 4.4, sellerReviews: 58 },
  { id: 'ACC015', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', pricePerHour: 0.85, minHours: 1, collectionLevel: 76, description: 'Аккаунт с Pharaoh X-Suit', rentalTerms: defaultRentalTerms, sellerRating: 4.9, sellerReviews: 198 },
  { id: 'ACC016', image: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=400', pricePerHour: 0.95, minHours: 1, collectionLevel: 82, description: 'Коллекция Glacier скинов', rentalTerms: defaultRentalTerms, sellerRating: 4.8, sellerReviews: 167 },
  { id: 'ACC017', image: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400', pricePerHour: 0.25, minHours: 5, collectionLevel: 22, description: 'Бюджетный вариант', rentalTerms: defaultRentalTerms, sellerRating: 4.1, sellerReviews: 23 },
  { id: 'ACC018', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400', pricePerHour: 1.1, minHours: 1, collectionLevel: 88, description: 'Эксклюзивные скины 2020', rentalTerms: defaultRentalTerms, sellerRating: 4.7, sellerReviews: 134 },
  { id: 'ACC019', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400', pricePerHour: 0.6, minHours: 2, collectionLevel: 54, description: 'Аккаунт с Blood Raven', rentalTerms: defaultRentalTerms, sellerRating: 4.5, sellerReviews: 76 },
  { id: 'ACC020', image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400', pricePerHour: 0.7, minHours: 2, collectionLevel: 61, description: 'Редкие шлемы и маски', rentalTerms: defaultRentalTerms, sellerRating: 4.6, sellerReviews: 98 },
  { id: 'ACC021', image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400', pricePerHour: 0.4, minHours: 3, collectionLevel: 35, description: 'Костюмы всех сезонов', rentalTerms: defaultRentalTerms, sellerRating: 4.3, sellerReviews: 45 },
  { id: 'ACC022', image: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=400', pricePerHour: 1.3, minHours: 1, collectionLevel: 93, description: 'Топ-5 аккаунт сервера', rentalTerms: '• Не менять пароль\n• Не удалять друзей\n• Не тратить UC\n• Штраф за нарушение — $120', sellerRating: 5.0, sellerReviews: 256 },
  { id: 'ACC023', image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400', pricePerHour: 0.5, minHours: 2, collectionLevel: 47, description: 'Коллекция M762 скинов', rentalTerms: defaultRentalTerms, sellerRating: 4.5, sellerReviews: 63 },
  { id: 'ACC024', image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400', pricePerHour: 0.8, minHours: 1, collectionLevel: 71, description: 'Аккаунт с Dragon Ball коллаб', rentalTerms: defaultRentalTerms, sellerRating: 4.8, sellerReviews: 178 },
  { id: 'ACC025', image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400', pricePerHour: 0.55, minHours: 2, collectionLevel: 50, description: 'Полный набор McLaren', rentalTerms: defaultRentalTerms, sellerRating: 4.6, sellerReviews: 87 },
];

const AccountRentalPage = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const gameName = gameId === 'pubg-mobile' ? 'PUBG Mobile' : 'Game';

  // Filter states
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [rentalDays, setRentalDays] = useState(0);
  const [rentalHours, setRentalHours] = useState(1);
  const [collectionFrom, setCollectionFrom] = useState('');
  const [collectionTo, setCollectionTo] = useState('');
  const [searchId, setSearchId] = useState('');
  const [showCollectionHint, setShowCollectionHint] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filteredAccounts = useMemo(() => {
    let result = [...mockAccounts];

    // Filter by price
    if (priceFrom) {
      result = result.filter(a => a.pricePerHour >= parseFloat(priceFrom));
    }
    if (priceTo) {
      result = result.filter(a => a.pricePerHour <= parseFloat(priceTo));
    }

    // Filter by collection level
    if (collectionFrom) {
      result = result.filter(a => a.collectionLevel >= parseInt(collectionFrom));
    }
    if (collectionTo) {
      result = result.filter(a => a.collectionLevel <= parseInt(collectionTo));
    }

    // Filter by ID
    if (searchId) {
      result = result.filter(a => a.id.toLowerCase().includes(searchId.toLowerCase()));
    }

    // Sort
    if (sortOrder !== 'none') {
      result.sort((a, b) => {
        return sortOrder === 'asc' ? a.pricePerHour - b.pricePerHour : b.pricePerHour - a.pricePerHour;
      });
    }

    return result;
  }, [priceFrom, priceTo, collectionFrom, collectionTo, searchId, sortOrder]);

  return (
    <div className="min-h-screen pb-40">
      <main className="max-w-[1800px] mx-auto px-4 md:px-8 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center relative py-1">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">{gameName}</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-white">Аренда аккаунтов</h1>
        </div>

        {/* Banner with Characters - Desktop & Tablet */}
        <section className="hidden md:flex items-stretch h-[280px] lg:h-[320px] relative">
          {/* Character LEFT */}
          <div className="flex-shrink-0 h-full">
            <img 
              src="/arenda-left.png" 
              alt="Character Left"
              className="h-full w-auto object-contain transform scale-110 translate-y-2"
            />
          </div>
          
          {/* Banner Carousel */}
          <div className="flex-1 min-w-0 h-full">
            <BannerCarousel banners={banners} />
          </div>

          {/* Character RIGHT - Desktop only */}
          <div className="hidden lg:block flex-shrink-0 h-full">
            <img 
              src="/arenda-right.png" 
              alt="Character Right"
              className="h-full w-auto object-contain transform scale-110 translate-y-2"
            />
          </div>
        </section>

        {/* Banner - Mobile only */}
        <section className="md:hidden h-[200px]">
          <BannerCarousel banners={banners} />
        </section>

        {/* Filters */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-700 overflow-hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-4 hover:bg-zinc-800 transition-all"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-bold text-white">Фильтры</span>
            </div>
            <svg className={`w-5 h-5 text-zinc-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showFilters && (
          <div className="space-y-3 p-4 pt-0">
          {/* Price */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Цена от ($)</label>
              <input
                type="number"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Цена до ($)</label>
              <input
                type="number"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="relative">
            <label className="text-xs text-zinc-400 mb-1 block">Сортировка</label>
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm text-left flex items-center justify-between"
            >
              <span>{sortOrder === 'asc' ? 'Сначала дешевле' : sortOrder === 'desc' ? 'Сначала дороже' : 'Не указано'}</span>
              <svg className={`w-4 h-4 text-zinc-400 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showSortDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
                <div className="absolute left-0 right-0 mt-1 bg-zinc-700 border border-zinc-600 rounded-lg overflow-hidden z-50">
                  {[
                    { value: 'none', label: 'Отключить' },
                    { value: 'asc', label: 'Сначала дешевле' },
                    { value: 'desc', label: 'Сначала дороже' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortOrder(opt.value as 'asc' | 'desc' | 'none'); setShowSortDropdown(false); }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-600 transition-colors ${sortOrder === opt.value ? 'bg-zinc-600 text-white' : 'text-zinc-300'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Rental duration */}
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Срок аренды</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={rentalDays}
                  onChange={(e) => setRentalDays(Math.max(0, Math.min(30, parseInt(e.target.value) || 0)))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                />
                <span className="text-xs text-zinc-400 whitespace-nowrap">дней</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={rentalHours}
                  onChange={(e) => setRentalHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                />
                <span className="text-xs text-zinc-400 whitespace-nowrap">часов</span>
              </div>
            </div>
          </div>

          {/* Collection level */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-xs text-zinc-400">Уровень коллекции</label>
              <button
                onClick={() => setShowCollectionHint(!showCollectionHint)}
                className="w-4 h-4 rounded-full bg-zinc-700 text-zinc-400 text-[10px] flex items-center justify-center hover:bg-zinc-600"
              >
                ?
              </button>
            </div>
            {showCollectionHint && (
              <p className="text-xs text-zinc-500 mb-2 p-2 bg-zinc-800 rounded-lg">
                Уровень коллекции — показатель наполненности аккаунта по коллекции предметов (скины/костюмы/транспорт/оружие). Чем выше уровень — тем "богаче" аккаунт.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={collectionFrom}
                onChange={(e) => setCollectionFrom(e.target.value)}
                placeholder="от 0"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
              />
              <input
                type="number"
                value={collectionTo}
                onChange={(e) => setCollectionTo(e.target.value)}
                placeholder="до 100"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Search by ID */}
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Поиск по ID аккаунта</label>
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Введите ID аккаунта"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setPriceFrom('');
                setPriceTo('');
                setSortOrder('none');
                setRentalDays(0);
                setRentalHours(1);
                setCollectionFrom('');
                setCollectionTo('');
                setSearchId('');
              }}
              className="flex-1 py-2.5 px-4 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-white font-medium text-sm transition-all"
            >
              Сбросить
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-medium text-sm transition-all"
            >
              Сохранить
            </button>
          </div>
          </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-white font-medium">Всего: {filteredAccounts.length} товаров</p>
        </div>

        {/* Accounts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredAccounts.map((account) => (
            <button
              key={account.id}
              onClick={() => navigate(`/game/${gameId}/account-rental/${account.id}`)}
              className="bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden hover:border-zinc-500 transition-all text-left"
            >
              {/* Image - fixed aspect ratio */}
              <div className="aspect-[4/3] relative overflow-hidden bg-zinc-800">
                <img 
                  src={account.image} 
                  alt={account.id}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 rounded-md">
                  <span className="text-[10px] text-white font-medium">{account.id}</span>
                </div>
              </div>
              {/* Info */}
              <div className="p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold text-base">${account.pricePerHour}/час</span>
                  <span className="text-xs text-zinc-300">мин. {account.minHours}ч</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-300">Коллекция:</span>
                  <span className="text-xs text-white font-semibold">{account.collectionLevel}</span>
                </div>
                <p className="text-xs text-zinc-300 line-clamp-2">{account.description}</p>
                <div className="mt-1">
                  <StarRating rating={account.sellerRating} reviews={account.sellerReviews} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AccountRentalPage;

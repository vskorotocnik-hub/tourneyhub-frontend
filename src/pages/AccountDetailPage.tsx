import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface AccountItem {
  name: string;
  rarity: string;
}

const mockAccountData = {
  id: '51847293',
  images: [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    'https://images.unsplash.com/photo-1493711662062-fa541f7f764e?w=800',
    'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800',
  ],
  price: 150,
  collectionLevel: 45,
  rpSeasons: [
    ['S9', 'A7', 'A10', 'A11', 'A12', 'A13', 'A14'],
    ['S9', 'A7', 'A10', 'A11', 'A12', 'A13'],
  ],
  rareCostumes: [
    { name: 'Glacier Suit', rarity: 'Mythic' },
    { name: 'Pharaoh X-Suit', rarity: 'Legendary' },
    { name: 'Blood Raven Set', rarity: 'Epic' },
    { name: 'Season 1 Conqueror', rarity: 'Rare' },
    { name: 'Dragon Hunter', rarity: 'Epic' },
  ] as AccountItem[],
  vehicleSkins: [
    { name: 'McLaren 570S', rarity: 'Mythic' },
    { name: 'Dacia Golden', rarity: 'Epic' },
    { name: 'UAZ Neon', rarity: 'Rare' },
    { name: 'Buggy Flames', rarity: 'Epic' },
  ] as AccountItem[],
  weaponSkins: [
    { name: 'M416 Glacier', rarity: 'Mythic' },
    { name: 'AWM Dragon', rarity: 'Legendary' },
    { name: 'AKM Hellfire', rarity: 'Epic' },
    { name: 'Kar98k Fool', rarity: 'Epic' },
    { name: 'M762 Rugged', rarity: 'Rare' },
    { name: 'UZI Neon', rarity: 'Rare' },
  ] as AccountItem[],
  otherItems: [
    { name: 'Parachute Golden Wings', rarity: 'Legendary' },
    { name: 'Backpack Neon Glow', rarity: 'Epic' },
    { name: 'Pan Kill Message', rarity: 'Rare' },
    { name: 'Helmet Samurai', rarity: 'Epic' },
  ] as AccountItem[],
  reviewLink: 'https://www.tiktok.com/@example/video/123456789', // опционально
};

const AccountDetailPage = () => {
  const navigate = useNavigate();
  const { accountId } = useParams();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGuarantee, setShowGuarantee] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Accordions
  const [showCostumes, setShowCostumes] = useState(false);
  const [showVehicles, setShowVehicles] = useState(false);
  const [showWeapons, setShowWeapons] = useState(false);
  const [showOther, setShowOther] = useState(false);

  // Toggle accordions in pairs
  const toggleAccordions = (section: 'costumes' | 'vehicles' | 'weapons' | 'other') => {
    if (section === 'costumes') {
      const newState = !showCostumes;
      setShowCostumes(newState);
      setShowVehicles(newState);
    } else if (section === 'vehicles') {
      const newState = !showVehicles;
      setShowVehicles(newState);
      setShowCostumes(newState);
    } else if (section === 'weapons') {
      const newState = !showWeapons;
      setShowWeapons(newState);
      setShowOther(newState);
    } else if (section === 'other') {
      const newState = !showOther;
      setShowOther(newState);
      setShowWeapons(newState);
    }
  };
  const [copiedId, setCopiedId] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const account = mockAccountData;

  const copyId = useCallback(() => {
    navigator.clipboard.writeText(accountId || account.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }, [accountId, account.id]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % account.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + account.images.length) % account.images.length);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Mythic': return 'text-red-400';
      case 'Legendary': return 'text-yellow-400';
      case 'Epic': return 'text-purple-400';
      case 'Rare': return 'text-blue-400';
      default: return 'text-zinc-400';
    }
  };

  
  return (
    <div className="min-h-screen pb-52 lg:pb-28">
      <main className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center relative px-8 py-3 lg:pt-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-white">Покупка аккаунта</h1>
        </div>

        {/* Desktop: Two columns + Fixed Guard */}
        <div className="lg:flex lg:gap-6 lg:px-8 lg:pr-[320px]">
          {/* Left Column - Gallery + Info */}
          <div className="lg:w-[45%] lg:pt-4">
            {/* Image Gallery */}
            <div 
              className="relative aspect-[4/3] lg:aspect-[4/3] bg-zinc-900 mx-4 lg:mx-0 rounded-2xl overflow-hidden shadow-xl"
              onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
              onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
              onTouchEnd={() => {
                if (touchStart - touchEnd > 50) nextImage();
                if (touchStart - touchEnd < -50) prevImage();
              }}
            >
              <img
                src={account.images[currentImageIndex]}
                alt={`${account.id} - ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Navigation arrows - Desktop only */}
              <button
                onClick={prevImage}
                className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm items-center justify-center text-white hover:bg-black/80 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm items-center justify-center text-white hover:bg-black/80 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Dots indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {account.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Thumbnails - Desktop only */}
            <div className="hidden lg:grid grid-cols-5 gap-2 mt-3">
              {account.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentImageIndex ? 'border-emerald-500 shadow-lg shadow-emerald-500/30' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Desktop: Purchase Info */}
            <div className="hidden lg:block p-4 bg-gradient-to-br from-zinc-800/80 to-zinc-900 border border-zinc-700/50 rounded-2xl mt-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="text-white font-bold text-sm">Сделка под защитой</h4>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                После оплаты вы получите полный доступ к аккаунту. Данные для входа будут отправлены в чат с продавцом. 
                Сделка защищена гарантией возврата.
              </p>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="lg:w-[55%] px-4 lg:px-0 py-4 space-y-3">
            {/* Desktop: Price Card - Main CTA */}
            <div className="hidden lg:block p-5 bg-gradient-to-r from-emerald-900/40 via-emerald-800/20 to-zinc-800/80 border border-emerald-500/30 rounded-2xl shadow-xl shadow-emerald-900/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-zinc-400 text-sm">Цена аккаунта</p>
                  <p className="text-4xl font-bold text-emerald-400">${account.price}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 bg-zinc-800/50 rounded-xl">
                    <p className="text-zinc-500 text-xs">Коллекция</p>
                    <p className="text-white font-bold text-xl">{account.collectionLevel}</p>
                  </div>
                  <div className="text-center px-4 py-2 bg-zinc-800/50 rounded-xl">
                    <p className="text-zinc-500 text-xs">ID</p>
                    <button onClick={copyId} className="text-white font-bold text-sm hover:text-emerald-400 transition-colors">
                      {copiedId ? '✅' : account.id}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/30"
              >
                Купить аккаунт — ${account.price}
              </button>
            </div>
            {/* Review Link (optional) */}
            {account.reviewLink && (
              <a
                href={account.reviewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-600 bg-zinc-800/50 text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-sm">Смотреть обзор</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            {/* Guarantee + Support row */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowGuarantee(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:border-emerald-500/50 transition-all"
              >
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-emerald-400 font-medium text-xs">Гарантия</span>
              </button>
              <button
                onClick={() => navigate('/messages')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-800 border border-zinc-600 rounded-xl hover:bg-zinc-700 transition-all"
              >
                <svg className="w-4 h-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-zinc-300 font-medium text-xs">Поддержка</span>
              </button>
            </div>

            {/* Mobile: Account Info - Compact row */}
            <div className="flex gap-3 lg:hidden">
              <div className="flex-1 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <span>🆔</span>
                  <span className="text-zinc-400 text-xs">ID аккаунта</span>
                </div>
                <button onClick={copyId} className="flex items-center gap-1.5 text-white font-bold text-sm hover:text-emerald-400 transition-colors">
                  {copiedId ? '✅' : account.id}
                  {!copiedId && (
                    <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex-1 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <span>🏆</span>
                  <span className="text-zinc-400 text-xs">Коллекция</span>
                </div>
                <span className="text-white font-bold text-sm">{account.collectionLevel} ур.</span>
              </div>
                          </div>

            {/* RP Seasons */}
            <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
              <p className="text-zinc-400 text-xs mb-2">RP сезоны</p>
              <div className="flex flex-wrap gap-2">
                {account.rpSeasons.flat().map((rp, idx) => (
                  <span key={idx} className="px-2 py-1 bg-zinc-700/50 rounded-lg text-white text-xs font-medium">{rp}</span>
                ))}
              </div>
            </div>

            {/* Accordions - Desktop: 2 columns, Mobile: 1 column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {/* First Row: Costumes + Vehicles */}
              {/* Rare Costumes */}
              <div className="border border-zinc-700/50 rounded-xl overflow-hidden bg-zinc-800/30">
                <button
                  onClick={() => toggleAccordions('costumes')}
                  className="w-full flex items-center justify-between py-3 px-4 hover:bg-zinc-700/30 transition-all"
                >
                  <span className="text-white font-medium text-sm">👗 Редкие костюмы <span className="text-emerald-400">({account.rareCostumes.length})</span></span>
                  <svg className={`w-4 h-4 text-zinc-400 transition-transform ${showCostumes ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showCostumes && (
                  <div className="p-3 bg-zinc-900/50 space-y-2 border-t border-zinc-700/30">
                    {account.rareCostumes.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-white text-sm">{item.name}</span>
                        <span className={`text-xs font-medium ${getRarityColor(item.rarity)}`}>{item.rarity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vehicle Skins */}
              <div className="border border-zinc-700/50 rounded-xl overflow-hidden bg-zinc-800/30">
                <button
                  onClick={() => toggleAccordions('vehicles')}
                  className="w-full flex items-center justify-between py-3 px-4 hover:bg-zinc-700/30 transition-all"
                >
                  <span className="text-white font-medium text-sm">🚗 Транспорт <span className="text-emerald-400">({account.vehicleSkins.length})</span></span>
                  <svg className={`w-4 h-4 text-zinc-400 transition-transform ${showVehicles ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showVehicles && (
                  <div className="p-3 bg-zinc-900/50 space-y-2 border-t border-zinc-700/30">
                    {account.vehicleSkins.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-white text-sm">{item.name}</span>
                        <span className={`text-xs font-medium ${getRarityColor(item.rarity)}`}>{item.rarity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Second Row: Weapons + Other */}
              {/* Weapon Skins */}
              <div className="border border-zinc-700/50 rounded-xl overflow-hidden bg-zinc-800/30">
                <button
                  onClick={() => toggleAccordions('weapons')}
                  className="w-full flex items-center justify-between py-3 px-4 hover:bg-zinc-700/30 transition-all"
                >
                  <span className="text-white font-medium text-sm">🔫 Оружие <span className="text-emerald-400">({account.weaponSkins.length})</span></span>
                  <svg className={`w-4 h-4 text-zinc-400 transition-transform ${showWeapons ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showWeapons && (
                  <div className="p-3 bg-zinc-900/50 space-y-2 border-t border-zinc-700/30">
                    {account.weaponSkins.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-white text-sm">{item.name}</span>
                        <span className={`text-xs font-medium ${getRarityColor(item.rarity)}`}>{item.rarity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Other Items */}
              <div className="border border-zinc-700/50 rounded-xl overflow-hidden bg-zinc-800/30">
                <button
                  onClick={() => toggleAccordions('other')}
                  className="w-full flex items-center justify-between py-3 px-4 hover:bg-zinc-700/30 transition-all"
                >
                  <span className="text-white font-medium text-sm">📦 Другое <span className="text-emerald-400">({account.otherItems.length})</span></span>
                  <svg className={`w-4 h-4 text-zinc-400 transition-transform ${showOther ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showOther && (
                  <div className="p-3 bg-zinc-900/50 space-y-2 border-t border-zinc-700/30">
                    {account.otherItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-white text-sm">{item.name}</span>
                        <span className={`text-xs font-medium ${getRarityColor(item.rarity)}`}>{item.rarity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Purchase Info - Mobile only */}
            <div className="lg:hidden p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
              <h4 className="text-white font-bold text-sm mb-2">Информация о покупке</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                После оплаты вы получите полный доступ к аккаунту. Данные для входа будут отправлены в чат с продавцом. 
                Рекомендуем сразу сменить пароль и привязать свою почту. Сделка защищена гарантией возврата.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Guard - Desktop only */}
      <div className="hidden lg:flex fixed right-[40px] bottom-[14px] top-[50px] w-[280px] z-40 pointer-events-none items-end justify-center overflow-hidden">
        <img 
          src="/охрана.png" 
          alt="Охрана сделки" 
          className="w-full h-auto min-h-full object-cover object-top drop-shadow-2xl -scale-x-100"
        />
      </div>

      {/* Sticky Bottom Panel - Mobile */}
      <div className="fixed bottom-[64px] left-0 right-0 px-4 py-3 bg-zinc-900 border-t border-zinc-700 lg:hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-zinc-400 text-xs">Цена аккаунта</p>
            <p className="text-xl font-bold text-emerald-400">${account.price}</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-400 text-xs">Коллекция</p>
            <p className="text-white font-bold">{account.collectionLevel} ур.</p>
          </div>
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all"
        >
          Купить аккаунт — ${account.price}
        </button>
      </div>

      {/* Guarantee Modal */}
      {showGuarantee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowGuarantee(false)} />
          <div className="relative w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-600 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Гарантия сделки</h3>
            </div>
            
            <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
              Сделка защищена. Продавец не получит оплату, пока вы не подтвердите получение товара. 
              В случае любых проблем — мы вернём деньги.
            </p>

            <button
              onClick={() => setShowGuarantee(false)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all"
            >
              Понял, спасибо
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal (Stub) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          <div className="relative w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-600 p-5 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">Оплата в разработке</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Функция оплаты скоро будет доступна. Следите за обновлениями!
            </p>

            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-bold transition-all"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDetailPage;

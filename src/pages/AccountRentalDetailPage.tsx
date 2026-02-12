import { useState, useMemo, useCallback } from 'react';
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
  pricePerHour: 0.5,
  minHours: 2,
  maxHours: 168,
  collectionLevel: 45,
  description: 'Аккаунт с редкими скинами Season 1-5',
  rentalTerms: 'Условия аренды:\n• Не менять пароль и привязки\n• Не удалять друзей и клан\n• Не тратить UC и другую валюту\n• Не участвовать в читерстве\n• После аренды выйти из аккаунта\n• При нарушении — штраф $50',
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
};

const AccountRentalDetailPage = () => {
  const navigate = useNavigate();
  const { accountId } = useParams();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rentalDays, setRentalDays] = useState(0);
  const [rentalHours, setRentalHours] = useState(2);
  const [showGuarantee, setShowGuarantee] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Accordions
  const [showCostumes, setShowCostumes] = useState(false);
  const [showVehicles, setShowVehicles] = useState(false);
  const [showWeapons, setShowWeapons] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const account = mockAccountData; // In real app, fetch by accountId

  const copyId = useCallback(() => {
    navigator.clipboard.writeText(accountId || account.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }, [accountId, account.id]);

  const totalHours = useMemo(() => {
    return rentalDays * 24 + rentalHours;
  }, [rentalDays, rentalHours]);

  const totalPrice = useMemo(() => {
    return (totalHours * account.pricePerHour).toFixed(2);
  }, [totalHours, account.pricePerHour]);

  const updateRentalTime = (newDays: number, newHours: number) => {
    const total = newDays * 24 + newHours;
    if (total < account.minHours) {
      // Can't go below minimum
      return;
    }
    if (total > account.maxHours) {
      // Can't go above maximum
      return;
    }
    setRentalDays(newDays);
    setRentalHours(newHours);
  };

  const decreaseDays = () => {
    if (rentalDays > 0) {
      updateRentalTime(rentalDays - 1, rentalHours);
    }
  };

  const increaseDays = () => {
    updateRentalTime(rentalDays + 1, rentalHours);
  };

  const decreaseHours = () => {
    if (rentalHours > 0) {
      updateRentalTime(rentalDays, rentalHours - 1);
    } else if (rentalDays > 0) {
      updateRentalTime(rentalDays - 1, 23);
    }
  };

  const increaseHours = () => {
    if (rentalHours < 23) {
      updateRentalTime(rentalDays, rentalHours + 1);
    } else {
      updateRentalTime(rentalDays + 1, 0);
    }
  };

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
    <div className="min-h-screen pb-72 lg:pb-28">
      <main className="max-w-[1800px] mx-auto">
        {/* Header - outside gallery */}
        <div className="flex items-center relative px-8 py-3 lg:pt-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-white">Аренда аккаунта</h1>
        </div>

        {/* Desktop: Two columns + Fixed Guard */}
        <div className="lg:flex lg:gap-6 lg:px-8 lg:pr-[320px]">
          {/* Left Column - Gallery */}
          <div className="lg:w-[45%] lg:pt-4">
            {/* Image Gallery */}
            <div 
              className="relative aspect-[4/3] bg-zinc-900 mx-4 lg:mx-0 rounded-xl overflow-hidden"
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
                className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 items-center justify-center text-white hover:bg-black/70"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 items-center justify-center text-white hover:bg-black/70"
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
            <div className="hidden lg:flex gap-2 mt-3">
              {account.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentImageIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Desktop: Rent panel - moved to left column */}
            <div className="hidden lg:block p-4 bg-zinc-800 border border-zinc-700 rounded-xl mt-4">
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-400">Дни</span>
                  <button
                    onClick={decreaseDays}
                    className="w-9 h-9 rounded-lg bg-zinc-700 border border-zinc-600 text-white flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="text-white font-bold text-lg w-6 text-center">{rentalDays}</span>
                  <button
                    onClick={increaseDays}
                    className="w-9 h-9 rounded-lg bg-zinc-700 border border-zinc-600 text-white flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-400">Часы</span>
                  <button
                    onClick={decreaseHours}
                    className="w-9 h-9 rounded-lg bg-zinc-700 border border-zinc-600 text-white flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="text-white font-bold text-lg w-6 text-center">{rentalHours}</span>
                  <button
                    onClick={increaseHours}
                    className="w-9 h-9 rounded-lg bg-zinc-700 border border-zinc-600 text-white flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-zinc-400 text-xs">Итого: {totalHours} час{totalHours === 1 ? '' : totalHours < 5 ? 'а' : 'ов'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all"
              >
                Арендовать — ${totalPrice}
              </button>
            </div>

            {/* Desktop: Rental Info */}
            <div className="hidden lg:block p-4 bg-gradient-to-br from-zinc-800/80 to-zinc-900 border border-zinc-700/50 rounded-2xl mt-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="text-white font-bold text-sm">Сделка под защитой</h4>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                После оплаты вы получите доступ через привязку. Отправьте код в чат поддержки, и мы привяжем ваш аккаунт в течение 5 минут.
              </p>
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="lg:w-[55%] px-4 lg:px-0 py-4 space-y-3">
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

            {/* Account Info - 2 rows of 2 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <span>🆔</span>
                  <span className="text-zinc-400 text-xs">ID аккаунта</span>
                </div>
                <button onClick={copyId} className="flex items-center gap-1.5 text-white font-bold text-sm hover:text-emerald-400 transition-colors">
                  {copiedId ? '✅ Скопировано' : account.id}
                  {!copiedId && (
                    <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <span>🏆</span>
                  <span className="text-zinc-400 text-xs">Коллекция</span>
                </div>
                <span className="text-white font-bold text-sm">{account.collectionLevel}</span>
              </div>
              <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <span>💰</span>
                  <span className="text-zinc-400 text-xs">Цена/час</span>
                </div>
                <span className="text-emerald-400 font-bold text-sm">${account.pricePerHour}</span>
              </div>
              <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <span>⏰</span>
                  <span className="text-zinc-400 text-xs">Срок</span>
                </div>
                <span className="text-white font-bold text-sm">от {account.minHours}ч до {account.maxHours}ч</span>
              </div>
            </div>

            {/* Short Description */}
            <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
              <p className="text-zinc-400 text-xs mb-1">📝 Описание</p>
              <p className="text-white text-sm">{account.description}</p>
            </div>

            {/* Rental Terms */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-amber-400 text-xs font-medium mb-2">⚠️ Условия аренды</p>
              <p className="text-zinc-300 text-sm whitespace-pre-line">{account.rentalTerms}</p>
            </div>

            {/* RP Seasons - new format */}
            <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
              <p className="text-zinc-400 text-xs mb-2">RP</p>
              <div className="space-y-1">
                {account.rpSeasons.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex gap-2 flex-wrap">
                    {row.map((rp, idx) => (
                      <span key={idx} className="text-white text-sm font-medium">{rp}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Accordions */}
            <div className="space-y-2">
              {/* Rare Costumes */}
              <div className="border border-zinc-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowCostumes(!showCostumes)}
                  className="w-full flex items-center justify-between py-3 px-4 bg-zinc-800 hover:bg-zinc-700 transition-all"
                >
                  <span className="text-white font-medium text-sm">👗 Редкие костюмы ({account.rareCostumes.length})</span>
                  <svg className={`w-4 h-4 text-zinc-400 transition-transform ${showCostumes ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showCostumes && (
                  <div className="p-3 bg-zinc-900 space-y-2">
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
              <div className="border border-zinc-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowVehicles(!showVehicles)}
                  className="w-full flex items-center justify-between py-3 px-4 bg-zinc-800 hover:bg-zinc-700 transition-all"
                >
                  <span className="text-white font-medium text-sm">🚗 Скины на транспорт ({account.vehicleSkins.length})</span>
                  <svg className={`w-4 h-4 text-zinc-400 transition-transform ${showVehicles ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showVehicles && (
                  <div className="p-3 bg-zinc-900 space-y-2">
                    {account.vehicleSkins.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-white text-sm">{item.name}</span>
                        <span className={`text-xs font-medium ${getRarityColor(item.rarity)}`}>{item.rarity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weapon Skins */}
              <div className="border border-zinc-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowWeapons(!showWeapons)}
                  className="w-full flex items-center justify-between py-3 px-4 bg-zinc-800 hover:bg-zinc-700 transition-all"
                >
                  <span className="text-white font-medium text-sm">🔫 Скины на оружие ({account.weaponSkins.length})</span>
                  <svg className={`w-4 h-4 text-zinc-400 transition-transform ${showWeapons ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showWeapons && (
                  <div className="p-3 bg-zinc-900 space-y-2">
                    {account.weaponSkins.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-white text-sm">{item.name}</span>
                        <span className={`text-xs font-medium ${getRarityColor(item.rarity)}`}>{item.rarity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Rental Info - Mobile only */}
            <div className="lg:hidden p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
              <h4 className="text-white font-bold text-sm mb-2">Информация об аренде</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                После оплаты вы получите доступ через привязку. Нужно зайти в PUBG Mobile и сгенерировать ID/код в разделе "Центр безопасности" → "Привязка аккаунта". Отправьте код в чат поддержки, и мы привяжем ваш аккаунт в течение 5 минут. После окончания срока аренды доступ автоматически отключается.
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
        {/* Duration selector - centered and aligned */}
        <div className="flex justify-center gap-6 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 w-10">Дни</span>
            <button
              onClick={decreaseDays}
              className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-600 text-white flex items-center justify-center text-lg"
            >
              −
            </button>
            <span className="text-white font-bold text-lg w-6 text-center">{rentalDays}</span>
            <button
              onClick={increaseDays}
              className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-600 text-white flex items-center justify-center text-lg"
            >
              +
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 w-10">Часы</span>
            <button
              onClick={decreaseHours}
              className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-600 text-white flex items-center justify-center text-lg"
            >
              −
            </button>
            <span className="text-white font-bold text-lg w-6 text-center">{rentalHours}</span>
            <button
              onClick={increaseHours}
              className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-600 text-white flex items-center justify-center text-lg"
            >
              +
            </button>
          </div>
        </div>

        {/* Rent button */}
        <button
          onClick={() => setShowPaymentModal(true)}
          className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all"
        >
          Арендовать на {totalHours} час{totalHours === 1 ? '' : totalHours < 5 ? 'а' : 'ов'} — ${totalPrice}
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

export default AccountRentalDetailPage;

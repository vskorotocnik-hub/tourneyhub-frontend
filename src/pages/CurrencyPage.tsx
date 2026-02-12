import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BannerCarousel from '../components/BannerCarousel';
import { banners } from '../data/banners';

interface UCPackage {
  id: string;
  amount: number;
  bonus: number;
  bonusPercent: number;
  price: number;
  popular?: boolean;
  image: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const categories: Category[] = [
  { id: 'uc', name: 'UC', icon: '💎' },
  { id: 'rp', name: 'Royale Pass', icon: '🎫' },
  { id: 'prime', name: 'Prime Plus', icon: '⭐' },
  { id: 'crates', name: 'Crate Coupons', icon: '📦' },
];


const ucPackages: UCPackage[] = [
  { id: 'uc-60', amount: 60, bonus: 0, bonusPercent: 0, price: 0.99, popular: true, image: 'https://static.midasbuy.com/images/pubgm/uc/60uc.png' },
  { id: 'uc-300', amount: 300, bonus: 25, bonusPercent: 8, price: 4.99, popular: true, image: 'https://static.midasbuy.com/images/pubgm/uc/300uc.png' },
  { id: 'uc-325', amount: 325, bonus: 0, bonusPercent: 0, price: 4.99, image: 'https://static.midasbuy.com/images/pubgm/uc/325uc.png' },
  { id: 'uc-600', amount: 600, bonus: 60, bonusPercent: 10, price: 9.99, image: 'https://static.midasbuy.com/images/pubgm/uc/600uc.png' },
  { id: 'uc-1500', amount: 1500, bonus: 300, bonusPercent: 20, price: 24.99, image: 'https://static.midasbuy.com/images/pubgm/uc/1500uc.png' },
  { id: 'uc-3000', amount: 3000, bonus: 850, bonusPercent: 28, price: 49.99, image: 'https://static.midasbuy.com/images/pubgm/uc/3000uc.png' },
  { id: 'uc-6000', amount: 6000, bonus: 2100, bonusPercent: 35, price: 99.99, image: 'https://static.midasbuy.com/images/pubgm/uc/6000uc.png' },
  { id: 'uc-12000', amount: 12000, bonus: 4200, bonusPercent: 35, price: 199.99, image: 'https://static.midasbuy.com/images/pubgm/uc/12000uc.png' },
];

const CurrencyPage = () => {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const [selectedCategory, setSelectedCategory] = useState('uc');
  const [selectedPackage, setSelectedPackage] = useState<UCPackage | null>(null);
  const [depositTarget, setDepositTarget] = useState<'game' | 'site'>('game');
  const [playerId, setPlayerId] = useState('');
  const [playerIdError, setPlayerIdError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const handlePackageSelect = useCallback((pkg: UCPackage) => {
    setSelectedPackage(pkg);
    setDepositTarget('game');
    setPlayerId('');
    setPlayerIdError('');
  }, []);

  const closeModal = useCallback(() => {
    setSelectedPackage(null);
    setDepositTarget('game');
    setPlayerId('');
    setPlayerIdError('');
    setShowConfirmation(false);
  }, []);

  const validatePlayerId = useCallback((id: string) => {
    const regex = /^\d{10}$/;
    return regex.test(id);
  }, []);

  const handleProceedToConfirmation = useCallback(() => {
    if (depositTarget === 'game') {
      if (!playerId.trim()) {
        setPlayerIdError('Введите Player ID');
        return;
      }
      if (!validatePlayerId(playerId)) {
        setPlayerIdError('ID PUBG Mobile должен состоять ровно из 10 цифр');
        return;
      }
    }
    setShowConfirmation(true);
  }, [playerId, validatePlayerId, depositTarget]);

  const handleConfirmPayment = useCallback(() => {
    if (depositTarget === 'game') {
      console.log(`Processing payment for ${selectedPackage?.amount} UC to Player ID: ${playerId}`);
      alert(`Оплата ${selectedPackage?.amount} UC для игрового ID: ${playerId}\nСумма: $${selectedPackage?.price}`);
    } else {
      console.log(`Processing payment for ${selectedPackage?.amount} UC to site account`);
      alert(`Оплата ${selectedPackage?.amount} UC на баланс сайта\nСумма: $${selectedPackage?.price}`);
    }
    closeModal();
  }, [playerId, selectedPackage, closeModal, depositTarget]);

  const handleEditId = useCallback(() => {
    setShowConfirmation(false);
  }, []);

  const gameName = gameId === 'pubg-mobile' ? 'PUBG Mobile' : 'Game';

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
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-white">Игровая валюта</h1>
        </div>

        {/* Banner with Characters - Desktop & Tablet */}
        <section className="hidden md:flex items-stretch h-[280px] lg:h-[320px] relative mb-5">
          {/* Character LEFT */}
          <div className="flex-shrink-0 h-full">
            <img 
              src="/левая.png" 
              alt="Character Left"
              className="h-full w-auto object-contain"
            />
          </div>
          
          {/* Banner Carousel */}
          <div className="flex-1 min-w-0 h-full">
            <BannerCarousel banners={banners} />
          </div>

          {/* Character RIGHT - Desktop only */}
          <div className="hidden lg:block flex-shrink-0 h-full">
            <img 
              src="/правая.png" 
              alt="Character Right"
              className="h-full w-auto object-contain"
            />
          </div>
        </section>

        {/* Banner - Mobile only */}
        <section className="md:hidden h-[200px] mb-5">
          <BannerCarousel banners={banners} />
        </section>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all
                        ${selectedCategory === cat.id
                          ? 'bg-purple-600 text-white font-semibold'
                          : 'bg-white/10 text-white hover:bg-white/20 font-medium'}`}
            >
              <span>{cat.icon}</span>
              <span className="text-sm font-medium">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* UC Packages Grid */}
        {selectedCategory === 'uc' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Unknown Cash (UC)</h3>
              <span className="text-xs text-white/40">Выбери пакет</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {ucPackages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handlePackageSelect(pkg)}
                  className="relative bg-slate-800/80 rounded-xl border border-slate-700/50 
                           hover:border-slate-600 transition-all overflow-hidden group"
                >
                  {/* Popular Badge */}
                  {pkg.popular && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500/90 text-white text-[9px] font-medium rounded z-10">
                      Popular
                    </span>
                  )}
                  
                  {/* Bonus Percent Badge */}
                  {pkg.bonusPercent > 0 && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-orange-500 text-white text-[9px] font-bold rounded z-10">
                      {pkg.bonusPercent}%
                    </span>
                  )}

                  {/* UC Image */}
                  <div className="aspect-square flex items-center justify-center p-3 bg-gradient-to-b from-slate-800 to-slate-900">
                    <img 
                      src={pkg.image} 
                      alt={`${pkg.amount} UC`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<div class="w-16 h-16 flex items-center justify-center"><svg viewBox="0 0 48 48" class="w-full h-full"><rect x="8" y="12" width="32" height="24" rx="2" fill="#D4AF37" stroke="#B8960C" stroke-width="1"/><rect x="12" y="16" width="24" height="16" rx="1" fill="#F4D03F"/><text x="24" y="28" text-anchor="middle" font-size="10" font-weight="bold" fill="#8B7500">UC</text></svg></div>`;
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="p-3 text-center border-t border-slate-700/50">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="4" y="6" width="16" height="12" rx="1" />
                      </svg>
                      <span className="text-white font-bold">{pkg.amount.toLocaleString()}</span>
                      {pkg.bonus > 0 && (
                        <span className="text-emerald-400 font-medium">+{pkg.bonus}</span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm">{pkg.price.toFixed(2)} USD</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Other categories placeholder */}
        {selectedCategory !== 'uc' && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">{categories.find(c => c.id === selectedCategory)?.icon}</p>
            <p className="text-white/60 text-sm">Раздел "{categories.find(c => c.id === selectedCategory)?.name}" скоро будет доступен</p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 bg-slate-800/50 rounded-xl border border-white/10 p-4">
          <p className="text-sm font-semibold text-white mb-2">ℹ️ Важная информация</p>
          <ul className="space-y-1.5 text-xs text-white/60">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>UC зачисляются мгновенно после оплаты</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Убедитесь, что Player ID указан верно</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Возврат средств невозможен после зачисления</span>
            </li>
          </ul>
        </div>
      </main>

      {/* Purchase Modal */}
      {selectedPackage && !showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />
          
          <div className="relative w-full max-w-lg bg-slate-900 rounded-t-3xl border-t border-slate-700 p-4 pb-8 animate-slide-up"
               style={{ marginBottom: '72px' }}>
            <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="6" width="16" height="12" rx="1" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">
                    {selectedPackage.amount.toLocaleString()} UC
                    {selectedPackage.bonus > 0 && (
                      <span className="text-emerald-400 text-sm ml-1">+{selectedPackage.bonus}</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-400">${selectedPackage.price} USD</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Deposit Target Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">
                Куда зачислить UC
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setDepositTarget('game'); setPlayerIdError(''); }}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    depositTarget === 'game'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-700 bg-slate-800/60 hover:border-slate-600'
                  }`}
                >
                  <span className="text-2xl">🎮</span>
                  <span className="text-sm font-semibold text-white">Игровой аккаунт</span>
                  <span className="text-xs text-slate-400 text-center leading-tight">UC на аккаунт PUBG Mobile</span>
                  {depositTarget === 'game' && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
                <button
                  onClick={() => { setDepositTarget('site'); setPlayerIdError(''); }}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    depositTarget === 'site'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-800/60 hover:border-slate-600'
                  }`}
                >
                  <span className="text-2xl">🏆</span>
                  <span className="text-sm font-semibold text-white">Аккаунт сайта</span>
                  <span className="text-xs text-slate-400 text-center leading-tight">UC для участия в турнирах</span>
                  {depositTarget === 'site' && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Player ID Input — only for game account */}
            {depositTarget === 'game' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  ID PUBG Mobile
                </label>
                <input
                  type="text"
                  value={playerId}
                  onChange={(e) => {
                    setPlayerId(e.target.value.replace(/\D/g, ''));
                    setPlayerIdError('');
                  }}
                  placeholder="Введите 10-значный ID"
                  className={`w-full px-4 py-3 rounded-xl bg-slate-800 border text-white placeholder-slate-500
                            focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all
                            ${playerIdError ? 'border-red-500' : 'border-slate-700'}`}
                  maxLength={10}
                />
                {playerIdError && (
                  <p className="text-red-400 text-xs mt-1">{playerIdError}</p>
                )}
                <p className="text-slate-400 text-xs mt-1.5">
                  {playerId.length}/10 цифр
                </p>
              </div>
            )}

            {/* Site account info */}
            {depositTarget === 'site' && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400">ℹ️</span>
                  <p className="text-xs text-emerald-200">
                    UC будут зачислены на ваш баланс на сайте. Вы сможете использовать их для участия в турнирах или вывести себе на аккаунт PUBG Mobile.
                  </p>
                </div>
              </div>
            )}

            {/* Warning — only for game account */}
            {depositTarget === 'game' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-amber-400">⚠️</span>
                  <p className="text-xs text-amber-200">
                    Проверьте правильность ID. После оплаты UC будут зачислены на указанный аккаунт. 
                    Возврат средств при неверном ID невозможен.
                  </p>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-slate-800/60 rounded-xl p-3 mb-5 border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">Пакет</span>
                <span className="text-sm text-white">{selectedPackage.amount} UC {selectedPackage.bonus > 0 && `+ ${selectedPackage.bonus}`}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">Итого UC</span>
                <span className="text-sm text-white font-medium">{(selectedPackage.amount + selectedPackage.bonus).toLocaleString()} UC</span>
              </div>
              <div className="border-t border-slate-700 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-white">К оплате</span>
                  <span className="text-lg font-bold text-white">${selectedPackage.price}</span>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handleProceedToConfirmation}
              className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500
                       text-white font-semibold transition-all shadow-lg shadow-purple-500/20"
            >
              Оплатить ${selectedPackage.price}
            </button>

            {/* Payment Methods */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="text-xs text-slate-500">Способы оплаты:</span>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400">Visa</div>
                <div className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400">MasterCard</div>
                <div className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400">Crypto</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ID Confirmation Modal */}
      {selectedPackage && showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleEditId}
          />
          
          <div className="relative w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-700 p-5 animate-slide-up">
            {/* Header */}
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Подтверждение</h3>
              <p className="text-sm text-slate-400 mt-1">
                {depositTarget === 'game' ? 'Убедитесь, что ID указан верно' : 'Проверьте данные перед оплатой'}
              </p>
            </div>

            {/* Deposit Target Display */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4 text-center">
              {depositTarget === 'game' ? (
                <>
                  <p className="text-xs text-slate-500 mb-1">🎮 Игровой аккаунт PUBG Mobile</p>
                  <p className="text-2xl font-bold text-white font-mono tracking-wider">{playerId}</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-500 mb-1">🏆 Аккаунт сайта</p>
                  <p className="text-lg font-bold text-emerald-400">На баланс сайта</p>
                </>
              )}
            </div>

            {/* Package Info */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Пакет</span>
                <span className="text-sm text-white font-medium">
                  {selectedPackage.amount} UC {selectedPackage.bonus > 0 && `+ ${selectedPackage.bonus}`}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-slate-400">Сумма</span>
                <span className="text-sm text-white font-bold">${selectedPackage.price}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleEditId}
                className="flex-1 py-3 rounded-xl bg-slate-800 border border-slate-600
                         text-white font-medium hover:bg-slate-700 transition-all"
              >
                Изменить
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500
                         text-white font-semibold transition-all shadow-lg shadow-emerald-500/20"
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

export default CurrencyPage;

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerCarousel from '../components/BannerCarousel';
import DepositTicker from '../components/DepositTicker';
import { banners } from '../data/banners';
import { recentDeposits } from '../data/deposits';

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  image: string;
  gradient: string;
}

const categories: Category[] = [
  { id: 'accounts', name: 'Аккаунты', icon: '👤', description: 'Купить / Продать', image: '/accounts.png', gradient: 'from-blue-600/80 to-cyan-700/90' },
  { id: 'account-rental', name: 'Аренда аккаунтов', icon: '🔑', description: 'Возьми на время', image: '/rent.png', gradient: 'from-pink-600/80 to-purple-700/90' },
  { id: 'tournaments', name: 'Турниры', icon: '🏆', description: 'Соревнуйся и выигрывай', image: '/tournaments.png', gradient: 'from-yellow-600/80 to-orange-700/90' },
  { id: 'global-tournament', name: 'Глобальный турнир', icon: '🌍', description: 'Мировой чемпионат', image: '/global-tournament.png', gradient: 'from-purple-600/80 to-pink-700/90' },
  { id: 'currency', name: 'Игровая валюта', icon: '💎', description: 'UC, CP и другие', image: '/currency.png', gradient: 'from-emerald-600/80 to-teal-700/90' },
  { id: 'boost', name: 'Буст', icon: '🚀', description: 'Прокачка рейтинга', image: '/training.png', gradient: 'from-amber-600/80 to-yellow-700/90' },
  { id: 'coaching', name: 'Обучение', icon: '🎓', description: 'Прокачай скилл', image: '/обучения.png', gradient: 'from-indigo-600/80 to-violet-700/90' },
  { id: 'clan', name: 'Клан', icon: '🛡️', description: 'Небесная Арена', image: '/clans.png', gradient: 'from-red-600/80 to-rose-700/90' },
];

// Speech bubble quotes data
const itachiQuotes = {
  left: {
    title: 'ITACHI UCHIHA — QUOTE #1',
    text: '«Каким бы сильным ты не стал, никогда не пытайся справиться со всем в одиночку. Если сделаешь так — потерпишь неудачу.»',
  },
  right: {
    title: 'ITACHI UCHIHA — QUOTE #2',
    text: '«Не так страшно подражать своему кумиру, но не стоит делать из себя его копию.»',
  },
};

const HomePage = () => {
  const navigate = useNavigate();
  const [activeBubble, setActiveBubble] = useState<'left' | 'right' | null>(null);
  const leftCharacterRef = useRef<HTMLDivElement>(null);
  const rightCharacterRef = useRef<HTMLDivElement>(null);

  // Auto-close bubble after 6 seconds
  useEffect(() => {
    if (!activeBubble) return;
    const timer = setTimeout(() => {
      setActiveBubble(null);
    }, 9000);
    return () => clearTimeout(timer);
  }, [activeBubble]);

  // Close bubble on click outside
  useEffect(() => {
    if (!activeBubble) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const leftContains = leftCharacterRef.current?.contains(target);
      const rightContains = rightCharacterRef.current?.contains(target);
      
      if (!leftContains && !rightContains) {
        setActiveBubble(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeBubble]);

  const handleCharacterClick = (side: 'left' | 'right') => {
    setActiveBubble(prev => prev === side ? null : side);
  };

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'tournaments') {
      navigate('/game/pubg-mobile');
    } else if (categoryId === 'global-tournament') {
      navigate('/global-tournaments');
    } else if (categoryId === 'currency') {
      navigate('/game/pubg-mobile/currency');
    } else if (categoryId === 'coaching') {
      navigate('/game/pubg-mobile/training');
    } else if (categoryId === 'account-rental') {
      navigate('/game/pubg-mobile/account-rental');
    } else if (categoryId === 'accounts') {
      navigate('/game/pubg-mobile/accounts');
    } else if (categoryId === 'boost') {
      navigate('/game/pubg-mobile/boost');
    } else if (categoryId === 'clan') {
      navigate('/clan');
    }
  };

  return (
    <div className="min-h-screen pb-40">
      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-4 md:px-8 pt-0 pb-1 md:py-4 space-y-6">
        {/* Banner with Anime Character - Desktop & Tablet */}
        <section className="hidden md:flex items-stretch h-[280px] lg:h-[320px] relative">
          {/* Anime Character LEFT - same height as banner */}
          <div className="flex-shrink-0 h-full relative" ref={leftCharacterRef}>
            <img 
              src="/edited-photo.png" 
              alt="Itachi Uchiha"
              className="h-full w-auto object-contain cursor-pointer hover:scale-105 transition-transform duration-300"
              style={{ backfaceVisibility: 'hidden', willChange: 'transform' }}
              onClick={() => handleCharacterClick('left')}
            />
            {/* Speech Bubble LEFT */}
            {activeBubble === 'left' && (
              <div className="absolute top-0 left-[90%] z-50 animate-in fade-in zoom-in-95 duration-300">
                {/* Comic dots connector */}
                <div className="absolute -left-8 top-6 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-4 h-4 rounded-full bg-red-500/80" />
                </div>
                <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-red-500/40 rounded-xl p-4 min-w-[280px] max-w-[320px] shadow-2xl shadow-red-500/30 overflow-hidden">
                  {/* Akatsuki clouds background */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <ellipse cx="20" cy="30" rx="12" ry="8" fill="#dc2626" />
                      <ellipse cx="75" cy="70" rx="15" ry="10" fill="#dc2626" />
                      <ellipse cx="50" cy="50" rx="10" ry="6" fill="#dc2626" />
                    </svg>
                  </div>
                  {/* Tail pointing left */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-red-500/40" />
                  <div className="absolute -left-[10px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-zinc-900/95" />
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-600/15 via-transparent to-red-900/20 pointer-events-none" />
                  {/* Content */}
                  <div className="relative">
                    <h4 className="text-xs uppercase tracking-widest text-red-400 font-bold mb-1">{itachiQuotes.left.title}</h4>
                    <div className="w-12 h-px bg-gradient-to-r from-red-500 to-transparent mb-3" />
                    <p className="text-sm text-zinc-100 leading-relaxed font-medium">{itachiQuotes.left.text}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Banner Carousel - fixed height, flexible width */}
          <div className="flex-1 min-w-0 h-full">
            <BannerCarousel banners={banners} />
          </div>

          {/* Anime Character RIGHT - Desktop only */}
          <div className="hidden lg:block flex-shrink-0 h-full relative" ref={rightCharacterRef}>
            <img 
              src="/edited-photo.png" 
              alt="Itachi Uchiha"
              className="h-full w-auto object-contain cursor-pointer transition-transform duration-300 hover:scale-105"
              style={{ backfaceVisibility: 'hidden', willChange: 'transform', transform: 'scaleX(-1)' }}
              onClick={() => handleCharacterClick('right')}
            />
            {/* Speech Bubble RIGHT - appears on left side of character */}
            {activeBubble === 'right' && (
              <div className="absolute top-0 right-[90%] z-50 animate-in fade-in zoom-in-95 duration-300">
                {/* Comic dots connector */}
                <div className="absolute -right-8 top-6 flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-2 h-2 rounded-full bg-red-500/60" />
                </div>
                <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-red-500/40 rounded-xl p-4 min-w-[280px] max-w-[320px] shadow-2xl shadow-red-500/30 overflow-hidden">
                  {/* Akatsuki clouds background */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <ellipse cx="80" cy="30" rx="12" ry="8" fill="#dc2626" />
                      <ellipse cx="25" cy="70" rx="15" ry="10" fill="#dc2626" />
                      <ellipse cx="50" cy="50" rx="10" ry="6" fill="#dc2626" />
                    </svg>
                  </div>
                  {/* Tail pointing right */}
                  <div className="absolute -right-3 top-6 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[12px] border-l-red-500/40" />
                  <div className="absolute -right-[10px] top-6 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[12px] border-l-zinc-900/95" />
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-600/15 via-transparent to-red-900/20 pointer-events-none" />
                  {/* Content */}
                  <div className="relative">
                    <h4 className="text-xs uppercase tracking-widest text-red-400 font-bold mb-1">{itachiQuotes.right.title}</h4>
                    <div className="w-12 h-px bg-gradient-to-r from-red-500 to-transparent mb-3" />
                    <p className="text-sm text-zinc-100 leading-relaxed font-medium">{itachiQuotes.right.text}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Banner Carousel - Mobile only */}
        <section className="md:hidden">
          <BannerCarousel banners={banners} />
        </section>

        {/* Deposit Ticker */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <span className="text-sm text-white/70">Последние покупки</span>
          </div>
          <DepositTicker deposits={recentDeposits} />
        </section>

        {/* PUBG Mobile Categories */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <img src="https://play-lh.googleusercontent.com/JRd05pyBH41qjgsJuWduRJpDeZG0Hnb0yjf2nWqO7VaGKL10-G5UIygxED-WNOc3pg" alt="PUBG Mobile" className="w-10 h-10 rounded-xl" />
            <h2 className="text-lg font-bold text-white">PUBG Mobile</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="relative overflow-hidden rounded-2xl aspect-[4/3]
                          border border-white/20
                          shadow-[0_0_20px_rgba(255,255,255,0.08),0_0_40px_rgba(255,255,255,0.04)]
                          hover:shadow-[0_0_25px_rgba(255,255,255,0.15),0_0_50px_rgba(255,255,255,0.08)]
                          hover:-translate-y-1.5 hover:border-white/40
                          transition-all duration-300 ease-out
                          group text-left"
              >
                {/* Background Image */}
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Dark Gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                {/* Content */}
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <span className="text-2xl mb-1">{category.icon}</span>
                  <p className="text-sm font-bold text-white drop-shadow-lg">{category.name}</p>
                  <p className="text-xs text-white/80 drop-shadow">{category.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// 10 призов за разные этажи (1-100), первый приз $20, каждый следующий x2
const prizes = [
  { id: 1, floor: 5, amount: '$20' },
  { id: 2, floor: 12, amount: '$40' },
  { id: 3, floor: 21, amount: '$80' },
  { id: 4, floor: 33, amount: '$160' },
  { id: 5, floor: 44, amount: '$320' },
  { id: 6, floor: 56, amount: '$640' },
  { id: 7, floor: 67, amount: '$1 280' },
  { id: 8, floor: 78, amount: '$2 560' },
  { id: 9, floor: 89, amount: '$5 120' },
  { id: 10, floor: 100, amount: '$10 240' },
];

// 10 участников с полной информацией
const participants = [
  { id: 1, odId: '5847291036', nickname: 'Mif Graf', towerLevel: 18, joinDate: '15.01.2026', joinCost: '$25', totalWon: '$60', avatar: '😎' },
  { id: 2, odId: '7182940365', nickname: 'NightHawk', towerLevel: 35, joinDate: '10.01.2026', joinCost: '$25', totalWon: '$140', avatar: '🦅' },
  { id: 3, odId: '9283746501', nickname: 'Shadow', towerLevel: 14, joinDate: '18.01.2026', joinCost: '$25', totalWon: '$40', avatar: '👤' },
  { id: 4, odId: '6192837465', nickname: 'Phoenix', towerLevel: 92, joinDate: '05.01.2026', joinCost: '$25', totalWon: '$8 060', avatar: '🔥' },
  { id: 5, odId: '3847291065', nickname: 'Storm', towerLevel: 9, joinDate: '20.01.2026', joinCost: '$25', totalWon: '$20', avatar: '⚡' },
  { id: 6, odId: '8273640192', nickname: 'Dragon', towerLevel: 71, joinDate: '08.01.2026', joinCost: '$25', totalWon: '$1 280', avatar: '🐉' },
  { id: 7, odId: '1928374650', nickname: 'Wolf', towerLevel: 48, joinDate: '12.01.2026', joinCost: '$25', totalWon: '$460', avatar: '🐺' },
  { id: 8, odId: '4657382910', nickname: 'Tiger', towerLevel: 7, joinDate: '22.01.2026', joinCost: '$25', totalWon: '$20', avatar: '🐯' },
  { id: 9, odId: '7391028465', nickname: 'Blaze', towerLevel: 4, joinDate: '24.01.2026', joinCost: '$25', totalWon: '$0', avatar: '💥' },
  { id: 10, odId: '2938471650', nickname: 'King', towerLevel: 2, joinDate: '25.01.2026', joinCost: '$25', totalWon: '$0', avatar: '👑' },
];

const ClanPage = () => {
  const navigate = useNavigate();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPrizesInfo, setShowPrizesInfo] = useState(false);
  const [showParticipantsInfo, setShowParticipantsInfo] = useState(false);
  const [showWhatIsThis, setShowWhatIsThis] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [agreedToRules, setAgreedToRules] = useState(false);
  const carouselTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Пауза карусели с таймером возобновления
  const pauseCarousel = () => {
    setIsCarouselPaused(true);
    if (carouselTimeoutRef.current) {
      clearTimeout(carouselTimeoutRef.current);
    }
    carouselTimeoutRef.current = setTimeout(() => {
      if (!selectedParticipant) {
        setIsCarouselPaused(false);
      }
    }, 5000);
  };
  
  // Функции для открытия карточек с закрытием других
  const openPrizesInfo = () => {
    setShowParticipantsInfo(false);
    setSelectedParticipant(null);
    setShowWhatIsThis(false);
    setShowPrizesInfo(!showPrizesInfo);
  };
  
  const openParticipantsInfo = () => {
    setShowPrizesInfo(false);
    setSelectedParticipant(null);
    setShowWhatIsThis(false);
    setShowParticipantsInfo(!showParticipantsInfo);
  };
  
  const openParticipantCard = (id: number) => {
    setShowPrizesInfo(false);
    setShowParticipantsInfo(false);
    setShowWhatIsThis(false);
    setSelectedParticipant(selectedParticipant === id ? null : id);
  };
  
  const openWhatIsThis = () => {
    setShowPrizesInfo(false);
    setShowParticipantsInfo(false);
    setSelectedParticipant(null);
    setShowWhatIsThis(!showWhatIsThis);
  };
  
  // Состояния для процесса вступления в клан
  const [pubgId, setPubgId] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<typeof participants[0] | null>(null);
  
  // Функция оплаты и запуска карусели
  const handlePayment = () => {
    if (!pubgId.trim()) return;
    setIsPaid(true);
    setIsSpinning(true);
    
    // Карусель крутится 4 секунды, потом останавливается на рандомном участнике
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * participants.length);
      setSelectedOpponent(participants[randomIndex]);
      setIsSpinning(false);
    }, 4000);
  };

  return (
    <div className="h-screen relative overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/clan-bg.png.png')" }}
      />
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/20 to-zinc-950/50" />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.6)_100%)]" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-red-900/50 flex items-center justify-center text-white hover:bg-red-900/40 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Title */}
        <div className="py-3 text-center">
          <h1 
            className="text-3xl md:text-4xl tracking-widest uppercase"
            style={{ 
              fontFamily: "'Russo One', sans-serif",
              color: '#e8a845',
              textShadow: `
                0 0 8px rgba(255, 120, 50, 0.4),
                0 0 20px rgba(200, 80, 30, 0.3),
                0 2px 4px rgba(0, 0, 0, 0.8)
              `,
              WebkitTextStroke: '1px #6b2a0a',
              animation: 'subtlePulse 3s ease-in-out infinite',
            }}
          >
            New Era
          </h1>
        </div>
        
        {/* Subtle pulse animation */}
        <style>{`
          @keyframes subtlePulse {
            0%, 100% {
              transform: scale(1);
              text-shadow: 
                0 0 8px rgba(255, 120, 50, 0.4),
                0 0 20px rgba(200, 80, 30, 0.3),
                0 2px 4px rgba(0, 0, 0, 0.8);
            }
            50% {
              transform: scale(1.03);
              text-shadow: 
                0 0 12px rgba(255, 140, 60, 0.5),
                0 0 25px rgba(220, 100, 40, 0.4),
                0 2px 4px rgba(0, 0, 0, 0.8);
            }
          }
          @keyframes slideUpModal {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-scroll {
            animation: scroll 20s linear infinite;
          }
        `}</style>

        {/* Mobile Layout - только на мобильных */}
        <div className="flex-1 flex flex-col md:hidden px-4 pb-4 relative">
          {/* Верхняя панель с кнопками */}
          <div className="flex justify-between items-center mb-2">
            {/* Что это? - слева */}
            <button
              onClick={openWhatIsThis}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 border border-zinc-600/40 rounded-lg text-zinc-300 hover:bg-zinc-700/50 transition-all text-xs"
            >
              <span className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold">?</span>
              <span className="font-bold">Что это?</span>
            </button>
            
            {/* Призы за этаж - справа */}
            <button
              onClick={openPrizesInfo}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/30 border border-amber-600/40 rounded-lg text-amber-400 hover:bg-amber-800/40 transition-all text-xs"
            >
              <span>🏆</span>
              <span className="font-bold">Призы за этаж</span>
              <svg className={`w-3 h-3 transition-transform ${showPrizesInfo ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Пустое пространство для башни */}
          <div className="flex-1"></div>
          
          {/* Попап "Что это?" на мобильных */}
          {showWhatIsThis && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowWhatIsThis(false)}
              />
              <div 
                className="fixed inset-x-4 top-28 z-50 bg-zinc-900/98 backdrop-blur-sm rounded-2xl p-4 border border-zinc-600/50"
                style={{ boxShadow: '0 4px 40px rgba(0, 0, 0, 0.8)' }}
              >
                <h3 className="text-white font-bold text-lg mb-3 text-center">❓ Что такое "Призы за этажи"?</h3>
                <div className="text-zinc-300 text-sm space-y-3">
                  <p>
                    <strong className="text-amber-400">Призы за этажи</strong> — это система вознаграждений для участников клана.
                  </p>
                  <p>
                    Каждый участник клана имеет свой <strong className="text-amber-400">уровень башни</strong>. 
                    Чем выше ваш этаж — тем больше призов вы получаете!
                  </p>
                  <p>
                    Повышайте свой уровень, побеждая в матчах и показывая хорошие результаты. 
                    Призы начисляются автоматически в конце каждого месяца.
                  </p>
                </div>
              </div>
            </>
          )}
          
          {/* Попап призов на мобильных */}
          {showPrizesInfo && (
            <>
              {/* Overlay для закрытия при клике вне */}
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowPrizesInfo(false)}
              />
              <div 
                className="fixed inset-x-4 top-28 z-50 bg-zinc-900/98 backdrop-blur-sm rounded-2xl p-4 border border-amber-700/50 max-h-[55vh] overflow-y-auto"
                style={{ boxShadow: '0 4px 40px rgba(0, 0, 0, 0.8)' }}
              >
                <h3 className="text-amber-400 font-bold text-lg mb-3 text-center">🏆 Призы за этажи</h3>
                <div className="grid grid-cols-2 gap-2">
                  {prizes.map((prize) => (
                    <div
                      key={prize.id}
                      className="flex items-center justify-between bg-black/40 border border-amber-900/30 rounded-lg px-3 py-2"
                    >
                      <span className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                        <span className="w-6 h-6 flex items-center justify-center bg-amber-900/50 rounded">
                          {prize.floor}
                        </span>
                        <span className="text-zinc-400 text-xs">этаж</span>
                      </span>
                      <span className="text-amber-400 font-bold text-sm">{prize.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {/* Участники - 3 в ряд с полной информацией */}
          <div className="mb-4">
            <p className="text-center text-red-400 text-xs font-bold mb-2">👥 Участники клана</p>
            <div 
              className="overflow-x-auto scrollbar-hide"
              onTouchStart={pauseCarousel}
              onScroll={pauseCarousel}
            >
              <div 
                className={`flex gap-2 pb-2 ${isCarouselPaused || selectedParticipant ? '' : 'animate-scroll'}`}
                style={{ width: 'max-content' }}
              >
                {[...participants, ...participants].map((p, idx) => (
                  <button
                    key={`${p.id}-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      openParticipantCard(p.id);
                    }}
                    className={`w-[120px] h-[140px] rounded-xl p-2 flex flex-col items-center gap-1 transition-all shrink-0 ${
                      selectedParticipant === p.id 
                        ? 'bg-red-600/50 border-2 border-red-500' 
                        : 'bg-black/50 border border-red-900/30'
                    }`}
                  >
                    {/* Аватар/Фото */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-900 to-red-950 flex items-center justify-center text-2xl border-2 border-red-700/50 shrink-0">
                      {p.avatar}
                    </div>
                    {/* Ник */}
                    <span className="text-white text-xs font-bold truncate w-full text-center mt-1">{p.nickname}</span>
                    {/* Инфо */}
                    <div className="flex flex-col items-center text-xs mt-auto">
                      <span className="text-amber-400">🗼 Ур. {p.towerLevel}</span>
                      <span className="text-emerald-400 font-bold">{p.totalWon}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Кнопка на всю ширину */}
          <button
            onClick={() => {
              setShowPrizesInfo(false);
              setShowParticipantsInfo(false);
              setSelectedParticipant(null);
              setShowJoinModal(true);
            }}
            className="w-full py-4 rounded-xl font-bold text-lg text-white transition-all active:scale-95"
            style={{
              background: isPaid 
                ? 'linear-gradient(135deg, rgba(16,185,129,0.4) 0%, rgba(34,197,94,0.4) 50%, rgba(16,185,129,0.4) 100%)'
                : 'linear-gradient(135deg, rgba(139,0,0,0.6) 0%, rgba(220,38,38,0.6) 50%, rgba(139,0,0,0.6) 100%)',
              boxShadow: isPaid 
                ? '0 0 20px rgba(16, 185, 129, 0.3)' 
                : '0 0 30px rgba(220, 38, 38, 0.4)',
              border: isPaid ? '2px solid rgba(16, 185, 129, 0.5)' : '2px solid rgba(220, 38, 38, 0.6)',
            }}
          >
            {isPaid ? 'Открыть матч ⚔️' : 'Вступить в клан'}
          </button>
        </div>
        
        {/* Desktop Layout - скрыт на мобильных */}
        <div className="hidden md:flex flex-1 px-4 pb-4 gap-6 overflow-hidden">
          
          {/* Left - Prizes */}
          <div className="w-48 lg:w-56 flex flex-col shrink-0">
            <div className="relative flex items-center justify-center gap-2 mb-2">
              <h2 
                className="text-amber-400 font-bold text-sm"
                style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.4)' }}
              >
                🏆 Призы за этажи
              </h2>
              <button
                onClick={openPrizesInfo}
                className="w-5 h-5 rounded-full bg-amber-900/50 border border-amber-600/50 flex items-center justify-center text-amber-400 text-xs hover:bg-amber-800/50 transition-all"
              >
                ?
              </button>
              
              {/* Prizes Info Popup - справа от блока */}
              {showPrizesInfo && (
                <div 
                  className="absolute top-0 left-full ml-4 z-50 w-64 bg-zinc-900/95 backdrop-blur-sm rounded-xl p-4 border border-amber-700/50"
                  style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)' }}
                >
                  <button
                    onClick={() => setShowPrizesInfo(false)}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs hover:text-white transition-all"
                  >
                    ✕
                  </button>
                  <h3 className="text-amber-400 font-bold text-sm mb-2">Как работают призы?</h3>
                  <div className="space-y-2 text-zinc-300 text-xs">
                    <p><span className="text-amber-400">Башня</span> — система уровней клана. За каждый этаж вы получаете приз.</p>
                    <p>Чем выше этаж — тем больше награда!</p>
                    <div className="bg-amber-900/30 border border-amber-800/40 rounded p-2 mt-2">
                      <p className="text-amber-300">💡 Пример: 5 этаж = <span className="font-bold">$20</span></p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto scrollbar-hide max-h-40 md:max-h-none md:flex-1">
              {prizes.map((prize) => (
                <div
                  key={prize.id}
                  className="flex items-center justify-between bg-black/40 backdrop-blur-sm border border-amber-900/30 rounded-lg px-3 py-2 hover:border-amber-600/50 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center bg-amber-900/50 rounded text-amber-400 font-bold text-xs">
                      {prize.floor}
                    </span>
                    <span className="text-zinc-300 text-sm">Этаж</span>
                  </div>
                  <span className="text-amber-400 font-bold text-sm">{prize.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center - Button */}
          <div className="flex-1 flex flex-col items-center justify-center md:justify-end pb-4 md:pb-6 order-first md:order-none">
            <button
              onClick={() => {
                setShowPrizesInfo(false);
                setShowParticipantsInfo(false);
                setSelectedParticipant(null);
                setShowJoinModal(true);
              }}
              className={`group relative px-10 md:px-24 py-3 rounded-xl font-bold text-lg text-white overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer`}
              style={{
                background: isPaid 
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(34,197,94,0.3) 50%, rgba(16,185,129,0.3) 100%)'
                  : 'linear-gradient(135deg, rgba(139,0,0,0.5) 0%, rgba(220,38,38,0.5) 50%, rgba(139,0,0,0.5) 100%)',
                boxShadow: isPaid 
                  ? '0 0 20px rgba(16, 185, 129, 0.3)' 
                  : '0 0 30px rgba(220, 38, 38, 0.5), 0 0 60px rgba(139, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                border: isPaid ? '2px solid rgba(16, 185, 129, 0.4)' : '2px solid rgba(220, 38, 38, 0.6)',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative">{isPaid ? 'Открыть матч ⚔️' : 'Вступить в клан'}</span>
            </button>
          </div>

          {/* Right - Participants */}
          <div className="w-full md:w-48 lg:w-56 flex flex-col shrink-0">
            <div className="relative flex items-center justify-center gap-2 mb-2">
              <h2 
                className="text-red-400 font-bold text-sm"
                style={{ textShadow: '0 0 10px rgba(220, 38, 38, 0.4)' }}
              >
                👥 Участники клана
              </h2>
              <button
                onClick={openParticipantsInfo}
                className="w-5 h-5 rounded-full bg-red-900/50 border border-red-600/50 flex items-center justify-center text-red-400 text-xs hover:bg-red-800/50 transition-all"
              >
                ?
              </button>
              
              {/* Participants Info Popup - слева от блока */}
              {showParticipantsInfo && (
                <div 
                  className="absolute top-0 right-full mr-4 z-50 w-64 bg-zinc-900/95 backdrop-blur-sm rounded-xl p-4 border border-red-700/50"
                  style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)' }}
                >
                  <button
                    onClick={() => setShowParticipantsInfo(false)}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs hover:text-white transition-all"
                  >
                    ✕
                  </button>
                  <h3 className="text-red-400 font-bold text-sm mb-2">Как попасть в клан?</h3>
                  <div className="space-y-2 text-zinc-300 text-xs">
                    <p><span className="text-red-400">1.</span> Нажмите "Вступить в клан"</p>
                    <p><span className="text-red-400">2.</span> Оплатите взнос ($25)</p>
                    <p><span className="text-red-400">3.</span> Получите приглашение в игре</p>
                    <div className="bg-red-900/30 border border-red-800/40 rounded p-2 mt-2">
                      <p className="text-red-300">🗼 Цифра рядом с ником — уровень башни участника</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto scrollbar-hide max-h-40 md:max-h-none md:flex-1">
              {participants.map((p) => (
                <div
                  key={p.id}
                  onClick={() => openParticipantCard(p.id)}
                  className="flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-red-900/30 rounded-lg px-3 py-2 hover:border-red-600/50 transition-all cursor-pointer"
                >
                  <span className="w-6 h-6 flex items-center justify-center bg-red-900/50 rounded text-red-400 font-bold text-xs">
                    {p.id}
                  </span>
                  <span className="flex-1 text-white text-sm font-medium truncate">{p.nickname}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-400 text-xs">🗼</span>
                    <span className="text-amber-400 font-bold text-sm">{p.towerLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Join Modal - снизу экрана, не перекрывает верх */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent"
            onClick={() => setShowJoinModal(false)}
          />
          <div 
            className="relative w-full max-w-4xl mx-4 mb-4 max-h-[65vh] overflow-hidden"
            style={{
              borderRadius: '24px 24px 16px 16px',
              border: '2px solid rgba(139, 0, 0, 0.5)',
              boxShadow: '0 -10px 60px rgba(139, 0, 0, 0.3), 0 0 100px rgba(0,0,0,0.8)',
              animation: 'slideUpModal 3s ease-out forwards',
            }}
          >
            {/* Фон с башней */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: "url('/clan-bg.png.png')" }}
            />
            <div className="absolute inset-0 bg-black/60" />
            
            {/* Контент с прокруткой */}
            <div className="relative overflow-y-auto scrollbar-hide max-h-[65vh]">
            
            {/* Декоративная линия сверху */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent rounded-full z-10" />
            
            <div className="p-6 md:p-8">
              {/* Контент после оплаты - VS экран */}
              {isPaid ? (
                <div className="text-center">
                  <h3 
                    className="text-2xl md:text-3xl font-bold mb-8"
                    style={{ 
                      color: '#e8a845',
                      textShadow: '0 0 20px rgba(255, 120, 50, 0.5)',
                    }}
                  >
                    {isSpinning ? 'Определяем участника...' : 'Ваш матч готов!'}
                  </h3>
                  
                  {/* VS секция */}
                  <div className="flex items-center justify-center gap-4 md:gap-8 mb-8">
                    {/* Игрок (вы) */}
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-900 flex items-center justify-center text-4xl md:text-5xl border-4 border-emerald-500/50 shadow-lg shadow-emerald-500/30">
                        🎮
                      </div>
                      <p className="text-white font-bold mt-3 text-lg">Вы</p>
                      <p className="text-zinc-400 text-sm">ID: {pubgId}</p>
                    </div>
                    
                    {/* VS */}
                    <div 
                      className="text-4xl md:text-6xl font-black"
                      style={{
                        color: '#dc2626',
                        textShadow: '0 0 30px rgba(220, 38, 38, 0.8)',
                        animation: isSpinning ? 'pulse 0.5s ease-in-out infinite' : 'none',
                      }}
                    >
                      VS
                    </div>
                    
                    {/* Соперник (карусель или выбранный) */}
                    <div className="flex flex-col items-center">
                      {isSpinning ? (
                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center border-4 border-red-500/50 shadow-lg shadow-red-500/30 overflow-hidden">
                          <div 
                            className="flex flex-col items-center"
                            style={{
                              animation: 'spinCarousel 0.3s linear infinite',
                            }}
                          >
                            {participants.map((p, i) => (
                              <span key={i} className="text-4xl md:text-5xl">{p.avatar}</span>
                            ))}
                          </div>
                        </div>
                      ) : selectedOpponent ? (
                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-4xl md:text-5xl border-4 border-red-500/50 shadow-lg shadow-red-500/30">
                          {selectedOpponent.avatar}
                        </div>
                      ) : null}
                      <p className="text-white font-bold mt-3 text-lg">
                        {isSpinning ? '...' : selectedOpponent?.nickname}
                      </p>
                      <p className="text-zinc-400 text-sm">
                        {isSpinning ? 'Выбор...' : `ID: ${selectedOpponent?.odId}`}
                      </p>
                    </div>
                  </div>
                  
                  {/* Кнопка перейти в чат */}
                  {!isSpinning && selectedOpponent && (
                    <div className="space-y-4">
                      <p className="text-zinc-400 text-sm mb-4">
                        Теперь договоритесь о времени и правилах игры в чате
                      </p>
                      <button 
                        className="px-8 py-4 rounded-xl font-bold text-white transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mx-auto"
                        style={{
                          background: 'linear-gradient(135deg, rgba(139,0,0,0.5) 0%, rgba(220,38,38,0.5) 50%, rgba(139,0,0,0.5) 100%)',
                          boxShadow: '0 0 30px rgba(220, 38, 38, 0.3)',
                          border: '1px solid rgba(220, 38, 38, 0.5)',
                        }}
                      >
                        <span className="text-xl">💬</span>
                        Перейти в чат
                      </button>
                      <button
                        onClick={() => setShowJoinModal(false)}
                        className="w-full py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl font-medium text-zinc-400 hover:text-white transition-all mt-4"
                      >
                        Закрыть
                      </button>
                    </div>
                  )}
                  
                  {/* Анимация карусели */}
                  <style>{`
                    @keyframes spinCarousel {
                      0% { transform: translateY(0); }
                      100% { transform: translateY(-100%); }
                    }
                  `}</style>
                </div>
              ) : (
              <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-4xl">⚔️</span>
                  <h3 
                    className="text-2xl md:text-3xl font-bold"
                    style={{ 
                      color: '#e8a845',
                      textShadow: '0 0 20px rgba(255, 120, 50, 0.5)',
                    }}
                  >
                    Путь в New Era
                  </h3>
                  <span className="text-4xl">🏰</span>
                </div>
                <p className="text-zinc-400 text-sm">Эксклюзивный клан для лучших игроков</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Левая колонка - Как вступить */}
                <div className="flex flex-col justify-between">
                  <div 
                    className="rounded-xl p-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139,0,0,0.2) 0%, rgba(30,30,35,0.8) 100%)',
                      border: '1px solid rgba(139, 0, 0, 0.3)',
                    }}
                  >
                    <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2">
                      <span className="text-xl">�</span> Как попасть в клан?
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-3 items-start">
                        <div className="w-7 h-7 rounded-lg bg-red-900/50 flex items-center justify-center text-red-400 font-bold shrink-0">1</div>
                        <div>
                          <p className="text-white font-medium">Оплатите вход — $25</p>
                          <p className="text-zinc-500 text-xs">Это даёт вам право на участие в отборе</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="w-7 h-7 rounded-lg bg-red-900/50 flex items-center justify-center text-red-400 font-bold shrink-0">2</div>
                        <div>
                          <p className="text-white font-medium">Играйте за случайного участника</p>
                          <p className="text-zinc-500 text-xs">Вам выпадает один из 10 игроков клана</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="w-7 h-7 rounded-lg bg-red-900/50 flex items-center justify-center text-red-400 font-bold shrink-0">3</div>
                        <div>
                          <p className="text-white font-medium">Покажите достойную игру</p>
                          <p className="text-zinc-500 text-xs">Победы и хорошие результаты — ваш билет</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="w-7 h-7 rounded-lg bg-amber-900/50 flex items-center justify-center text-amber-400 font-bold shrink-0">4</div>
                        <div>
                          <p className="text-amber-300 font-medium">Мини-турнир в конце месяца</p>
                          <p className="text-zinc-500 text-xs">Топ игроки борются за места в клане. Занял 5 место = стал 5-м в клане!</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Поле ввода ID - под карточкой */}
                  <div className="md:-mt-2">
                    <p className="hidden md:block text-zinc-400 text-xs mb-2">Введите PUBG Mobile ID аккаунта</p>
                    <input
                      type="text"
                      value={pubgId}
                      onChange={(e) => setPubgId(e.target.value)}
                      placeholder="Введите ваш PUBG Mobile ID..."
                      className="w-full px-3 py-2 md:py-3 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:border-red-500 focus:outline-none transition-all"
                    />
                  </div>

                </div>

                {/* Правая колонка - Преимущества */}
                <div className="space-y-4">
                  <div 
                    className="rounded-xl p-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(234,179,8,0.1) 0%, rgba(30,30,35,0.8) 100%)',
                      border: '1px solid rgba(234, 179, 8, 0.3)',
                    }}
                  >
                    <h4 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
                      <span className="text-xl">👑</span> Преимущества членства
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 py-2 border-b border-zinc-800">
                        <span className="text-lg">💰</span>
                        <div>
                          <p className="text-white">50% от прибыли</p>
                          <p className="text-zinc-500 text-xs">Когда кто-то оплачивает вступление и выигрывает за вас</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 py-2 border-b border-zinc-800">
                        <span className="text-lg">🗼</span>
                        <div>
                          <p className="text-white">Башня с призами</p>
                          <p className="text-zinc-500 text-xs">До $10 240 за достижение этажей</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 py-2 border-b border-zinc-800">
                        <span className="text-lg">🌍</span>
                        <div>
                          <p className="text-white">Мировые турниры</p>
                          <p className="text-zinc-500 text-xs">Лидер направляет на кастомки с призами по всему миру</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 py-2 border-b border-zinc-800">
                        <span className="text-lg">🤖</span>
                        <div>
                          <p className="text-white">Бот для лобби</p>
                          <p className="text-zinc-500 text-xs">Безлимитный доступ пока вы в клане</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 py-2">
                        <span className="text-lg">✨</span>
                        <div>
                          <p className="text-purple-400 font-medium">Скоро больше...</p>
                          <p className="text-zinc-500 text-xs">Новые преимущества уже в разработке</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Правила + Кнопка оплаты */}
              <div className="mt-4 flex flex-col gap-3">
                  {/* Чекбокс правил */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToRules}
                      onChange={(e) => setAgreedToRules(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-red-500 focus:ring-red-500 focus:ring-offset-0"
                    />
                    <span className="text-zinc-400 text-sm">
                      Я согласен с{' '}
                      <a 
                        href="/clan-rules" 
                        target="_blank"
                        className="text-red-400 underline hover:text-red-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        правилами клана
                      </a>
                    </span>
                  </label>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={handlePayment}
                      disabled={!pubgId.trim() || !agreedToRules}
                      className={`flex-1 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                        pubgId.trim() && agreedToRules
                          ? 'hover:scale-[1.02] cursor-pointer' 
                          : 'cursor-not-allowed'
                      }`}
                      style={{
                        background: pubgId.trim() && agreedToRules
                          ? 'linear-gradient(135deg, #8b0000 0%, #dc2626 50%, #8b0000 100%)'
                          : 'linear-gradient(135deg, rgba(139,0,0,0.4) 0%, rgba(220,38,38,0.4) 50%, rgba(139,0,0,0.4) 100%)',
                        boxShadow: pubgId.trim() && agreedToRules ? '0 0 30px rgba(220, 38, 38, 0.4)' : 'none',
                        border: '1px solid rgba(220, 38, 38, 0.5)',
                        opacity: pubgId.trim() && agreedToRules ? 1 : 0.6,
                      }}
                    >
                      <span className="text-xl">⚔️</span>
                      Оплатить — $25
                    </button>
                    <button
                      onClick={() => setShowJoinModal(false)}
                      className="hidden sm:block sm:w-40 py-4 bg-zinc-800/80 border border-zinc-700 rounded-xl font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
                    >
                      Закрыть
                    </button>
                  </div>
              </div>
              </>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Participant Card Popup */}
      {selectedParticipant && (() => {
        const p = participants.find(x => x.id === selectedParticipant);
        if (!p) return null;
        return (
          <>
            {/* Overlay для закрытия */}
            <div 
              className="fixed inset-0 z-40 md:hidden"
              onClick={() => setSelectedParticipant(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center md:justify-end px-4 md:px-0 md:pr-[340px] pointer-events-none">
              <div 
                className="pointer-events-auto w-full max-w-xs md:w-64 bg-zinc-900/30 backdrop-blur-md rounded-xl p-4 border border-red-700/50 relative"
                style={{ boxShadow: '0 4px 30px rgba(0, 0, 0, 0.7)' }}
              >
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs hover:text-white transition-all z-10"
                >
                  ✕
                </button>
              
              {/* Avatar & Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-900 to-red-950 flex items-center justify-center text-3xl border-2 border-red-700/50">
                  {p.avatar}
                </div>
                <div>
                  <p className="text-white font-bold">{p.nickname}</p>
                  <p className="text-zinc-500 text-xs">ID: {p.odId}</p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                  <span className="text-zinc-400">🗼 Уровень башни</span>
                  <span className="text-amber-400 font-bold">{p.towerLevel}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                  <span className="text-zinc-400">📅 Вступил</span>
                  <span className="text-white">{p.joinDate}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                  <span className="text-zinc-400">💰 Взнос</span>
                  <span className="text-white">{p.joinCost}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-400">🏆 Выиграл</span>
                  <span className="text-emerald-400 font-bold">{p.totalWon}</span>
                </div>
              </div>
            </div>
          </div>
          </>
        );
      })()}

    </div>
  );
};

export default ClanPage;

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { referralLink, referrals, referralStats } from '../data/referrals';

const FriendsPage = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(() => {
    const fullLink = `https://t.me/TourneyHubBot?start=${referralLink.code}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="min-h-screen pb-40">
      <div className="xl:flex">
        {/* Main Content - Left side */}
        <main className="flex-1 xl:max-w-[1200px] px-4 md:px-8 xl:pr-[300px] py-4 space-y-4">
          {/* Back button - Mobile only */}
          <button 
            onClick={() => navigate(-1)} 
            className="md:hidden flex items-center gap-2 text-white/70 hover:text-white mb-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Назад</span>
          </button>

          {/* Header */}
          <div className="pt-2 md:pt-2">
            <h1 className="text-2xl font-bold text-white">Друзья</h1>
            <p className="text-sm text-white/60">Вы получаете 50% от прибыли сайта за каждого приглашённого пользователя — на его первые 5 покупок</p>
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-r from-emerald-600/30 to-teal-600/30 backdrop-blur-sm 
                        rounded-xl border border-white/20 p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{referralStats.totalReferrals}</p>
                <p className="text-xs text-white/60">Приглашено</p>
              </div>
              <div className="text-center border-x border-white/10">
                <p className="text-2xl font-bold text-accent-green">{referralStats.totalEarned.toFixed(2)}</p>
                <p className="text-xs text-white/60">Заработано {referralStats.currency}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{referralStats.activeReferrals}</p>
                <p className="text-xs text-white/60">Активных</p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">💡 Как это работает</h3>
            <div className="space-y-2 text-xs text-white/70">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">1</span>
                <span>Отправь реферальную ссылку другу</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">2</span>
                <span>Друг регистрируется и пополняет баланс</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">3</span>
                <span>Получай <b className="text-accent-green">50%</b> от прибыли сайта с первых <b className="text-white">5 покупок</b> друга</span>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Твоя реферальная ссылка</h2>
            <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 
                              flex items-center justify-center text-2xl shrink-0">
                  🔗
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-purple-400 truncate">
                    t.me/TourneyHubBot?start={referralLink.code}
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    {referralLink.usedCount} друзей присоединились
                  </p>
                </div>
              </div>
              <button
                onClick={copyToClipboard}
                className={`w-full mt-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                          ${copied 
                            ? 'bg-accent-green text-white' 
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'}`}
              >
                {copied ? '✓ Ссылка скопирована!' : 'Скопировать ссылку'}
              </button>
            </div>
          </div>

          {/* Friends List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">Приглашённые друзья</h2>
              <span className="text-xs text-white/50">{referrals.length} друзей</span>
            </div>
            <div className="space-y-2">
              {referrals.map((friend) => (
                <div 
                  key={friend.id}
                  className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-3 
                           flex items-center gap-3"
                >
                  {/* Avatar */}
                  <img 
                    src={friend.avatar} 
                    alt={friend.username}
                    className="w-10 h-10 rounded-full border-2 border-white/20"
                  />
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{friend.username}</span>
                      {friend.isActive ? (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-green/20 text-accent-green">
                          Активен
                        </span>
                      ) : (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">
                          Завершён
                        </span>
                      )}
                    </div>
                    
                    {/* Progress */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${friend.isActive ? 'bg-purple-500' : 'bg-white/30'}`}
                          style={{ width: `${(friend.gamesPlayed / friend.maxGames) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/50 shrink-0">
                        {friend.gamesPlayed}/{friend.maxGames} игр
                      </span>
                    </div>
                  </div>

                  {/* Earnings */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-accent-green">+{friend.totalEarned.toFixed(2)}</p>
                    <p className="text-xs text-white/50">{friend.currency}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Character - Right side (Desktop only) */}
        <div className="hidden xl:flex fixed right-[7px] top-20 items-start justify-end flex-shrink-0 pointer-events-none">
          <img 
            src="/друзя.png" 
            alt="Character"
            className="h-[calc(100vh-120px)] w-auto object-contain"
            style={{ maxHeight: '880px', transform: 'translateY(-25px)' }}
          />
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;

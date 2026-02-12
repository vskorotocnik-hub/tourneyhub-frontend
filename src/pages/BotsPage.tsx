import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface GameBot {
  id: string;
  game: string;
  gameIcon: string;
  botName: string;
  botId: string;
  botAvatar: string;
  isAvailable: boolean;
  canAddFriend: boolean;
  userDeposit: number;
  requiredDeposit: number;
}

const gameBots: GameBot[] = [
  {
    id: 'pubg',
    game: 'PUBG Mobile',
    gameIcon: '🎯',
    botName: 'TourneyHub_PUBG',
    botId: '5847291036',
    botAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=pubg',
    isAvailable: true,
    canAddFriend: true,
    userDeposit: 10,
    requiredDeposit: 10,
  },
  {
    id: 'standoff',
    game: 'Standoff 2',
    gameIcon: '🔫',
    botName: 'TourneyHub_SO2',
    botId: 'TH_Standoff',
    botAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=standoff',
    isAvailable: true,
    canAddFriend: false,
    userDeposit: 5,
    requiredDeposit: 10,
  },
  {
    id: 'codm',
    game: 'Call of Duty Mobile',
    gameIcon: '💥',
    botName: 'TourneyHub_CODM',
    botId: '6729401852',
    botAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=codm',
    isAvailable: false,
    canAddFriend: false,
    userDeposit: 0,
    requiredDeposit: 10,
  },
];

const BotsPage = () => {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState<GameBot>(gameBots[0]);
  const [showBotId, setShowBotId] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="min-h-screen pb-44">
      <main className="max-w-[1800px] mx-auto px-4 md:px-8 py-4">
        {/* Header */}
        <div className="flex items-center relative mb-6 py-1">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Назад</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-white">🤖 Game Lobby Bots</h1>
        </div>

        {/* Game Selector - Compact Dropdown */}
        <div className="relative mb-4">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full p-3 rounded-xl bg-dark-200/60 border border-white/10 
                     flex items-center justify-between hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{selectedGame.gameIcon}</span>
              <span className="text-sm font-medium text-white">{selectedGame.game}</span>
            </div>
            <svg 
              className={`w-4 h-4 text-white/50 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-dark-200/95 backdrop-blur-md 
                          rounded-xl border border-white/10 overflow-hidden z-10">
              {gameBots.map((bot) => (
                <button
                  key={bot.id}
                  onClick={() => {
                    setSelectedGame(bot);
                    setShowDropdown(false);
                    setShowBotId(false);
                  }}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors
                            ${selectedGame.id === bot.id ? 'bg-purple-600/20' : ''}`}
                >
                  <span className="text-lg">{bot.gameIcon}</span>
                  <span className="text-sm text-white">{bot.game}</span>
                  {selectedGame.id === bot.id && (
                    <svg className="w-4 h-4 text-purple-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bot Info Card */}
        <div className="bg-dark-200/60 rounded-xl border border-white/10 p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <img 
              src={selectedGame.botAvatar} 
              alt={selectedGame.botName}
              className="w-14 h-14 rounded-full bg-white/10"
            />
            <div className="flex-1">
              <p className="text-base font-semibold text-white">{selectedGame.botName}</p>
              <p className="text-xs text-white/50">Создаёт лобби в {selectedGame.game}</p>
            </div>
          </div>
          
          {/* Status badges */}
          <div className="flex gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium
                            ${selectedGame.isAvailable 
                              ? 'bg-accent-green/20 text-accent-green' 
                              : 'bg-red-500/20 text-red-400'}`}>
              {selectedGame.isAvailable ? '✓ Доступен сейчас' : '✗ Недоступен'}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium
                            ${selectedGame.canAddFriend 
                              ? 'bg-cyan-500/20 text-cyan-400' 
                              : 'bg-orange-500/20 text-orange-400'}`}>
              {selectedGame.canAddFriend ? 'Можно добавить' : 'Нельзя добавить'}
            </span>
          </div>
        </div>

        {/* Bot ID reveal */}
        {showBotId && (
          <div className="bg-accent-green/10 rounded-xl border border-accent-green/30 p-4 mb-4">
            <p className="text-xs text-white/60 mb-1">ID / Ник бота:</p>
            <p className="text-xl font-bold text-white font-mono">{selectedGame.botId}</p>
            <p className="text-xs text-white/50 mt-1">Скопируй и добавь в друзья в игре</p>
          </div>
        )}

        {/* Deposit Progress */}
        <div className="bg-dark-200/60 rounded-xl border border-white/10 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-white">💰 Прогресс пополнения</p>
            <span className={`text-sm font-bold ${selectedGame.userDeposit >= selectedGame.requiredDeposit ? 'text-accent-green' : 'text-yellow-400'}`}>
              ${selectedGame.userDeposit} / ${selectedGame.requiredDeposit}
            </span>
          </div>
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${selectedGame.userDeposit >= selectedGame.requiredDeposit ? 'bg-accent-green' : 'bg-yellow-400'}`}
              style={{ width: `${Math.min((selectedGame.userDeposit / selectedGame.requiredDeposit) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-white/50 mt-2">
            {selectedGame.userDeposit >= selectedGame.requiredDeposit 
              ? '✓ Требование выполнено! Можно добавить бота.' 
              : `Осталось пополнить: $${selectedGame.requiredDeposit - selectedGame.userDeposit}`}
          </p>
        </div>

        {/* Show Bot ID Button */}
        <button
          onClick={() => setShowBotId(true)}
          disabled={!selectedGame.isAvailable || selectedGame.userDeposit < selectedGame.requiredDeposit}
          className={`w-full py-3.5 rounded-xl font-semibold transition-all mb-4
                    ${selectedGame.isAvailable && selectedGame.userDeposit >= selectedGame.requiredDeposit
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
                      : 'bg-white/5 text-white/40 cursor-not-allowed'}`}
        >
          {showBotId ? '✓ ID показан выше' : selectedGame.userDeposit < selectedGame.requiredDeposit ? '🔒 Сначала пополни аккаунт' : '🔓 Показать ID бота'}
        </button>

        {/* Conditions */}
        <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4 mb-4">
          <p className="text-sm font-semibold text-white mb-3">📋 Условия использования</p>
          <div className="space-y-2.5 text-sm text-white/70">
            <div className="flex items-start gap-2">
              <span className={`mt-0.5 ${selectedGame.userDeposit >= selectedGame.requiredDeposit ? 'text-accent-green' : 'text-purple-400'}`}>
                {selectedGame.userDeposit >= selectedGame.requiredDeposit ? '✓' : '•'}
              </span>
              <span>Пополни игровой аккаунт минимум на <strong className="text-white">${selectedGame.requiredDeposit}</strong> для добавления бота</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span>Минимум <strong className="text-white">1 игра раз в 2 недели</strong> чтобы бот не удалил из друзей</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
          <p className="text-sm font-semibold text-white mb-3">📝 Как использовать бота в игре</p>
          <ol className="space-y-2.5 text-sm text-white/70">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
              <span>Добавь бота в друзья по ID (указан выше)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
              <span>Открой игру и <strong className="text-white">пригласи бота в своё лобби</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
              <span>Напиши боту в игровой чат команду: <code className="bg-white/10 px-1.5 py-0.5 rounded text-purple-300">/create</code></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
              <span>Бот создаст кастомное лобби и выдаст тебе <strong className="text-white">ID комнаты + пароль</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">5</span>
              <span>Поделись данными с другими участниками турнира</span>
            </li>
          </ol>
          
          {/* Commands reference */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-xs text-white/50 mb-2">Доступные команды:</p>
            <div className="flex flex-wrap gap-2">
              <code className="bg-white/10 px-2 py-1 rounded text-xs text-purple-300">/create</code>
              <code className="bg-white/10 px-2 py-1 rounded text-xs text-purple-300">/start</code>
              <code className="bg-white/10 px-2 py-1 rounded text-xs text-purple-300">/kick [id]</code>
              <code className="bg-white/10 px-2 py-1 rounded text-xs text-purple-300">/info</code>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BotsPage;

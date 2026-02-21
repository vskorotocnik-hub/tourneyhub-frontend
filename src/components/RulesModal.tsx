interface Props {
  onClose: () => void;
}

const RulesModal = ({ onClose }: Props) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div className="bg-dark-200 border border-white/20 rounded-2xl p-4 max-w-sm w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-white">📋 Правила турнира</h3>
        <button onClick={onClose} className="text-white/50 hover:text-white">
          ✕
        </button>
      </div>
      <div className="space-y-2 text-xs text-white/70">
        <p>🚫 <strong className="text-red-400">Запрещено:</strong> читы, эмуляторы, баги</p>
        <p>⚠️ При нарушении — <strong className="text-red-400">бан аккаунта</strong> + потеря ставки</p>
        <p>📹 Администрация может запросить видео матча</p>
        <p>🤝 Споры решаются через поддержку в чате</p>
        <p>⏱️ На подачу результата — 30 минут после матча</p>
      </div>
      <button 
        onClick={onClose}
        className="w-full mt-4 py-2 rounded-lg bg-red-600/30 border border-red-500/50 
                 text-red-300 text-sm font-medium hover:bg-red-600/40"
      >
        Понятно
      </button>
    </div>
  </div>
);

export default RulesModal;

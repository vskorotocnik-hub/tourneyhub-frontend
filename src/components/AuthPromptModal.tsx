import { useNavigate } from 'react-router-dom';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function AuthPromptModal({ isOpen, onClose, message }: AuthPromptModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-center space-y-5 animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
          <span className="text-3xl">🔒</span>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">Требуется авторизация</h2>
          <p className="text-zinc-400 text-sm mt-1.5">
            {message || 'Войдите или зарегистрируйтесь, чтобы продолжить'}
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={() => { onClose(); navigate('/login'); }}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
          >
            Войти
          </button>
          <button
            onClick={() => { onClose(); navigate('/register'); }}
            className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold transition-colors"
          >
            Зарегистрироваться
          </button>
        </div>

        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          Отмена
        </button>
      </div>
    </div>
  );
}

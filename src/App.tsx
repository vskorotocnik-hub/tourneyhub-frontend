import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import TasksPage from './pages/TasksPage';
import FriendsPage from './pages/FriendsPage';
import MessagesPage from './pages/MessagesPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import GamePage from './pages/GamePage';
import BotsPage from './pages/BotsPage';
import CurrencyPage from './pages/CurrencyPage';
import TrainingPage from './pages/TrainingPage.tsx';
import AccountRentalPage from './pages/AccountRentalPage';
import AccountRentalDetailPage from './pages/AccountRentalDetailPage.tsx';
import AccountsPage from './pages/AccountsPage';
import AccountDetailPage from './pages/AccountDetailPage';
import ClanPage from './pages/ClanPage';
import GlobalTournamentsPage from './pages/GlobalTournamentsPage.tsx';
import TournamentDetailPage from './pages/TournamentDetailPage';
import BoostPage from './pages/BoostPage';
import SellPage from './pages/SellPage.tsx';
import TournamentRoomPage from './pages/TournamentRoomPage';

import BottomNav from './components/BottomNav';
import Header from './components/Header';
import WelcomeModal from './components/WelcomeModal';
import PageLoader from './components/PageLoader';
// import PageTransition from './components/PageTransition'; // временно отключён

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function BannedScreen({ reason, onBack }: { reason: string; onBack: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-950">
      <div className="w-full max-w-md bg-zinc-900 border border-red-500/30 rounded-2xl p-8 text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-red-500/15 flex items-center justify-center mx-auto">
          <span className="text-4xl">🚫</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Аккаунт заблокирован</h1>
          <p className="text-zinc-500 text-sm mt-1">Ваш аккаунт был заблокирован администратором</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-zinc-400 text-xs mb-1">Причина:</p>
          <p className="text-red-400 font-medium text-sm">{reason}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-xl px-4 py-3 text-left space-y-2">
          <p className="text-zinc-400 text-sm font-medium">Что делать?</p>
          <ul className="text-zinc-500 text-xs space-y-1">
            <li>• Напишите в поддержку для обжалования</li>
            <li>• Telegram: @tourneyhub_support</li>
            <li>• Email: support@tourneyhub.com</li>
          </ul>
        </div>
        <button onClick={onBack} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          ← Назад
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const { banInfo, clearBan } = useAuth();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname.startsWith('/auth/google');
  const isFullscreenPage = isAuthPage || location.pathname === '/clan' || location.pathname.startsWith('/global-tournaments') || location.pathname.startsWith('/tournament/');

  if (banInfo) {
    return <BannedScreen reason={banInfo.reason} onBack={clearBan} />;
  }

  return (
    <>
      <ScrollToTop />
      <PageLoader />
      <WelcomeModal />
      {!isFullscreenPage && <Header />}
      <div className={isFullscreenPage ? '' : 'pt-14'}>
        {/* PageTransition временно отключён */}
        <Routes>
        {/* ── Public routes ── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
        <Route path="/global-tournaments" element={<GlobalTournamentsPage />} />
        <Route path="/global-tournaments/:tournamentId" element={<TournamentDetailPage />} />
        {/* ── Semi-public (can browse, actions require auth via modal) ── */}
        <Route path="/game/:gameId" element={<GamePage />} />
        {/* ── Protected routes ── */}
        <Route path="/tasks" element={<RequireAuth><TasksPage /></RequireAuth>} />
        <Route path="/friends" element={<RequireAuth><FriendsPage /></RequireAuth>} />
        <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>} />
        <Route path="/messages/:chatId" element={<RequireAuth><ChatPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/game/:gameId/currency" element={<RequireAuth><CurrencyPage /></RequireAuth>} />
        <Route path="/game/:gameId/training" element={<RequireAuth><TrainingPage /></RequireAuth>} />
        <Route path="/game/:gameId/accounts" element={<RequireAuth><AccountsPage /></RequireAuth>} />
        <Route path="/game/:gameId/accounts/:accountId" element={<RequireAuth><AccountDetailPage /></RequireAuth>} />
        <Route path="/game/:gameId/account-rental" element={<RequireAuth><AccountRentalPage /></RequireAuth>} />
        <Route path="/game/:gameId/account-rental/:accountId" element={<RequireAuth><AccountRentalDetailPage /></RequireAuth>} />
        <Route path="/game/:gameId/boost" element={<RequireAuth><BoostPage /></RequireAuth>} />
        <Route path="/sell" element={<RequireAuth><SellPage /></RequireAuth>} />
        <Route path="/bots" element={<RequireAuth><BotsPage /></RequireAuth>} />
        <Route path="/clan" element={<RequireAuth><ClanPage /></RequireAuth>} />
        <Route path="/tournament/:tournamentId" element={<RequireAuth><TournamentRoomPage /></RequireAuth>} />
        
        </Routes>
      </div>
      {!isFullscreenPage && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App

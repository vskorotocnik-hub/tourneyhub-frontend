import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminListingsPage from './pages/admin/ListingsPage';
import AdminTournamentsPage from './pages/admin/TournamentsPage';
import AdminFinancesPage from './pages/admin/FinancesPage';
import AdminSupportPage from './pages/admin/SupportPage';
import AdminContentPage from './pages/admin/ContentPage';
import AdminSettingsPage from './pages/admin/SettingsPage';
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

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname.startsWith('/auth/google');
  const isFullscreenPage = isAdminPage || isAuthPage || location.pathname === '/clan' || location.pathname.startsWith('/global-tournaments');

  return (
    <>
      <ScrollToTop />
      <PageLoader />
      <WelcomeModal />
      {!isFullscreenPage && <Header />}
      <div className={isFullscreenPage ? '' : 'pt-14'}>
        {/* PageTransition временно отключён */}
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:chatId" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="/game/:gameId/currency" element={<CurrencyPage />} />
        <Route path="/game/:gameId/training" element={<TrainingPage />} />
        <Route path="/game/:gameId/accounts" element={<AccountsPage />} />
        <Route path="/game/:gameId/accounts/:accountId" element={<AccountDetailPage />} />
        <Route path="/game/:gameId/account-rental" element={<AccountRentalPage />} />
        <Route path="/game/:gameId/account-rental/:accountId" element={<AccountRentalDetailPage />} />
        <Route path="/game/:gameId/boost" element={<BoostPage />} />
        <Route path="/sell" element={<SellPage />} />
        <Route path="/bots" element={<BotsPage />} />
        <Route path="/clan" element={<ClanPage />} />
        <Route path="/global-tournaments" element={<GlobalTournamentsPage />} />
        <Route path="/global-tournaments/:tournamentId" element={<TournamentDetailPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="listings" element={<AdminListingsPage />} />
          <Route path="tournaments" element={<AdminTournamentsPage />} />
          <Route path="finances" element={<AdminFinancesPage />} />
          <Route path="support" element={<AdminSupportPage />} />
          <Route path="content" element={<AdminContentPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
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

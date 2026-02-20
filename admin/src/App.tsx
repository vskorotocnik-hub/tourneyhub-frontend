import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminLayout from './pages/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import PlaceholderPage from './pages/PlaceholderPage';
import TournamentsPage from './pages/TournamentsPage';
import SupportPage from './pages/SupportPage';
import WoWMapsPage from './pages/WoWMapsPage';
import ClassicTournamentsPage from './pages/ClassicTournamentsPage';

function ProtectedRoutes() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <svg className="w-10 h-10 animate-spin text-emerald-400 mx-auto" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-zinc-500 text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-5xl">🚫</p>
          <h1 className="text-xl font-bold text-white">Доступ запрещён</h1>
          <p className="text-zinc-500 text-sm">У вашего аккаунта нет прав администратора</p>
          <p className="text-zinc-600 text-xs">Роль: {useAuth().user?.role || 'неизвестно'}</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="listings" element={<PlaceholderPage title="Объявления" />} />
        <Route path="tournaments" element={<TournamentsPage />} />
        <Route path="classic-tournaments" element={<ClassicTournamentsPage />} />
        <Route path="wow-maps" element={<WoWMapsPage />} />
        <Route path="finances" element={<PlaceholderPage title="Финансы" />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="content" element={<PlaceholderPage title="Контент" />} />
        <Route path="settings" element={<PlaceholderPage title="Настройки" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProtectedRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

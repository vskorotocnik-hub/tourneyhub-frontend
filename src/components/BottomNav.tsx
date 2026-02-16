import { memo, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tournamentApi } from '../lib/api';

type NavIcon = 'home' | 'tasks' | 'friends' | 'sell' | 'messages' | 'profile';

interface NavItemData {
  icon: NavIcon;
  label: string;
  path: string;
  hideOnMobile?: boolean;
}

const navItems: NavItemData[] = [
  { icon: 'home', label: 'Главная', path: '/' },
  { icon: 'tasks', label: 'Задания', path: '/tasks' },
  { icon: 'friends', label: 'Друзья', path: '/friends', hideOnMobile: true },
  { icon: 'sell', label: 'Продать', path: '/sell' },
  { icon: 'messages', label: 'Сообщения', path: '/messages' },
  { icon: 'profile', label: 'Профиль', path: '/profile' },
];

const BottomNav = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(() => {
    if (!user) return;
    tournamentApi.unreadCount()
      .then(r => setUnreadCount(r.unreadCount))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    fetchUnread();
    const iv = setInterval(fetchUnread, 15000);
    return () => clearInterval(iv);
  }, [fetchUnread]);

  const icons: Record<NavIcon, React.ReactNode> = {
    home: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    tasks: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    friends: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    sell: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 4v16m8-8H4" />
      </svg>
    ),
    messages: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    profile: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-300/95 backdrop-blur-lg border-t border-white/10 z-50">
      <div className="max-w-[1800px] mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors active:scale-95
                          ${isActive ? 'text-purple-400' : 'text-white/50 hover:text-white/70'}
                          ${item.hideOnMobile ? 'hidden md:flex' : ''}`}
              >
                <div className="relative">
                  {icons[item.icon]}
                  {item.icon === 'messages' && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;

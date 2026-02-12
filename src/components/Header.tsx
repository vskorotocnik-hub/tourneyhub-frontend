import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'RUB', symbol: '₽', name: 'Рубль' },
  { code: 'UAH', symbol: '₴', name: 'Гривня' },
];

const languages = [
  { code: 'RU', name: 'Русский', flag: '🇷🇺' },
  { code: 'UA', name: 'Українська', flag: '🇺🇦' },
  { code: 'EN', name: 'English', flag: '🇬🇧' },
];

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const languageRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const balance = isAuthenticated && user ? parseFloat(user.balance) : 0;

  // Language dropdown (reused in both guest and authenticated desktop views)
  const languageDropdown = (className?: string) => (
    <div className={`relative ${className || ''}`} ref={languageRef}>
      <button
        onClick={() => {
          setShowLanguageDropdown(!showLanguageDropdown);
          setShowCurrencyDropdown(false);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
      >
        <span className="text-base">{selectedLanguage.flag}</span>
        <span className="text-white text-sm font-medium">{selectedLanguage.code}</span>
        <svg className={`w-4 h-4 text-zinc-400 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showLanguageDropdown && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setSelectedLanguage(lang);
                setShowLanguageDropdown(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-700 transition-colors ${
                selectedLanguage.code === lang.code ? 'bg-zinc-700' : ''
              }`}
            >
              <span className="text-base">{lang.flag}</span>
              <span className="text-white text-sm">{lang.name}</span>
              {selectedLanguage.code === lang.code && (
                <svg className="w-4 h-4 text-emerald-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        {/* Logo + Site Name */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="text-white font-bold text-lg hidden sm:block">GameHub</span>
        </button>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {authLoading ? (
            <div className="w-20 h-8 rounded-lg bg-zinc-700 animate-pulse" />
          ) : isAuthenticated && user ? (
            <>
              {/* Authenticated: Balance + Currency */}
              <div className="relative flex items-center" ref={currencyRef}>
                <span className="text-white font-semibold text-sm mr-1">{balance.toFixed(2)}</span>
                <button
                  onClick={() => {
                    setShowCurrencyDropdown(!showCurrencyDropdown);
                    setShowLanguageDropdown(false);
                  }}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                >
                  <span className="text-white text-sm font-medium">{selectedCurrency.code}</span>
                  <svg className={`w-4 h-4 text-zinc-400 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showCurrencyDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-36 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    {currencies.map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => {
                          setSelectedCurrency(currency);
                          setShowCurrencyDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-700 transition-colors ${
                          selectedCurrency.code === currency.code ? 'bg-zinc-700' : ''
                        }`}
                      >
                        <span className="text-zinc-400 text-sm w-5">{currency.symbol}</span>
                        <span className="text-white text-sm">{currency.code}</span>
                        {selectedCurrency.code === currency.code && (
                          <svg className="w-4 h-4 text-emerald-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Authenticated: Top Up Button */}
              <button className="px-2 sm:px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors">
                Пополнить
              </button>

              {/* Authenticated Desktop: Language */}
              {languageDropdown('hidden md:block')}
            </>
          ) : (
            <>
              {/* Guest: Language */}
              {languageDropdown()}

              {/* Guest: Login + Register */}
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-medium transition-colors"
              >
                Войти
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors"
              >
                Регистрация
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

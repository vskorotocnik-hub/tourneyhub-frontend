import { useEffect, useRef } from 'react';

interface TelegramLoginButtonProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: 'write';
  usePic?: boolean;
  lang?: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    TelegramLoginWidgetCb?: (user: TelegramUser) => void;
  }
}

const TelegramLoginButton = ({
  botName,
  onAuth,
  buttonSize = 'large',
  cornerRadius = 12,
  requestAccess = 'write',
  usePic = true,
  lang = 'ru',
}: TelegramLoginButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set global callback
    window.TelegramLoginWidgetCb = (user: TelegramUser) => {
      onAuth(user);
    };

    // Create and inject script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', String(cornerRadius));
    script.setAttribute('data-request-access', requestAccess);
    script.setAttribute('data-userpic', String(usePic));
    script.setAttribute('data-lang', lang);
    script.setAttribute('data-onauth', 'TelegramLoginWidgetCb(user)');

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
    }

    return () => {
      delete window.TelegramLoginWidgetCb;
    };
  }, [botName, onAuth, buttonSize, cornerRadius, requestAccess, usePic, lang]);

  return <div ref={containerRef} className="flex justify-center" />;
};

export default TelegramLoginButton;

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const TRANSITION_DURATION = 1500; // 1.5 seconds
// Local GIF file (save from Tenor to public/transition.gif)
const GIF_URL = '/transition.gif';

// Preload GIF for instant display
const gifImage = new Image();
gifImage.src = GIF_URL;

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const previousPathRef = useRef(location.pathname);
  const [gifKey, setGifKey] = useState(0);

  const startTransition = useCallback(() => {
    setIsTransitioning(true);
    setShowContent(false);
    setGifKey(prev => prev + 1); // Force GIF restart
    
    setTimeout(() => {
      setIsTransitioning(false);
      setShowContent(true);
    }, TRANSITION_DURATION);
  }, []);

  useEffect(() => {
    // Skip transition on initial load
    if (previousPathRef.current === location.pathname) return;
    
    previousPathRef.current = location.pathname;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startTransition();
  }, [location.pathname, startTransition]);

  return (
    <>
      {/* Transition Overlay - positioned between Header (56px) and BottomNav (72px) */}
      {isTransitioning && (
        <div 
          className="fixed left-0 right-0 z-[100] flex items-center justify-center bg-black"
          style={{ 
            top: '56px',      // Header height
            bottom: '72px',   // BottomNav height
            touchAction: 'none' 
          }}
        >
          <img
            key={gifKey}
            src={`${GIF_URL}?v=${gifKey}`}
            alt="Loading"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Page Content */}
      <div 
        style={{ 
          visibility: showContent ? 'visible' : 'hidden',
          opacity: showContent ? 1 : 0,
        }}
      >
        {children}
      </div>
    </>
  );
};

export default PageTransition;

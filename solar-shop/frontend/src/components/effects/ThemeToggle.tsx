import React, { useState, useEffect } from 'react';
import './ThemeToggle.css';

const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(true);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePullStart = () => {
    setIsPulling(true);
  };

  const handlePullMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPulling) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const lampElement = document.querySelector('.lamp-fixture');
    if (lampElement) {
      const rect = lampElement.getBoundingClientRect();
      const distance = Math.max(0, Math.min(80, clientY - rect.bottom));
      setPullDistance(distance);
    }
  };

  const handlePullEnd = () => {
    if (pullDistance > 40) {
      toggleThemeState();
    }
    
    setIsPulling(false);
    setPullDistance(0);
  };

  const toggleThemeState = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    if (isMobile) {
      // Direct toggle for mobile
      toggleThemeState();
    } else {
      // Animate the pull for desktop
      setIsPulling(true);
      setPullDistance(60);
      
      setTimeout(() => {
        toggleThemeState();
        
        setTimeout(() => {
          setIsPulling(false);
          setPullDistance(0);
        }, 200);
      }, 300);
    }
  };

  return (
    <div className="theme-toggle-container">
      {/* Desktop: Lamp Toggle */}
      <div className={`lamp-toggle ${isMobile ? 'hidden' : ''}`}>
        <div className="lamp-fixture">
          <div className="lamp-mount" />
          <div className="lamp-cord" style={{ height: `${30 + pullDistance}px` }} />
          <div className={`lamp-bulb ${!isDark ? 'lit' : ''}`}>
            <div className="bulb-glow" />
            <div className="bulb-glass" />
            <div className="bulb-base" />
          </div>
          
          {/* Pull Chain */}
          <div 
            className="pull-chain"
            style={{ 
              height: `${50 + pullDistance}px`,
              transition: isPulling ? 'none' : 'height 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }}
          >
            <div className="chain-links">
              {[...Array(8 + Math.floor(pullDistance / 10))].map((_, i) => (
                <div key={i} className="chain-link" />
              ))}
            </div>
            <div 
              className="pull-handle"
              onMouseDown={handlePullStart}
              onTouchStart={handlePullStart}
              onClick={toggleTheme}
            >
              <div className="handle-top" />
              <div className="handle-body" />
            </div>
          </div>

          {/* Light Rays */}
          {!isDark && (
            <div className="light-rays">
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className="ray" 
                  style={{ 
                    transform: `rotate(${i * 30}deg)`,
                    animationDelay: `${i * 0.1}s`
                  }} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Theme Label */}
        <div className="theme-label">
          {isDark ? '🌙' : '☀️'}
        </div>

        {/* Invisible overlay for drag detection */}
        {isPulling && (
          <div 
            className="pull-overlay"
            onMouseMove={handlePullMove}
            onMouseUp={handlePullEnd}
            onMouseLeave={handlePullEnd}
            onTouchMove={handlePullMove}
            onTouchEnd={handlePullEnd}
          />
        )}
      </div>

      {/* Mobile: Toggle Switch */}
      <div className={`toggle-switch-wrapper ${isMobile ? '' : 'hidden'}`}>
        <button
          className={`toggle-switch ${isDark ? 'dark' : 'light'}`}
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          <span className="toggle-track">
            <span className="toggle-thumb">
              <span className="toggle-icon">
                {isDark ? '🌙' : '☀️'}
              </span>
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;
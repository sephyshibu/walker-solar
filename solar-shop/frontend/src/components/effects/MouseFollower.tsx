import React, { useEffect, useState, useRef } from 'react';
import './MouseFollower.css';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

const MouseFollower: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const particleId = useRef(0);
  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Detect touch device
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouchDevice();

    let animationFrame: number;

    const updatePosition = (x: number, y: number) => {
      setMousePos({ x, y });
      setIsVisible(true);

      // Calculate distance moved
      const distance = Math.sqrt(
        Math.pow(x - lastPosRef.current.x, 2) + Math.pow(y - lastPosRef.current.y, 2)
      );

      // Create particles based on movement speed
      if (distance > 5) {
        const newParticle: Particle = {
          id: particleId.current++,
          x: x,
          y: y,
          size: Math.random() * 8 + 4,
          opacity: 1,
        };

        setParticles(prev => [...prev.slice(-30), newParticle]);
        lastPosRef.current = { x, y };
      }
    };

    // Mouse events for desktop
    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updatePosition(touch.clientX, touch.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updatePosition(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      // Keep visible briefly after touch ends
      setTimeout(() => {
        setIsVisible(false);
      }, 500);
    };
    // Fade out particles
    const fadeParticles = () => {
      setParticles(prev =>
        prev
          .map(p => ({ ...p, opacity: p.opacity - 0.02, size: p.size * 0.98 }))
          .filter(p => p.opacity > 0)
      );
      animationFrame = requestAnimationFrame(fadeParticles);
    };

 if (!isTouchDevice) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseleave', handleMouseLeave);
      document.addEventListener('mouseenter', handleMouseEnter);
    } else {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);
    }
    animationFrame = requestAnimationFrame(fadeParticles);

    return () => {
       document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animationFrame);
    };
  }, [isTouchDevice]);

  return (
    <div className="mouse-follower-container">
      {/* Main cursor glow */}
      <div
        className={`cursor-glow ${isVisible ? 'visible' : ''}`}
        style={{
          left: mousePos.x,
          top: mousePos.y,
        }}
      />

      {/* Inner cursor dot */}
      <div
        className={`cursor-dot ${isVisible ? 'visible' : ''}`}
        style={{
          left: mousePos.x,
          top: mousePos.y,
        }}
      />

      {/* Trailing ring */}
      <div
        className={`cursor-ring ${isVisible ? 'visible' : ''}`}
        style={{
          left: mousePos.x,
          top: mousePos.y,
        }}
      />

      {/* Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="cursor-particle"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
          }}
        />
      ))}
    </div>
  );
};

export default MouseFollower;

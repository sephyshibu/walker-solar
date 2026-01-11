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
  const particleId = useRef(0);

  useEffect(() => {
    let animationFrame: number;
    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      // Calculate distance moved
      const distance = Math.sqrt(
        Math.pow(e.clientX - lastX, 2) + Math.pow(e.clientY - lastY, 2)
      );

      // Create particles based on mouse movement speed
      if (distance > 5) {
        const newParticle: Particle = {
          id: particleId.current++,
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 8 + 4,
          opacity: 1,
        };

        setParticles(prev => [...prev.slice(-30), newParticle]);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
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

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    animationFrame = requestAnimationFrame(fadeParticles);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

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

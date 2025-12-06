import { useState, useEffect } from 'react';
import './FallingBomb.css';

interface FallingBombProps {
  onImpact: () => void;
  nagasakiScreenPos: { x: number; y: number };
  mapZoom: number;
}

export default function FallingBomb({ onImpact, nagasakiScreenPos, mapZoom }: FallingBombProps) {
  const [isFalling, setIsFalling] = useState(true);
  
  // 줌 레벨에 따른 역보정 (기준 줌 6)
  const scale = Math.pow(2, mapZoom - 6);

  useEffect(() => {
    // 1.5초 후 폭발
    const timer = setTimeout(() => {
      setIsFalling(false);
      onImpact();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onImpact]);

  if (!isFalling) return null;

  return (
    <div
      className="falling-bomb-container"
      style={{
        position: 'absolute',
        left: nagasakiScreenPos.x,
        top: nagasakiScreenPos.y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        pointerEvents: 'none',
        zIndex: 998,
      }}
    >
      <div className="bomb">
        <div className="bomb-body"></div>
        <div className="bomb-tail"></div>
        <div className="bomb-fins">
          <div className="fin fin-1"></div>
          <div className="fin fin-2"></div>
          <div className="fin fin-3"></div>
          <div className="fin fin-4"></div>
        </div>
      </div>
    </div>
  );
}
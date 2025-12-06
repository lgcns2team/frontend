import { useEffect } from 'react';
import './NukeExplosion.css';

interface NukeExplosionProps {
  x: number;
  y: number;
  scale?: number;
  onComplete?: () => void;
}

const NukeExplosion = ({ x, y, scale = 1, onComplete }: NukeExplosionProps) => {
  // 폭발이 끝나면(예: 2.3초 뒤) 부모에게 알려서 삭제하기
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2300);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className="nuke-container" 
      style={{ 
        left: x, 
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`
      }}
    >
      {/* 1. 초기 섬광 (가장 밝게) */}
      <div className="flash"></div>
      
      {/* 2. 메인 폭발 (노란색 원) */}
      <div className="main-explosion"></div>
      
      {/* 3. 다중 충격파 */}
      <div className="shockwave shockwave-1"></div>
      <div className="shockwave shockwave-2"></div>
      <div className="shockwave shockwave-3"></div>
      
      {/* 4. 화염 파티클들 */}
      {[...Array(12)].map((_, i) => (
        <div 
          key={i} 
          className="fire-particle" 
          style={{
            '--angle': `${i * 30}deg`,
            '--delay': `${i * 0.05}s`
          } as React.CSSProperties}
        ></div>
      ))}
      
      {/* 5. 버섯구름 기둥 */}
      <div className="mushroom-stem"></div>
      
      {/* 6. 버섯구름 머리 */}
      <div className="mushroom-cap"></div>
      
      {/* 7. 외부 글로우 */}
      <div className="outer-glow"></div>
    </div>
  );
};

export default NukeExplosion;

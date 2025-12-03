import './TimeControls.css';
import { getEraForYear } from '../../../shared/config/era-theme';
import goryeoBg from '../../../shared/assets/images/goryeotimecontrol.png';
import joseonBg from '../../../shared/assets/images/joseontimecontrol.png';
import daehanBg from '../../../shared/assets/images/daehantimecontrol.png';

interface TimeControlsProps {
    currentYear: number;
    isPlaying: boolean;
    speed: number;
    onTogglePlay: () => void;
    onToggleSpeed: () => void;
}

export const TimeControls = ({ currentYear, isPlaying, speed, onTogglePlay, onToggleSpeed }: TimeControlsProps) => {

    const eraConfig = getEraForYear(currentYear);

    let bgImage = undefined;
    if (eraConfig.id === 'goryeo') {
        bgImage = goryeoBg;
    } else if (eraConfig.id === 'joseon') {
        bgImage = joseonBg;
    } else if (eraConfig.id === 'korean-empire') {
        bgImage = daehanBg;
    }

    return (
        <div
            className="time-controls-container"
            style={bgImage ? {
                backgroundImage: `url(${bgImage})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            } : undefined}
        >
            {/* Year Display (Top) */}
            <div className="year-display-group">
                <div className="year-text">
                    {currentYear <= 0 ? `BC ${Math.abs(currentYear)}` : currentYear} 년 {eraConfig.label}
                </div>
                <div className="year-sub-row">
                    <span className="era-name">{eraConfig.description}</span>
                </div>
            </div>

            {/* Controls Row (Bottom) */}
            <div className="controls-row">
                <button
                    className={`control-btn play-btn ${isPlaying ? 'playing' : ''}`}
                    onClick={onTogglePlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>

                <button className="control-btn speed-btn" onClick={onToggleSpeed}>
                    <span className="speed-value">{speed}x</span>
                </button>
            </div>
        </div>
    );
};

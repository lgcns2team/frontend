import './TimeControls.css';
import { getEraName } from '../../../shared/lib/korean-history-eras';
import { getEraForYear } from '../../../shared/config/era-theme';

interface TimeControlsProps {
    currentYear: number;
    isPlaying: boolean;
    speed: number;
    onTogglePlay: () => void;
    onToggleSpeed: () => void;
}

export const TimeControls = ({ currentYear, isPlaying, speed, onTogglePlay, onToggleSpeed }: TimeControlsProps) => {

    const eraName = getEraName(currentYear);
    const eraConfig = getEraForYear(currentYear);

    return (
        <div className="time-controls-container">
            {/* Year Display (Top) */}
            <div className="year-display-group">
                <div className="year-text">
                    {currentYear <= 0 ? `BC ${Math.abs(currentYear)}` : currentYear} 년 {eraConfig.label}
                </div>
                <div className="year-sub-row">
                    <span className="era-name">{eraName}</span>
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

import './TimeControls.css';
import { getEraName, getEraColor } from '../../../shared/data/eras';

interface TimeControlsProps {
    currentYear: number;
    isPlaying: boolean;
    speed: number;
    onTogglePlay: () => void;
    onToggleSpeed: () => void;
}

export const TimeControls = ({ currentYear, isPlaying, speed, onTogglePlay, onToggleSpeed }: TimeControlsProps) => {

    const eraColor = getEraColor(currentYear);

    return (
        <div className="control-row">
            <div className="ruler-display-container" style={{ borderColor: eraColor }}>
                <div className="ruler-marks-top"></div>
                <div className="time-content-wrapper">
                    <div className="year-row">
                        <span className="year-number">
                            {currentYear > 0 ? `${currentYear}` : `BC ${Math.abs(currentYear)}`}
                        </span>
                        <span className="year-unit">년</span>
                        {getEraName(currentYear)}
                    </div>
                </div>
                <div className="ruler-marks-bottom"></div>
            </div>

            <div className="playback-controls">
                <button className="circle-btn play-btn" onClick={onTogglePlay}>
                    {isPlaying ? '⏸' : '▶'}
                </button>
                <button className="circle-btn speed-btn" onClick={onToggleSpeed}>{speed}x</button>
            </div>
        </div>
    );
};

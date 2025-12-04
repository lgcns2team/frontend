
import './TimeControls.css';
import { getEraForYear } from '../../../shared/config/era-theme';

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
        bgImage = "/assets/images/timecontrols/goryeotimecontrol.png";
    } else if (eraConfig.id === 'joseon') {
        bgImage = "/assets/images/timecontrols/joseontimecontrol.png";
    } else if (eraConfig.id === 'korean-empire') {
        bgImage = "/assets/images/timecontrols/daehantimecontrol.png";
    } else if (eraConfig.id === 'colonial') {
        bgImage = "/assets/images/timecontrols/colonialtimecontrol.png";
    } else if (eraConfig.id === 'republic') {
        bgImage = "/assets/images/timecontrols/republictimecontrol.png";
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
                    {currentYear <= 0 ? `BC ${Math.abs(currentYear)} ` : currentYear} 년 {eraConfig.label}
                </div>
                {/* <div className="year-sub-row">
                    <span className="era-name">{eraConfig.description}</span>
                </div> */}
            </div>

            {/* Controls Row (Bottom) */}
            {/* <div className="controls-row">
                <button
                    className={`control - btn play - btn ${ isPlaying ? 'playing' : '' } `}
                    onClick={onTogglePlay}
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>

                <button className="control-btn speed-btn" onClick={onToggleSpeed}>
                    <span className="speed-value">{speed}x</span>
                </button>
            </div> */}
        </div>
    );
};

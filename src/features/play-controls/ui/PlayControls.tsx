
import './PlayControls.css';

interface PlayControlsProps {
    isPlaying: boolean;
    speed: number;
    onTogglePlay: () => void;
    onToggleSpeed: () => void;
}

export const PlayControls = ({ isPlaying, speed, onTogglePlay, onToggleSpeed }: PlayControlsProps) => {
    return (
        <div className="play-controls-container">
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

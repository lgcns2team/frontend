import './TimeControls.css';

interface TimeControlsProps {
    currentYear: number;
    isPlaying: boolean;
    speed: number;
    onTogglePlay: () => void;
    onToggleSpeed: () => void;
}

export const TimeControls = ({ currentYear, isPlaying, speed, onTogglePlay, onToggleSpeed }: TimeControlsProps) => {


    const getEraName = (year: number) => {
        // const period = getCapitalPeriod(year).split('_')[0]; // Unused
        if (year < 918) return '삼국/남북국시대';
        if (year < 1392) return '고려시대';
        if (year < 1897) return '조선시대';
        if (year < 1910) return '대한제국';
        if (year < 1945) return '일제강점기';
        return '현대';
    };

    return (
        <div className="control-row">
            <div className="year-display-box">
                {currentYear > 0 ? `${currentYear}년` : `BC ${Math.abs(currentYear)}년`} {getEraName(currentYear)}
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

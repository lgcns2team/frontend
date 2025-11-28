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

    const getEraColor = (year: number) => {
        if (year < -108) return '#cbd5e1'; // Gojoseon
        if (year < 300) return '#fca5a5';  // Proto-Three Kingdoms
        if (year < 698) return '#93c5fd';  // Three Kingdoms
        if (year < 926) return '#fdba74';  // North-South States
        if (year < 1392) return '#c4b5fd'; // Goryeo
        if (year < 1897) return '#86efac'; // Joseon
        return '#fcd34d';                  // Modern
    };

    const eraColor = getEraColor(currentYear);

    return (
        <div className="control-row">
            <div className="ruler-display-container" style={{ borderColor: eraColor }}>
                <div className="ruler-marks-top"></div>
                <div className="year-text-content" style={{ color: '#333' }}>
                    <span className="year-number">
                        {currentYear > 0 ? `${currentYear}` : `BC ${Math.abs(currentYear)}`}
                    </span>
                    <span className="year-unit">년</span>
                    <span className="era-badge" style={{ backgroundColor: eraColor }}>
                        {getEraName(currentYear)}
                    </span>
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

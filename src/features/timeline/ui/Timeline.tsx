import './Timeline.css';
import { getEraColor } from '../../../shared/data/eras';

interface TimelineProps {
    currentYear: number;
    onYearChange: (year: number) => void;
}

export const Timeline = ({ currentYear, onYearChange }: TimelineProps) => {
    const thumbColor = getEraColor(currentYear);

    return (
        <div className="timeline-container">
            <button className="nav-btn prev-btn" onClick={() => onYearChange(currentYear - 10)}>
                ◀
            </button>

            <div className="timeline-wrapper">
                <div className="timeline-slider-container">
                    <div className="timeline-ruler-ticks"></div>
                    <input
                        type="range"
                        min="-2333"
                        max="2024"
                        value={currentYear}
                        className="timeline-slider"
                        onChange={(e) => onYearChange(parseInt(e.target.value))}
                        style={{ '--thumb-color': thumbColor } as React.CSSProperties}
                    />
                    <div className="timeline-track-bg"></div>
                </div>
                <div className="timeline-labels">
                    <span>BC 2000</span>
                    <span>BC 500</span>
                    <span>0</span>
                    <span>500</span>
                    <span>1000</span>
                    <span>1500</span>
                    <span>2024</span>
                </div>
            </div>

            <button className="nav-btn next-btn" onClick={() => onYearChange(currentYear + 10)}>
                ▶
            </button>
        </div>
    );
};

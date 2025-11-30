import { useMemo } from 'react';
import './Timeline.css';
import { getEraColor, ERA_LIMITS } from '../../../shared/lib/korean-history-eras';

interface TimelineProps {
    currentYear: number;
    onYearChange: (year: number) => void;
}

const MIN_YEAR = -2333;
const MAX_YEAR = 2024;

export const Timeline = ({ currentYear, onYearChange }: TimelineProps) => {
    const thumbColor = getEraColor(currentYear);

    const trackGradient = useMemo(() => {
        const totalRange = MAX_YEAR - MIN_YEAR;
        const getPercent = (year: number) => ((year - MIN_YEAR) / totalRange) * 100;

        const eras = [
            { label: '고조선', end: ERA_LIMITS.GOJOSEON_END, color: getEraColor(ERA_LIMITS.GOJOSEON_END - 1) },
            { label: '원삼국', end: ERA_LIMITS.PROTO_THREE_KINGDOMS_END, color: getEraColor(ERA_LIMITS.PROTO_THREE_KINGDOMS_END - 1) },
            { label: '삼국', end: ERA_LIMITS.THREE_KINGDOMS_END, color: getEraColor(ERA_LIMITS.THREE_KINGDOMS_END - 1) },
            { label: '남북국', end: ERA_LIMITS.NORTH_SOUTH_STATES_END, color: getEraColor(ERA_LIMITS.NORTH_SOUTH_STATES_END - 1) },
            { label: '고려', end: ERA_LIMITS.GORYEO_END, color: getEraColor(ERA_LIMITS.GORYEO_END - 1) },
            { label: '조선', end: ERA_LIMITS.JOSEON_END, color: getEraColor(ERA_LIMITS.JOSEON_END - 1) },
            { label: '대한제국', end: ERA_LIMITS.KOREAN_EMPIRE_END, color: getEraColor(ERA_LIMITS.KOREAN_EMPIRE_END - 1) },
            { label: '일제강점기', end: ERA_LIMITS.COLONIAL_PERIOD_END, color: getEraColor(ERA_LIMITS.COLONIAL_PERIOD_END - 1) },
            { label: '대한민국', end: MAX_YEAR, color: getEraColor(MAX_YEAR) },
        ];

        let gradient = 'linear-gradient(to right';
        let prevPercent = 0;

        eras.forEach((era) => {
            const endPercent = getPercent(era.end);
            gradient += `, ${era.color} ${prevPercent}%, ${era.color} ${endPercent}%`;
            prevPercent = endPercent;
        });

        gradient += ')';
        return gradient;
    }, []);

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
                        min={MIN_YEAR}
                        max={MAX_YEAR}
                        value={currentYear}
                        className="timeline-slider"
                        onChange={(e) => onYearChange(parseInt(e.target.value))}
                        style={{ '--thumb-color': thumbColor } as React.CSSProperties}
                    />
                    <div
                        className="timeline-track-bg"
                        style={{ background: trackGradient }}
                    ></div>
                </div>
                <div className="timeline-labels">
                    <span>BC 2333</span>
                    <span>BC 1000</span>
                    <span>0</span>
                    <span>1000</span>
                    <span>2000</span>
                </div>
            </div>

            <button className="nav-btn next-btn" onClick={() => onYearChange(currentYear + 10)}>
                ▶
            </button>
        </div>
    );
};

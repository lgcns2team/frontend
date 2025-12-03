import { useMemo, useState, useEffect, useRef } from 'react';
import './Timeline.css';
import { getEraColor, ERA_LIMITS, ERAS } from '../../../shared/config/era-theme';


interface TimelineProps {
    currentYear: number;
    onYearChange: (year: number) => void;
}

const GLOBAL_MIN_YEAR = -2333;
const GLOBAL_MAX_YEAR = 2024;
const WINDOW_SIZE = 500; // Show 500 years at a time

export const Timeline = ({ currentYear, onYearChange }: TimelineProps) => {
    const thumbColor = getEraColor(currentYear);

    // Initialize view window centered on current year
    const [viewStart, setViewStart] = useState(() => {
        const start = currentYear - WINDOW_SIZE / 2;
        return Math.max(GLOBAL_MIN_YEAR, Math.min(start, GLOBAL_MAX_YEAR - WINDOW_SIZE));
    });

    const viewEnd = Math.min(GLOBAL_MAX_YEAR, viewStart + WINDOW_SIZE);

    const [isDragging, setIsDragging] = useState(false);
    const scrollDirection = useRef<number>(0); // -1: left, 0: stop, 1: right
    const animationFrameId = useRef<number | null>(null);

    // Update view window if currentYear goes out of bounds (e.g. from auto-play or external change)
    useEffect(() => {
        if (!isDragging) {
            if (currentYear < viewStart) {
                setViewStart(Math.max(GLOBAL_MIN_YEAR, currentYear - WINDOW_SIZE * 0.1));
            } else if (currentYear > viewEnd) {
                setViewStart(Math.min(GLOBAL_MAX_YEAR - WINDOW_SIZE, currentYear - WINDOW_SIZE * 0.9));
            }
        }
    }, [currentYear, viewStart, viewEnd, isDragging]);

    // Continuous scroll loop
    useEffect(() => {
        const scroll = () => {
            if (scrollDirection.current !== 0) {
                const step = 10; // Scroll speed

                setViewStart(prev => {
                    let nextStart = prev;
                    if (scrollDirection.current === 1) {
                        nextStart = Math.min(GLOBAL_MAX_YEAR - WINDOW_SIZE, prev + step);
                        // Also push currentYear if we are scrolling right
                        if (nextStart > prev) {
                            onYearChange(Math.min(GLOBAL_MAX_YEAR, currentYear + step));
                        }
                    } else if (scrollDirection.current === -1) {
                        nextStart = Math.max(GLOBAL_MIN_YEAR, prev - step);
                        // Also push currentYear if we are scrolling left
                        if (nextStart < prev) {
                            onYearChange(Math.max(GLOBAL_MIN_YEAR, currentYear - step));
                        }
                    }
                    return nextStart;
                });
            }

            if (isDragging) {
                animationFrameId.current = requestAnimationFrame(scroll);
            }
        };

        if (isDragging) {
            animationFrameId.current = requestAnimationFrame(scroll);
        } else {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
            scrollDirection.current = 0;
        }

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isDragging, currentYear, onYearChange]);

    const handleSliderChange = (newYear: number) => {
        onYearChange(newYear);

        // Detect scroll zone
        const margin = WINDOW_SIZE * 0.1; // 10% margin

        if (newYear > viewEnd - margin && viewEnd < GLOBAL_MAX_YEAR) {
            scrollDirection.current = 1;
        } else if (newYear < viewStart + margin && viewStart > GLOBAL_MIN_YEAR) {
            scrollDirection.current = -1;
        } else {
            scrollDirection.current = 0;
        }
    };

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => {
        setIsDragging(false);
        scrollDirection.current = 0;
    };

    const trackGradient = useMemo(() => {
        const totalRange = viewEnd - viewStart;
        const getPercent = (year: number) => {
            const percent = ((year - viewStart) / totalRange) * 100;
            return Math.max(0, Math.min(100, percent)); // Clamp between 0 and 100
        };

        const eras = [
            { label: '고조선', end: ERA_LIMITS.GOJOSEON_END, color: getEraColor(ERA_LIMITS.GOJOSEON_END - 1) },
            { label: '원삼국', end: ERA_LIMITS.PROTO_THREE_KINGDOMS_END, color: getEraColor(ERA_LIMITS.PROTO_THREE_KINGDOMS_END - 1) },
            { label: '삼국', end: ERA_LIMITS.THREE_KINGDOMS_END, color: getEraColor(ERA_LIMITS.THREE_KINGDOMS_END - 1) },
            { label: '남북국', end: ERA_LIMITS.NORTH_SOUTH_STATES_END, color: getEraColor(ERA_LIMITS.NORTH_SOUTH_STATES_END - 1) },
            { label: '고려', end: ERA_LIMITS.GORYEO_END, color: getEraColor(ERA_LIMITS.GORYEO_END - 1) },
            { label: '조선', end: ERA_LIMITS.JOSEON_END, color: getEraColor(ERA_LIMITS.JOSEON_END - 1) },
            { label: '대한제국', end: ERA_LIMITS.KOREAN_EMPIRE_END, color: getEraColor(ERA_LIMITS.KOREAN_EMPIRE_END - 1) },
            { label: '일제강점기', end: ERA_LIMITS.COLONIAL_PERIOD_END, color: getEraColor(ERA_LIMITS.COLONIAL_PERIOD_END - 1) },
            { label: '대한민국', end: GLOBAL_MAX_YEAR, color: getEraColor(GLOBAL_MAX_YEAR) },
        ];

        let gradient = 'linear-gradient(to right';
        let prevPercent = 0;

        // Filter eras that overlap with current view
        const visibleEras = eras.filter(era => {
            return era.end > viewStart;
        });

        visibleEras.forEach((era) => {
            const endPercent = getPercent(era.end);

            if (endPercent > prevPercent) {
                gradient += `, ${era.color} ${prevPercent}%, ${era.color} ${endPercent}%`;
                prevPercent = endPercent;
            }
        });

        gradient += ')';
        return gradient;
    }, [viewStart, viewEnd]);

    // Generate ticks based on view window
    const ticks = useMemo(() => {
        const tickCount = 5;
        const step = (viewEnd - viewStart) / (tickCount - 1);
        return Array.from({ length: tickCount }, (_, i) => Math.round(viewStart + i * step));
    }, [viewStart, viewEnd]);

    return (
        <div className="timeline-container">
            <button className="nav-btn prev-btn" onClick={() => onYearChange(currentYear - 10)} aria-label="Previous 10 years">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <div className="timeline-wrapper">
                <div className="timeline-slider-container">
                    <div className="timeline-ruler-ticks"></div>

                    {/* Era Markers */}
                    <div className="timeline-era-markers">
                        {ERAS.map((era) => {
                            // Calculate midpoint
                            // Handle -Infinity for Gojoseon start: use GLOBAL_MIN_YEAR
                            const effectiveStart = era.startYear === -Infinity ? GLOBAL_MIN_YEAR : era.startYear;
                            // Handle Infinity for Republic end: use GLOBAL_MAX_YEAR
                            const effectiveEnd = era.endYear === Infinity ? GLOBAL_MAX_YEAR : era.endYear;

                            const midYear = (effectiveStart + effectiveEnd) / 2;

                            // Calculate position relative to view
                            const totalRange = viewEnd - viewStart;
                            const midPercent = ((midYear - viewStart) / totalRange) * 100;

                            // Check if visible (allow some buffer)
                            if (midPercent < -20 || midPercent > 120) return null;

                            const eraColor = getEraColor(effectiveEnd - 1);

                            return (
                                <div
                                    key={era.id}
                                    className="era-label-marker"
                                    style={{
                                        left: `${midPercent}%`,
                                        '--era-color': eraColor
                                    } as React.CSSProperties}
                                >
                                    <div className="era-bubble">
                                        {era.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <input
                        type="range"
                        min={viewStart}
                        max={viewEnd}
                        value={currentYear}
                        className="timeline-slider"
                        onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onTouchStart={handleMouseDown}
                        onTouchEnd={handleMouseUp}
                        style={{ '--thumb-color': thumbColor } as React.CSSProperties}
                    />
                    <div
                        className="timeline-track-bg"
                        style={{ background: trackGradient }}
                    ></div>
                </div>
                <div className="timeline-labels">
                    {ticks.map(tick => (
                        <span key={tick}>
                            {tick <= 0 ? `BC ${Math.abs(tick)}` : tick}
                        </span>
                    ))}
                </div>
            </div>

            <button className="nav-btn next-btn" onClick={() => onYearChange(currentYear + 10)} aria-label="Next 10 years">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    );
};

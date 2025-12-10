import { useMemo, useState, useEffect, useRef } from 'react';
import { fetchMainEvents, type ParsedMainEvent } from '../../../shared/api/main-events-api';
import './Timeline.css';
import { getEraColor, ERA_LIMITS, ERAS } from '../../../shared/config/era-theme';


interface TimelineProps {
    currentYear: number;
    onYearChange: (year: number) => void;
    onEventClick?: (event: ParsedMainEvent) => void;
}

const GLOBAL_MIN_YEAR = -2333;
const GLOBAL_MAX_YEAR = 2024;

export const Timeline = ({ currentYear, onYearChange, onEventClick }: TimelineProps) => {
    const thumbColor = getEraColor(currentYear);
    const [mainEvents, setMainEvents] = useState<ParsedMainEvent[]>([]);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        fetchMainEvents().then(setMainEvents);
    }, []);

    // Zoom levels: 1x (500), 2x (250), 4x (125), 16x (31.25)
    // Base window size is 500 years
    const BASE_WINDOW_SIZE = 500;
    const [zoomLevel, setZoomLevel] = useState<1 | 2 | 4 | 16>(1);

    const displayWindowSize = BASE_WINDOW_SIZE / zoomLevel;

    // Initialize view window centered on current year
    const [viewStart, setViewStart] = useState(() => {
        const start = currentYear - displayWindowSize / 2;
        return Math.max(GLOBAL_MIN_YEAR, Math.min(start, GLOBAL_MAX_YEAR - displayWindowSize));
    });

    const viewEnd = Math.min(GLOBAL_MAX_YEAR, viewStart + displayWindowSize);

    const [isDragging, setIsDragging] = useState(false);
    const scrollDirection = useRef<number>(0);
    const animationFrameId = useRef<number | null>(null);



    // Update view window if currentYear goes out of bounds (e.g. from auto-play or external change)
    useEffect(() => {
        if (!isDragging) {
            if (currentYear < viewStart) {
                setViewStart(Math.max(GLOBAL_MIN_YEAR, currentYear - displayWindowSize * 0.1));
            } else if (currentYear > viewEnd) {
                setViewStart(Math.min(GLOBAL_MAX_YEAR - displayWindowSize, currentYear - displayWindowSize * 0.9));
            }
        }
    }, [currentYear, viewStart, viewEnd, isDragging, displayWindowSize]);
    // Continuous scroll loop
    useEffect(() => {
        const scroll = () => {
            if (scrollDirection.current !== 0) {
                const step = displayWindowSize / 100; // Scroll speed: 1% of window per frame (5 years or 1 year)

                setViewStart(prev => {
                    let nextStart = prev;
                    if (scrollDirection.current === 1) {
                        nextStart = Math.min(GLOBAL_MAX_YEAR - displayWindowSize, prev + step);
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
    }, [isDragging, currentYear, onYearChange, displayWindowSize]);

    const handleSliderChange = (newYear: number) => {
        onYearChange(newYear);

        // Detect scroll zone
        const margin = displayWindowSize * 0.1; // 10% margin

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
            { label: '광복', end: ERA_LIMITS.LIBERATION_END, color: getEraColor(ERA_LIMITS.LIBERATION_END - 1) },
            { label: '6.25전쟁', end: ERA_LIMITS.KOREAN_WAR_END, color: getEraColor(ERA_LIMITS.KOREAN_WAR_END - 1) },
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




    // Navigation Press-and-Hold Logic
    const latestYearRef = useRef(currentYear);
    const navInterval = useRef<number | null>(null);
    const activeDirection = useRef<number | null>(null);

    useEffect(() => {
        latestYearRef.current = currentYear;
    }, [currentYear]);

    const startNav = (direction: number) => {
        // If already navigating in a different direction, stop it first
        if (activeDirection.current !== null && activeDirection.current !== direction) {
            if (navInterval.current) {
                clearInterval(navInterval.current);
                navInterval.current = null;
            }
        }

        // Set active direction
        activeDirection.current = direction;

        if (navInterval.current) return;

        // Immediate move
        onYearChange(latestYearRef.current + direction);

        // Continuous move
        navInterval.current = window.setInterval(() => {
            onYearChange(latestYearRef.current + direction);
        }, 100); // 100ms interval for fast scrolling
    };

    const stopNav = (direction: number) => {
        // Only stop if the stopped button matches the active direction
        if (activeDirection.current === direction) {
            if (navInterval.current) {
                clearInterval(navInterval.current);
                navInterval.current = null;
            }
            activeDirection.current = null;
        }
    };

    // Cleanup on mount/unmount
    useEffect(() => {
        return () => {
            if (navInterval.current) clearInterval(navInterval.current);
        };
    }, []);

    // Jittered Grid & Seeded Random for Decorations (Houses & Vehicles)
    const decorationItems = useMemo(() => {
        // Simple seeded random generator (Linear Congruential Generator)
        let seed = 12345; // Fixed seed for stability
        const seededRandom = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };

        const items: Array<{ id: string; year: number; lane: number; image: string; type: 'house' | 'vehicle' | 'cloud' }> = [];

        ERAS.forEach((era) => {
            // Calculate effective range
            const effectiveStart = era.startYear === -Infinity ? GLOBAL_MIN_YEAR : era.startYear;
            const effectiveEnd = era.endYear === Infinity ? GLOBAL_MAX_YEAR : era.endYear;
            const duration = effectiveEnd - effectiveStart;

            // --- 1. Houses (Lanes 2, 3, 4) ---
            if (era.houseImage) {
                const HOUSE_DENSITY = 50; // 1 house per 50 years
                const houseCount = Math.max(1, Math.floor(duration / HOUSE_DENSITY));

                for (let i = 0; i < houseCount; i++) {
                    // Random year within era
                    const year = effectiveStart + Math.floor(seededRandom() * (duration + 1));

                    // Lanes 2, 3, 4
                    const lane = 2 + Math.floor(seededRandom() * 3);

                    items.push({
                        id: `house-${era.id}-${i}`,
                        year,
                        lane,
                        image: era.houseImage,
                        type: 'house'
                    });
                }
            }

            // --- 2. Clouds (Lane 4) ---
            // Randomly placed, disappearing/reappearing
            const CLOUD_DENSITY = 70; // 1 cloud per 70 years
            const cloudCount = Math.max(1, Math.floor(duration / CLOUD_DENSITY));
            const cloudStep = duration / cloudCount;

            for (let i = 0; i < cloudCount; i++) {
                const jitter = seededRandom(); // 0 to 1
                const verticalJitter = seededRandom(); // 0 to 1
                const imageJitter = seededRandom(); // 0 to 1
                const year = effectiveStart + (cloudStep * i) + (cloudStep * jitter);

                items.push({
                    id: `cloud-${era.id}-${i}`,
                    year,
                    lane: 4 + (verticalJitter * 0.5), // Lane 4 with some vertical variation
                    image: imageJitter > 0.5 ? '/assets/images/common/cloud1.png' : '/assets/images/common/cloud2.png',
                    type: 'cloud'
                });
            }


        });

        return items.sort((a, b) => a.year - b.year);
    }, []);

    return (
        <div className={`timeline-container ${!isVisible ? 'timeline-hidden' : ''}`}>
            {/* Zoom Controls */}
            <div className="zoom-controls">
                {[1, 2, 4, 16].map((zoom) => (
                    <button
                        key={zoom}
                        className={`zoom-btn ${zoomLevel === zoom ? 'active' : ''}`}
                        onClick={() => setZoomLevel(zoom as 1 | 2 | 4 | 16)}
                        aria-label={`Zoom ${zoom}x`}
                    >
                        {zoom}x
                    </button>
                ))}
            </div>

            {/* Toggle Button */}
            <button
                className="timeline-toggle-btn"
                onClick={() => setIsVisible(!isVisible)}
                aria-label={isVisible ? "Hide timeline" : "Show timeline"}
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        transform: isVisible ? 'rotate(0deg)' : 'rotate(180deg)',
                        transition: 'transform 0.3s ease'
                    }}
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            <button
                className="nav-btn prev-btn"
                onMouseDown={() => startNav(-1)}
                onMouseUp={() => stopNav(-1)}
                onMouseLeave={() => stopNav(-1)}
                onTouchStart={(e) => { e.preventDefault(); startNav(-1); }}
                onTouchEnd={(e) => { e.preventDefault(); stopNav(-1); }}
                onTouchCancel={() => stopNav(-1)}
                aria-label="Previous 1 year"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <div className="timeline-wrapper">
                <div className="timeline-slider-container">



                    {/* Main Event Markers */}
                    <div className="timeline-event-markers">
                        {mainEvents.map((event) => {
                            const totalRange = viewEnd - viewStart;
                            const percent = ((event.year - viewStart) / totalRange) * 100;

                            if (percent < -5 || percent > 105) return null;

                            return (
                                <div
                                    key={event.eventId}
                                    className="event-marker"
                                    style={{ left: `${percent}%` }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onYearChange(event.year);
                                        if (onEventClick) onEventClick(event);
                                    }}
                                >
                                    <div className="event-marker-dot" style={{ backgroundColor: getEraColor(event.year) }}></div>
                                    <div className="event-marker-label" style={{ borderColor: getEraColor(event.year) }}>
                                        {event.eventName}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Vehicles (Era-based End-to-End Movement) */}
                    <div className="timeline-vehicles">
                        {ERAS.map((era) => {
                            if (!era.vehicleImage) return null;

                            // Calculate effective range
                            const effectiveStart = era.startYear === -Infinity ? GLOBAL_MIN_YEAR : era.startYear;
                            const effectiveEnd = era.endYear === Infinity ? GLOBAL_MAX_YEAR : era.endYear;
                            const duration = effectiveEnd - effectiveStart;

                            const totalRange = viewEnd - viewStart;
                            const leftPercent = ((effectiveStart - viewStart) / totalRange) * 100;
                            const widthPercent = (duration / totalRange) * 100;

                            // Skip if completely out of view
                            if (leftPercent + widthPercent < -20 || leftPercent > 120) return null;

                            return (
                                <div
                                    key={`vehicles-${era.id}`}
                                    className="era-vehicle-container"
                                    style={{
                                        left: `${leftPercent}%`,
                                        width: `${widthPercent}%`
                                    }}
                                >
                                    {/* Lane 0: Right to Left */}
                                    <div className="vehicle-track lane-0">
                                        <img
                                            src={era.vehicleImage}
                                            alt=""
                                            className="era-vehicle vehicle-rl"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    {/* Lane 1: Left to Right */}
                                    <div className="vehicle-track lane-1">
                                        <img
                                            src={era.vehicleImage}
                                            alt=""
                                            className="era-vehicle vehicle-lr"
                                            aria-hidden="true"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Background Decorations (Houses) */}
                    <div className="timeline-decorations">
                        {decorationItems.map((item) => {
                            const totalRange = viewEnd - viewStart;
                            const percent = ((item.year - viewStart) / totalRange) * 100;

                            // Optimization: Skip if far out of view
                            if (percent < -15 || percent > 115) return null;

                            // Lane offsets:
                            // Vehicles (0, 1): 10px, 35px
                            // Houses (2, 3, 4): 60px, 85px, 110px
                            const laneOffset = 10 + (item.lane * 7);

                            let className = "timeline-decoration-house";
                            if (item.type === 'vehicle') className = "timeline-decoration-vehicle";
                            else if (item.type === 'cloud') className = "timeline-decoration-cloud";

                            return (
                                <img
                                    key={item.id}
                                    src={item.image}
                                    alt=""
                                    className={className}
                                    style={{
                                        left: `${percent}%`,
                                        marginBottom: `${laneOffset}px`
                                    }}
                                    aria-hidden="true"
                                />
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
            </div>

            <button
                className="nav-btn next-btn"
                onMouseDown={() => startNav(1)}
                onMouseUp={() => stopNav(1)}
                onMouseLeave={() => stopNav(1)}
                onTouchStart={(e) => { e.preventDefault(); startNav(1); }}
                onTouchEnd={(e) => { e.preventDefault(); stopNav(1); }}
                onTouchCancel={() => stopNav(1)}
                aria-label="Next 1 year"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    );
};

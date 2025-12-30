import React, { useState, useEffect, useCallback, useRef } from 'react';
import './DayTimelineSlider.css';
import {
    KOREAN_WAR_START,
    KOREAN_WAR_END,
    generateDateRange,
    type FrontlineData
} from '../../../shared/api/korean-war-api';

interface DayTimelineSliderProps {
    currentDate: string;
    onDateChange: (date: string) => void;
    frontlines: FrontlineData[];
    isPlaying: boolean;
    onPlayPause: () => void;
    speed: number;
    onSpeedChange: (speed: number) => void;
}

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const formatShortDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

export const DayTimelineSlider: React.FC<DayTimelineSliderProps> = ({
    currentDate,
    onDateChange,
    frontlines,
    isPlaying,
    onPlayPause,
    speed,
    onSpeedChange
}) => {
    const [allDates] = useState(() => generateDateRange(KOREAN_WAR_START, KOREAN_WAR_END));
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Drag and resize state
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 600, height: 'auto' as number | 'auto' });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
    const resizeStartRef = useRef({ x: 0, y: 0, width: 0 });

    // Find current frontline phase
    const currentPhase = frontlines.find(f => f.date === currentDate)?.phase || '';

    // Current date index
    const currentIndex = allDates.indexOf(currentDate);
    const validIndex = currentIndex >= 0 ? currentIndex : 0;

    // Handle slider change (both onChange and onInput)
    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const index = parseInt(e.target.value, 10);
        if (allDates[index]) {
            onDateChange(allDates[index]);
        }
    }, [allDates, onDateChange]);

    // Handle phase marker click
    const handlePhaseClick = useCallback((date: string) => {
        console.log('Phase marker clicked:', date);
        onDateChange(date);
    }, [onDateChange]);

    // Drag handlers
    const handleDragStart = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.resize-handle')) return;
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            posX: position.x,
            posY: position.y
        };
    }, [position]);

    const handleDragMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        setPosition({
            x: dragStartRef.current.posX + deltaX,
            y: dragStartRef.current.posY + deltaY
        });
    }, [isDragging]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Resize handlers
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            width: typeof size.width === 'number' ? size.width : 600
        };
    }, [size.width]);

    const handleResizeMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;
        const deltaX = e.clientX - resizeStartRef.current.x;
        const newWidth = Math.max(350, Math.min(900, resizeStartRef.current.width + deltaX));
        setSize(prev => ({ ...prev, width: newWidth }));
    }, [isResizing]);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
    }, []);

    // Add/remove event listeners for drag and resize
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [isResizing, handleResizeMove, handleResizeEnd]);

    // Auto play effect
    useEffect(() => {
        if (isPlaying) {
            const interval = 1000 / speed;
            autoPlayRef.current = setInterval(() => {
                const nextIndex = currentIndex + 1;
                if (nextIndex < allDates.length) {
                    onDateChange(allDates[nextIndex]);
                } else {
                    onPlayPause();
                }
            }, interval);
        } else {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current);
            }
        }

        return () => {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current);
            }
        };
    }, [isPlaying, currentIndex, allDates, speed, onDateChange, onPlayPause]);

    // Key phases for markers
    const keyPhases = frontlines.map(f => ({
        date: f.date,
        phase: f.phase,
        index: allDates.indexOf(f.date)
    })).filter(p => p.index >= 0);

    // Calculate progress percentage
    const progress = (validIndex / (allDates.length - 1)) * 100;

    // Calculate style with position and size
    const containerStyle: React.CSSProperties = {
        transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)`,
        width: typeof size.width === 'number' ? `${size.width}px` : size.width,
        cursor: isDragging ? 'grabbing' : 'default'
    };

    return (
        <>
            {/* Floating label positioned near East Sea */}
            <div
                className={`korean-war-label ${isPanelOpen ? 'active' : ''}`}
                onClick={() => setIsPanelOpen(!isPanelOpen)}
            >
                <div className="korean-war-label-content">
                    <span className="korean-war-label-flag">🇰🇷</span>
                    <div className="korean-war-label-text">
                        <span className="korean-war-label-title">6.25 전쟁</span>
                        <span className="korean-war-label-subtitle">1950-1953</span>
                    </div>
                    <span className="korean-war-label-arrow">{isPanelOpen ? '▼' : '▶'}</span>
                </div>
            </div>

            {/* Timeline Panel - conditionally shown */}
            {isPanelOpen && (
                <div
                    ref={containerRef}
                    className={`day-timeline-slider ${isCollapsed ? 'collapsed' : ''} ${isDragging ? 'dragging' : ''}`}
                    style={containerStyle}
                >
                    {/* Drag handle */}
                    <div
                        className="drag-handle"
                        onMouseDown={handleDragStart}
                        title="드래그하여 이동"
                    >
                        <span className="drag-handle-icon">⋮⋮</span>
                    </div>

                    <div className="day-timeline-header">
                        <div className="day-timeline-title">
                            <span className="war-icon">🇰🇷</span>
                            <span>6.25 전쟁</span>
                        </div>
                        <div className="day-timeline-controls">
                            <button
                                className="play-pause-btn"
                                onClick={onPlayPause}
                                title={isPlaying ? '일시정지' : '재생'}
                            >
                                {isPlaying ? '⏸️' : '▶️'}
                            </button>
                            <div className="speed-controls">
                                {[1, 2, 4, 8].map(s => (
                                    <button
                                        key={s}
                                        className={`speed-btn ${speed === s ? 'active' : ''}`}
                                        onClick={() => onSpeedChange(s)}
                                    >
                                        {s}x
                                    </button>
                                ))}
                            </div>
                            <button
                                className="collapse-btn"
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                title={isCollapsed ? '펼치기' : '접기'}
                            >
                                {isCollapsed ? '▼' : '▲'}
                            </button>
                        </div>
                    </div>

                    {!isCollapsed && (
                        <>
                            <div className="day-timeline-date-display">
                                <span className="current-date">{formatDate(currentDate)}</span>
                                {currentPhase && <span className="current-phase">{currentPhase}</span>}
                            </div>

                            <div className="day-timeline-slider-container">
                                <div className="slider-labels">
                                    <span>{formatShortDate(KOREAN_WAR_START)}</span>
                                    <span>{formatShortDate(KOREAN_WAR_END)}</span>
                                </div>

                                <div className="slider-wrapper">
                                    <div
                                        className="slider-progress"
                                        style={{ width: `${progress}%` }}
                                    />
                                    <input
                                        type="range"
                                        min={0}
                                        max={allDates.length - 1}
                                        value={validIndex}
                                        onChange={handleSliderChange}
                                        onInput={handleSliderChange}
                                        className="slider-input"
                                    />

                                    {/* Key phase markers - rendered as buttons for accessibility */}
                                    <div className="phase-markers">
                                        {keyPhases.map((phase, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                className="phase-marker"
                                                style={{
                                                    left: `${(phase.index / (allDates.length - 1)) * 100}%`
                                                }}
                                                title={`${phase.phase} (${phase.date})`}
                                                onClick={() => handlePhaseClick(phase.date)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="day-timeline-footer">
                                <span>D+{validIndex}</span>
                                <span>{allDates.length}일 중 {validIndex + 1}일째</span>
                            </div>
                        </>
                    )}

                    {isCollapsed && (
                        <div className="collapsed-info">
                            <span className="current-date-mini">{formatDate(currentDate)}</span>
                            {currentPhase && <span className="current-phase-mini">{currentPhase}</span>}
                        </div>
                    )}

                    {/* Resize handle */}
                    {!isCollapsed && (
                        <div
                            className="resize-handle"
                            onMouseDown={handleResizeStart}
                            title="드래그하여 크기 조절"
                        />
                    )}
                </div>
            )}
        </>
    );
};

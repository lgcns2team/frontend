import React, { useState, useEffect, useCallback, useRef } from 'react';
import './DayTimelineSlider.css';
import {
    KOREAN_WAR_START,
    KOREAN_WAR_END,
    generateDateRange,
    type FrontlineData,
    type KoreanWarBattle
} from '../../../shared/api/korean-war-api';

interface DayTimelineSliderProps {
    currentDate: string;
    onDateChange: (date: string) => void;
    frontlines: FrontlineData[];
    isPlaying: boolean;
    onPlayPause: () => void;
    speed: number;
    onSpeedChange: (speed: number) => void;
    isOpen?: boolean;
    onToggle?: (isOpen: boolean) => void;
    activeBattle?: KoreanWarBattle | null; // 현재 표시할 전투 정보
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
    onSpeedChange,
    isOpen,
    onToggle,
    activeBattle
}) => {
    const [allDates] = useState(() => generateDateRange(KOREAN_WAR_START, KOREAN_WAR_END));
    const [internalIsPanelOpen, setInternalIsPanelOpen] = useState(false);

    const isPanelOpen = isOpen !== undefined ? isOpen : internalIsPanelOpen;
    const handleToggle = () => {
        if (onToggle) {
            onToggle(!isPanelOpen);
        } else {
            setInternalIsPanelOpen(!isPanelOpen);
        }
    };

    const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Container ref
    const containerRef = useRef<HTMLDivElement>(null);

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

    return (
        <>
            {/* Floating label positioned near East Sea */}
            <div
                className={`korean-war-label ${isPanelOpen ? 'active' : ''}`}
                onClick={handleToggle}
            >
                <div className="korean-war-label-content">
                    <span className="korean-war-label-flag">🇰🇷⚔️🇰🇵</span>
                    <div className="korean-war-label-text">
                        <span className="korean-war-label-title">6.25 전쟁</span>
                        <span className="korean-war-label-subtitle">1950-1953</span>
                    </div>
                    <span className="korean-war-label-arrow">{isPanelOpen ? '▼' : '▶'}</span>
                </div>
            </div>

            {/* Battle Info Popup - 전투 정보 표시 */}
            {activeBattle && (
                <div className="battle-info-popup">
                    <div className="battle-info-header">
                        <span className="battle-info-icon">⚔️</span>
                        <h4 className="battle-info-name">{activeBattle.name}</h4>
                    </div>
                    <div className="battle-info-content">
                        <p className="battle-info-date">📅 {activeBattle.date}</p>
                        <div className="battle-info-result">
                            <span className="battle-winner">✅ 승리: {activeBattle.winner}</span>
                            <span className="battle-loser">❌ 패배: {activeBattle.loser}</span>
                        </div>
                        {activeBattle.description && (
                            <p className="battle-info-desc">{activeBattle.description}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Timeline Panel - conditionally shown */}
            {isPanelOpen && (
                <div
                    ref={containerRef}
                    className="day-timeline-slider"
                >
                    <div className="day-timeline-date-display">
                        <span>🇰🇷⚔️🇰🇵</span>
                        <span className="current-date">{formatDate(currentDate)}</span>
                        {currentPhase && <span className="current-phase">{currentPhase}</span>}
                        <div className="day-timeline-controls-inline">
                            <button
                                className="play-pause-btn-small"
                                onClick={onPlayPause}
                                title={isPlaying ? '일시정지' : '재생'}
                            >
                                {isPlaying ? '⏸️' : '▶️'}
                            </button>
                            <div className="speed-controls-small">
                                {[1, 2, 4, 8].map(s => (
                                    <button
                                        key={s}
                                        className={`speed-btn-small ${speed === s ? 'active' : ''}`}
                                        onClick={() => onSpeedChange(s)}
                                    >
                                        {s}x
                                    </button>
                                ))}
                            </div>
                        </div>
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
                </div>
            )}
        </>
    );
};

import { useState, useRef, useEffect } from 'react';
import './TimeControls.css';

interface TimeControlsProps {
    currentYear: number;
    onYearChange?: (year: number) => void;
    children?: React.ReactNode;
}

const MIN_YEAR = -2333;
const MAX_YEAR = 2024;

export const TimeControls = ({ currentYear, onYearChange, children }: TimeControlsProps) => {
    const [inputValue, setInputValue] = useState(currentYear.toString());
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update input value when currentYear changes externally
    useEffect(() => {
        if (!isEditing) {
            setInputValue(currentYear.toString());
        }
    }, [currentYear, isEditing]);

    const formatYearDisplay = (year: number) => {
        return year <= 0 ? `BC ${Math.abs(year)}` : year.toString();
    };

    const parseYearInput = (input: string): number | null => {
        const trimmed = input.trim();

        // Handle BC format: "BC 100" or "bc 100"
        const bcMatch = trimmed.match(/^bc\s*(\d+)$/i);
        if (bcMatch) {
            return -parseInt(bcMatch[1]);
        }

        // Handle negative numbers: "-100"
        const num = parseInt(trimmed);
        if (isNaN(num)) return null;

        return num;
    };

    const handleSubmit = () => {
        if (!onYearChange) {
            setIsEditing(false);
            return;
        }

        const parsedYear = parseYearInput(inputValue);

        if (parsedYear !== null) {
            // Clamp to valid range
            const clampedYear = Math.max(MIN_YEAR, Math.min(MAX_YEAR, parsedYear));
            onYearChange(clampedYear);
            setInputValue(clampedYear.toString());
        } else {
            // Invalid input, revert to current year
            setInputValue(currentYear.toString());
        }

        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSubmit();
            inputRef.current?.blur();
        } else if (e.key === 'Escape') {
            setInputValue(currentYear.toString());
            setIsEditing(false);
            inputRef.current?.blur();
        }
    };

    const handleFocus = () => {
        setIsEditing(true);
        // Select all text for easy editing
        setTimeout(() => {
            inputRef.current?.select();
        }, 0);
    };

    const handleBlur = () => {
        // Revert to current year instead of submitting
        setInputValue(currentYear.toString());
        setIsEditing(false);
    };

    return (
        <div className="time-controls-container">
            {/* Year Display (Top) */}
            <div className="year-display-group">
                <input
                    ref={inputRef}
                    type="text"
                    className="year-input"
                    value={isEditing ? inputValue : formatYearDisplay(currentYear)}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={!onYearChange}
                    placeholder="연도"
                />
                <span className="year-suffix">년</span>
            </div>
            {children}
        </div>
    );
};

import { useState, type KeyboardEvent } from 'react';
import './SearchYear.css';
import { getEraForYear } from '../../../shared/config/era-theme';

interface SearchYearProps {
    currentYear: number;
    onYearChange: (year: number) => void;
}

export const SearchYear = ({ currentYear, onYearChange }: SearchYearProps) => {
    const [inputValue, setInputValue] = useState('');
    const era = getEraForYear(currentYear);
    const bgImage = `/assets/images/${era.id}/timecontrol.png`;

    const handleSearch = () => {
        if (!inputValue.trim()) return;

        // Simple parsing: if number, use it. later can handle BC notation if needed.
        let year = parseInt(inputValue.replace(/[^0-9-]/g, ''), 10);

        // Check for BC in text simply (if user typed "BC 100" or "-100")
        // My logical guess: standard inputs might be "1994", "-2333", "Bc 500"

        if (inputValue.toUpperCase().includes('BC') || inputValue.toUpperCase().includes('기원전')) {
            if (year > 0) year = -year;
        }

        if (!isNaN(year)) {
            // Limit year range if necessary, but Timeline handles clamping usually.
            // Let's constrain loosely to global min/max if known, or just pass it.
            // Global min/max are in Timeline.tsx constants (-2333 ~ 2024), 
            // but HistoryMap clamps or handles it. Safe to just pass.

            // Constrain roughly to valid range to prevent crash
            if (year < -2333) year = -2333;
            if (year > 2024) year = 2024;

            onYearChange(year);
            setInputValue(''); // Optional: clear after search? Or keep it? User might want to adjust. Keeping it is fine, or clearing. Let's clear for now to show acceptance. 
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div
            className="search-box"
            style={{ backgroundImage: `url('${bgImage}')` }}
        >
            <input
                type="text"
                placeholder="연도 검색"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <button className="search-btn" onClick={handleSearch}>🔍</button>
        </div>
    );
};

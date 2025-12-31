import type { EraConfig } from '../../../shared/config/era-theme';
import './EraNameDisplay.css';

interface EraNameDisplayProps {
    currentEra: EraConfig;
}

export const EraNameDisplay = ({ currentEra }: EraNameDisplayProps) => {
    return (
        <div className="era-name-display">
            <span
                className="era-name-text"
                style={{
                    fontFamily: currentEra.fontFamily
                }}
            >
                {currentEra.label}
            </span>
        </div>
    );
};

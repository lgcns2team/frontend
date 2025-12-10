
import './TimeControls.css';
import { getEraForYear } from '../../../shared/config/era-theme';

interface TimeControlsProps {
    currentYear: number;
}

export const TimeControls = ({ currentYear }: TimeControlsProps) => {

    const eraConfig = getEraForYear(currentYear);

    const bgImage = eraConfig.bgImage;

    return (
        <div
            className="time-controls-container"
            style={bgImage ? {
                backgroundImage: `url(${bgImage})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            } : undefined}
        >
            {/* Year Display (Top) */}
            <div className="year-display-group">
                <div className="year-text">
                    {currentYear <= 0 ? `BC ${Math.abs(currentYear)}` : currentYear}년 {eraConfig.label}
                </div>
                {/* <div className="year-sub-row">
                    <span className="era-name">{eraConfig.description}</span>
                </div> */}
            </div>
        </div>
    );
};


import './TimeControls.css';

interface TimeControlsProps {
    currentYear: number;
    children?: React.ReactNode;
}

export const TimeControls = ({ currentYear, children }: TimeControlsProps) => {

    return (
        <div className="time-controls-container">
            {/* Year Display (Top) */}
            <div className="year-display-group">
                <div className="year-text">
                    {currentYear <= 0 ? `BC ${Math.abs(currentYear)}` : currentYear}년
                </div>
            </div>
            {children}
        </div>
    );
};

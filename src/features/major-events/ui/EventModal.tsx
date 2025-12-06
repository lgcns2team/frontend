import type { ParsedMainEvent } from '../../../shared/api/main-events-api';
import { getEraForYear } from '../../../shared/config/era-theme';
import './EventModal.css';

interface EventModalProps {
    event: ParsedMainEvent;
    onClose: () => void;
}

export const EventModal = ({ event, onClose }: EventModalProps) => {
    const eraConfig = getEraForYear(event.year);

    return (
        <div className="event-modal-overlay" onClick={onClose}>
            <div
                className="event-modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    fontFamily: eraConfig.fontFamily
                }}
            >
                <div
                    className="event-modal-header"
                    style={{
                        backgroundColor: eraConfig.color,
                        color: 'white'
                    }}
                >
                    <span className="event-modal-year">{event.year}년</span>
                    <span className="event-modal-era">{event.era}</span>
                    <button className="event-modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="event-modal-body">
                    <h2 className="event-modal-title" style={{ color: eraConfig.color }}>
                        {event.eventName}
                    </h2>
                    <div className="event-modal-subtitle">
                        <span className="country-badge">{event.countryName}</span>
                    </div>

                    <div className="event-modal-section">
                        <h3>설명</h3>
                        <p>{event.summary}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

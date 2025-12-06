import { useState } from 'react';
import './NotificationBox.css';

export const NotificationBox = () => {
    // User requested "accumulated notifications count as a number"
    // Initializing with a sample number (e.g. 19)
    const [count, setCount] = useState(19);

    return (
        <div className="notification-box-container">
            <button className="notification-btn" aria-label="Notifications">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="notification-icon">
                    <path d="M12.02 2.90991C8.70997 2.90991 6.01997 5.59991 6.01997 8.90991V11.7999C6.01997 12.4099 5.75997 13.3399 5.45997 13.8599L4.29997 15.7999C3.58997 16.9999 4.07997 18.3599 5.37997 18.3599H18.66C19.96 18.3599 20.45 17.0099 19.74 15.7999L18.58 13.8599C18.28 13.3399 18.02 12.4099 18.02 11.7999V8.90991C18.02 5.60991 15.32 2.90991 12.02 2.90991Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" />
                    <path d="M13.87 3.20007C13.56 3.11007 13.24 3.04007 12.91 3.01007" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15.02 19.0601C15.02 20.7101 13.67 22.0601 12.02 22.0601C11.2 22.0601 10.44 21.7201 9.90002 21.1801C9.36002 20.6401 9.02002 19.8801 9.02002 19.0601" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" />
                </svg>
                {count > 0 && (
                    <span className="notification-badge">
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </button>
        </div>
    );
};

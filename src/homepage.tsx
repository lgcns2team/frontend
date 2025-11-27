import { useState } from 'react';
import './homepage.css';

const Homepage = () => {
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const fetchHello = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/hello');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.text();
            setMessage(data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setMessage('Failed to fetch data from backend.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="homepage-container">
            <div className="hero-card">
                <h1 className="title">Backend Integration</h1>
                <p className="subtitle">Connect to Spring Boot with style.</p>

                <button
                    className="action-button"
                    onClick={fetchHello}
                    disabled={loading}
                >
                    {loading ? 'Connecting...' : 'Call Backend API'}
                </button>

                {message && (
                    <div className="response-area">
                        <span className="response-text">{message}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Homepage;

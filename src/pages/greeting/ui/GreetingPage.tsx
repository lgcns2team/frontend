import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ERAS } from '../../../shared/config/era-theme';
import './GreetingPage.css';

const GreetingPage = () => {
    const navigate = useNavigate();
    const [themeIndex, setThemeIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setThemeIndex(prev => (prev + 1) % ERAS.length);
        }, 4000); // Change theme every 4 seconds

        return () => clearInterval(interval);
    }, []);

    const currentTheme = ERAS[themeIndex];

    const handleStart = () => {
        navigate('/map');
    };

    return (
        <div className="greeting-container">
            {/* Background Layer for Transitions */}
            <div key={currentTheme.id} className={`greeting-background theme-${currentTheme.id}`}></div>

            {/* Top Right Navigation */}
            <div className="top-right-nav">
                <button className="btn nav-btn">
                    로그인
                </button>
                <button className="btn nav-btn">
                    회원가입
                </button>
            </div>

            <div className="era-badge">
                {currentTheme.label} ({currentTheme.labelEn})
            </div>

            <div className="globe-container">
                <div key={currentTheme.id} className={`globe theme-globe-${currentTheme.id}`}></div>
            </div>

            <div className="content-wrapper">
                <h1 className="title">H.AI</h1>

                <p className="description">
                    시간의 흐름을 따라 변화하는<br />
                    역사의 현장을 탐험하세요.
                </p>

                <div className="button-group">
                    <button className="btn start-btn" onClick={handleStart}>
                        시작하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GreetingPage;

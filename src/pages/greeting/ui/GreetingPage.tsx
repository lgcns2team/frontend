import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ERAS } from '../../../shared/config/era-theme';
import './GreetingPage.css';

const GreetingPage = () => {
    const navigate = useNavigate();
    const [themeIndex, setThemeIndex] = useState(0);
    const isThrottled = useRef(false);

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (isThrottled.current) return;

            if (e.deltaY > 0) {
                // Scroll Down -> Next Era
                setThemeIndex(prev => Math.min(prev + 1, ERAS.length - 1));
                throttle();
            } else if (e.deltaY < 0) {
                // Scroll Up -> Previous Era
                setThemeIndex(prev => Math.max(prev - 1, 0));
                throttle();
            }
        };

        const throttle = () => {
            isThrottled.current = true;
            setTimeout(() => {
                isThrottled.current = false;
            }, 800); // 800ms delay for smooth transition
        };

        window.addEventListener('wheel', handleWheel);
        return () => window.removeEventListener('wheel', handleWheel);
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

import { useEffect, useRef } from 'react';
import GreetingPage from '../../greeting/ui/GreetingPage';
import './LandingPage.css';

const LandingPage = () => {
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        const sections = document.querySelectorAll('.feature-section');
        sections.forEach(section => observerRef.current?.observe(section));

        return () => observerRef.current?.disconnect();
    }, []);

    return (
        <div className="landing-container">
            {/* Hero Section */}
            <section className="hero-section">
                <h1 className="hero-title">H.AI</h1>
                <p className="hero-subtitle">
                    역사의 흐름을 탐험하는 새로운 방법.<br />
                    인공지능과 함께 과거와 현재를 잇는 여정을 시작하세요.
                </p>
                <div className="scroll-indicator">
                    Scroll to explore ↓
                </div>
            </section>

            {/* Feature 1: Time Travel */}
            <section className="feature-section">
                <div className="feature-content">
                    <div className="feature-text">
                        <span className="feature-label">Time Travel</span>
                        <h2 className="feature-heading">시간을 넘나드는<br />몰입형 경험</h2>
                        <p className="feature-description">
                            고대부터 현대까지, 타임라인을 따라 흐르는 역사의 현장을 직접 확인하세요.
                            각 시대에 맞춰 변화하는 지형과 국경, 그리고 그 시대의 숨결을 느낄 수 있습니다.
                        </p>
                    </div>
                    <div className="feature-visual">
                        {/* Placeholder for visual, can use CSS pattern or image */}
                        <div style={{
                            width: '100%', height: '100%',
                            background: 'conic-gradient(from 0deg, #d4c5a9, #8d6e63, #d4c5a9)',
                            opacity: 0.5
                        }}></div>
                    </div>
                </div>
            </section>

            {/* Feature 2: Dynamic Themes */}
            <section className="feature-section alt">
                <div className="feature-content">
                    <div className="feature-text">
                        <span className="feature-label">Dynamic Themes</span>
                        <h2 className="feature-heading">시대에 반응하는<br />살아있는 디자인</h2>
                        <p className="feature-description">
                            단순한 정보 전달을 넘어, 시각적인 아름다움을 추구합니다.
                            연도가 바뀔 때마다 서체, 색상, 질감이 실시간으로 변화하며
                            당신을 그 시대로 초대합니다.
                        </p>
                    </div>
                    <div className="feature-visual">
                        {/* Placeholder for visual */}
                        <div style={{
                            width: '100%', height: '100%',
                            background: 'linear-gradient(135deg, #b91c1c 50%, #1e3a8a 50%)',
                            opacity: 0.8
                        }}></div>
                    </div>
                </div>
            </section>

            {/* Final Section: Greeting Page Integration */}
            <section className="final-section">
                <GreetingPage />
            </section>
        </div>
    );
};

export default LandingPage;

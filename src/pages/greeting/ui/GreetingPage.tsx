import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GreetingPage.css';



// Portal Animation Video
import portalVideo from '../../../assets/images/portal/portal.mp4';

const GreetingPage = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState(0);

    // Zoom state for button trigger
    const [isZooming, setIsZooming] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);



    const handleStart = () => {
        navigate('/login');
    };

    const handleEnterBook = () => {
        if (videoRef.current) {
            videoRef.current.play();
        }
    };

    return (
        // Switch to digital mode style when activeSection >= 1 (Map Section)
        // Prevent scroll when in Section 0 and not yet zoomed
        <div
            className={`greeting-container ${activeSection >= 1 ? 'mode-digital' : ''}`}
            style={{
                overflow: 'hidden',
                height: '100vh'
            }}
        >

            {/* Section 1: Introduction (The Portal) */}
            <div
                data-index="0"
                className={`section section-paper ${activeSection === 0 ? 'visible' : 'hidden'}`}
                style={{ overflow: 'hidden' }}
            >
                {/* Top-right login button */}
                <button
                    onClick={handleStart}
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        padding: '8px 20px',
                        fontSize: '1rem',
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.5)',
                        color: '#fff',
                        cursor: 'pointer',
                        borderRadius: '20px',
                        zIndex: 10,
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                        e.currentTarget.style.borderColor = '#fff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                    }}
                >
                    로그인
                </button>
                {/* Background Video that zooms in on click */}
                <video
                    ref={videoRef}
                    className={`portal-background ${isZooming ? 'portal-zoom-animation' : ''}`}
                    muted
                    playsInline
                    preload="auto"
                    onTimeUpdate={(e) => {
                        const video = e.currentTarget;
                        // 영상 끝나기 1초 전에 확대 효과 시작
                        if (video.duration - video.currentTime <= 1 && !isZooming) {
                            setIsZooming(true);
                        }
                    }}
                    onEnded={() => {
                        // 확대 애니메이션 후 다음 섹션으로 전환
                        setTimeout(() => {
                            setActiveSection(1);
                        }, 1500);
                    }}
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        objectFit: 'cover',
                        transformOrigin: 'center center',
                        zIndex: 0
                    }}
                >
                    <source src={portalVideo} type="video/mp4" />
                </video>

                <div
                    className={isZooming ? 'fade-out' : ''}
                    style={{ position: 'relative', zIndex: 1 }}
                >
                    <h1 className="book-title" style={{ color: '#fff', textShadow: '0 4px 10px rgba(0,0,0,0.8)' }}>
                        H.AI
                    </h1>
                    <p className="book-desc" style={{ whiteSpace: 'pre-wrap', color: '#eee', textShadow: '0 2px 5px rgba(0,0,0,0.8)' }}>
                        잠들어 있는 역사를 깨우다.<br />
                        교과서 속으로 빨려들어가는 경험
                    </p>

                    <button className="enter-book-btn" onClick={handleEnterBook}>
                        역사 속으로 입장하기
                    </button>
                </div>
            </div>

            {/* Section 2: Outro */}
            <div
                data-index="1"
                className={`section section-outro ${activeSection === 1 ? 'visible' : 'hidden'}`}
            >
                <h2 className="logo-large">H.AI</h2>

                <button className="start-btn" onClick={handleStart}>
                    학습 시작하기
                </button>
            </div>

        </div>
    );
};

export default GreetingPage;

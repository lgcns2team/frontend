import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GreetingPage.css';
import kingSejongImg from '../../../assets/images/joseon/king_sejong_original.png';


// Portal Animation Video
import portalVideo from '../../../assets/images/portal/portal.mp4';

const GreetingPage = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState(0);
    const [typedText, setTypedText] = useState('');
    const fullText = "지겨운 암기는 그만,\n역사의 인물들과 직접 대화하세요.";

    // Zoom state for button trigger
    const [isZooming, setIsZooming] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);





    // Typewriter effect logic
    useEffect(() => {
        if (activeSection === 1) { // When Dialogue section is active
            // 페이지 전환 후 0.4초 딜레이 후 타이핑 시작
            const delayTimer = setTimeout(() => {
                let index = 0;
                setTypedText('');
                const timer = setInterval(() => {
                    if (index <= fullText.length) {
                        setTypedText(fullText.slice(0, index));
                        index++;
                    } else {
                        clearInterval(timer);
                    }
                }, 100);
                // 클린업 함수에서 interval도 정리
                return () => clearInterval(timer);
            }, 700);
            return () => clearTimeout(delayTimer);
        }
    }, [activeSection]);



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

            {/* Section 2: Dialogue */}
            <div
                data-index="1"
                className={`section section-chat ${activeSection === 1 ? 'visible' : 'hidden'}`}
            >
                <div className="character-card">
                    {/* Using Sejong image or placeholder */}
                    <img
                        src={kingSejongImg}
                        alt="King Sejong"
                        className="character-img"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400/1e293b/ffffff?text=King+Sejong';
                        }}
                    />
                </div>
                <div className="chat-bubble-container">
                    <div className="chat-bubble">
                        <div className="typewriter-text">
                            {typedText}
                            <span className="cursor"></span>
                        </div>
                    </div>
                </div>
                <button
                    className="enter-book-btn"
                    style={{ marginTop: '2rem' }}
                    onClick={() => setActiveSection(2)}
                >
                    다음
                </button>
            </div>

            {/* Section 3: Outro */}
            <div
                data-index="2"
                className={`section section-outro ${activeSection === 2 ? 'visible' : 'hidden'}`}
            >
                <h2 className="logo-large">H.AI</h2>
                <p className="book-desc" style={{ marginBottom: '3rem' }}>
                    지금 바로, 당신만의 역사 여행을 시작하세요.
                </p>
                <button className="start-btn" onClick={handleStart}>
                    학습 시작하기
                </button>
            </div>

        </div>
    );
};

export default GreetingPage;

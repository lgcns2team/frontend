import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GreetingPage.css';
import kingSejongImg from '../../../assets/images/joseon/king_sejong_original.png';
import mapPreviewImg from '../../../assets/images/korean-war/map_preview.png';

// Portal Animation Frames
import r1 from '../../../assets/images/portal/r1.png';
import r2 from '../../../assets/images/portal/r2.png';
import r3 from '../../../assets/images/portal/r3.png';
import r4 from '../../../assets/images/portal/r4.png';
import r5 from '../../../assets/images/portal/r5.png';
import r6 from '../../../assets/images/portal/r6.png';
import r7 from '../../../assets/images/portal/r7.png';
import r8 from '../../../assets/images/portal/r8.png';
import r9 from '../../../assets/images/portal/r9.png';
import r10 from '../../../assets/images/portal/r10.png';

const portalFrames = [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10];

const GreetingPage = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState(0);
    const [typedText, setTypedText] = useState('');
    const fullText = "지겨운 암기는 그만,\n역사의 인물들과 직접 대화하세요.";

    // Zoom state for button trigger
    const [isZooming, setIsZooming] = useState(false);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

    // Refs for sections
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Preload images to avoid flickering
    useEffect(() => {
        portalFrames.forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    }, []);

    // Typewriter effect logic
    useEffect(() => {
        if (activeSection === 2) { // When Dialogue section is active
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
            return () => clearInterval(timer);
        }
    }, [activeSection]);

    // Intersection Observer for scroll detection
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = Number(entry.target.getAttribute('data-index'));
                    setActiveSection(index);
                }
            });
        }, {
            threshold: 0.5 // Trigger when 50% visible
        });

        sectionRefs.current.forEach(el => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const handleStart = () => {
        navigate('/login');
    };

    const handleEnterBook = () => {
        setIsZooming(true);

        // 10-Frame Animation Sequence (Total 2.5s)
        // Buildup Phase (Slow march to the edge)
        setTimeout(() => setCurrentFrameIndex(1), 250);  // r2
        setTimeout(() => setCurrentFrameIndex(2), 500);  // r3
        setTimeout(() => setCurrentFrameIndex(3), 750);  // r4
        setTimeout(() => setCurrentFrameIndex(4), 1000); // r5
        setTimeout(() => setCurrentFrameIndex(5), 1250); // r6
        setTimeout(() => setCurrentFrameIndex(6), 1500); // r7
        setTimeout(() => setCurrentFrameIndex(7), 1750); // r8 (Last moment of calm)

        // The Plunge (Sucked In)
        setTimeout(() => setCurrentFrameIndex(8), 2000); // r9 (Action starts)
        setTimeout(() => setCurrentFrameIndex(9), 2200); // r10 (Deep inside)

        // After animation (2.5s), scroll to next section
        setTimeout(() => {
            if (sectionRefs.current[1]) {
                sectionRefs.current[1].scrollIntoView({ behavior: 'smooth' });
            }
        }, 2500);
    };

    return (
        // Switch to digital mode style when activeSection >= 1 (Map Section)
        // Prevent scroll when in Section 0 and not yet zoomed
        <div
            className={`greeting-container ${activeSection >= 1 ? 'mode-digital' : ''}`}
            style={{
                overflowY: activeSection === 0 && !isZooming ? 'hidden' : 'auto',
                height: '100vh'
            }}
        >

            {/* Section 1: Introduction (The Portal) */}
            <div
                ref={el => { sectionRefs.current[0] = el; }}
                data-index="0"
                className={`section section-paper ${activeSection === 0 ? 'visible' : ''}`}
                style={{ overflow: 'hidden' }}
            >
                {/* Background Book Image that zooms in on click */}
                <div
                    className={`portal-background ${isZooming ? 'portal-zoom-animation' : ''}`}
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        backgroundImage: `url(${portalFrames[currentFrameIndex]})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transformOrigin: 'center center',
                        zIndex: 0
                    }}
                />

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

            {/* Section 2: Map (Awakening) */}
            <div
                ref={el => { sectionRefs.current[1] = el; }}
                data-index="1"
                className={`section section-map ${activeSection === 1 ? 'visible' : 'hidden'}`}
            >
                <div className="map-glow-text">
                    지도가 살아 숨쉽니다
                </div>
                <div
                    className="map-stage"
                    style={{ backgroundImage: `url(${mapPreviewImg})` }}
                >
                    {/* Map image set via inline style for correct import resolution */}
                </div>
                <p className="book-desc" style={{ marginTop: '2rem' }}>
                    단순한 그림이 아닙니다.<br />
                    전장의 흐름과 무역로가 당신의 눈앞에서 펼쳐집니다.
                </p>
            </div>

            {/* Section 3: Dialogue */}
            <div
                ref={el => { sectionRefs.current[2] = el; }}
                data-index="2"
                className={`section section-chat ${activeSection === 2 ? 'visible' : 'hidden'}`}
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
            </div>

            {/* Section 4: Outro */}
            <div
                ref={el => { sectionRefs.current[3] = el; }}
                data-index="3"
                className={`section section-outro ${activeSection === 3 ? 'visible' : 'hidden'}`}
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

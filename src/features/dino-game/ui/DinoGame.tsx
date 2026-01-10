import { useEffect, useRef, useState } from 'react';
import './DinoGame.css';
import { useGameLoop } from '../lib/useGameLoop';
import { getEraAssets, ERA_NAMES, type Era } from '../lib/gameAssets';

interface DinoGameProps {
    onClose: () => void;
}

export const DinoGame = ({ onClose }: DinoGameProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [showEraTransition, setShowEraTransition] = useState(false);
    const [transitionEra, setTransitionEra] = useState<Era>('gojoseon');
    const prevEraRef = useRef<Era>('gojoseon');

    const {
        state,
        startGame,
        jump,
        GROUND_Y,
        PLAYER_WIDTH,
        PLAYER_HEIGHT,
        OBSTACLE_WIDTH,
        OBSTACLE_HEIGHT,
    } = useGameLoop();

    // Load images for current era
    useEffect(() => {
        const loadImages = async () => {
            const era = state.currentEra;
            const assets = getEraAssets(era);
            const imagePaths = [
                { key: `${era}_background`, src: assets.background },
                { key: `${era}_floor`, src: assets.floor },
                ...assets.run.map((src, i) => ({ key: `${era}_run${i}`, src })),
                ...assets.jump.map((src, i) => ({ key: `${era}_jump${i}`, src })),
                ...assets.impediments.map((src, i) => ({ key: `${era}_obs${i}`, src })),
            ];

            const loadPromises = imagePaths.map(({ key, src }) => {
                return new Promise<void>((resolve) => {
                    // Skip if already loaded
                    if (imagesRef.current.has(key)) {
                        resolve();
                        return;
                    }

                    const img = new Image();
                    img.onload = () => {
                        imagesRef.current.set(key, img);
                        resolve();
                    };
                    img.onerror = () => {
                        console.warn(`Failed to load image: ${src}`);
                        resolve();
                    };
                    img.src = src;
                });
            });

            await Promise.all(loadPromises);
            setImagesLoaded(true);
        };

        loadImages();
    }, [state.currentEra]);

    // Era transition effect
    useEffect(() => {
        if (state.currentEra !== prevEraRef.current && state.isPlaying) {
            setTransitionEra(state.currentEra);
            setShowEraTransition(true);

            // No need to clear cache - each era has its own keys now

            setTimeout(() => {
                setShowEraTransition(false);
            }, 1000);
        }
        prevEraRef.current = state.currentEra;
    }, [state.currentEra, state.isPlaying]);

    // Canvas rendering
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imagesLoaded) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const era = state.currentEra;

        // Clear canvas
        ctx.fillStyle = '#f7f7f7';
        ctx.fillRect(0, 0, width, height);

        // Draw background
        const bgImg = imagesRef.current.get(`${era}_background`);
        if (bgImg) {
            ctx.drawImage(bgImg, 0, 0, width, GROUND_Y);
        }

        // Draw scrolling ground (fills to bottom of canvas)
        const floorImg = imagesRef.current.get(`${era}_floor`);
        if (floorImg) {
            const groundY = GROUND_Y;
            const floorWidth = 900;
            const floorHeight = height - groundY; // 바닥부터 캔버스 끝까지
            const offset = state.groundOffset % floorWidth;

            ctx.drawImage(floorImg, -offset, groundY, floorWidth, floorHeight);
            ctx.drawImage(floorImg, floorWidth - offset, groundY, floorWidth, floorHeight);
        }

        // Draw obstacles
        state.obstacles.forEach(obs => {
            const obsImg = imagesRef.current.get(`${era}_obs${obs.type}`);
            if (obsImg) {
                ctx.drawImage(
                    obsImg,
                    obs.x,
                    GROUND_Y - OBSTACLE_HEIGHT,
                    OBSTACLE_WIDTH,
                    OBSTACLE_HEIGHT
                );
            } else {
                // Fallback rectangle
                ctx.fillStyle = '#c0392b';
                ctx.fillRect(obs.x, GROUND_Y - OBSTACLE_HEIGHT, OBSTACLE_WIDTH, OBSTACLE_HEIGHT);
            }
        });

        // Draw player
        const playerX = 50;
        let playerImg: HTMLImageElement | undefined;

        if (state.isJumping) {
            playerImg = imagesRef.current.get(`${era}_jump${state.jumpFrame}`);
        } else {
            playerImg = imagesRef.current.get(`${era}_run${state.runFrame}`);
        }

        if (playerImg) {
            ctx.drawImage(
                playerImg,
                playerX,
                state.playerY,
                PLAYER_WIDTH,
                PLAYER_HEIGHT
            );
        } else {
            // Fallback rectangle
            ctx.fillStyle = '#3498db';
            ctx.fillRect(playerX, state.playerY, PLAYER_WIDTH, PLAYER_HEIGHT);
        }

    }, [state, imagesLoaded, GROUND_Y, PLAYER_WIDTH, PLAYER_HEIGHT, OBSTACLE_WIDTH, OBSTACLE_HEIGHT]);

    // Touch controls
    const handleTouch = () => {
        if (state.isGameOver) {
            startGame();
        } else if (!state.isPlaying) {
            startGame();
        } else {
            jump();
        }
    };

    return (
        <div className="dino-game-overlay" onClick={handleTouch}>
            <div className="dino-game-container" onClick={e => e.stopPropagation()}>
                <button className="dino-game-close-btn" onClick={onClose}>✕</button>

                <div className="dino-game-header">
                    <div className="dino-game-title">
                        역사 달리기
                        <span className="era-badge">{ERA_NAMES[state.currentEra]}</span>
                    </div>
                    <div className="score-display">
                        <div className="score-item">
                            <span className="score-label">점수</span>
                            <span className="score-value">{state.score.toString().padStart(5, '0')}</span>
                        </div>
                        <div className="score-item">
                            <span className="score-label">최고</span>
                            <span className="score-value">{state.highScore.toString().padStart(5, '0')}</span>
                        </div>
                    </div>
                </div>

                <canvas
                    ref={canvasRef}
                    className="game-canvas"
                    width={900}
                    height={400}
                    onClick={handleTouch}
                />

                {/* Start Screen */}
                {!state.isPlaying && !state.isGameOver && (
                    <div className="game-message-overlay">

                        <p>시대를 넘어 역사 속을 달려보세요!</p>
                        <button className="start-button" onClick={startGame}>
                            게임 시작
                        </button>
                        <p className="controls-hint">Space 또는 화면 터치로 점프</p>
                    </div>
                )}

                {/* Game Over Screen */}
                {state.isGameOver && (
                    <div className="game-message-overlay">
                        <h2>💀 게임 오버</h2>
                        <p className="final-score">점수: {state.score}</p>
                        {state.score >= state.highScore && state.score > 0 && (
                            <p>🎉 신기록!</p>
                        )}
                        <button className="start-button" onClick={startGame}>
                            다시 하기
                        </button>
                        <p className="controls-hint">Space 또는 화면 터치로 재시작</p>
                    </div>
                )}

                {/* Era Transition Effect */}
                {showEraTransition && (
                    <div className="era-transition">
                        <h2>🎉 {ERA_NAMES[transitionEra]} 시대!</h2>
                    </div>
                )}
            </div>
        </div>
    );
};

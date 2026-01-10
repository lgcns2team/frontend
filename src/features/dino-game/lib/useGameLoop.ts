import { useState, useEffect, useCallback, useRef } from 'react';
import { type Era, getEraByScore } from './gameAssets';

// Game constants
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const GROUND_Y = 330; // Ground position from top (캔버스 높이 400 기준)
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 80;
const OBSTACLE_WIDTH = 40;
const OBSTACLE_HEIGHT = 60;
const INITIAL_SPEED = 5;
<<<<<<< HEAD
const SPEED_INCREMENT = 0.005; // 점수가 올라갈수록 속도 빠르게 증가
const MAX_SPEED = 20; // 최고 속도
const MIN_OBSTACLE_GAP = 300; // 장애물 최소 간격 (px)
const MAX_OBSTACLE_GAP = 500; // 장애물 최대 간격 (px)
=======
const SPEED_INCREMENT = 0.004; // 점수가 올라갈수록 속도 빠르게 증가
const MAX_SPEED = 20; // 최고 속도
const MIN_OBSTACLE_GAP = 300; // 장애물 최소 간격 (px)
const MAX_OBSTACLE_GAP = 700; // 장애물 최대 간격 (px)
>>>>>>> 9e9d551e85f7ca5055fd56a53c3ba59f88e2f5b0

export interface GameState {
    isPlaying: boolean;
    isGameOver: boolean;
    score: number;
    highScore: number;
    currentEra: Era;
    playerY: number;
    playerVelocity: number;
    isJumping: boolean;
    obstacles: Obstacle[];
    speed: number;
    groundOffset: number;
    runFrame: number;
    jumpFrame: number;
}

interface Obstacle {
    id: number;
    x: number;
    type: number; // 0 or 1 for different obstacle images
}

const initialState: GameState = {
    isPlaying: false,
    isGameOver: false,
    score: 0,
    highScore: 0,
    currentEra: 'gojoseon',
    playerY: GROUND_Y - PLAYER_HEIGHT,
    playerVelocity: 0,
    isJumping: false,
    obstacles: [],
    speed: INITIAL_SPEED,
    groundOffset: 0,
    runFrame: 0,
    jumpFrame: 0,
};

export const useGameLoop = () => {
    const [state, setState] = useState<GameState>(initialState);
    const gameLoopRef = useRef<number | null>(null);
    const lastObstacleTime = useRef<number>(0);
    const obstacleIdCounter = useRef<number>(0);
    const frameCounter = useRef<number>(0);

    // Load high score from localStorage
    useEffect(() => {
        const savedHighScore = localStorage.getItem('dinoHighScore');
        if (savedHighScore) {
            setState(prev => ({ ...prev, highScore: parseInt(savedHighScore, 10) }));
        }
    }, []);

    // Save high score
    useEffect(() => {
        if (state.score > state.highScore) {
            localStorage.setItem('dinoHighScore', state.score.toString());
            setState(prev => ({ ...prev, highScore: state.score }));
        }
    }, [state.score, state.highScore]);

    const jump = useCallback(() => {
        setState(prev => {
            if (!prev.isJumping && prev.isPlaying && !prev.isGameOver) {
                return {
                    ...prev,
                    playerVelocity: JUMP_FORCE,
                    isJumping: true,
                    jumpFrame: 0,
                };
            }
            return prev;
        });
    }, []);

    const startGame = useCallback(() => {
        obstacleIdCounter.current = 0;
        lastObstacleTime.current = 0; // 첫 장애물이 바로 생성되도록 0으로 설정
        frameCounter.current = 0;
        setState({
            ...initialState,
            isPlaying: true,
            highScore: state.highScore,
        });
    }, [state.highScore]);

    const stopGame = useCallback(() => {
        if (gameLoopRef.current) {
            cancelAnimationFrame(gameLoopRef.current);
            gameLoopRef.current = null;
        }
    }, []);

    // Main game loop
    useEffect(() => {
        if (!state.isPlaying || state.isGameOver) {
            stopGame();
            return;
        }

        const gameLoop = () => {
            frameCounter.current++;

            setState(prev => {
                // Update player physics
                let newPlayerY = prev.playerY + prev.playerVelocity;
                let newVelocity = prev.playerVelocity + GRAVITY;
                let newIsJumping = prev.isJumping;
                let newJumpFrame = prev.jumpFrame;

                // Ground collision
                if (newPlayerY >= GROUND_Y - PLAYER_HEIGHT) {
                    newPlayerY = GROUND_Y - PLAYER_HEIGHT;
                    newVelocity = 0;
                    newIsJumping = false;
                    newJumpFrame = 0;
                }

                // Update jump animation frame
                if (newIsJumping && frameCounter.current % 8 === 0) {
                    newJumpFrame = Math.min(newJumpFrame + 1, 2);
                }

                // Update run animation frame
                let newRunFrame = prev.runFrame;
                if (!newIsJumping && frameCounter.current % 6 === 0) {
                    newRunFrame = (newRunFrame + 1) % 5;
                }

                // Update speed and ground offset
                const newSpeed = Math.min(prev.speed + SPEED_INCREMENT, MAX_SPEED);
                const newGroundOffset = (prev.groundOffset + newSpeed) % 800;

                // Spawn obstacles at random intervals (like Chrome Dino)
                let newObstacles = [...prev.obstacles];

                // 처음 장애물 생성 또는 마지막 장애물과의 거리 체크
                const lastObstacle = newObstacles[newObstacles.length - 1];
                const canSpawn = !lastObstacle || lastObstacle.x < 900 - MIN_OBSTACLE_GAP;

                if (canSpawn && Math.random() < 0.02) { // 2% 확률로 스폰
                    const gap = MIN_OBSTACLE_GAP + Math.random() * (MAX_OBSTACLE_GAP - MIN_OBSTACLE_GAP);
                    // 마지막 장애물과 충분한 간격이 있을 때만 생성
                    if (!lastObstacle || (900 - lastObstacle.x) >= gap * 0.5) {
                        newObstacles.push({
                            id: obstacleIdCounter.current++,
                            x: 900,
                            type: Math.floor(Math.random() * 2),
                        });
                    }
                }

                // Move and filter obstacles
                newObstacles = newObstacles
                    .map(obs => ({ ...obs, x: obs.x - newSpeed }))
                    .filter(obs => obs.x > -OBSTACLE_WIDTH);

                // Collision detection
                const playerLeft = 50; // Fixed X position
                const playerRight = playerLeft + PLAYER_WIDTH - 10;
                const playerTop = newPlayerY + 10;
                const playerBottom = newPlayerY + PLAYER_HEIGHT;

                for (const obs of newObstacles) {
                    const obsLeft = obs.x;
                    const obsRight = obs.x + OBSTACLE_WIDTH;
                    const obsTop = GROUND_Y - OBSTACLE_HEIGHT;
                    const obsBottom = GROUND_Y;

                    if (
                        playerRight > obsLeft &&
                        playerLeft < obsRight &&
                        playerBottom > obsTop &&
                        playerTop < obsBottom
                    ) {
                        return { ...prev, isGameOver: true };
                    }
                }

                // Update score
                const newScore = prev.score + 1;

                // Check for era change
                const newEra = getEraByScore(newScore);

                return {
                    ...prev,
                    playerY: newPlayerY,
                    playerVelocity: newVelocity,
                    isJumping: newIsJumping,
                    jumpFrame: newJumpFrame,
                    runFrame: newRunFrame,
                    speed: newSpeed,
                    groundOffset: newGroundOffset,
                    obstacles: newObstacles,
                    score: newScore,
                    currentEra: newEra,
                };
            });

            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [state.isPlaying, state.isGameOver, stopGame]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (state.isGameOver) {
                    startGame();
                } else if (!state.isPlaying) {
                    startGame();
                } else {
                    jump();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.isPlaying, state.isGameOver, jump, startGame]);

    return {
        state,
        startGame,
        jump,
        stopGame,
        GROUND_Y,
        PLAYER_WIDTH,
        PLAYER_HEIGHT,
        OBSTACLE_WIDTH,
        OBSTACLE_HEIGHT,
    };
};

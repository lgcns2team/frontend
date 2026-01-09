// Game assets path configuration for each era

export type Era = 'gojoseon' | 'threekingdom' | 'joseon' | 'koreaempire' | 'morden';

export interface EraAssets {
    name: string;
    background: string;
    floor: string;
    run: string[];
    jump: string[];
    impediments: string[];
}

const BASE_PATH = '/assets/running';

export const ERA_ORDER: Era[] = ['gojoseon', 'threekingdom', 'joseon', 'koreaempire', 'morden'];

export const ERA_NAMES: Record<Era, string> = {
    gojoseon: '고조선',
    threekingdom: '삼국시대',
    joseon: '조선',
    koreaempire: '대한제국',
    morden: '현대'
};

// Score thresholds for era transitions
export const ERA_SCORE_THRESHOLDS: number[] = [0, 500, 1000, 1500, 2000];

export const getEraAssets = (era: Era): EraAssets => {
    const eraPath = `${BASE_PATH}/${era}`;

    return {
        name: ERA_NAMES[era],
        background: `${eraPath}/background/background.jpg`,
        floor: `${eraPath}/floor/floor.jpg`,
        run: [
            `${eraPath}/run/run1.png`,
            `${eraPath}/run/run2.png`,
            `${eraPath}/run/run3.png`,
            `${eraPath}/run/run4.png`,
            `${eraPath}/run/run5.png`,
        ],
        jump: [
            `${eraPath}/jump/jump1.png`,
            `${eraPath}/jump/jump2.png`,
            `${eraPath}/jump/jump3.png`,
        ],
        impediments: [
            `${eraPath}/impediments/obstacle1.png`,
            `${eraPath}/impediments/obstacle2.png`,
        ]
    };
};

// Get era based on current score
export const getEraByScore = (score: number): Era => {
    for (let i = ERA_SCORE_THRESHOLDS.length - 1; i >= 0; i--) {
        if (score >= ERA_SCORE_THRESHOLDS[i]) {
            return ERA_ORDER[i];
        }
    }
    return ERA_ORDER[0];
};

// Preload images for smooth gameplay
export const preloadImages = (era: Era): Promise<HTMLImageElement[]> => {
    const assets = getEraAssets(era);
    const allPaths = [
        assets.background,
        assets.floor,
        ...assets.run,
        ...assets.jump,
        ...assets.impediments
    ];

    return Promise.all(
        allPaths.map(src => {
            return new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        })
    );
};

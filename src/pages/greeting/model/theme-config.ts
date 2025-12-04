export const GREETING_THEMES = ['ancient', 'renaissance', 'modern', 'contemporary'] as const;

export type GreetingTheme = typeof GREETING_THEMES[number];

export const ERA_LABELS: Record<GreetingTheme, string> = {
    ancient: '고대 (Ancient)',
    renaissance: '르네상스 (Renaissance)',
    modern: '근대 (Modern)',
    contemporary: '현대 (Contemporary)'
};

export const THEME_CONFIG: Record<GreetingTheme, {
    fontFamily: string;
    description: string;
}> = {
    ancient: {
        fontFamily: "'Cinzel', serif",
        description: "거친 돌과 암각화의 시대"
    },
    renaissance: {
        fontFamily: "'Nanum Brush Script', cursive",
        description: "붓과 한지의 시대"
    },
    modern: {
        fontFamily: "'Nanum Myeongjo', serif",
        description: "격동의 근대와 인쇄술"
    },
    contemporary: {
        fontFamily: "'Pretendard', sans-serif",
        description: "디지털과 연결의 시대"
    }
};

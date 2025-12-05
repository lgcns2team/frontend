// src/shared/config/era-theme.ts

// 1. 시대 구분 상수 (보내주신 기준 그대로 적용)
export const ERA_LIMITS = {
    GOJOSEON_END: -108,
    PROTO_THREE_KINGDOMS_END: 300,
    THREE_KINGDOMS_END: 698,
    NORTH_SOUTH_STATES_END: 918,
    GORYEO_END: 1392,
    JOSEON_END: 1897,
    KOREAN_EMPIRE_END: 1910,
    COLONIAL_PERIOD_END: 1945,
    LIBERATION_END: 1950,
    KOREAN_WAR_END: 1954,
};

// 2. EraType을 한국사 시대로 세분화
export type EraType =
    | 'gojoseon'
    | 'proto-three-kingdoms'
    | 'three-kingdoms'
    | 'north-south-states'
    | 'goryeo'
    | 'joseon'
    | 'korean-empire'
    | 'colonial'
    | 'liberation'
    | 'korean-war'
    | 'republic';

export interface EraConfig {
    id: EraType;
    label: string;      // 한글 이름
    labelEn: string;    // 영문 이름 (필요시 사용)
    description: string; // 시대 설명
    startYear: number;
    endYear: number;
    fontFamily: string; // 시대 분위기에 맞는 폰트
    color: string;      // 테마 메인 색상
    bgImage?: string;   // 배경 이미지 경로 (Optional)
    timelineImage?: string; // 타임라인 배경 이미지 (Optional)
}

// 3. 시대별 설정 (Color를 여기서 통합 관리)
export const ERAS: EraConfig[] = [
    {
        id: 'gojoseon',
        label: '고조선',
        labelEn: 'Gojoseon',
        description: '청동기 문명의 묵직하고 고전적인 시대',
        startYear: -Infinity,
        endYear: ERA_LIMITS.GOJOSEON_END - 1,
        fontFamily: "'Cinzel', serif", // 고대 느낌
        color: '#D7C0AE', // 브론즈 베이지
        bgImage: "/assets/images/gojoseon/timecontrol.png",
        timelineImage: "/assets/images/gojoseon/timeline.png",
    },
    {
        id: 'proto-three-kingdoms',
        label: '원삼국시대',
        labelEn: 'Proto Three Kingdoms',
        description: '여러 소국이 자라나는 태동의 시기',
        startYear: ERA_LIMITS.GOJOSEON_END,
        endYear: ERA_LIMITS.PROTO_THREE_KINGDOMS_END - 1,
        fontFamily: "'Noto Serif KR', serif",
        color: '#E2E8F0', // 연한 올리브 그린/슬레이트
        bgImage: "/assets/images/proto-three-kingdoms/timecontrol.png",
        timelineImage: "/assets/images/proto-three-kingdoms/timeline.png",
    },
    {
        id: 'three-kingdoms',
        label: '삼국시대',
        labelEn: 'Three Kingdoms',
        description: '영토 확장의 열정과 역동성',
        startYear: ERA_LIMITS.PROTO_THREE_KINGDOMS_END,
        endYear: ERA_LIMITS.THREE_KINGDOMS_END - 1,
        fontFamily: "'Noto Serif KR', serif",
        color: '#FDA4AF', // 활기찬 코랄 레드
        bgImage: "/assets/images/three-kingdoms/timecontrol.png",
        timelineImage: "/assets/images/three-kingdoms/timeline.png",
    },
    {
        id: 'north-south-states',
        label: '남북국시대',
        labelEn: 'North-South States',
        description: '신라의 황금 문화와 발해의 기상',
        startYear: ERA_LIMITS.THREE_KINGDOMS_END,
        endYear: ERA_LIMITS.NORTH_SOUTH_STATES_END - 1,
        fontFamily: "'Noto Serif KR', serif",
        color: '#FCD34D', // 화려한 앰버 골드
        bgImage: "/assets/images/north-south-states/timecontrol.png",
        timelineImage: "/assets/images/north-south-states/timeline.png",
    },
    {
        id: 'goryeo',
        label: '고려시대',
        labelEn: 'Goryeo Dynasty',
        description: '우아하고 신비로운 청자의 나라',
        startYear: ERA_LIMITS.NORTH_SOUTH_STATES_END,
        endYear: ERA_LIMITS.GORYEO_END - 1,
        fontFamily: "'Nanum Myeongjo', serif", // 우아한 명조체
        color: '#5EEAD4', // 비취색/청록색
        bgImage: "/assets/images/goryeo/timecontrol.png",
        timelineImage: "/assets/images/goryeo/timeline.png",
    },
    {
        id: 'joseon',
        label: '조선시대',
        labelEn: 'Joseon Dynasty',
        description: '선비의 청렴함과 성리학의 시대',
        startYear: ERA_LIMITS.GORYEO_END,
        endYear: ERA_LIMITS.JOSEON_END - 1,
        fontFamily: "'Nanum Myeongjo', serif",
        color: '#93C5FD', // 단아한 쪽빛/스카이 블루
        bgImage: "/assets/images/joseon/timecontrol.png",
        timelineImage: "/assets/images/joseon/timeline.png",
    },
    {
        id: 'korean-empire',
        label: '대한제국',
        labelEn: 'Korean Empire',
        description: '황실의 존엄과 근대화의 의지',
        startYear: ERA_LIMITS.JOSEON_END,
        endYear: ERA_LIMITS.KOREAN_EMPIRE_END - 1,
        fontFamily: "'Nanum Myeongjo', serif",
        color: '#C084FC', // 고귀한 로얄 퍼플
        bgImage: "/assets/images/korean-empire/timecontrol.png",
        timelineImage: "/assets/images/korean-empire/timeline.png",
    },
    {
        id: 'colonial',
        label: '일제강점기',
        labelEn: 'Colonial Period',
        description: '아픔과 저항, 잊지 말아야 할 시간',
        startYear: ERA_LIMITS.KOREAN_EMPIRE_END,
        endYear: 1944, // 1945년 광복 전까지
        fontFamily: "'Pretendard', sans-serif", // 근대적 느낌
        color: '#94A3B8', // 무채색 그레이
        bgImage: "/assets/images/colonial/timecontrol.png",
        timelineImage: "/assets/images/colonial/timeline.png",
    },
    {
        id: 'liberation',
        label: '광복',
        labelEn: 'Liberation',
        description: '빛을 되찾은 기쁨과 환희',
        startYear: ERA_LIMITS.COLONIAL_PERIOD_END,
        endYear: ERA_LIMITS.LIBERATION_END - 1,
        fontFamily: "'Pretendard', sans-serif",
        color: '#34d399', // 희망찬 에메랄드 그린
        timelineImage: "/assets/images/liberation/timeline.png",
    },
    {
        id: 'korean-war',
        label: '6.25 전쟁',
        labelEn: 'Korean War',
        description: '동족상잔의 비극과 아픔',
        startYear: ERA_LIMITS.LIBERATION_END,
        endYear: ERA_LIMITS.KOREAN_WAR_END - 1,
        fontFamily: "'Pretendard', sans-serif",
        color: '#7f1d1d', // 핏빛 레드/다크 브라운
        timelineImage: "/assets/images/korean-war/timeline.png",
    },
    {
        id: 'republic',
        label: '대한민국',
        labelEn: 'Republic of Korea',
        description: '전쟁의 폐허를 딛고 일어선 기적',
        startYear: ERA_LIMITS.KOREAN_WAR_END,
        endYear: Infinity,
        fontFamily: "'Pretendard', sans-serif", // 현대적 느낌
        color: '#3B82F6', // 청량하고 맑은 딥 블루
        bgImage: "/assets/images/republic/timecontrol.png",
        timelineImage: "/assets/images/republic/timeline.png",
    },
];

export const getEraForYear = (year: number): EraConfig => {
    return ERAS.find(era => year >= era.startYear && year <= era.endYear) || ERAS[ERAS.length - 1];
};

// 기존에 사용하던 getEraName도 이 config를 활용하도록 수정하면 일관성이 생겨요!
export const getEraName = (year: number): string => {
    return getEraForYear(year).label;
};

export const getEraColor = (year: number): string => {
    return getEraForYear(year).color;
};
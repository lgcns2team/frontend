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
    | 'republic';

export interface EraConfig {
    id: EraType;
    label: string;      // 한글 이름
    labelEn: string;    // 영문 이름 (필요시 사용)
    description: string; // 시대 설명
    startYear: number;
    endYear: number;
    fontFamily: string; // 시대 분위기에 맞는 폰트
}

// 3. 시대별 설정 (Color는 CSS에서 관리하므로 여기선 제외하거나 필요시 추가)
export const ERAS: EraConfig[] = [
    {
        id: 'gojoseon',
        label: '고조선',
        labelEn: 'Gojoseon',
        description: '청동기 문명의 묵직하고 고전적인 시대',
        startYear: -Infinity,
        endYear: ERA_LIMITS.GOJOSEON_END - 1,
        fontFamily: "'Cinzel', serif", // 고대 느낌
    },
    {
        id: 'proto-three-kingdoms',
        label: '원삼국시대',
        labelEn: 'Proto Three Kingdoms',
        description: '여러 소국이 자라나는 태동의 시기',
        startYear: ERA_LIMITS.GOJOSEON_END,
        endYear: ERA_LIMITS.PROTO_THREE_KINGDOMS_END - 1,
        fontFamily: "'Noto Serif KR', serif",
    },
    {
        id: 'three-kingdoms',
        label: '삼국시대',
        labelEn: 'Three Kingdoms',
        description: '영토 확장의 열정과 역동성',
        startYear: ERA_LIMITS.PROTO_THREE_KINGDOMS_END,
        endYear: ERA_LIMITS.THREE_KINGDOMS_END - 1,
        fontFamily: "'Noto Serif KR', serif",
    },
    {
        id: 'north-south-states',
        label: '남북국시대',
        labelEn: 'North-South States',
        description: '신라의 황금 문화와 발해의 기상',
        startYear: ERA_LIMITS.THREE_KINGDOMS_END,
        endYear: ERA_LIMITS.NORTH_SOUTH_STATES_END - 1,
        fontFamily: "'Noto Serif KR', serif",
    },
    {
        id: 'goryeo',
        label: '고려시대',
        labelEn: 'Goryeo Dynasty',
        description: '우아하고 신비로운 청자의 나라',
        startYear: ERA_LIMITS.NORTH_SOUTH_STATES_END,
        endYear: ERA_LIMITS.GORYEO_END - 1,
        fontFamily: "'Nanum Myeongjo', serif", // 우아한 명조체
    },
    {
        id: 'joseon',
        label: '조선시대',
        labelEn: 'Joseon Dynasty',
        description: '선비의 청렴함과 성리학의 시대',
        startYear: ERA_LIMITS.GORYEO_END,
        endYear: ERA_LIMITS.JOSEON_END - 1,
        fontFamily: "'Nanum Myeongjo', serif",
    },
    {
        id: 'korean-empire',
        label: '대한제국',
        labelEn: 'Korean Empire',
        description: '황실의 존엄과 근대화의 의지',
        startYear: ERA_LIMITS.JOSEON_END,
        endYear: ERA_LIMITS.KOREAN_EMPIRE_END - 1,
        fontFamily: "'Nanum Myeongjo', serif",
    },
    {
        id: 'colonial',
        label: '일제강점기',
        labelEn: 'Colonial Period',
        description: '아픔과 저항, 잊지 말아야 할 시간',
        startYear: ERA_LIMITS.KOREAN_EMPIRE_END,
        endYear: ERA_LIMITS.COLONIAL_PERIOD_END,
        fontFamily: "'Pretendard', sans-serif", // 근대적 느낌
    },
    {
        id: 'republic',
        label: '대한민국',
        labelEn: 'Republic of Korea',
        description: '밝은 미래와 역동적인 성장',
        startYear: ERA_LIMITS.COLONIAL_PERIOD_END + 1,
        endYear: Infinity,
        fontFamily: "'Pretendard', sans-serif", // 현대적 느낌
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
    // 고조선: 청동기 문명의 묵직하고 고전적인 느낌 (브론즈 베이지)
    if (year < ERA_LIMITS.GOJOSEON_END) return '#D7C0AE';

    // 원삼국: 여러 소국이 자라나는 새싹 같은 시기 (연한 올리브 그린)
    if (year < ERA_LIMITS.PROTO_THREE_KINGDOMS_END) return '#E2E8F0';

    // 삼국: 영토 확장의 열정과 역동성 (활기찬 코랄 레드)
    if (year < ERA_LIMITS.THREE_KINGDOMS_END) return '#FDA4AF';

    // 남북국: 신라의 황금 문화와 발해의 기상 (화려한 앰버 골드)
    if (year < ERA_LIMITS.NORTH_SOUTH_STATES_END) return '#FCD34D';

    // 고려: 우아하고 신비로운 고려청자 색 (비취색/청록색)
    if (year < ERA_LIMITS.GORYEO_END) return '#5EEAD4';

    // 조선: 선비의 청렴함과 백의민족 (단아한 쪽빛/스카이 블루)
    if (year < ERA_LIMITS.JOSEON_END) return '#93C5FD';

    // 대한제국: 황실의 존엄과 근대화의 의지 (고귀한 로얄 퍼플)
    if (year < ERA_LIMITS.KOREAN_EMPIRE_END) return '#C084FC';

    // 일제강점기: 우리 민족의 아픔, 잊지 말아야 할 시간 (무채색 그레이)
    if (year < ERA_LIMITS.COLONIAL_PERIOD_END) return '#94A3B8';

    // 대한민국: 밝은 미래와 희망 (청량하고 맑은 딥 블루)
    if (year >= ERA_LIMITS.COLONIAL_PERIOD_END) return '#3B82F6';

    return '#CBD5E1'; // 기본값
};